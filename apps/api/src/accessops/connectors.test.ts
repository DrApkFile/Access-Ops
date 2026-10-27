import { expect, test } from 'bun:test'
import { normalizeMbta, fetchMbta } from './connectors'
const context = {
  buildingId: 'b',
  namespace: 'mbta',
  levelId: null,
  mode: 'alerts' as const,
  retrievedAt: '2026-10-26T00:00:00Z',
}
test('escalator closures never become lift outages', () => {
  const rows = normalizeMbta(
    [
      {
        id: '1',
        attributes: {
          effect: 'ESCALATOR_CLOSURE',
          updated_at: '2026-10-25T00:00:00Z',
          informed_entity: [{ facility: '123' }],
          active_period: [{ start: '2026-10-25T00:00:00Z', end: null }],
        },
      },
    ],
    context,
  )
  expect(rows[0]!.entityKind).toBe('stairs')
  expect(rows[0]!.eventType).toBe('route_closure')
  expect(rows[0]!.observedAt).toBe('2026-10-25T00:00:00Z')
})
test('failed or truncated refresh is not returned as a healthy empty source', async () => {
  const fetcher = (async () =>
    new Response('', { status: 500 })) as unknown as typeof fetch
  await expect(
    fetchMbta(
      {
        buildingId: 'b',
        namespace: 'mbta',
        config: { stationId: 'place-andrw', mode: 'alerts' },
      },
      fetcher,
    ),
  ).rejects.toThrow()
})
test('foreign pagination host is rejected instead of following an SSRF link', async () => {
  const fetcher = (async () =>
    Response.json({
      data: [],
      links: { next: 'http://169.254.169.254/metadata' },
    })) as unknown as typeof fetch
  await expect(
    fetchMbta(
      {
        buildingId: 'b',
        namespace: 'mbta',
        config: { stationId: 'place-andrw', mode: 'alerts' },
      },
      fetcher,
    ),
  ).rejects.toThrow('SOURCE_REDIRECT_DENIED')
})
