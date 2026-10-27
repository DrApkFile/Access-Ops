import { stableJson, type Observation } from './contracts'
export function stateAt(
  o: Observation,
  at: Date,
): 'verified' | 'reported' | 'stale' | 'unknown' | 'simulated' {
  const t = at.getTime()
  if (o.sourceRefreshError && o.attribute === 'operational_status')
    return 'unknown'
  if (
    Date.parse(o.observedAt) > t ||
    Date.parse(o.retrievedAt) > t ||
    (o.lastVerifiedAt && Date.parse(o.lastVerifiedAt) > t) ||
    (o.effectiveFrom && Date.parse(o.effectiveFrom) > t) ||
    (o.effectiveTo && Date.parse(o.effectiveTo) <= t)
  )
    return 'unknown'
  if (
    t - Date.parse(o.lastVerifiedAt ?? o.observedAt) >
    o.freshnessSeconds * 1000
  )
    return 'stale'
  return o.verification
}
export function normalizedValue(o: Observation): unknown {
  if (typeof o.value === 'number' && ['mm', 'cm', 'm'].includes(o.unit))
    return {
      value: o.value * (o.unit === 'm' ? 1000 : o.unit === 'cm' ? 10 : 1),
      unit: 'mm',
    }
  return { value: o.value, unit: o.unit }
}
export type Reconciled = {
  entityId: string
  attribute: string
  state:
    | 'verified'
    | 'reported'
    | 'stale'
    | 'unknown'
    | 'simulated'
    | 'conflicting'
  selected: Observation | null
  evidence: Observation[]
  reason: string
}
export function reconcile(observations: Observation[], at: Date): Reconciled[] {
  const groups = new Map<string, Observation[]>()
  for (const o of observations) {
    if (!o.entityId) continue
    const key = o.entityId + '|' + o.attribute
    groups.set(key, [...(groups.get(key) ?? []), o])
  }
  return [...groups.values()].map((group) => {
    const current = group.filter(
      (o) => !['unknown', 'stale'].includes(stateAt(o, at)),
    )
    const head = group[0]!
    const base = {
      entityId: head.entityId!,
      attribute: head.attribute,
      evidence: group,
    }
    // A later observation from the SAME source supersedes its older version; independent disagreement remains visible.
    const bySource = new Map<string, Observation>()
    for (const o of current) {
      const prev = bySource.get(o.sourceId)
      if (!prev || Date.parse(o.observedAt) > Date.parse(prev.observedAt))
        bySource.set(o.sourceId, o)
    }
    const candidates = [...bySource.values()]
    const decision = group.find((o) => o.reviewDecision)?.reviewDecision
    const reviewed = decision
      ? candidates.find(
          (o) => o.id === decision.selectedId && stateAt(o, at) === 'verified',
        )
      : undefined
    if (
      reviewed &&
      decision &&
      Date.parse(decision.reviewedAt) <= at.getTime() &&
      candidates.every((o) => decision.evidenceIds.includes(o.id))
    )
      return {
        ...base,
        state: 'verified' as const,
        selected: reviewed,
        reason:
          'Authorized reviewer selected this observation; contrary evidence retained. Decision ' +
          decision.id +
          ': ' +
          decision.reason,
      }
    const values = new Set(
      candidates.map((o) => stableJson(normalizedValue(o))),
    )
    if (values.size > 1)
      return {
        ...base,
        state: 'conflicting' as const,
        selected: null,
        reason:
          'Current independent sources disagree; reviewer decision or new evidence required',
      }
    const sorted = candidates.sort(
      (a, b) =>
        Number(b.verification === 'verified') -
          Number(a.verification === 'verified') ||
        b.trust - a.trust ||
        Date.parse(b.observedAt) - Date.parse(a.observedAt),
    )
    if (!sorted[0])
      return {
        ...base,
        state: group.some((o) => stateAt(o, at) === 'stale')
          ? ('stale' as const)
          : ('unknown' as const),
        selected: null,
        reason: 'No fresh observation is effective at the investigation time',
      }
    return {
      ...base,
      state: stateAt(sorted[0], at),
      selected: sorted[0],
      reason:
        'Equivalent current values; verified observation, source trust, then observation time break ties',
    }
  })
}
