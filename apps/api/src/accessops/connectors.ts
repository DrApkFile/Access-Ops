import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { recordSchema, type SourceRecord } from '@accessops/domain'
import { boundedJson, type Transport } from '../providers/http'
import { AppError } from './errors'
import type { Principal } from './auth'
export const mbtaConfig = z
  .object({
    stationId: z.string().regex(/^place-[a-zA-Z0-9-]{1,80}$/),
    mode: z.enum(['facilities', 'alerts']),
    levelId: z.string().nullable().default(null),
  })
  .strict()
const envelope = z
  .object({
    data: z
      .array(
        z.object({
          id: z.string(),
          attributes: z.record(z.string(), z.unknown()),
        }),
      )
      .max(500),
    links: z.object({ next: z.string().nullable().optional() }).optional(),
  })
  .passthrough()
export function normalizeMbta(
  data: z.infer<typeof envelope>['data'],
  context: {
    buildingId: string
    namespace: string
    levelId: string | null
    mode: 'facilities' | 'alerts'
    retrievedAt: string
  },
): SourceRecord[] {
  const records: SourceRecord[] = []
  for (const row of data) {
    const a = row.attributes
    if (context.mode === 'facilities') {
      const kinds: Record<string, SourceRecord['entityKind']> = {
        ELEVATOR: 'lift',
        ESCALATOR: 'stairs',
      }
      const kind = kinds[String(a.type)]
      if (!kind) continue
      records.push(
        recordSchema.parse({
          externalId: row.id,
          buildingId: context.buildingId,
          levelId: context.levelId,
          entityKind: kind,
          entityName: String(a.long_name ?? row.id),
          entityExternalId: row.id,
          namespace: context.namespace,
          attribute: 'directory',
          value: String(a.long_name ?? row.id),
          unit: 'none',
          observedAt: context.retrievedAt,
          verification: 'reported',
          method:
            'MBTA V3 facility inventory; not a measurement or operating-status assertion',
          locator: '/facilities/' + row.id,
          sourceTimezone: 'America/New_York',
        }),
      )
    } else {
      if (!['ELEVATOR_CLOSURE', 'ESCALATOR_CLOSURE'].includes(String(a.effect)))
        continue
      const entities = z
        .array(z.object({ facility: z.string().optional() }).passthrough())
        .parse(a.informed_entity ?? [])
      const ids = [
        ...new Set(
          entities
            .map((x) => x.facility)
            .filter((x): x is string => Boolean(x)),
        ),
      ]
      const periods = z
        .array(
          z.object({
            start: z.string().datetime({ offset: true }).nullable(),
            end: z.string().datetime({ offset: true }).nullable(),
          }),
        )
        .parse(a.active_period ?? [])
      for (const facility of ids)
        for (const [i, period] of periods.entries())
          records.push(
            recordSchema.parse({
              externalId: row.id + ':' + facility + ':' + i,
              buildingId: context.buildingId,
              levelId: context.levelId,
              entityKind: a.effect === 'ELEVATOR_CLOSURE' ? 'lift' : 'stairs',
              entityName: 'MBTA facility ' + facility,
              entityExternalId: facility,
              namespace: context.namespace,
              attribute: 'operational_status',
              value: 'unavailable',
              observedAt: String(a.updated_at ?? a.created_at),
              effectiveFrom: period.start ?? undefined,
              effectiveTo: period.end ?? undefined,
              verification: 'reported',
              method: 'MBTA V3 reported closure; no inferred restoration',
              eventType:
                a.effect === 'ELEVATOR_CLOSURE'
                  ? 'lift_outage'
                  : 'route_closure',
              locator: '/alerts/' + row.id,
              sourceTimezone: 'America/New_York',
            }),
          )
    }
  }
  return records
}
export async function fetchMbta(
  context: { buildingId: string; namespace: string; config: unknown },
  transport: Transport = fetch,
) {
  const config = mbtaConfig.parse(context.config),
    retrievedAt = new Date().toISOString()
  let next: string | null =
    'https://api-v3.mbta.com/' +
    config.mode +
    '?filter%5Bstop%5D=' +
    encodeURIComponent(config.stationId) +
    '&page%5Blimit%5D=100' +
    (config.mode === 'alerts' ? '&filter%5Bactivity%5D=ALL' : '')
  const records: SourceRecord[] = []
  const rawPages: unknown[] = []
  let pages = 0
  while (next) {
    if (++pages > 10) throw new AppError('SOURCE_PAGINATION_LIMIT', 503)
    const url: URL = new URL(next)
    if (url.origin !== 'https://api-v3.mbta.com')
      throw new AppError('SOURCE_REDIRECT_DENIED', 503)
    const parsed = envelope.parse(
      await boundedJson(
        url.toString(),
        { headers: { accept: 'application/vnd.api+json' } },
        transport,
        15000,
        1,
      ),
    )
    rawPages.push(parsed)
    if (JSON.stringify(rawPages).length > 5 * 1024 * 1024)
      throw new AppError('SOURCE_RAW_BUDGET_EXCEEDED', 503)
    records.push(
      ...normalizeMbta(parsed.data, {
        buildingId: context.buildingId,
        namespace: context.namespace,
        ...config,
        retrievedAt,
      }),
    )
    next = parsed.links?.next
      ? new URL(parsed.links.next, url).toString()
      : null
  }
  return {
    records,
    pages,
    rawContent: JSON.stringify(rawPages),
    retrievedAt: new Date(retrievedAt),
  }
}
export async function synchronize(p: Principal, sourceId: string) {
  const { getSource } = await import('./store')
  const { ingest } = await import('./ingestion')
  const { db } = await import('../db')
  const { sources, ingestionRuns } = await import('./schema')
  const s = await getSource(p, sourceId)
  try {
    if (s.kind !== 'mbta')
      throw new AppError('SOURCE_REQUIRES_IMPORT_OR_FEDERATED_QUERY', 422)
    const fetched = await fetchMbta({
      buildingId: s.buildingId,
      namespace: s.namespace,
      config: s.config,
    })
    return await ingest(p, sourceId, fetched.records, fetched.retrievedAt, [], {
      content: fetched.rawContent,
      format: 'mbta',
    })
  } catch (e) {
    await db
      .update(sources)
      .set({
        lastError: e instanceof AppError ? e.code : 'SOURCE_REFRESH_FAILED',
      })
      .where(and(eq(sources.id, s.id), eq(sources.workspaceId, p.workspaceId)))
    await db
      .insert(ingestionRuns)
      .values({
        id: Bun.randomUUIDv7(),
        workspaceId: p.workspaceId,
        sourceId: s.id,
        status: 'failed',
        completedAt: new Date(),
        summary: {
          error: e instanceof AppError ? e.code : 'SOURCE_REFRESH_FAILED',
          retryEligible: true,
          snapshotPreserved: true,
        },
      })
    throw e
  }
}
