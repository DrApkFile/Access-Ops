import type { NextRequest } from 'next/server'
const MAX_BYTES = 12 * 1024 * 1024
async function forward(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  if (
    !['auth', 'v1', 'projects', 'health', 'ready'].includes(path[0] ?? '') ||
    path.some((s) => s === '..' || s.includes('/') || s.includes('\\'))
  )
    return Response.json({ error: 'Not found' }, { status: 404 })
  const headers = new Headers()
  for (const k of [
    'content-type',
    'cookie',
    'x-accessops-request',
    'idempotency-key',
    'if-match',
    'origin',
    'sec-fetch-site',
    'accept',
  ]) {
    const v = request.headers.get(k)
    if (v) headers.set(k, v)
  }
  // Do not invent the CSRF header here: callers must intentionally send it.
  let body: Uint8Array | undefined
  if (!['GET', 'HEAD'].includes(request.method)) {
    if (Number(request.headers.get('content-length') ?? 0) > MAX_BYTES)
      return Response.json({ error: 'Request too large' }, { status: 413 })
    const reader = request.body?.getReader()
    if (reader) {
      let size = 0
      const chunks: Uint8Array[] = []
      while (true) {
        const r = await reader.read()
        if (r.done) break
        size += r.value.byteLength
        if (size > MAX_BYTES) {
          await reader.cancel()
          return Response.json({ error: 'Request too large' }, { status: 413 })
        }
        chunks.push(r.value)
      }
      body = new Uint8Array(size)
      let offset = 0
      for (const chunk of chunks) {
        body.set(chunk, offset)
        offset += chunk.length
      }
    }
  }
  try {
    const origin =
      process.env.API_INTERNAL_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:3003'
    const response = await fetch(
      origin +
        '/' +
        path.map(encodeURIComponent).join('/') +
        request.nextUrl.search,
      {
        method: request.method,
        headers,
        body: body as BodyInit | undefined,
        redirect: 'manual',
        signal: AbortSignal.timeout(60000),
        cache: 'no-store',
      },
    )
    const outgoing = new Headers()
    for (const k of [
      'content-type',
      'content-disposition',
      'set-cookie',
      'x-request-id',
      'x-floor-model-version',
      'x-tactile-design-id',
      'x-geometry-status',
      'retry-after',
      'content-security-policy',
    ]) {
      const v = response.headers.get(k)
      if (v) outgoing.set(k, v)
    }
    outgoing.set('cache-control', 'no-store')
    outgoing.set('x-content-type-options', 'nosniff')
    return new Response(response.body, {
      status: response.status,
      headers: outgoing,
    })
  } catch {
    return Response.json(
      { error: 'Backend unavailable', code: 'BACKEND_UNAVAILABLE' },
      { status: 503 },
    )
  }
}
export const GET = forward
export const POST = forward
export const PATCH = forward
export const DELETE = forward
export const PUT = forward
