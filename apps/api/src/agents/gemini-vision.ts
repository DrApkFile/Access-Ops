import { z } from 'zod'
import type { MessagePart } from './llm'
import { AppError, hash, log } from '../accessops/errors'
import { boundedJson, type Transport } from '../providers/http'
import { selectVision } from '../providers/vision-selection'
import { requireProviderConsent } from '../providers/workspace-scope'
import { prepareVisionInput } from '../lib/vision-image'
import { recordModelExecution } from '../providers/model-executions'

const envelope = z.object({
  modelVersion: z.string().min(1),
  responseId: z.string().optional(),
  candidates: z
    .array(
      z.object({
        finishReason: z.string(),
        content: z.object({
          parts: z.array(
            z.object({
              text: z.string().optional(),
              thought: z.boolean().optional(),
            }),
          ),
        }),
      }),
    )
    .min(1),
})

/** Original Gemini image capability through documented REST; no new SDK or paid fallback. */
export async function runGeminiVisionTurn(
  options: { agentName: string; instruction: string; parts: MessagePart[] },
  transport: Transport = fetch,
) {
  const started = Date.now(),
    workspace = requireProviderConsent()
  if (
    !(process.env.ACCESSOPS_GEMINI_VISION_WORKSPACES ?? '')
      .split(',')
      .includes(workspace)
  )
    throw new AppError('GEMINI_VISION_WORKSPACE_CONSENT_REQUIRED', 403)
  const config = selectVision()
  if (config.provider !== 'gemini')
    throw new AppError('GEMINI_VISION_NOT_SELECTED', 422)
  const key = process.env.GEMINI_API_KEY?.trim()
  if (!key) throw new AppError('GEMINI_VISION_CREDENTIALS_REQUIRED', 503)
  // The API key cannot reveal billing tier. This must attest an unbilled free project.
  if (process.env.GEMINI_FREE_TIER_CONFIRMED !== 'true')
    throw new AppError('GEMINI_FREE_PROJECT_CONFIRMATION_REQUIRED', 503)
  const count = options.parts.filter((p) => 'inlineData' in p).length
  if (!count) throw new AppError('GEMINI_VISION_IMAGE_REQUIRED', 422)
  if (count > config.maxImages)
    throw new AppError('VISION_IMAGE_COUNT_LIMIT', 413)
  const provenance: Awaited<ReturnType<typeof prepareVisionInput>>[] = [],
    parts: MessagePart[] = []
  let encodedSize = 0
  for (const part of options.parts) {
    if ('text' in part) {
      parts.push(part)
      continue
    }
    encodedSize += part.inlineData.data.length
    if (encodedSize > config.maxRequestBytes)
      throw new AppError('GEMINI_REQUEST_BUDGET_EXCEEDED', 413)
    const image = await prepareVisionInput(
      part.inlineData.data,
      part.inlineData.mimeType,
      config,
    )
    provenance.push(image)
    parts.push({ inlineData: { mimeType: 'image/png', data: image.data } })
  }
  const maxTokens = Number(process.env.GEMINI_VISION_MAX_OUTPUT_TOKENS ?? 8192)
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 16384)
    throw new AppError('GEMINI_OUTPUT_BUDGET_INVALID', 422)
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: options.instruction }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: maxTokens,
      responseMimeType: 'application/json',
    },
  })
  if (Buffer.byteLength(body) > config.maxRequestBytes)
    throw new AppError('GEMINI_REQUEST_BUDGET_EXCEEDED', 413)
  let raw: unknown
  log('vision.request', { provider: 'gemini', requestedModel: config.model,
    execution: transport === fetch ? 'live' : 'mocked', capability: 'vision',
    inputSha256: provenance.map(p => p.sourceSha256) })
  try {
    raw = await boundedJson(
      `${config.origin}/v1beta/models/${config.model}:generateContent`,
      {
        method: 'POST',
        headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
        body,
      },
      transport,
      config.timeoutMs,
      0,
    )
  } catch (error) {
    const code = error instanceof AppError ? error.code : 'UNKNOWN'
    const mapped =
      code === 'PROVIDER_UNAUTHORIZED'
        ? 'GEMINI_UNAUTHORIZED'
        : code === 'PROVIDER_RATE_LIMITED'
          ? 'GEMINI_RATE_LIMITED'
          : code === 'PROVIDER_HTTP_404'
            ? 'GEMINI_MODEL_NOT_AVAILABLE'
            : code === 'PROVIDER_HTTP_503'
              ? 'GEMINI_SERVICE_BUSY'
              : code === 'PROVIDER_OFFLINE_OR_TIMEOUT'
                ? 'GEMINI_REQUEST_TIMEOUT'
                : 'GEMINI_REQUEST_REJECTED'
    log('vision.request_failed', {provider:'gemini',requestedModel:config.model,code:mapped,durationMs:Date.now()-started,completionAccepted:false})
    throw new AppError(mapped, 503)
  }
  const validated = envelope.safeParse(raw)
  if (!validated.success) throw new AppError('GEMINI_INVALID_RESPONSE', 502)
  const result = validated.data,
    candidate = result.candidates[0]!
  const suffix = result.modelVersion.slice(config.model.length)
  if (
    result.modelVersion !== config.model &&
    !(
      result.modelVersion.startsWith(config.model + '-') &&
      /^-\d{3}$/.test(suffix)
    )
  )
    throw new AppError('PROVIDER_MODEL_IDENTITY_MISMATCH', 502)
  if (candidate.finishReason !== 'STOP')
    throw new AppError(
      candidate.finishReason === 'MAX_TOKENS'
        ? 'GEMINI_OUTPUT_TRUNCATED'
        : 'GEMINI_OUTPUT_REJECTED',
      502,
    )
  const content = candidate.content.parts
    .filter((p) => !p.thought)
    .map((p) => p.text ?? '')
    .join('')
  const secrets = [
    key,
    process.env.NVIDIA_API_KEY,
    process.env.METERLESS_RUNTIME_TOKEN,
  ].filter((s): s is string => Boolean(s && s.length >= 8))
  if (secrets.some((s) => JSON.stringify(result).includes(s)))
    throw new AppError('PROVIDER_SECRET_ECHO_REJECTED', 502)
  if (!content.trim()) throw new AppError('GEMINI_EMPTY_OUTPUT', 502)
  let json: unknown
  try {
    json = JSON.parse(content)
  } catch {
    throw new AppError('GEMINI_INVALID_OUTPUT_JSON', 502)
  }
  if (!json || typeof json !== 'object' || Array.isArray(json))
    throw new AppError('GEMINI_INVALID_OUTPUT_JSON', 502)
  const metadata = {
    provider: 'gemini' as const,
    requestedModel: config.model,
    model: result.modelVersion,
    requestId: result.responseId ?? null,
    capability: 'vision' as const,
    execution: transport === fetch ? ('live' as const) : ('mocked' as const),
    durationMs: Date.now() - started,
    inputImages: provenance.map(({ data, mimeType, ...source }) => source),
    responseTextSha256: hash(content),
    geometryReviewed: false as const,
  }
  recordModelExecution(metadata)
  log('model.execution', metadata)
  // Agent-specific strict schemas and deterministic validation remain downstream.
  return content
}
