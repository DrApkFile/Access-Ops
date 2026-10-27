export class AppError extends Error {
  constructor(
    public code: string,
    public status:
      | 400
      | 401
      | 403
      | 404
      | 409
      | 413
      | 422
      | 429
      | 502
      | 503 = 400,
    message = code,
  ) {
    super(message)
  }
}
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        /password|secret|token|authorization|cookie|api.?key|credential|connection.?string/i.test(
          k,
        )
          ? '[REDACTED]'
          : redact(v),
      ]),
    )
  if (typeof value === 'string')
    return value
      .replace(/(Bearer\s+)[^\s"']+/gi, '$1[REDACTED]')
      .replace(/(postgres(?:ql)?:\/\/)[^\s]+/gi, '$1[REDACTED]')
      .replace(/\b(?:nvapi-|sk-|gsk_)[A-Za-z0-9_-]+/g, '[REDACTED]')
  return value
}
export function log(event: string, fields: Record<string, unknown> = {}) {
  console.log(
    JSON.stringify({
      time: new Date().toISOString(),
      event,
      ...(redact(fields) as object),
    }),
  )
}
export const hash = (s: string | Uint8Array) =>
  new Bun.CryptoHasher('sha256').update(s).digest('hex')
