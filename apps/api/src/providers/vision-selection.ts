import { AppError } from '../accessops/errors'
import { visionConfiguration, visionReadiness } from './vision-configuration'

// Stable models with independently checked image/JSON support and free API pricing.
export const GEMINI_VISION_MODEL = 'gemini-3.6-flash'
export const OPENROUTER_VISION_MODEL = 'nvidia/nemotron-3.5-super-vl:free'
const freeVisionModels = new Set([GEMINI_VISION_MODEL, 'gemini-3.7-flash'])
export function selectVision(
  env: Record<string, string | undefined> = process.env,
) {
  const provider = env.VISION_PROVIDER ?? 'gemini'
  if (!['gemini', 'openrouter', 'nvidia', 'none'].includes(provider))
    throw new AppError('INVALID_VISION_PROVIDER', 422)
  if (provider === 'none') return { provider: 'none' as const, model: null }
  if (provider === 'nvidia')
    return { provider: 'nvidia' as const, ...visionConfiguration(env) }
  if (provider === 'openrouter') {
    const model = env.OPENROUTER_VISION_MODEL?.trim() || OPENROUTER_VISION_MODEL
    if (model !== OPENROUTER_VISION_MODEL)
      throw new AppError('OPENROUTER_FREE_VISION_MODEL_NOT_SUPPORTED', 422)
    return {
      provider: 'openrouter' as const,
      model,
      origin: 'https://openrouter.ai/api/v1',
      maxImages: 16,
      maxImageBytes: 5 * 1024 * 1024,
      maxPixels: 4_000_000,
      maxRequestBytes: 19 * 1024 * 1024,
      timeoutMs: 60_000,
    }
  }
  const model = env.GEMINI_VISION_MODEL?.trim() || GEMINI_VISION_MODEL
  if (!freeVisionModels.has(model))
    throw new AppError('GEMINI_VISION_MODEL_NOT_SUPPORTED', 422)
  if (
    env.GEMINI_FREE_TIER_CONFIRMED &&
    !['true', 'false'].includes(env.GEMINI_FREE_TIER_CONFIRMED)
  )
    throw new AppError('GEMINI_FREE_TIER_CONFIRMATION_INVALID', 422)
  return {
    provider: 'gemini' as const,
    model,
    origin: 'https://generativelanguage.googleapis.com',
    maxImages: 16,
    maxImageBytes: 5 * 1024 * 1024,
    maxPixels: 4_000_000,
    maxRequestBytes: 19 * 1024 * 1024,
    timeoutMs: 120_000,
  }
}
export function selectedVisionReadiness(workspaceId?: string) {
  try {
    const c = selectVision()
    if (c.provider === 'none')
      return {
        provider: c.provider,
        configured: false,
        state: 'disabled',
        inference: 'not_verified',
      }
    if (c.provider === 'nvidia')
      return {
        ...visionReadiness(),
        provider: c.provider,
        state: 'legacy_opt_in',
        automaticFallback: false,
      }
    if (c.provider === 'openrouter') {
      const missing = !process.env.OPENROUTER_API_KEY?.trim()
        ? ['OPENROUTER_API_KEY'] : []
      const permitted = Boolean(workspaceId &&
        (process.env.ACCESSOPS_PROVIDER_WORKSPACES ?? '').split(',').includes(workspaceId) &&
        (process.env.ACCESSOPS_OPENROUTER_VISION_WORKSPACES ?? '').split(',').includes(workspaceId))
      return {
        provider: c.provider, model: c.model, configured: !missing.length,
        missing, workspacePermitted: permitted,
        state: missing.length ? 'missing_configuration' : permitted ? 'configured_not_live_verified' : 'consent_required',
        capability: 'vision', inputFormats: ['image/png','image/jpeg','image/webp'],
        wireFormat: 'image/png', inference: 'not_verified_by_configuration_or_text_inference',
        freeAccess: 'checked_against_account_and_catalog_before_each_request',
        automaticFallback: false,
      }
    }
    const missing = [
      !process.env.GEMINI_API_KEY?.trim() && 'GEMINI_API_KEY',
      process.env.GEMINI_FREE_TIER_CONFIRMED !== 'true' &&
        'GEMINI_FREE_TIER_CONFIRMED',
    ].filter(Boolean)
    const permitted = Boolean(
      workspaceId &&
        (process.env.ACCESSOPS_GEMINI_VISION_WORKSPACES ?? '')
          .split(',')
          .includes(workspaceId) &&
        (process.env.ACCESSOPS_PROVIDER_WORKSPACES ?? '')
          .split(',')
          .includes(workspaceId),
    )
    return {
      provider: c.provider,
      model: c.model,
      configured: !missing.length,
      missing,
      workspacePermitted: permitted,
      state: missing.length
        ? 'missing_configuration'
        : permitted
          ? 'configured_not_live_verified'
          : 'consent_required',
      capability: 'vision',
      inputFormats: ['image/png', 'image/jpeg', 'image/webp'],
      wireFormat: 'image/png',
      inference: 'not_verified_by_configuration_or_text_inference',
      automaticFallback: false,
    }
  } catch (e) {
    return {
      provider: 'unavailable',
      configured: false,
      code: e instanceof AppError ? e.code : 'INVALID_VISION_CONFIGURATION',
      inference: 'not_verified',
    }
  }
}
