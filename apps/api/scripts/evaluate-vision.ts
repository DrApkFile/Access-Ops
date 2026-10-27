import path from 'node:path'
import { imageSize } from 'image-size'
import { z } from 'zod'
import { createEvaluationFixtures } from './vision-evaluation-fixtures'
import {
  selectedVisionReadiness,
  selectVision,
} from '../src/providers/vision-selection'
import { captureModelExecutions } from '../src/providers/model-executions'
import { withProviderWorkspace } from '../src/providers/workspace-scope'
import { prepareVisionInput } from '../src/lib/vision-image'
import { parsePlanImage, loadPlanImageParts } from '../src/agents/parser'
import { parseAgentJson } from '../src/agents/llm'
import { runVisionTurn } from '../src/agents/vision'
import { AppError, hash } from '../src/accessops/errors'
import { loadIntegrationEnvironment } from '../src/providers/integration-environment'
await loadIntegrationEnvironment()
const directory = process.env.INTEGRATION_EVIDENCE_DIR
if (!directory || !path.isAbsolute(directory))
  throw new Error('Absolute private INTEGRATION_EVIDENCE_DIR required')
const credentials = JSON.parse(await Bun.stdin.text()) as {
  email: string
  password: string
  workspaceId: string
}
const fixtures = await createEvaluationFixtures(
    path.join(directory, 'fixtures'),
  ),
  config = selectVision(),
  readiness = selectedVisionReadiness(credentials.workspaceId)
const live = process.argv.includes('--live'),
  persist = process.argv.includes('--persist'),
  origin = process.env.API_URL ?? 'http://127.0.0.1:3403'
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname))
  throw new Error('Use authorized local API only')
let cookie = ''
async function api(
  route: string,
  method = 'GET',
  body?: RequestInit['body'],
  contentType?: string,
) {
  const r = await fetch(origin + route, {
    method,
    body,
    headers: {
      cookie,
      'x-accessops-request': '1',
      ...(contentType ? { 'content-type': contentType } : {}),
    },
    signal: AbortSignal.timeout(30000),
  })
  if (r.headers.get('set-cookie'))
    cookie = r.headers.get('set-cookie')!.split(';')[0]!
  if (!r.ok) throw new AppError('LOCAL_API_' + r.status, 502)
  return r.json() as Promise<Record<string, unknown>>
}
let authenticated = false
const results: Record<string, unknown>[] = []
for (const fixture of fixtures) {
  const input = path.join(directory, 'fixtures', fixture.filename),
    bytes = await Bun.file(input).bytes(),
    result: Record<string, unknown> = {
      fixture: fixture.id,
      synthetic: true,
      sourceSha256: fixture.sourceSha256,
      sourceTransform: fixture.sourceTransform,
      classification: 'LOCAL_INTEGRATION',
      externalRequestAttempted: false,
    }
  const started = Date.now()
  try {
    if (fixture.id === 'invalid') {
      let rejected = false
      try {
        await prepareVisionInput(
          Buffer.from(bytes).toString('base64'),
          'image/png',
          { maxImageBytes: 5 * 1024 * 1024, maxPixels: 4e6 },
        )
      } catch {
        rejected = true
      }
      if (!rejected) throw new Error('INVALID_FIXTURE_WAS_ACCEPTED')
      Object.assign(result, {
        status: 'PASS',
        outcome: 'malformed input rejected before provider request',
      })
      results.push(result)
      continue
    }
    const size = imageSize(bytes),
      parts = await loadPlanImageParts(input)
    for (const part of parts)
      if ('inlineData' in part)
        await prepareVisionInput(
          part.inlineData.data,
          part.inlineData.mimeType,
          { maxImageBytes: 5 * 1024 * 1024, maxPixels: 4e6 },
        )
    Object.assign(result, {
      preprocessing: 'PASS',
      width: size.width,
      height: size.height,
      inputImages: parts.filter((p) => 'inlineData' in p).length,
      wholeImageIncluded: parts.some(
        (p) =>
          'inlineData' in p &&
          hash(Buffer.from(p.inlineData.data, 'base64')) === hash(bytes),
      ),
    })
    if (
      !live ||
      !readiness.configured ||
      !('workspacePermitted' in readiness) ||
      !readiness.workspacePermitted
    ) {
      Object.assign(result, {
        status: 'BLOCKED',
        liveStatus: 'NOT_RUN',
        diagnosis: readiness,
        liveOptIn: live,
      })
      results.push(result)
      continue
    }
    if (!['gemini','openrouter'].includes(config.provider))
      throw new AppError('SELECT_SUPPORTED_VISION_FOR_THIS_EVALUATION', 422)
    if (!authenticated) {
      await api(
        '/auth/login',
        'POST',
        JSON.stringify(credentials),
        'application/json',
      )
      authenticated = true
    }
    result.classification = 'LIVE_EXTERNAL'
    result.externalRequestAttempted = true
    if (fixture.id === 'crop') {
      const captured = await captureModelExecutions((records) => {
        result.executions = records
        return withProviderWorkspace(credentials.workspaceId, () =>
          runVisionTurn({
            agentName: 'Synthetic crop label evaluation',
            instruction:
              'Return only JSON with a labels array. Transcribe all printed room/symbol labels visible in this image. Do not invent labels.',
            parts,
          }),
        )
      })
      const actual = parseAgentJson(
        z.object({ labels: z.array(z.string()) }).strict(),
        captured.value,
        'Crop evaluation',
      )
      const labels = actual.labels.map((l) => l.trim().toUpperCase())
      if (
        !fixture.expectedLabels.every((l) => labels.includes(l)) ||
        labels.some((l) => !fixture.expectedLabels.includes(l))
      )
        throw new Error('CROP_LABEL_CONTENT_MISMATCH')
      Object.assign(result, {
        status: 'PASS',
        actual,
        executions: captured.executions,
      })
    } else {
      const captured = await captureModelExecutions((records) => {
          result.executions = records
          return withProviderWorkspace(credentials.workspaceId, () =>
            parsePlanImage(input, {
              widthPx: size.width!,
              heightPx: size.height!,
            }),
          )
        }),
        model = captured.value
      const rooms = model.rooms.map((r) => ({
          label: r.label?.trim().toUpperCase(),
          centerX: r.polygon.reduce((n, p) => n + p.x, 0) / r.polygon.length,
        })),
        w = size.width!,
        h = size.height!
      const door = model.openings.some(
        (o) =>
          o.kind === 'door' &&
          Math.abs(o.at.x - w * 0.5) <= w * 0.06 &&
          Math.abs(o.at.y - h * 0.5) <= h * 0.08,
      )
      const stairs = model.features.some(
        (f) => f.kind === 'stairs' && Math.abs(f.at.x - w * 0.84) <= w * 0.1,
      )
      const labels =
        rooms.some((r) => r.label === 'RECEPTION' && r.centerX < w / 2) &&
        rooms.some((r) => r.label === 'CLINIC' && r.centerX > w / 2)
      const checks = {
        schemaAndCoordinateBounds: true,
        roomLabelsAndSides: labels,
        partitionDoor: door,
        stairsSymbol: stairs,
        noInventedElevator: !model.features.some((f) => f.kind === 'elevator'),
        physicalScaleUnknown: model.plan.pixelsPerMeter === null,
      }
      await Bun.write(
        path.join(directory, fixture.id + '-extracted-model.json'),
        JSON.stringify(model, null, 2),
      )
      result.checks = checks
      if (Object.values(checks).some((v) => !v))
        throw new Error('FLOORPLAN_CONTENT_ACCEPTANCE_FAILED')
      Object.assign(result, {
        status: 'PASS',
        modelSha256: hash(JSON.stringify(model)),
        executions: captured.executions,
        geometryReviewed: false,
        scope:
          'Parser stage only; critique/doorway/human review remain separate',
      })
      if (persist) {
        const form = new FormData()
        form.set(
          'file',
          new File([bytes], 'Synthetic ' + fixture.id + ' evaluation.png', {
            type: 'image/png',
          }),
        )
        const project = await api('/projects', 'POST', form)
        await api(
          '/projects/' + project.id + '/model',
          'POST',
          JSON.stringify(model),
          'application/json',
        )
        const reopened = await api('/projects/' + project.id + '/model')
        if (
          hash(JSON.stringify(reopened.model)) !== hash(JSON.stringify(model))
        )
          throw new Error('PERSISTENCE_MISMATCH')
        Object.assign(result, {
          classification: 'LIVE_END_TO_END',
          projectId: project.id,
          persistedUnreviewed: true,
        })
      }
    }
  } catch (error) {
    Object.assign(result, {
      status: 'FAIL',
      code:
        error instanceof AppError
          ? error.code
          : error instanceof Error && /^[A-Z0-9_]+$/.test(error.message)
            ? error.message
            : 'VISION_EVALUATION_FAILED',
    })
  }
  result.durationMs = Date.now() - started
  results.push(result)
}
const report = {
  at: new Date().toISOString(),
  provider: config.provider,
  model: config.model,
  liveRequested: live,
  results,
  fullPipelineClaimed: false,
  noPaidResourcesProvisioned: true,
}
await Bun.write(
  path.join(directory, 'evaluation.json'),
  JSON.stringify(report, null, 2),
)
console.log(JSON.stringify(report))
if (results.some((r) => r.status === 'FAIL')) process.exitCode = 1
else if (results.some((r) => r.status === 'BLOCKED')) process.exitCode = 2
