import { z } from 'zod'
import type { MessagePart } from './llm'
import { AppError, hash, log } from '../accessops/errors'
import { boundedJson, type Transport } from '../providers/http'
import { selectVision } from '../providers/vision-selection'
import { requireProviderConsent } from '../providers/workspace-scope'
import { prepareVisionInput } from '../lib/vision-image'
import { recordModelExecution } from '../providers/model-executions'

const accountSchema = z.object({ data: z.object({ is_free_tier: z.boolean() }) })
const catalogSchema = z.object({ data: z.array(z.unknown()) })
const catalogModel = z.object({
  id: z.string(),
  pricing: z.record(z.string(), z.string()),
  architecture: z.object({ input_modalities: z.array(z.string()) }),
  supported_parameters: z.array(z.string()),
})
const envelope = z.object({
  id: z.string().min(1), model: z.string().min(1), provider: z.string().optional(),
  choices: z.array(z.object({ finish_reason: z.string(), message: z.object({ content: z.string() }) })).min(1),
  usage: z.object({ cost: z.number().nonnegative().optional() }).optional(),
})

/** Free-only image transport. Text inference, deterministic checks and review remain separate. */
export async function runOpenRouterVisionTurn(
  options: { agentName: string; instruction: string; parts: MessagePart[] },
  transport: Transport = fetch,
) {
  const started = Date.now(), workspace = requireProviderConsent(), config = selectVision()
  if (config.provider !== 'openrouter') throw new AppError('OPENROUTER_VISION_NOT_SELECTED', 422)
  if (!(process.env.ACCESSOPS_OPENROUTER_VISION_WORKSPACES ?? '').split(',').includes(workspace))
    throw new AppError('OPENROUTER_VISION_CONSENT_REQUIRED', 403)
  const key = process.env.OPENROUTER_API_KEY?.trim()
  if (!key) throw new AppError('OPENROUTER_VISION_CREDENTIALS_REQUIRED', 503)
  const count = options.parts.filter(p => 'inlineData' in p).length
  if (!count) throw new AppError('FREE_VISION_IMAGE_REQUIRED', 422)
  if (count > config.maxImages) throw new AppError('VISION_IMAGE_COUNT_LIMIT', 413)
  const images: Awaited<ReturnType<typeof prepareVisionInput>>[] = []
  const content: ({type:'text';text:string} | {type:'image_url';image_url:{url:string}})[] = []
  let encodedSize = 0
  for (const part of options.parts) {
    if ('text' in part) { content.push({type:'text',text:part.text}); continue }
    encodedSize += part.inlineData.data.length
    if (encodedSize > config.maxRequestBytes) throw new AppError('FREE_VISION_REQUEST_TOO_LARGE', 413)
    const image = await prepareVisionInput(part.inlineData.data, part.inlineData.mimeType, config)
    images.push(image)
    content.push({type:'image_url',image_url:{url:'data:image/png;base64,'+image.data}})
  }
  const maxTokens = Number(process.env.OPENROUTER_VISION_MAX_OUTPUT_TOKENS ?? 8192)
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 16384)
    throw new AppError('FREE_VISION_OUTPUT_BUDGET_INVALID', 422)
  const body = JSON.stringify({
    model: config.model, messages: [{role:'system',content:options.instruction},{role:'user',content}],
    temperature: 0.1, max_tokens: maxTokens, stream: false,
    response_format: {type:'json_object'}, reasoning: {enabled:false},
    // Never route to a paid model/provider, even if the catalog changes.
    provider: {require_parameters:true,allow_fallbacks:false,max_price:{prompt:0,completion:0,request:0,image:0}},
  })
  if (Buffer.byteLength(body) > config.maxRequestBytes) throw new AppError('FREE_VISION_REQUEST_TOO_LARGE', 413)
  const headers = {Authorization:'Bearer '+key,'content-type':'application/json'}
  let raw: unknown
  log('vision.request',{provider:'openrouter',requestedModel:config.model,capability:'vision',
    execution:transport===fetch?'live':'mocked',inputSha256:images.map(i=>i.sourceSha256)})
  try {
    // Discovery is not inference proof. It prevents accidental paid/account-ineligible execution.
    const account = accountSchema.safeParse(await boundedJson(config.origin+'/key',{headers},transport,15000,0))
    if (!account.success || !account.data.data.is_free_tier)
      throw new AppError('FREE_VISION_ACCOUNT_NOT_ELIGIBLE',503)
    const catalog = catalogSchema.safeParse(await boundedJson(config.origin+'/models',{headers},transport,15000,0))
    const selectedModel = catalogModel.safeParse(catalog.success ? catalog.data.data.find(m=>
      typeof m === 'object' && m !== null && 'id' in m && m.id === config.model) : undefined)
    const model = selectedModel.success ? selectedModel.data : undefined
    if (!model || !model.architecture.input_modalities.includes('image') ||
      !model.supported_parameters.includes('response_format') ||
      !['prompt','completion'].every(p=>model.pricing[p] !== undefined && Number(model.pricing[p]) === 0) ||
      ['request','image'].some(p=>model.pricing[p] !== undefined && Number(model.pricing[p]) !== 0))
      throw new AppError('FREE_VISION_MODEL_NOT_AVAILABLE',503)
    raw = await boundedJson(config.origin+'/chat/completions',{method:'POST',headers,body},transport,config.timeoutMs,1)
  } catch (error) {
    const code = error instanceof AppError ? error.code : 'UNKNOWN'
    const mapped = code.startsWith('FREE_VISION_') ? code :
      code === 'PROVIDER_UNAUTHORIZED' ? 'FREE_VISION_ACCESS_DENIED' :
      code === 'PROVIDER_RATE_LIMITED' ? 'FREE_VISION_THROTTLED' :
      code === 'PROVIDER_HTTP_404' ? 'FREE_VISION_MODEL_NOT_AVAILABLE' :
      code === 'PROVIDER_HTTP_400' ? 'FREE_VISION_INPUT_REJECTED' :
      /^PROVIDER_HTTP_5/.test(code) ? 'FREE_VISION_BUSY' :
      code === 'PROVIDER_OFFLINE_OR_TIMEOUT' ? 'FREE_VISION_TIMEOUT' : 'FREE_VISION_REQUEST_REJECTED'
    log('vision.request_failed',{provider:'openrouter',requestedModel:config.model,code:mapped,
      upstreamCode:code,durationMs:Date.now()-started,completionAccepted:false})
    throw new AppError(mapped,503)
  }
  const secrets = [key,process.env.GEMINI_API_KEY,process.env.NVIDIA_API_KEY,
    process.env.GROQ_API_KEY,process.env.METERLESS_RUNTIME_TOKEN].filter((s):s is string=>Boolean(s && s.length>=8))
  if (secrets.some(s=>JSON.stringify(raw).includes(s))) throw new AppError('PROVIDER_SECRET_ECHO_REJECTED',502)
  const parsed = envelope.safeParse(raw)
  if (!parsed.success) throw new AppError('FREE_VISION_INVALID_RESPONSE',502)
  const result = parsed.data, choice = result.choices[0]!
  if (result.model !== config.model) throw new AppError('PROVIDER_MODEL_IDENTITY_MISMATCH',502)
  if (result.usage?.cost !== undefined && result.usage.cost !== 0) throw new AppError('FREE_VISION_COST_NOT_ZERO',502)
  if (choice.finish_reason !== 'stop') throw new AppError(
    choice.finish_reason === 'length' ? 'FREE_VISION_OUTPUT_TRUNCATED' : 'FREE_VISION_OUTPUT_REJECTED',502)
  let json: unknown
  try { json = JSON.parse(choice.message.content) }
  catch { throw new AppError('FREE_VISION_INVALID_OUTPUT',502) }
  if (!json || typeof json !== 'object' || Array.isArray(json)) throw new AppError('FREE_VISION_INVALID_OUTPUT',502)
  const metadata = {
    provider:'openrouter' as const, requestedModel:config.model,model:result.model,
    servingProvider:result.provider,requestId:result.id,capability:'vision' as const,
    execution:transport===fetch?'live' as const:'mocked' as const,durationMs:Date.now()-started,
    completedAt:new Date().toISOString(),httpStatus:200,reportedCost:result.usage?.cost,
    inputImages:images.map(({data,mimeType,...source})=>source),
    responseTextSha256:hash(choice.message.content),geometryReviewed:false as const,
  }
  recordModelExecution(metadata)
  log('model.execution',metadata)
  return choice.message.content
}
