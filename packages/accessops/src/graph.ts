import {
  graphSchema,
  type Graph,
  type Profile,
  type Scenario,
  type Observation,
  type Entity,
} from './contracts'
import { reconcile, stateAt } from './reconcile'
export type Reachability = {
  entityId: string
  outcome: 'reachable' | 'unreachable' | 'unknown'
  path: string[]
  evidenceIds: string[]
  unknownEdges: string[]
}
export function validateGraph(
  graph: Graph,
  entities: Set<string>,
  evidence: Set<string>,
  context: Entity[] = [],
): string[] {
  const errors: string[] = []
  const nodes = new Map(graph.nodes.map((n) => [n.id, n]))
  if (nodes.size !== graph.nodes.length) errors.push('Duplicate node IDs')
  if (new Set(graph.edges.map((e) => e.id)).size !== graph.edges.length)
    errors.push('Duplicate edge IDs')
  if (!graph.reviewed || !graph.reviewerId)
    errors.push('Graph requires an authorized human review')
  if (!graph.nodes.some((n) => n.entry))
    errors.push('Graph requires at least one entry')
  for (const n of graph.nodes) {
    if (!entities.has(n.entityId))
      errors.push('Unknown node entity: ' + n.entityId)
    const canonical = context.find((e) => e.id === n.entityId)
    if (
      canonical &&
      (canonical.buildingId !== graph.buildingId ||
        (canonical.levelId !== null && canonical.levelId !== n.levelId))
    )
      errors.push('Node context conflicts with canonical entity: ' + n.id)
  }
  for (const e of graph.edges) {
    if (!nodes.has(e.from) || !nodes.has(e.to))
      errors.push('Missing endpoint: ' + e.id)
    if (!entities.has(e.entityId)) errors.push('Unknown edge entity: ' + e.id)
    if (!e.reviewed) errors.push('Unreviewed edge: ' + e.id)
    if (e.evidenceIds.length === 0)
      errors.push('Edge lacks topology evidence: ' + e.id)
    for (const x of [...e.evidenceIds, ...e.measurementEvidenceIds])
      if (!evidence.has(x)) errors.push('Unknown evidence: ' + x)
    const a = nodes.get(e.from),
      b = nodes.get(e.to)
    if (
      a &&
      b &&
      a.levelId !== b.levelId &&
      !['lift', 'stairs', 'ramp'].includes(e.kind)
    )
      errors.push('Unsupported inter-level edge: ' + e.id)
  }
  for (const x of graph.evidenceIds)
    if (!evidence.has(x)) errors.push('Unknown graph evidence: ' + x)
  return errors
}
export function analyzeGraph(
  graph: Graph,
  observations: Observation[],
  at: Date,
  profile: Profile,
  changes: Scenario['changes'] = [],
): Reachability[] {
  const current = reconcile(observations, at)
  const lookup = (entity: string, attr: string) =>
    current.find((r) => r.entityId === entity && r.attribute === attr)
  const closed = new Set(
    changes.filter((c) => c.kind === 'close').map((c) => c.entityId),
  )
  const opened = new Set(
    changes.filter((c) => c.kind === 'reopen').map((c) => c.entityId),
  )
  const nodeState = new Map<
    string,
    { state: 'yes' | 'no' | 'unknown'; evidence: string[] }
  >()
  for (const node of graph.nodes) {
    const operational = lookup(node.entityId, 'operational_status')
    let state: 'yes' | 'no' | 'unknown' = 'yes'
    if (closed.has(node.entityId)) state = 'no'
    else if (!opened.has(node.entityId) && operational) {
      if (!operational.selected) state = 'unknown'
      else if (
        ['unavailable', 'restricted'].includes(
          String(operational.selected.value),
        )
      )
        state = 'no'
      else if (operational.state !== 'verified') state = 'unknown'
    }
    nodeState.set(node.id, {
      state,
      evidence: operational?.evidence.map((o) => o.id) ?? [],
    })
  }
  const edgeState = new Map<
    string,
    { state: 'yes' | 'no' | 'unknown'; evidence: string[] }
  >()
  for (const e of graph.edges) {
    let state: 'yes' | 'no' | 'unknown' =
      e.reviewed && graph.reviewed ? 'yes' : 'unknown'
    const ids = [...e.evidenceIds]
    if (
      e.evidenceIds.length === 0 ||
      e.evidenceIds.some((id) => {
        const o = observations.find((x) => x.id === id)
        return !o || stateAt(o, at) !== 'verified'
      })
    )
      state = 'unknown'
    if (profile.kind === 'step-free') {
      if (e.kind === 'stairs' || e.stepFree === false) state = 'no'
      else if (e.stepFree === null) state = 'unknown'
    }
    const status = lookup(e.entityId, 'operational_status')
    if (status) ids.push(...status.evidence.map((o) => o.id))
    if (closed.has(e.entityId)) state = 'no'
    else if (!opened.has(e.entityId) && status) {
      if (!status.selected || status.state === 'simulated')
        state = state === 'no' ? 'no' : 'unknown'
      else if (
        ['unavailable', 'restricted'].includes(String(status.selected.value))
      )
        state = 'no'
    }
    const restriction = lookup(e.entityId, 'route_restriction')
    if (restriction) {
      ids.push(...restriction.evidence.map((o) => o.id))
      if (!restriction.selected) {
        if (state !== 'no') state = 'unknown'
      } else if (
        ['closed', 'restricted', 'true'].includes(
          String(restriction.selected.value),
        )
      )
        state = 'no'
      else if (
        !['open', 'none', 'false'].includes(
          String(restriction.selected.value),
        ) &&
        state !== 'no'
      )
        state = 'unknown'
    }
    // A lift requires current operating evidence and reviewed served-level evidence; a symbol alone is insufficient.
    if (e.kind === 'lift') {
      if (
        !opened.has(e.entityId) &&
        (!status?.selected || status.state !== 'verified')
      )
        state = state === 'no' ? 'no' : 'unknown'
      const served = lookup(e.entityId, 'lift_served_floors')
      const levels = graph.nodes
        .filter((n) => n.id === e.from || n.id === e.to)
        .map((n) => n.levelId)
      if (
        !served?.selected ||
        served.state !== 'verified' ||
        !Array.isArray(served.selected.value) ||
        !levels.every((l) => (served.selected!.value as string[]).includes(l))
      )
        state = state === 'no' ? 'no' : 'unknown'
      if (served) ids.push(...served.evidence.map((o) => o.id))
    }
    const requireNumeric = (
      attribute: string,
      check: (value: number) => boolean,
    ) => {
      const m = lookup(e.entityId, attribute)
      if (m) ids.push(...m.evidence.map((o) => o.id))
      if (
        !m?.selected ||
        m.state !== 'verified' ||
        typeof m.selected.value !== 'number'
      ) {
        if (state !== 'no') state = 'unknown'
        return
      }
      const o = m.selected
      let v = Number(o.value)
      if (attribute !== 'ramp_slope')
        v *= o.unit === 'm' ? 1000 : o.unit === 'cm' ? 10 : 1
      else if (o.unit === 'degrees') v = Math.tan((v * Math.PI) / 180) * 100
      if (!check(v)) state = 'no'
    }
    if (e.kind === 'door' && profile.minimumDoorWidthMm !== undefined)
      requireNumeric(
        'door_clear_width',
        (v) => v >= profile.minimumDoorWidthMm!,
      )
    if (e.kind === 'ramp' && profile.maximumRampSlopePercent !== undefined)
      requireNumeric('ramp_slope', (v) => v <= profile.maximumRampSlopePercent!)
    if (e.kind === 'door' && profile.maximumThresholdMm !== undefined)
      requireNumeric(
        'threshold_height',
        (v) => v <= profile.maximumThresholdMm!,
      )
    edgeState.set(e.id, { state, evidence: ids })
  }
  const search = (possible: boolean) => {
    const paths = new Map<string, string[]>()
    const queue = graph.nodes
      .filter(
        (n) =>
          n.entry &&
          nodeState.get(n.id)!.state !== 'no' &&
          (possible || nodeState.get(n.id)!.state === 'yes'),
      )
      .map((n) => n.id)
    for (const n of queue) paths.set(n, [])
    for (let i = 0; i < queue.length; i++) {
      const n = queue[i]!
      for (const e of graph.edges) {
        const next =
          e.from === n ? e.to : e.bidirectional && e.to === n ? e.from : null
        if (!next || paths.has(next)) continue
        const target = graph.nodes.find((x) => x.id === next)!
        const ns = nodeState.get(target.id)!
        if (ns.state === 'no' || (!possible && ns.state === 'unknown')) continue
        const s = edgeState.get(e.id)!
        if (s.state === 'no' || (!possible && s.state === 'unknown')) continue
        paths.set(next, [...paths.get(n)!, e.id])
        queue.push(next)
      }
    }
    return paths
  }
  const certain = search(false),
    possible = search(true)
  return graph.nodes
    .filter((n) => n.destination)
    .map((n) => {
      const relocation = changes.find(
        (c) => c.kind === 'relocate' && c.destinationId === n.entityId,
      )
      const target =
        relocation?.kind === 'relocate' ? relocation.toNodeId : n.id
      const definite = certain.get(target),
        maybe = possible.get(target)
      const path = definite ?? maybe ?? []
      return {
        entityId: n.entityId,
        outcome: definite
          ? 'reachable'
          : maybe || !graph.complete
            ? 'unknown'
            : 'unreachable',
        path,
        evidenceIds: [
          ...new Set([
            ...path.flatMap((id) => edgeState.get(id)!.evidence),
            ...graph.nodes
              .filter(
                (n) =>
                  n.entry ||
                  n.id === target ||
                  graph.edges.some(
                    (e) =>
                      path.includes(e.id) && (e.from === n.id || e.to === n.id),
                  ),
              )
              .flatMap((n) => nodeState.get(n.id)!.evidence),
          ]),
        ],
        unknownEdges: [
          ...path.filter((id) => edgeState.get(id)!.state === 'unknown'),
          ...graph.nodes
            .filter((n) => nodeState.get(n.id)!.state === 'unknown')
            .map((n) => 'node:' + n.id),
          ...(!graph.complete ? ['incomplete-graph-coverage'] : []),
        ],
      }
    })
}
export function simulate(
  graph: Graph,
  observations: Observation[],
  at: Date,
  profile: Profile,
  scenario: Scenario,
) {
  const copy = graphSchema.parse(structuredClone(graph))
  const ids = new Set([
    ...copy.nodes.map((n) => n.entityId),
    ...copy.edges.map((e) => e.entityId),
  ])
  for (const c of scenario.changes) {
    if (c.kind === 'relocate') {
      if (
        !copy.nodes.some((n) => n.id === c.toNodeId) ||
        !copy.nodes.some((n) => n.entityId === c.destinationId && n.destination)
      )
        throw new Error('Invalid relocation')
    } else if (!ids.has(c.entityId)) throw new Error('Unknown scenario entity')
  }
  const baseline = analyzeGraph(copy, observations, at, profile),
    result = analyzeGraph(copy, observations, at, profile, scenario.changes)
  return {
    baseline,
    result,
    affected: result.filter(
      (r) =>
        baseline.find((b) => b.entityId === r.entityId)?.outcome !== r.outcome,
    ),
    changedEdges: copy.edges
      .filter((e) =>
        scenario.changes.some(
          (c) =>
            c.kind !== 'relocate' &&
            (c.entityId === e.entityId ||
              copy.nodes.some(
                (n) =>
                  n.entityId === c.entityId &&
                  (n.id === e.from || n.id === e.to),
              )),
        ),
      )
      .map((e) => e.id),
    classification: 'simulated' as const,
    assumptions: [
      'Reviewed topology; only explicitly supplied profile constraints are checked',
      'Step-free connectivity is not wheelchair suitability or certified compliance',
    ],
  }
}
