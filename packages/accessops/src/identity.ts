import type { Entity, SourceRecord } from './contracts'
export function normalizedName(s: string) {
  return s.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/\s+/g, ' ')
}
export type Match = {
  state: 'confirmed' | 'provisional' | 'conflicting' | 'unresolved'
  entityId: string | null
  candidates: string[]
  reason: string
}
export function matchEntity(
  record: SourceRecord,
  entities: Entity[],
  confirmedMapping?: string,
): Match {
  const scoped = entities.filter(
    (e) =>
      e.buildingId === record.buildingId &&
      e.kind === record.entityKind &&
      (record.levelId === null || e.levelId === record.levelId),
  )
  const exact = scoped.filter(
    (e) =>
      record.entityExternalId &&
      e.aliases.some(
        (a) =>
          a.namespace === record.namespace &&
          a.externalId === record.entityExternalId,
      ),
  )
  const result = (
    items: Entity[],
    state: Match['state'],
    reason: string,
  ): Match => ({
    state:
      items.length > 1
        ? 'conflicting'
        : items.length === 1
          ? state
          : 'unresolved',
    entityId: items.length === 1 ? items[0]!.id : null,
    candidates: items.map((e) => e.id),
    reason,
  })
  if (exact.length)
    return result(
      exact,
      'confirmed',
      'Exact external ID within building, type, namespace and level context',
    )
  if (confirmedMapping) {
    const e = scoped.filter((e) => e.id === confirmedMapping)
    return result(e, 'confirmed', 'Explicit reviewer mapping')
  }
  if (
    record.levelId === null &&
    !['building', 'lift'].includes(record.entityKind)
  )
    return {
      state: 'unresolved',
      entityId: null,
      candidates: [],
      reason: 'Level context is required for a name-only spatial match',
    }
  return result(
    scoped.filter(
      (e) => normalizedName(e.name) === normalizedName(record.entityName),
    ),
    'provisional',
    'Normalized name and building/level context; requires human confirmation',
  )
}
