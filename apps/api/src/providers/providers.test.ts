import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { boundedJson, normalizeOrigin } from './http'
import {
  discover,
  validateExplanation,
  explain as explainProvider,
  type Packet,
  autoDetectMeterless,
} from './explanation'
import { ZetarisAdapter, federationSql, federatedEvidence } from './zetaris'
import { recordSchema, type Finding, type Observation } from '@accessops/domain'
import { withProviderWorkspace } from './workspace-scope'
const explain = (...args: Parameters<typeof explainProvider>) =>
  withProviderWorkspace('provider-unit', () => explainProvider(...args))
beforeEach(() => {
  process.env.ACCESSOPS_PROVIDER_WORKSPACES = 'provider-unit'
  process.env.ACCESSOPS_NVIDIA_TEXT_WORKSPACES = 'provider-unit'
  process.env.ACCESSOPS_EXPLANATION_PROVIDER = 'auto'
})
const finding: Finding = {
  id: 'f1',
  title: 'Reported operational restriction',
  entityId: 'lift',
  severity: 'high',
  rationale: 'A verified source reports a restriction.',
  classification: 'reported',
  evidenceIds: ['e1'],
  recommendation: 'Verify the restriction.',
  uncertainties: [],
  status: 'open',
}
const packet: Packet = {
  question: 'Which destinations are affected?',
  asOf: '2026-10-26T00:00:00Z',
  findings: [finding],
  evidence: [{ id: 'e1' } as Packet['evidence'][number]],
}
const answer = {
  summary: finding.title,
  claims: [
    {
      findingId: 'f1',
      text: finding.rationale,
      evidenceIds: ['e1'],
      classification: 'reported' as const,
    },
  ],
  recommendations: [finding.recommendation],
}
const saved = { ...process.env }
afterEach(() => {
  for (const k of [
    'NVIDIA_API_KEY',
    'NVIDIA_MODEL',
    'NVIDIA_BASE_URL',
    'METERLESS_RUNTIME_TOKEN',
    'ACCESSOPS_PROVIDER_WORKSPACES',
    'ACCESSOPS_NVIDIA_TEXT_WORKSPACES',
    'ACCESSOPS_EXPLANATION_PROVIDER',
  ]) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})
const transport = (fn: (url: string, init: RequestInit) => Response) =>
  (async (input: Parameters<typeof fetch>[0], init: RequestInit = {}) =>
    fn(String(input), init)) as unknown as typeof fetch
test('origin normalizes supported pasted suffixes without /v1/v1', () => {
  for (const suffix of [
    '',
    '/v1',
    '/v1/models',
    '/v1/chat/completions',
    '/healthz',
  ])
    expect(normalizeOrigin('localhost:8088' + suffix)).toBe(
      'http://localhost:8088/v1',
    )
})
test('URL embedded credentials rejected', () =>
  expect(() => normalizeOrigin('https://user:secret@example.com')).toThrow())
test('authentication errors remain unauthorized and are not retried', async () => {
  let calls = 0
  await expect(
    boundedJson(
      'http://localhost',
      {},
      transport(() => {
        calls++
        return new Response('', { status: 401 })
      }),
    ),
  ).rejects.toThrow('PROVIDER_UNAUTHORIZED')
  expect(calls).toBe(1)
})
test('bounded retry recovers from a rate limit', async () => {
  let n = 0
  const result = await boundedJson(
    'http://localhost',
    {},
    transport(() =>
      ++n === 1
        ? new Response('', { status: 429 })
        : Response.json({ ok: true }),
    ),
    10,
    1,
  )
  expect(result).toEqual({ ok: true })
  expect(n).toBe(2)
})
test('offline failures are explicit; malformed JSON rejected', async () => {
  await expect(
    boundedJson(
      'http://localhost',
      {},
      transport(() => {
        throw new Error('offline')
      }),
      10,
      0,
    ),
  ).rejects.toThrow('PROVIDER_OFFLINE_OR_TIMEOUT')
  await expect(
    boundedJson(
      'http://localhost',
      {},
      transport(() => new Response('bad')),
    ),
  ).rejects.toThrow('PROVIDER_INVALID_JSON')
})
test('Meterless discovery sends real token and application header and preserves unknown routing modes', async () => {
  const models = await discover(
    {
      provider: 'meterless',
      baseUrl: 'http://localhost:8088/v1',
      key: 'real-token',
      model: 'meterless/custom',
    },
    transport((url, init) => {
      expect(url).toEndWith('/models')
      expect((init.headers as Record<string, string>)['meterless-app']).toBe(
        'accessops',
      )
      expect((init.headers as Record<string, string>).Authorization).toBe(
        'Bearer real-token',
      )
      return Response.json({ data: [{ id: 'meterless/custom' }] })
    }),
  )
  expect(models).toEqual(['meterless/custom'])
})
test('Meterless auto detection reports unauthorized rather than offline', async () => {
  expect(
    (
      await autoDetectMeterless(
        'real-token',
        transport(() => new Response('', { status: 403 })),
      )
    ).state,
  ).toBe('unauthorized')
  await expect(autoDetectMeterless('rt-local')).rejects.toThrow()
})
test('unknown citations, unsupported facts and invented recommendations are rejected', () => {
  expect(validateExplanation(answer, packet)).toEqual(answer)
  expect(() =>
    validateExplanation(
      {
        ...answer,
        claims: [{ ...answer.claims[0], evidenceIds: ['invented'] }],
      },
      packet,
    ),
  ).toThrow()
  expect(() =>
    validateExplanation(
      {
        ...answer,
        claims: [{ ...answer.claims[0], text: 'Door is 2 meters wide' }],
      },
      packet,
    ),
  ).toThrow()
  expect(() =>
    validateExplanation(
      { ...answer, recommendations: ['Use unsafe stairs'] },
      packet,
    ),
  ).toThrow()
  expect(() =>
    validateExplanation(answer, { ...packet, evidence: [] }),
  ).toThrow()
})
test('NVIDIA request uses discovered model, text evidence packet and records actual execution path', async () => {
  process.env.NVIDIA_API_KEY = 'unit-only-not-live'
  process.env.NVIDIA_MODEL = 'nvidia/test-model'
  let chats = 0
  const result = await explain(
    packet,
    'nvidia',
    transport((url, init) => {
      if (url.endsWith('/models'))
        return Response.json({ data: [{ id: 'nvidia/test-model' }] })
      const body = JSON.parse(String(init.body))
      expect(body.model).toBe('nvidia/test-model')
      expect(typeof body.messages[1].content).toBe('string')
      chats++
      return Response.json({
        model: body.model,
        id: 'request1',
        choices: [{ message: { content: JSON.stringify(answer) } }],
      })
    }),
  )
  expect(result.status).toBe('succeeded')
  expect(chats).toBe(1)
  expect('provider' in result && result.provider).toBe('nvidia')
})
test('wrong model identity rejects explanation while retaining deterministic operation', async () => {
  process.env.NVIDIA_API_KEY = 'unit-only'
  process.env.NVIDIA_MODEL = 'nvidia/test-model'
  const r = await explain(
    packet,
    'nvidia',
    transport((url) =>
      url.endsWith('/models')
        ? Response.json({ data: [{ id: 'nvidia/test-model' }] })
        : Response.json({
            model: 'different',
            choices: [{ message: { content: JSON.stringify(answer) } }],
          }),
    ),
  )
  expect(r.status).toBe('unavailable')
})
test('federation is generated from bounded identifiers and cannot execute user SQL', () => {
  expect(federationSql('directory.rooms', 'maintenance.events', 'b')).toContain(
    'JOIN maintenance.events',
  )
  expect(() =>
    federationSql('directory.rooms; DROP TABLE x', 'maintenance.events', 'b'),
  ).toThrow()
  expect(() => federationSql('a.b', 'c.d', "b' OR 1=1")).toThrow()
})
test('Zetaris real adapter authenticates and maps cross-source lineage with pagination', async () => {
  const adapter = new ZetarisAdapter(
    {
      baseUrl: 'http://localhost:3000',
      orgId: '1',
      token: 'unit-only',
      directoryTable: 'directory.rooms',
      operationsTable: 'operations.events',
    },
    transport((url, init) => {
      expect(url).toEndWith('/api/proxy/sql-editor/sqls/run-query')
      expect((init.headers as Record<string, string>)['X-Org-ID']).toBe('1')
      expect(JSON.parse(String(init.body)).sql).toContain(
        'JOIN operations.events',
      )
      return Response.json({
        rows: [
          {
            directory_record_id: 'dir1',
            destination_id: 'clinic',
            building_id: 'b',
            level_id: 'l1',
            lift_id: 'L1',
            operation_record_id: 'op1',
            status: 'unavailable',
            observed_at: '2026-10-26T00:00:00Z',
          },
        ],
      })
    }),
  )
  const r = await adapter.query('b', 1)
  expect(r.rows[0]!.operation_record_id).toBe('op1')
  expect(r.nextOffset).toBe(1)
})
test('Zetaris cannot federate a table with itself or leak rows from another building', async () => {
  expect(
    () =>
      new ZetarisAdapter({
        baseUrl: 'http://localhost',
        orgId: '1',
        token: 'x',
        directoryTable: 'a.b',
        operationsTable: 'a.b',
      }),
  ).toThrow()
  const adapter = new ZetarisAdapter(
    {
      baseUrl: 'http://localhost',
      orgId: '1',
      token: 'x',
      directoryTable: 'a.b',
      operationsTable: 'c.d',
    },
    transport(() =>
      Response.json({
        rows: [
          {
            directory_record_id: 'd',
            destination_id: 'e',
            building_id: 'other',
            level_id: 'l',
            lift_id: 'L1',
            operation_record_id: 'o',
            status: 'unavailable',
            observed_at: '2026-10-26T00:00:00Z',
          },
        ],
      }),
    ),
  )
  await expect(adapter.query('b')).rejects.toThrow(
    'ZETARIS_RESULT_SCOPE_MISMATCH',
  )
})

test('timeout aborts a stalled external request', async () => {
  const stall = async (_url: Parameters<typeof fetch>[0], init?: RequestInit) =>
    await new Promise<Response>((_, reject) => {
      init!.signal!.addEventListener(
        'abort',
        () => reject(new Error('aborted')),
        { once: true },
      )
    })
  await expect(
    boundedJson('http://localhost', {}, stall, 15, 0),
  ).rejects.toThrow('PROVIDER_OFFLINE_OR_TIMEOUT')
})
test('oversized response is rejected without parsing it', async () => {
  await expect(
    boundedJson(
      'http://localhost',
      {},
      transport(() => new Response('x'.repeat(2 * 1024 * 1024 + 1))),
      1000,
      0,
    ),
  ).rejects.toThrow('PROVIDER_RESPONSE_TOO_LARGE')
})

test('federated findings reject mismatched, ambiguous or invented local lineage', () => {
  const row = {
    directory_record_id: 'd',
    destination_id: 'clinic',
    building_id: 'b',
    level_id: 'l1',
    lift_id: 'lift',
    operation_record_id: 'o',
    status: 'unavailable' as const,
    observed_at: '2026-10-26T00:00:00Z',
  }
  const baseObservation: Observation = {
    ...recordSchema.parse({
      externalId: 'fixture',
      buildingId: 'b',
      levelId: 'l1',
      entityKind: 'destination',
      entityName: 'Synthetic test entity',
      namespace: 'fixture',
      attribute: 'directory' as const,
      value: 'Synthetic destination',
      observedAt: row.observed_at,
      method: 'Unit fixture',
      locator: 'unit:row1',
    }),
    id: 'unit',
    entityId: 'clinic',
    sourceId: 'directory',
    snapshotId: 'snapshot',
    retrievedAt: row.observed_at,
    contentHash: 'unit-hash',
    publisher: 'Unit fixture',
    uri: 'unit:test',
    license: 'Synthetic test fixture',
    trust: 20,
    freshnessSeconds: 3600,
  }
  const observations: Packet['evidence'] = [
    {
      externalId: 'd',
      attribute: 'directory' as const,
      buildingId: 'b',
      levelId: 'l1',
      entityId: 'clinic',
      sourceId: 'directory',
    },
    {
      externalId: 'o',
      attribute: 'operational_status' as const,
      buildingId: 'b',
      entityId: 'lift',
      sourceId: 'operations',
      value: 'unavailable',
      observedAt: row.observed_at,
    },
  ].map((record, index) => ({
    ...baseObservation,
    ...record,
    id: 'unit-' + index,
  }))
  expect(federatedEvidence(row, observations).operation.sourceId).toBe(
    'operations',
  )
  expect(() =>
    federatedEvidence(row, [
      observations[0]!,
      { ...observations[1]!, value: 'available' },
    ]),
  ).toThrow('FEDERATED_LINEAGE_NOT_REGISTERED')
  expect(() =>
    federatedEvidence(row, [
      ...observations,
      { ...observations[0]!, sourceId: 'ambiguous-directory' },
    ]),
  ).toThrow()
})
