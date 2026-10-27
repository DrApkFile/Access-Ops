import type { MessagePart } from './llm'
import { selectVision } from '../providers/vision-selection'
import { AppError } from '../accessops/errors'
import type { Transport } from '../providers/http'

/** Explicit image routing; errors never switch to another provider. Text is separate. */
export async function runVisionTurn(
  options: { agentName: string; instruction: string; parts: MessagePart[] },
  transport: Transport = fetch,
) {
  const selected = selectVision()
  if (selected.provider === 'none')
    throw new AppError('VISION_INFERENCE_DISABLED', 503)
  if (selected.provider === 'gemini') {
    const { runGeminiVisionTurn } = await import('./gemini-vision')
    return runGeminiVisionTurn(options, transport)
  }
  if (selected.provider === 'openrouter') {
    const { runOpenRouterVisionTurn } = await import('./openrouter-vision')
    return runOpenRouterVisionTurn(options, transport)
  }
  const { runNvidiaTurn } = await import('./nvidia')
  return runNvidiaTurn({ ...options, model: selected.model }, transport)
}
