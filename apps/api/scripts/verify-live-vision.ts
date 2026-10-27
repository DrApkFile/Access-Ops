import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import { imageSize } from 'image-size'
import { loadIntegrationEnvironment } from '../src/providers/integration-environment'
import { withProviderWorkspace } from '../src/providers/workspace-scope'
import { captureModelExecutions } from '../src/providers/model-executions'
import {
  OMNI_VISION_MODEL,
  visionConfiguration,
} from '../src/providers/vision-configuration'
import { AppError, hash } from '../src/accessops/errors'

// Explicit live test, not part of ordinary CI. Credentials arrive only through stdin.
await loadIntegrationEnvironment()
if (process.env.VISION_PROVIDER !== 'nvidia')
  throw new Error('Legacy NVIDIA-only verifier is disabled for the selected vision provider. Use scripts/evaluate-vision.ts for Gemini; no NVIDIA fallback was attempted.')
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const i = a.indexOf('=')
    return [a.slice(2, i), a.slice(i + 1)]
  }),
)
const directory = process.env.INTEGRATION_EVIDENCE_DIR
if (
  !directory ||
  !path.isAbsolute(directory) ||
  (args.control !== 'true' && (!args.image || !path.isAbsolute(args.image)))
)
  throw new Error(
    'Absolute INTEGRATION_EVIDENCE_DIR and --image=/authorized/test.png are required',
  )
const configuration = visionConfiguration()
if (
  configuration.model !== OMNI_VISION_MODEL ||
  configuration.baseUrl !== 'https://integrate.api.nvidia.com/v1'
)
  throw new Error(
    'This verification permits only the inspected NVIDIA free Omni vision endpoint/model',
  )
const origin = process.env.API_URL ?? 'http://127.0.0.1:3403'
if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname))
  throw new Error(
    'This persistence verification is limited to an authorized local API',
  )
await mkdir(directory, { recursive: true, mode: 0o700 })
const credentials = JSON.parse(await Bun.stdin.text()) as {
  email: string
  password: string
  workspaceId: string
}
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
const evidence: Record<string, unknown> = {
  at: new Date().toISOString(),
  classification: 'LOCAL_INTEGRATION',
  model: configuration.model,
  fixture: args.label ?? 'Operator-supplied authorized test image',
  geometryReviewed: false,
}
let stage = 'local_authentication'
async function captureVision<T>(task: () => Promise<T>) {
  return captureModelExecutions((executions) => {
    evidence.executions = executions
    return task()
  })
}
try {
  await api(
    '/auth/login',
    'POST',
    JSON.stringify(credentials),
    'application/json',
  )
  if (args.control === 'true') {
    const { Resvg } = await import('@resvg/resvg-js')
    const { svgFont } = await import('../src/lib/svg-font')
    const { runNvidiaTurn } = await import('../src/agents/nvidia')
    const { parseAgentJson } = await import('../src/agents/llm')
    const { z } = await import('zod')
    const alphabet = 'ACDEFHJKLMNPRTUVWXY'
    const code =
      'AX' +
      Array.from(
        crypto.getRandomValues(new Uint8Array(6)),
        (n) => alphabet[n % alphabet.length],
      ).join('')
    const bytes = new Resvg(
      `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="280"><rect width="500" height="280" fill="white"/><circle cx="250" cy="100" r="65" fill="#2371dc"/><text x="250" y="235" text-anchor="middle" font-size="46" font-family="Liberation Sans" fill="black">${code}</text></svg>`,
      { font: svgFont },
    )
      .render()
      .asPng()
    await Bun.write(path.join(directory, 'synthetic-control.png'), bytes)
    stage = 'nvidia_visual_control'
    const captured = await captureVision(() =>
      withProviderWorkspace(credentials.workspaceId, () =>
        runNvidiaTurn({
          agentName: 'Randomized visual control',
          model: configuration.model,
          instruction:
            'Return only JSON with code and shape fields. Read the printed code and identify the large geometric shape in the image. Do not invent missing text.',
          parts: [
            { text: 'Inspect this synthetic test image.' },
            {
              inlineData: {
                mimeType: 'image/png',
                data: Buffer.from(bytes).toString('base64'),
              },
            },
          ],
        }),
      ),
    )
    evidence.classification = 'LIVE_EXTERNAL'
    const parsed = parseAgentJson(
      z.object({ code: z.string(), shape: z.string() }).strict(),
      captured.value,
      'Visual control',
    )
    Object.assign(evidence, {
      sourceSha256: hash(bytes),
      expectedControl: { code, shape: 'circle' },
      visualControl: parsed,
    })
    if (parsed.code !== code || parsed.shape.toLowerCase() !== 'circle')
      throw new AppError('VISUAL_CONTROL_MISMATCH', 502)
    Object.assign(evidence, {
      status: 'PASS',
      sourceSha256: hash(bytes),
      visualControl: parsed,
      executions: captured.executions,
      limitation:
        'Randomized image understanding only, not building geometry extraction or review.',
    })
  } else {
    stage = 'image_validation'
    const bytes = await Bun.file(args.image!).bytes()
    const size = imageSize(bytes)
    if (size.type !== 'png' || !size.width || !size.height)
      throw new Error(
        'Provide a PNG test plan (render PDF through normal ingestion first)',
      )
    // Role constants must load after the selected vision model. Overrides stay process-local.
    process.env.MODEL_PROVIDER = 'nvidia'
    process.env.MODEL_CRITICAL = configuration.model
    process.env.MODEL_COMPARE = configuration.model
    const { parsePlanImage } = await import('../src/agents/parser')
    const started = Date.now()
    stage = 'nvidia_extraction'
    const captured = await captureVision(() =>
      withProviderWorkspace(credentials.workspaceId, () =>
        parsePlanImage(args.image!, {
          widthPx: size.width!,
          heightPx: size.height!,
        }),
      ),
    )
    evidence.classification = 'LIVE_EXTERNAL'
    await Bun.write(
      path.join(directory, 'extracted-model.json'),
      JSON.stringify(captured.value, null, 2),
    )
    stage = 'authorized_persistence'
    const form = new FormData()
    form.append(
      'file',
      new File([bytes], 'Authorized vision verification.png', {
        type: 'image/png',
      }),
    )
    const project = await api('/projects', 'POST', form)
    const saved = await api(
      '/projects/' + project.id + '/model',
      'POST',
      JSON.stringify(captured.value),
      'application/json',
    )
    const reopened = await api('/projects/' + project.id + '/model')
    if (
      hash(JSON.stringify(captured.value)) !==
      hash(JSON.stringify(reopened.model))
    )
      throw new Error('MODEL_PERSISTENCE_MISMATCH')
    Object.assign(evidence, {
      status: 'PASS',
      classification: 'LIVE_END_TO_END',
      sourceSha256: hash(bytes),
      modelSha256: hash(JSON.stringify(captured.value)),
      projectId: project.id,
      version: saved.version,
      durationMs: Date.now() - started,
      executions: captured.executions,
      limitation:
        'Schema-validated real extraction and authorized persistence only; critique/doorway loop and human geometry review are separate.',
    })
  }
} catch (error) {
  // Missing consent/configuration/invalid local input is not a live request.
  const code =
    error instanceof AppError ? error.code : 'VISION_VERIFICATION_FAILED'
  if (
    (Array.isArray(evidence.executions) && evidence.executions.length) ||
    /^PROVIDER_(HTTP_|UNAUTHORIZED|RATE_LIMITED|OFFLINE_OR_TIMEOUT|MODEL_IDENTITY_MISMATCH)/.test(
      code,
    ) ||
    code === 'CONFIGURED_MODEL_NOT_AVAILABLE'
  )
    evidence.classification = 'LIVE_EXTERNAL'
  Object.assign(evidence, {
    status: 'FAIL',
    code,
    stage,
    errorType: error instanceof Error ? error.name : 'UnknownError',
  })
  process.exitCode = 1
}
await Bun.write(
  path.join(directory, 'verification.json'),
  JSON.stringify(evidence, null, 2),
)
console.log(JSON.stringify(evidence))
