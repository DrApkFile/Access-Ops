import { sampleFloorModel, renderFloorModelSvg } from '@bumps/floor-model'
import { Resvg } from '@resvg/resvg-js'
import { svgFont } from '../src/lib/svg-font'
import type { Graph, SourceRecord } from '@accessops/domain'
export type Client = {
  request: (
    path: string,
    method?: string,
    body?: unknown,
    expected?: number,
  ) => Promise<any>
  upload: (bytes: Uint8Array, name: string, mime: string) => Promise<any>
}
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error('Acceptance failure: ' + message)
}
export async function runDemo(client: Client, userId: string) {
  const steps: { name: string; result: unknown }[] = []
  const record = (name: string, result: unknown) => {
    steps.push({ name, result })
    console.log(JSON.stringify({ step: name, result }))
  }
  const b = await client.request(
    '/v1/buildings',
    'POST',
    {
      name: 'DEMONSTRATION Clinic — synthetic operations, not a real assessment',
      aliases: ['DEMO-CLINIC'],
    },
    201,
  )
  const buildingId = b.id
  const ground = (
      await client.request(
        '/v1/buildings/' + buildingId + '/levels',
        'POST',
        { name: 'Ground', ordinal: 0 },
        201,
      )
    ).id,
    upper = (
      await client.request(
        '/v1/buildings/' + buildingId + '/levels',
        'POST',
        { name: 'Level 1', ordinal: 1 },
        201,
      )
    ).id
  const ids: Record<string, string> = {}
  const namespaces = [
    'plan-demo',
    'directory-demo',
    'measure-demo',
    'operations-demo',
    'review-demo',
  ]
  for (const [key, kind, name, levelId] of [
    ['building', 'building', 'Demo clinic building', null],
    ['entrance', 'entrance', 'North entrance', ground],
    ['door', 'door', 'Door A', ground],
    ['lobby', 'corridor', 'Ground lobby', ground],
    ['lift', 'lift', 'Lift L1', null],
    ['landing', 'corridor', 'Upper landing', upper],
    ['corridor', 'corridor', 'Clinic corridor', upper],
    ['clinic', 'destination', 'Clinic 202', upper],
    ['ramp', 'ramp', 'Unused ramp', ground],
  ] as const) {
    const e = await client.request(
      '/v1/entities',
      'POST',
      {
        buildingId,
        levelId,
        kind,
        name,
        aliases: namespaces.map((namespace) => ({
          namespace,
          externalId: key,
          confirmed: true,
        })),
      },
      201,
    )
    ids[key] = e.id
  }
  const model = structuredClone(sampleFloorModel)
  model.rooms.find((r) => r.id === 'r-ne')!.label = 'Clinic 202'
  const png = new Resvg(renderFloorModelSvg(model), { font: svgFont })
    .render()
    .asPng()
  const project = await client.upload(
    png,
    'demonstration-generated-office-plan.png',
    'image/png',
  )
  await client.request('/projects/' + project.id + '/model', 'POST', model, 201)
  await client.request('/projects/' + project.id + '/model/review', 'POST', {
    version: 1,
    reason:
      'Explicitly human-authored repository fixture; no claim of AI extraction or a real measured building.',
  })
  await client.request(
    '/v1/buildings/' + buildingId + '/plans',
    'POST',
    {
      projectId: project.id,
      levelId: upper,
      modelVersion: 1,
      reason:
        'Demonstration plan manually linked to upper level; reviewed schematic connectivity is a separate fixture.',
    },
    201,
  )
  record('plan.upload-and-review', {
    projectId: project.id,
    origin: 'manual fixture',
    geometryVersion: 1,
  })
  const sources: Record<string, string> = {}
  for (const [key, namespace] of [
    ['plan', 'plan-demo'],
    ['directory', 'directory-demo'],
    ['measure', 'measure-demo'],
    ['operations', 'operations-demo'],
    ['review', 'review-demo'],
  ]) {
    sources[key!] = (
      await client.request(
        '/v1/sources',
        'POST',
        {
          buildingId,
          name: 'DEMONSTRATION ' + key + ' independent source',
          kind: 'json',
          namespace,
          publisher: 'AccessOps explicitly labelled demonstration fixtures',
          uri: 'demo:' + key,
          license:
            'Synthetic records for demonstration; not real facility information',
          trust: 80,
          freshnessSeconds: 3600,
          demo: true,
          config: {},
        },
        201,
      )
    ).id
  }
  const now = () => new Date().toISOString()
  const time = (seconds: number) =>
    new Date(Date.now() - seconds * 1000).toISOString()
  function sourceRecord(
    source: string,
    entity: string,
    attribute: SourceRecord['attribute'],
    value: SourceRecord['value'],
    extra: Partial<SourceRecord> = {},
  ): SourceRecord {
    const levelId =
      entity === 'clinic' || entity === 'landing' || entity === 'corridor'
        ? upper
        : entity === 'lift' || entity === 'building'
          ? null
          : ground
    const kind =
      entity === 'clinic'
        ? 'destination'
        : entity === 'building'
          ? 'building'
          : entity === 'lobby' || entity === 'landing' || entity === 'corridor'
            ? 'corridor'
            : entity === 'door'
              ? 'door'
              : entity === 'ramp'
                ? 'ramp'
                : entity === 'entrance'
                  ? 'entrance'
                  : 'lift'
    return {
      externalId:
        source +
        '-' +
        entity +
        '-' +
        attribute +
        '-' +
        Math.random().toString(16).slice(2),
      buildingId,
      levelId,
      entityKind: kind,
      entityName: entity,
      entityExternalId: entity,
      namespace: source + '-demo',
      attribute,
      value,
      unit: 'none',
      observedAt: time(120),
      lastVerifiedAt: time(120),
      verification: 'verified',
      method:
        'Explicit demonstration fixture reviewed by the signed-in demonstration administrator; not a field measurement',
      reviewerId: userId,
      reviewReason: 'Demonstration fixture verification only',
      locator: 'demo:' + source + ':' + entity + ':' + attribute,
      sourceTimezone: 'UTC',
      ...extra,
    }
  }
  async function importRecords(source: string, records: SourceRecord[]) {
    const content = JSON.stringify(records)
    const preview = await client.request(
      '/v1/sources/' + sources[source] + '/preview',
      'POST',
      { format: 'json', content },
    )
    assert(
      preview.errors.length === 0,
      'Preview has no rejected valid fixture rows',
    )
    const imported = await client.request(
      '/v1/sources/' + sources[source] + '/import',
      'POST',
      { format: 'json', content, previewHash: preview.previewHash },
      201,
    )
    return { imported, content, preview }
  }
  const top = sourceRecord(
    'plan',
    'building',
    'topology',
    'Reviewed schematic graph explicitly authored for demonstration, including vertical connection assumptions.',
  )
  const dir = sourceRecord(
    'directory',
    'clinic',
    'directory',
    'Clinic 202 is served through the upper landing.',
  )
  const width = sourceRecord('measure', 'door', 'door_clear_width', 900, {
      unit: 'mm',
    }),
    threshold = sourceRecord('measure', 'door', 'threshold_height', 0, {
      unit: 'mm',
    }),
    served = sourceRecord('measure', 'lift', 'lift_served_floors', [
      ground,
      upper,
    ])
  const available = sourceRecord(
    'operations',
    'lift',
    'operational_status',
    'available',
  )
  await importRecords('plan', [top])
  await importRecords('directory', [dir])
  const measure = await importRecords('measure', [width, threshold, served])
  await importRecords('operations', [available])
  const repeated = await client.request(
    '/v1/sources/' + sources.measure + '/import',
    'POST',
    {
      format: 'json',
      content: measure.content,
      previewHash: measure.preview.previewHash,
    },
    201,
  )
  assert(
    repeated.accepted === 0 && repeated.skipped === 3,
    'Idempotent re-import',
  )
  record('sources.independent-and-idempotent', {
    sources: Object.keys(sources),
    skipped: repeated.skipped,
  })
  let all = (
    await client.request(
      '/v1/observations?buildingId=' + buildingId + '&limit=200',
    )
  ).items
  const topologyId = all.find((x: any) => x.attribute === 'topology').id
  const graph: Graph = {
    buildingId,
    complete: true,
    reviewed: true,
    reviewerId: userId,
    reviewReason:
      'Explicitly reviewed demonstration schematic, not inferred from a lift symbol.',
    evidenceIds: [topologyId],
    nodes: [
      {
        id: 'entry',
        entityId: ids.entrance!,
        levelId: ground,
        entry: true,
        destination: false,
      },
      {
        id: 'lobby',
        entityId: ids.lobby!,
        levelId: ground,
        entry: false,
        destination: false,
      },
      {
        id: 'landing',
        entityId: ids.landing!,
        levelId: upper,
        entry: false,
        destination: false,
      },
      {
        id: 'clinic',
        entityId: ids.clinic!,
        levelId: upper,
        entry: false,
        destination: true,
      },
    ],
    edges: [
      {
        id: 'door',
        from: 'entry',
        to: 'lobby',
        kind: 'door',
        entityId: ids.door!,
        reviewed: true,
        bidirectional: true,
        stepFree: true,
        evidenceIds: [topologyId],
        measurementEvidenceIds: all
          .filter((o: any) => o.entityId === ids.door)
          .map((o: any) => o.id),
      },
      {
        id: 'lift',
        from: 'lobby',
        to: 'landing',
        kind: 'lift',
        entityId: ids.lift!,
        reviewed: true,
        bidirectional: true,
        stepFree: true,
        evidenceIds: [topologyId],
        measurementEvidenceIds: all
          .filter((o: any) => o.attribute === 'lift_served_floors')
          .map((o: any) => o.id),
      },
      {
        id: 'corridor',
        from: 'landing',
        to: 'clinic',
        kind: 'walkway',
        entityId: ids.corridor!,
        reviewed: true,
        bidirectional: true,
        stepFree: true,
        evidenceIds: [topologyId],
        measurementEvidenceIds: [],
      },
    ],
  }
  const validation = await client.request('/v1/graphs/validate', 'POST', graph)
  assert(validation.valid, 'Reviewed graph validation')
  await client.request('/v1/graphs', 'POST', graph, 201)
  const profile = {
    kind: 'step-free',
    minimumDoorWidthMm: 850,
    maximumThresholdMm: 20,
  }
  async function investigate(previousId?: string) {
    const queued = await client.request(
      '/v1/investigations',
      'POST',
      {
        buildingId,
        question:
          'Which destinations are affected by the lift status and which evidence or measurements remain uncertain?',
        asOf: now(),
        profile,
        ...(previousId ? { previousId } : {}),
      },
      202,
    )
    for (let n = 0; n < 120; n++) {
      const inv = await client.request('/v1/investigations/' + queued.id)
      if (inv.status === 'completed') return inv
      if (inv.status === 'failed')
        throw new Error('Investigation failed: ' + inv.error)
      await Bun.sleep(250)
    }
    throw new Error('Investigation worker did not complete')
  }
  const initial = await investigate()
  assert(
    initial.result.reachability[0].outcome === 'reachable',
    'Baseline is reachable',
  )
  record('investigation.baseline', {
    id: initial.id,
    outcome: initial.result.reachability[0].outcome,
    ai: initial.result.explanation.status,
  })
  const scenario = await client.request(
    '/v1/scenarios',
    'POST',
    {
      buildingId,
      asOf: now(),
      profile,
      scenario: {
        changes: [{ kind: 'close', entityId: ids.lift }],
        reason: 'DEMONSTRATION hypothetical lift outage, not a live incident',
      },
    },
    201,
  )
  assert(
    scenario.result.baseline[0].outcome === 'reachable' &&
      scenario.result.result[0].outcome === 'unreachable',
    'Scenario isolates outage impact',
  )
  record('scenario.outage', {
    id: scenario.id,
    affected: scenario.result.affected.length,
  })
  const reversed = await client.request(
    '/v1/scenarios',
    'POST',
    {
      buildingId,
      asOf: now(),
      profile,
      scenario: {
        changes: [{ kind: 'reopen', entityId: ids.lift }],
        reason: 'DEMONSTRATION reversal of hypothetical closure',
      },
    },
    201,
  )
  assert(
    reversed.result.result[0].outcome === 'reachable',
    'Reversal restores baseline',
  )
  const outage = sourceRecord(
    'operations',
    'lift',
    'operational_status',
    'unavailable',
    {
      observedAt: time(60),
      lastVerifiedAt: undefined,
      verification: 'reported',
      eventType: 'lift_outage',
      effectiveFrom: time(60),
    },
  )
  await importRecords('operations', [outage])
  const impacted = await investigate(initial.id)
  assert(
    impacted.result.reachability[0].outcome === 'unreachable',
    'Reported outage impacts destination',
  )
  assert(
    impacted.result.previous.changedEvidence.length > 0,
    'Follow-up detects changed evidence',
  )
  const findings = (
    await client.request('/v1/investigations/' + impacted.id + '/findings')
  ).items
  const finding = findings.find((f: any) =>
    f.finding.title.includes('disconnected'),
  )
  assert(finding, 'Multi-source impact finding exists')
  const refs = finding.finding.evidenceIds
  const evidence = await Promise.all(
    refs.map((eid: string) =>
      client.request('/v1/investigations/' + impacted.id + '/evidence/' + eid),
    ),
  )
  assert(
    new Set(evidence.map((o: any) => o.sourceId)).size >= 3,
    'Finding cites independent sources',
  )
  record('investigation.multisource', {
    id: impacted.id,
    findingId: finding.id,
    evidenceCount: refs.length,
    independentSources: new Set(evidence.map((o: any) => o.sourceId)).size,
  })
  const action = await client.request(
    '/v1/actions',
    'POST',
    {
      findingId: finding.id,
      ownerId: userId,
      priority: 'high',
      proposal:
        'Verify the demonstrated reported lift outage and obtain current restoration evidence before reassessment.',
    },
    201,
  )
  await client.request('/v1/actions/' + action.id, 'PATCH', {
    status: 'approved',
    reason:
      'Demonstration reviewer approves a verification task; no external equipment change.',
  })
  await client.request('/v1/actions/' + action.id, 'PATCH', {
    status: 'in_progress',
    reason: 'Assigned demonstration operator is verifying the source evidence.',
  })
  const restoration = sourceRecord(
    'operations',
    'lift',
    'operational_status',
    'available',
    {
      observedAt: time(10),
      lastVerifiedAt: time(10),
      eventType: 'restoration',
    },
  )
  await importRecords('operations', [restoration])
  all = (
    await client.request(
      '/v1/observations?buildingId=' + buildingId + '&limit=200',
    )
  ).items
  const restoreId = all.find(
    (o: any) => o.externalId === restoration.externalId,
  ).id
  await client.request('/v1/actions/' + action.id, 'PATCH', {
    status: 'resolved',
    reason:
      'Demonstration authorized reviewer accepted new restoration evidence; follow-up investigation still required.',
    evidenceIds: [restoreId],
  })
  const restored = await investigate(impacted.id)
  assert(
    restored.result.reachability[0].outcome === 'reachable',
    'Verified restoration recalculates reachability',
  )
  const historical = await client.request('/v1/investigations/' + impacted.id)
  assert(
    historical.result.reachability[0].outcome === 'unreachable',
    'Historical result remains unchanged',
  )
  record('action.verified-resolution', {
    id: action.id,
    followupId: restored.id,
    outcome: 'reachable',
    historicalOutcome: 'unreachable',
  })
  const stale = sourceRecord('review', 'ramp', 'ramp_slope', 4, {
    unit: 'percent',
    observedAt: time(100000),
    lastVerifiedAt: time(100000),
  })
  const conflicting = sourceRecord('review', 'door', 'door_clear_width', 600, {
    unit: 'mm',
    observedAt: time(2),
    lastVerifiedAt: time(2),
  })
  await importRecords('review', [stale, conflicting])
  const uncertain = await investigate(restored.id)
  assert(
    uncertain.result.findings.some((f: any) => f.title.startsWith('stale')),
    'Stale record surfaces',
  )
  assert(
    uncertain.result.findings.some(
      (f: any) => f.classification === 'conflicting',
    ),
    'Independent disagreement surfaces',
  )
  assert(
    uncertain.result.reachability[0].outcome === 'unknown',
    'Conflicting width makes route unknown',
  )
  all = (
    await client.request(
      '/v1/observations?buildingId=' + buildingId + '&limit=200',
    )
  ).items
  const widths = all.filter(
    (o: any) => o.entityId === ids.door && o.attribute === 'door_clear_width',
  )
  const original = widths.find((o: any) => o.externalId === width.externalId)
  await client.request(
    '/v1/conflicts/resolve',
    'POST',
    {
      entityId: ids.door,
      attribute: 'door_clear_width',
      selectedEvidenceId: original.id,
      evidenceIds: widths.map((o: any) => o.id),
      reason:
        'Demonstration reviewer examined both records and explicitly selected the original reviewed measurement.',
    },
    201,
  )
  const reconciled = await investigate(uncertain.id)
  assert(
    reconciled.result.reachability[0].outcome === 'reachable',
    'Recorded reviewer decision recalculates result',
  )
  record('conflict-and-stale.review', {
    unknownInvestigationId: uncertain.id,
    reconciledInvestigationId: reconciled.id,
    stalePreserved: true,
  })
  const report = await client.request(
    '/v1/investigations/' + impacted.id + '/report',
  )
  assert(
    report.investigation.result.evidenceHash === historical.result.evidenceHash,
    'Export preserves historical evidence hash',
  )
  record('report.historical-export', {
    investigationId: impacted.id,
    evidenceHash: report.investigation.result.evidenceHash,
  })
  return {
    buildingId,
    projectId: project.id,
    initialId: initial.id,
    impactedId: impacted.id,
    restoredId: restored.id,
    reconciledId: reconciled.id,
    actionId: action.id,
    scenarioId: scenario.id,
    sourceId: sources.operations!,
    evidenceId: refs[0],
    findingId: finding.id,
    steps,
    report,
  }
}
