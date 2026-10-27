import type { MiddlewareHandler } from 'hono'
import { config } from './config'
import { db } from '../db'
import { AppError, hash, log } from './errors'
import type { Env } from './auth'
export const metrics = {
  requests: 0,
  failures: 0,
  requestMilliseconds: 0,
  providerFailures: 0,
  citationFailures: 0,
  ingestions: 0,
  investigations: 0,
  scenarios: 0,
  jobRetries: 0,
  exports: 0,
}
export const instrumentation: MiddlewareHandler<Env> = async (c, next) => {
  const started = performance.now()
  const requestId = crypto.randomUUID()
  c.set('requestId', requestId)
  c.header('x-request-id', requestId)
  c.header('x-content-type-options', 'nosniff')
  c.header('referrer-policy', 'same-origin')
  c.header('cache-control', 'no-store')
  await next()
  const duration = performance.now() - started
  metrics.requests++
  metrics.requestMilliseconds += duration
  if (c.res.status >= 400) metrics.failures++
  log('request', {
    requestId,
    method: c.req.method,
    path: c.req.path.replace(/[a-f0-9-]{30,}/g, ':id'),
    status: c.res.status,
    durationMs: Math.round(duration),
  })
}
export const csrf: MiddlewareHandler<Env> = async (c, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) {
    const origin = c.req.header('origin')
    if (
      (origin &&
        !config.ACCESSOPS_ALLOWED_ORIGINS.split(',')
          .map((s) => s.trim())
          .includes(origin)) ||
      c.req.header('sec-fetch-site') === 'cross-site'
    )
      throw new AppError('ORIGIN_DENIED', 403)
    if (c.req.header('x-accessops-request') !== '1')
      throw new AppError('CSRF_HEADER_REQUIRED', 403)
  }
  await next()
}
export function rateLimit(
  limit: number,
  scope: string,
): MiddlewareHandler<Env> {
  return async (c, next) => {
    const principal = c.get('principal')
    const identity = principal
      ? principal.workspaceId + ':' + principal.userId
      : (c.env?.remoteIp ?? 'unknown')
    const key = hash(scope + ':' + identity)
    const rows =
      await db.$client`INSERT INTO ao_rate_limits (key,count,reset_at) VALUES (${key},1,now()+interval '1 minute') ON CONFLICT(key) DO UPDATE SET count=CASE WHEN ao_rate_limits.reset_at<now() THEN 1 ELSE ao_rate_limits.count+1 END,reset_at=CASE WHEN ao_rate_limits.reset_at<now() THEN now()+interval '1 minute' ELSE ao_rate_limits.reset_at END RETURNING count`
    if (Number(rows[0]?.count) > limit) {
      c.header('retry-after', '60')
      throw new AppError('RATE_LIMITED', 429)
    }
    await next()
  }
}
