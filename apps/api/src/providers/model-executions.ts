import { AsyncLocalStorage } from 'node:async_hooks'
export type ModelExecution = {
  provider: 'nvidia' | 'gemini' | 'openrouter'
  requestedModel: string
  model: string
  requestId: string | null
  capability: 'vision' | 'text'
  execution: 'live' | 'mocked'
  durationMs: number
  inputImages: {
    sourceSha256: string
    sentSha256: string
    width: number
    height: number
    sourceMime: string
  }[]
  responseTextSha256: string
  geometryReviewed: false
  servingProvider?: string
  completedAt?: string
  httpStatus?: number
  reportedCost?: number
}
const scope = new AsyncLocalStorage<ModelExecution[]>()
export async function captureModelExecutions<T>(
  task: (executions: ModelExecution[]) => Promise<T>,
) {
  const executions: ModelExecution[] = []
  const value = await scope.run(executions, () => task(executions))
  return { value, executions }
}
export function recordModelExecution(record: ModelExecution) {
  const records = scope.getStore()
  if (records && records.length < 100) records.push(record)
}
