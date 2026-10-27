import { normalizeOrigin } from './http'
import { AppError } from '../accessops/errors'
export const OMNI_VISION_MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning'
export const SUPER_VISION_MODEL = 'nvidia/nemotron-3.5-super-vl-120b-a12b'
// Capability declarations come from these models' NVIDIA model cards, not name heuristics.
const documentedVisionModels = new Set([OMNI_VISION_MODEL, SUPER_VISION_MODEL])
export function visionConfiguration(
  env: Record<string, string | undefined> = process.env,
) {
  const model = env.NVIDIA_VISION_MODEL?.trim()
  if (!model) throw new AppError('NVIDIA_VISION_MODEL_REQUIRED', 503)
  if (!documentedVisionModels.has(model))
    throw new AppError('NVIDIA_MODEL_HAS_NO_SUPPORTED_VISION_CONTRACT', 422)
  return {
    model,
    baseUrl: normalizeOrigin(
      env.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1',
    ),
    maxImages: 16,
    maxImageBytes: 5 * 1024 * 1024,
    maxTotalBytes: 20 * 1024 * 1024,
    maxPixels: 2000 * 2000,
    outputMime: 'image/png' as const,
    thinking: { enable_thinking: false },
  }
}
export function visionReadiness() {
  try {
    const c = visionConfiguration()
    return {
      configured: true,
      model: c.model,
      capability: 'vision',
      inputFormats: ['image/png', 'image/jpeg', 'image/webp'],
      wireFormat: 'image/png',
      inference: 'not_verified_by_configuration_or_text_inference',
    }
  } catch (e) {
    return {
      configured: false,
      capability: 'vision',
      code: e instanceof AppError ? e.code : 'INVALID_VISION_CONFIGURATION',
      inference: 'not_verified',
    }
  }
}
