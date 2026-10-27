import { captureModelExecutions } from './providers/model-executions'
import { selectedVisionReadiness } from './providers/vision-selection'
import { desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { imageSize } from 'image-size'
import { runParseLoop, type ParseProgress } from './agents/parse-loop'
import { db } from './db'
import { enqueue } from './accessops/jobs'
import type { Env } from './accessops/auth'
import { saveModelVersion } from './model-versions'
import { AppError } from './accessops/errors'
import { floorModels, projects } from './db/schema'

async function setStatus(
  projectId: string,
  status: 'uploaded' | 'parsing' | 'parsed' | 'failed',
  parseError: string | null = null,
) {
  await db
    .update(projects)
    .set({ parseError, status })
    .where(eq(projects.id, projectId))
}

async function setProgress(projectId: string, progress: ParseProgress | null) {
  await db
    .update(projects)
    .set({ parseProgress: progress })
    .where(eq(projects.id, projectId))
}

export async function runParse(projectId: string, planPath: string) {
  try {
    const bytes = await Bun.file(planPath).bytes()
    const { height, width } = imageSize(bytes)
    if (!width || !height) {
      throw new Error('Could not read plan image dimensions')
    }
    await captureModelExecutions((executions) =>
      runParseLoop({
        dimensions: { heightPx: height, widthPx: width },
        onProgress: (progress) => setProgress(projectId, progress),
        planPath,
        saveIteration: async (model, iteration, critique) => {
          await saveModelVersion(projectId, model, undefined, {
            iteration,
            critique: {
              ...((critique as Record<string, unknown>) ?? {}),
              inference: structuredClone(executions),
              geometryReview: 'unreviewed_ai_extraction',
            },
          })
        },
      }),
    )
    await setProgress(projectId, null)
    await setStatus(projectId, 'parsed')
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown parse error'
    await setProgress(projectId, null)
    const visionHelp: Record<string, string> = {
      OPENROUTER_VISION_CREDENTIALS_REQUIRED: 'Configure the OpenRouter vision key; NVIDIA text remains available.',
      OPENROUTER_VISION_CONSENT_REQUIRED: 'This workspace has not approved OpenRouter vision data sharing.',
      FREE_VISION_ACCOUNT_NOT_ELIGIBLE: 'OpenRouter free access is not confirmed for this account. No paid request was made.',
      FREE_VISION_MODEL_NOT_AVAILABLE: 'The selected free image model is not currently available. No paid model was substituted.',
      FREE_VISION_ACCESS_DENIED: 'OpenRouter rejected vision access; check the key and account permissions.',
      FREE_VISION_THROTTLED: 'The free image quota is exhausted; retry later or use manual editing.',
      FREE_VISION_BUSY: 'The free image service is busy after a bounded retry; manual editing remains available.',
      FREE_VISION_TIMEOUT: 'The free image request timed out; manual editing remains available.',
      FREE_VISION_OUTPUT_TRUNCATED: 'The image response was incomplete and was rejected. No extraction was accepted.',
      GEMINI_VISION_CREDENTIALS_REQUIRED: 'Gemini vision needs GEMINI_API_KEY; NVIDIA text remains available.',
      GEMINI_FREE_PROJECT_CONFIRMATION_REQUIRED: 'Confirm an unbilled Gemini project before enabling free vision.',
      GEMINI_VISION_WORKSPACE_CONSENT_REQUIRED: 'This workspace has not approved Gemini vision data sharing.',
      WORKSPACE_PROVIDER_CONSENT_REQUIRED: 'This workspace has not approved external model inference.',
      GEMINI_UNAUTHORIZED: 'Gemini rejected vision credentials; check account access.',
      GEMINI_RATE_LIMITED: 'Gemini free vision rate limit reached; retry later without switching providers.',
      GEMINI_SERVICE_BUSY: 'Gemini vision is busy; retry later. No provider was substituted.',
      GEMINI_REQUEST_TIMEOUT: 'Gemini vision timed out; deterministic editing remains available.',
      VISION_INFERENCE_DISABLED: 'Vision inference is disabled; manual editing remains available.',
    }
    const help = error instanceof AppError ? visionHelp[error.code] : undefined
    await setStatus(projectId, 'failed', help ?? (message.includes('credentials') || message.includes('API_KEY') ? 'Model credentials are not configured' : 'Extraction rejected; inspect the source and correlated job diagnostics'))
    throw new AppError('PARSE_FAILED', 503)
  }
}

export const parseRoutes = new Hono<Env>()

parseRoutes.post('/:id/parse', async (c) => {
  const projectId = c.req.param('id')
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  })
  if (!project) {
    return c.json({ error: 'Project not found' }, 404)
  }
  if (project.status === 'parsing') {
    return c.json({ error: 'Parse already running' }, 409)
  }
  const readiness = selectedVisionReadiness(c.get('principal').workspaceId)
  if (!readiness.configured || ('workspacePermitted' in readiness && !readiness.workspacePermitted)) {
    return c.json({ error: 'Vision is not configured or permitted for this workspace', code: 'VISION_NOT_READY', vision: readiness }, 503)
  }
  await setStatus(projectId, 'parsing')
  await setProgress(projectId, null)
  // Fire and forget: the client polls GET /projects/:id for the outcome.
  await enqueue(c.get('principal'), 'parse', 'parse:'+projectId+':'+Bun.randomUUIDv7(), {projectId, planPath:project.planPath})
  return c.json({ status: 'parsing' }, 202)
})
