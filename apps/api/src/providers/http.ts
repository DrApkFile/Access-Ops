import { AppError } from '../accessops/errors'
export type Transport = (
  input: Parameters<typeof fetch>[0],
  init?: RequestInit,
) => Promise<Response>
export async function boundedJson(
  url: string,
  init: RequestInit = {},
  transport: Transport = fetch,
  timeout = 30000,
  retries = 1,
): Promise<unknown> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await transport(url, {
        ...init,
        redirect: 'error',
        signal: init.signal
          ? AbortSignal.any([init.signal, AbortSignal.timeout(timeout)])
          : AbortSignal.timeout(timeout),
      })
      if (r.status === 401 || r.status === 403)
        throw new AppError('PROVIDER_UNAUTHORIZED', 503)
      if ([429, 502, 503, 504].includes(r.status) && attempt < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(2000, 200 * 2 ** attempt)),
        )
        continue
      }
      if (!r.ok)
        throw new AppError(
          r.status === 429
            ? 'PROVIDER_RATE_LIMITED'
            : 'PROVIDER_HTTP_' + r.status,
          503,
        )
      const reader = r.body?.getReader()
      if (!reader) throw new AppError('EMPTY_PROVIDER_RESPONSE', 502)
      const chunks: Uint8Array[] = []
      let size = 0
      while (true) {
        const part = await reader.read()
        if (part.done) break
        size += part.value.byteLength
        if (size > 2 * 1024 * 1024) {
          await reader.cancel()
          throw new AppError('PROVIDER_RESPONSE_TOO_LARGE', 502)
        }
        chunks.push(part.value)
      }
      const bytes = new Uint8Array(size)
      let offset = 0
      for (const x of chunks) {
        bytes.set(x, offset)
        offset += x.byteLength
      }
      try {
        return JSON.parse(new TextDecoder().decode(bytes))
      } catch {
        throw new AppError('PROVIDER_INVALID_JSON', 502)
      }
    } catch (e) {
      if (e instanceof AppError) throw e
      if (init.signal?.aborted) throw new AppError('PROVIDER_CANCELLED', 503)
      if (attempt === retries)
        throw new AppError('PROVIDER_OFFLINE_OR_TIMEOUT', 503)
    }
  }
  throw new AppError('PROVIDER_UNAVAILABLE', 503)
}
export function normalizeOrigin(input: string): string {
  const s = input.includes('://') ? input : 'http://' + input
  const u = new URL(s)
  if (
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    !['http:', 'https:'].includes(u.protocol)
  )
    throw new AppError('INVALID_PROVIDER_URL', 422)
  if (
    u.protocol === 'http:' &&
    !['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname) &&
    process.env.NODE_ENV !== 'test'
  )
    throw new AppError('PROVIDER_REQUIRES_HTTPS', 422)
  if (
    !/^\/(?:v1\/)*(?:v1(?:\/(?:chat\/completions|models))?|healthz)?\/?$/.test(
      u.pathname,
    )
  )
    throw new AppError('UNSUPPORTED_PROVIDER_PATH', 422)
  u.pathname = '/v1'
  return u.toString().replace(/\/$/, '')
}
