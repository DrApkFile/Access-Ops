import { describe, expect, test } from 'bun:test'
import {
  matchEntity,
  recordSchema,
  reconcile,
  stateAt,
  analyzeGraph,
  simulate,
  validateGraph,
  type Entity,
  type Observation,
  type Graph,
  deterministicFindings,
} from '../src'
const at = new Date('2026-10-26T12:00:00Z')
const base = recordSchema.parse({
  externalId: 'rec-1',
  buildingId: 'b',
  levelId: 'l1',
  entityKind: 'door',
  entityName: 'Door A',
  namespace: 'audit',
  attribute: 'door_clear_width',
  value: 90,
  unit: 'cm',
  observedAt: '2026-10-26T11:59:00Z',
  lastVerifiedAt: '2026-10-26T11:59:00Z',
  verification: 'verified',
  method: 'Tape measurement by reviewer',
  locator: 'sheet:doors:row2',
})
function obs(overrides: Partial<Observation> = {}): Observation {
  return {
    ...base,
    id: 'o1',
    entityId: 'door',
    sourceId: 'audit',
    snapshotId: 'sn1',
    retrievedAt: '2026-10-26T11:59:00Z',
    contentHash: 'hash',
    publisher: 'Facilities',
    uri: 'file:measurements',
    license: 'Owner permission',
    trust: 90,
    freshnessSeconds: 3600,
    ...overrides,
  }
}
const entity: Entity = {
  id: 'door',
  buildingId: 'b',
  levelId: 'l1',
  kind: 'door',
  name: ' Door  A ',
  aliases: [{ namespace: 'audit', externalId: 'D1', confirmed: true }],
}
const graph: Graph = {
  buildingId: 'b',
  complete: true,
  reviewed: true,
  reviewerId: 'reviewer',
  evidenceIds: ['topology'],
  nodes: [
    {
      id: 'entry',
      entityId: 'entry',
      levelId: 'l0',
      entry: true,
      destination: false,
    },
    {
      id: 'lobby',
      entityId: 'lobby',
      levelId: 'l0',
      entry: false,
      destination: false,
    },
    {
      id: 'clinic',
      entityId: 'clinic',
      levelId: 'l1',
      entry: false,
      destination: true,
    },
  ],
  edges: [
    {
      id: 'door-edge',
      from: 'entry',
      to: 'lobby',
      kind: 'door',
      entityId: 'door',
      reviewed: true,
      bidirectional: true,
      stepFree: true,
      evidenceIds: ['topology'],
      measurementEvidenceIds: ['o1'],
    },
    {
      id: 'lift-edge',
      from: 'lobby',
      to: 'clinic',
      kind: 'lift',
      entityId: 'lift',
      reviewed: true,
      bidirectional: true,
      stepFree: true,
      evidenceIds: ['topology'],
      measurementEvidenceIds: ['served'],
    },
  ],
}
const evidence = () => [
  obs(),
  obs({
    id: 'topology',
    entityId: 'b',
    attribute: 'topology',
    value: 'Reviewed complete topology',
    unit: 'none',
  }),
  obs({
    id: 'status',
    sourceId: 'ops',
    entityId: 'lift',
    attribute: 'operational_status',
    value: 'available',
    unit: 'none',
  }),
  obs({
    id: 'served',
    entityId: 'lift',
    attribute: 'lift_served_floors',
    value: ['l0', 'l1'],
    unit: 'none',
  }),
  obs({
    id: 'directory',
    sourceId: 'directory',
    entityId: 'clinic',
    attribute: 'directory',
    value: 'Clinic 202',
    unit: 'none',
  }),
]
const profile = { kind: 'step-free' as const, minimumDoorWidthMm: 850 }
describe('canonical identity', () => {
  test('exact IDs remain scoped to building, type and level', () => {
    expect(
      matchEntity({ ...base, entityExternalId: 'D1' }, [entity]).state,
    ).toBe('confirmed')
    expect(
      matchEntity({ ...base, buildingId: 'other', entityExternalId: 'D1' }, [
        entity,
      ]).entityId,
    ).toBeNull()
  })
  test('normalized names are provisional, not silent confirmed merges', () =>
    expect(matchEntity(base, [entity]).state).toBe('provisional'))
  test('same name on two levels does not merge', () =>
    expect(
      matchEntity(base, [entity, { ...entity, id: 'door2', levelId: 'l2' }])
        .candidates,
    ).toEqual(['door']))
  test('missing level cannot match a room by name', () =>
    expect(matchEntity({ ...base, levelId: null }, [entity]).state).toBe(
      'unresolved',
    ))
  test('duplicate exact aliases are conflicting', () =>
    expect(
      matchEntity({ ...base, entityExternalId: 'D1' }, [
        entity,
        { ...entity, id: 'door2' },
      ]).state,
    ).toBe('conflicting'))
  test('explicit mapping cannot bypass context', () =>
    expect(
      matchEntity(base, [{ ...entity, buildingId: 'other' }], 'door').entityId,
    ).toBeNull())
})
describe('observation history and freshness', () => {
  test('retrieval does not make an old measurement fresh', () =>
    expect(
      stateAt(
        obs({ observedAt: '2020-01-01T00:00:00Z', lastVerifiedAt: undefined }),
        at,
      ),
    ).toBe('stale'))
  test('future, expired and not-yet-retrieved evidence is unknown', () => {
    expect(stateAt(obs({ effectiveFrom: '2027-01-01T00:00:00Z' }), at)).toBe(
      'unknown',
    )
    expect(stateAt(obs({ effectiveTo: '2026-10-26T11:58:00Z' }), at)).toBe(
      'unknown',
    )
    expect(stateAt(obs({ retrievedAt: '2027-01-01T00:00:00Z' }), at)).toBe(
      'unknown',
    )
  })
  test('equivalent length units agree', () =>
    expect(
      reconcile(
        [obs(), obs({ id: 'o2', sourceId: 'second', value: 900, unit: 'mm' })],
        at,
      )[0]!.state,
    ).toBe('verified'))
  test('independent disagreement survives trust priority', () =>
    expect(
      reconcile(
        [
          obs(),
          obs({
            id: 'o2',
            sourceId: 'second',
            value: 600,
            unit: 'mm',
            trust: 1,
          }),
        ],
        at,
      )[0]!.state,
    ).toBe('conflicting'))
  test('later same-source observations supersede without deleting history', () => {
    const all = [
      obs(),
      obs({ id: 'o2', value: 50, observedAt: '2026-10-26T11:59:30Z' }),
    ]
    const r = reconcile(all, at)[0]!
    expect(r.selected?.id).toBe('o2')
    expect(r.evidence).toHaveLength(2)
  })
  test('reviewed resolution retains contrary evidence and expires on new evidence', () => {
    const decision = {
      id: 'review',
      reviewedAt: '2026-10-26T11:59:00Z',
      selectedId: 'o1',
      evidenceIds: ['o1', 'o2'],
      reason: 'Independent measurement accepted',
    }
    const all = [
      obs({ reviewDecision: decision }),
      obs({
        id: 'o2',
        sourceId: 'second',
        value: 60,
        reviewDecision: decision,
      }),
    ]
    expect(reconcile(all, at)[0]!.selected?.id).toBe('o1')
    expect(
      reconcile(
        [...all, obs({ id: 'o3', sourceId: 'third', value: 30 })],
        at,
      )[0]!.state,
    ).toBe('conflicting')
  })
  test('missing units and backwards event windows are rejected', () => {
    expect(recordSchema.safeParse({ ...base, unit: 'none' }).success).toBe(
      false,
    )
    expect(
      recordSchema.safeParse({
        ...base,
        effectiveFrom: '2026-10-26T12:00:00Z',
        effectiveTo: '2026-10-25T12:00:00Z',
      }).success,
    ).toBe(false)
  })
})
describe('deterministic connectivity and simulation', () => {
  test('reviewed measured step-free route is reachable', () =>
    expect(analyzeGraph(graph, evidence(), at, profile)[0]!.outcome).toBe(
      'reachable',
    ))
  test('unknown measurement stays unknown, not accessible', () =>
    expect(
      analyzeGraph(
        graph,
        evidence().filter((o) => o.id !== 'o1'),
        at,
        profile,
      )[0]!.outcome,
    ).toBe('unknown'))
  test('too narrow a measured doorway blocks the path', () =>
    expect(
      analyzeGraph(
        graph,
        evidence().map((o) => (o.id === 'o1' ? { ...o, value: 50 } : o)),
        at,
        profile,
      )[0]!.outcome,
    ).toBe('unreachable'))
  test('reported lift outage blocks a path but is not independent verification', () => {
    const result = deterministicFindings(
      evidence().map((o) =>
        o.id === 'status'
          ? { ...o, value: 'unavailable', verification: 'reported' }
          : o,
      ),
      graph,
      at,
      profile,
    )
    expect(result.some((f) => f.classification === 'reported')).toBe(true)
    expect(
      result.some(
        (f) =>
          f.title.includes('disconnected') &&
          new Set(
            f.evidenceIds.map(
              (id) => evidence().find((e) => e.id === id)?.sourceId,
            ),
          ).size >= 3,
      ),
    ).toBe(true)
  })
  test('stale lift status and missing served-level evidence are unknown', () => {
    expect(
      analyzeGraph(
        graph,
        evidence().map((o) =>
          o.id === 'status'
            ? {
                ...o,
                lastVerifiedAt: undefined,
                observedAt: '2020-01-01T00:00:00Z',
              }
            : o,
        ),
        at,
        profile,
      )[0]!.outcome,
    ).toBe('unknown')
    expect(
      analyzeGraph(
        graph,
        evidence().filter((o) => o.id !== 'served'),
        at,
        profile,
      )[0]!.outcome,
    ).toBe('unknown')
  })
  test('a lift symbol without reviewed topology is insufficient', () =>
    expect(
      analyzeGraph({ ...graph, reviewed: false }, evidence(), at, profile)[0]!
        .outcome,
    ).toBe('unknown'))
  test('incomplete coverage cannot prove no possible route exists', () =>
    expect(
      analyzeGraph(
        { ...graph, complete: false, edges: [] },
        evidence(),
        at,
        profile,
      )[0]!.outcome,
    ).toBe('unknown'))
  test('scenario isolation and closure reversal preserve original inputs', () => {
    const before = JSON.stringify(graph)
    const closed = simulate(graph, evidence(), at, profile, {
      changes: [{ kind: 'close', entityId: 'lift' }],
      reason: 'Simulated outage',
    })
    expect(closed.result[0]!.outcome).toBe('unreachable')
    expect(closed.affected).toHaveLength(1)
    expect(JSON.stringify(graph)).toBe(before)
    const restored = simulate(graph, evidence(), at, profile, {
      changes: [{ kind: 'reopen', entityId: 'lift' }],
      reason: 'Simulated restoration',
    })
    expect(restored.result).toEqual(restored.baseline)
  })
  test('stairs remain forbidden for step-free even if operationally reopened', () =>
    expect(
      analyzeGraph(
        {
          ...graph,
          edges: graph.edges.map((e) =>
            e.kind === 'lift' ? { ...e, kind: 'stairs' } : e,
          ),
        },
        evidence(),
        at,
        profile,
        [{ kind: 'reopen', entityId: 'lift' }],
      )[0]!.outcome,
    ).toBe('unreachable'))
  test('graph rejects unknown evidence, missing endpoints and fabricated interlevel corridors', () => {
    const bad = {
      ...graph,
      edges: [{ ...graph.edges[1]!, kind: 'walkway' as const, to: 'missing' }],
    }
    expect(
      validateGraph(
        bad,
        new Set(['entry', 'lobby', 'clinic', 'door', 'lift']),
        new Set(),
      ),
    ).not.toEqual([])
  })
  test('unknown relocation targets are rejected', () =>
    expect(() =>
      simulate(graph, evidence(), at, profile, {
        changes: [
          { kind: 'relocate', destinationId: 'clinic', toNodeId: 'missing' },
        ],
        reason: 'Unknown target',
      }),
    ).toThrow())
})
test('a reported entrance closure affects baseline reachability and an isolated reopen reverses it', () => {
  const input = [
    ...evidence(),
    obs({
      id: 'entry-status',
      entityId: 'entry',
      sourceId: 'ops-entry',
      attribute: 'operational_status',
      unit: 'none',
      value: 'unavailable',
    }),
  ]
  expect(analyzeGraph(graph, input, at, profile)[0]!.outcome).toBe(
    'unreachable',
  )
  expect(
    simulate(graph, input, at, profile, {
      changes: [{ kind: 'reopen', entityId: 'entry' }],
      reason: 'Hypothetical entry restoration',
    }).result[0]!.outcome,
  ).toBe('reachable')
})
test('future verification time is unknown, never evergreen evidence', () =>
  expect(stateAt(obs({ lastVerifiedAt: '2027-01-01T00:00:00Z' }), at)).toBe(
    'unknown',
  ))
test('failed operational refresh cannot masquerade as a healthy current status', () =>
  expect(
    stateAt(
      obs({
        attribute: 'operational_status',
        value: 'available',
        sourceRefreshError: 'SOURCE_OFFLINE',
      }),
      at,
    ),
  ).toBe('unknown'))

test('graph node level must agree with canonical entity context', () => {
  expect(
    validateGraph(
      graph,
      new Set(['entry', 'lobby', 'clinic', 'door', 'lift']),
      new Set(['topology', 'o1', 'served']),
      [
        {
          ...entity,
          id: 'clinic',
          kind: 'destination',
          levelId: 'wrong-level',
        },
      ],
    ),
  ).toContain('Node context conflicts with canonical entity: clinic')
})
