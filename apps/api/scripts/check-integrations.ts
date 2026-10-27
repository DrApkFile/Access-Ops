import { loadIntegrationEnvironment } from '../src/providers/integration-environment'
import { withProviderWorkspace } from '../src/providers/workspace-scope'
import {
  configuredProvider,
  inspectProvider,
  discover,
  explain,
  type Packet,
} from '../src/providers/explanation'
import { zetarisForWorkspace } from '../src/providers/zetaris'
import { fetchMbta } from '../src/accessops/connectors'
import { AppError, hash } from '../src/accessops/errors'
await loadIntegrationEnvironment()
const results: unknown[] = []
for (const provider of ['meterless', 'nvidia'] as const) {
  const configured = configuredProvider(provider)
  if (!configured) {
    results.push({
      provider,
      status: 'blocked',
      missing: inspectProvider(provider).missing,
      diagnosis: inspectProvider(provider).status,
      networkAttempted: false,
      mockedTestsDoNotEstablishLiveExecution: true,
    })
    continue
  }
  try {
    const models = await discover(configured)
    results.push({
      provider,
      status: 'live_model_discovery_only',
      selectedModel: configured.model,
      available: models.includes(configured.model),
      execution: false,
    })
    if (
      process.env.LIVE_INVESTIGATION_ID &&
      process.env.LIVE_WORKSPACE_ID &&
      process.env.ACCESSOPS_PROVIDER_WORKSPACES?.split(',').includes(
        process.env.LIVE_WORKSPACE_ID,
      )
    ) {
      const { db } = await import('../src/db')
      const { investigations } = await import('../src/accessops/schema')
      const { and, eq } = await import('drizzle-orm')
      const row = await db.query.investigations.findFirst({
        where: and(
          eq(investigations.id, process.env.LIVE_INVESTIGATION_ID),
          eq(investigations.workspaceId, process.env.LIVE_WORKSPACE_ID),
        ),
      })
      if (!row || row.status !== 'completed')
        throw new Error('Requested authorized investigation is unavailable')
      const stored = row.result as Packet
      const result = await withProviderWorkspace(
        process.env.LIVE_WORKSPACE_ID!,
        () =>
          explain(
            {
              question: row.question,
              findings: stored.findings.slice(0, 30),
              evidence: stored.evidence.slice(0, 200),
              asOf: row.asOf.toISOString(),
            },
            provider,
          ),
      )
      results.push({
        provider,
        status: result.status,
        model: 'model' in result ? result.model : null,
        requestId: 'requestId' in result ? result.requestId : null,
        liveExecution: result.status === 'succeeded',
        investigationId: row.id,
      })
      await db.$client.close()
    }
  } catch (e) {
    results.push({
      provider,
      status: 'failed',
      code: e instanceof AppError ? e.code : 'INVALID_SERVICE_RESPONSE',
    })
  }
}
if (
  !process.env.ZETARIS_WORKSPACE_ID ||
  !process.env.LIVE_BUILDING_ID ||
  (!process.env.ZETARIS_API_KEY && !process.env.ZETARIS_USERNAME)
) {
  results.push({
    provider: 'zetaris',
    status: 'blocked',
    missing: [
      'workspace-bound endpoint/org/account or API token',
      'independently registered directory and operations tables',
      'LIVE_BUILDING_ID',
    ],
    queryExecuted: false,
  })
} else {
  try {
    const r = await zetarisForWorkspace(process.env.ZETARIS_WORKSPACE_ID).query(
      process.env.LIVE_BUILDING_ID,
    )
    results.push({
      provider: 'zetaris',
      status: 'live_cross_source_query',
      rows: r.rows.length,
      independentSources: r.independentSources,
      requestId: r.requestId,
      query: r.query,
      resultHash: hash(JSON.stringify(r.rows)),
    })
  } catch (e) {
    results.push({
      provider: 'zetaris',
      status: 'failed',
      code: e instanceof AppError ? e.code : 'INVALID_SERVICE_RESPONSE',
    })
  }
}
if (process.env.CHECK_PUBLIC_MBTA === '1') {
  try {
    const r = await fetchMbta({
      buildingId: 'public-api-research',
      namespace: 'mbta',
      config: { stationId: 'place-andrw', mode: 'facilities' },
    })
    results.push({
      provider: 'mbta',
      status: 'live_public_fetch',
      records: r.records.length,
      pages: r.pages,
      rawSha256: hash(r.rawContent),
      retrievedAt: r.retrievedAt,
      notice:
        'Connector exercise only; no invented building assessment or live sponsor inference',
    })
    if (process.env.INTEGRATION_EVIDENCE_DIR)
      await Bun.write(
        process.env.INTEGRATION_EVIDENCE_DIR + '/mbta.json',
        r.rawContent,
      )
  } catch (e) {
    results.push({
      provider: 'mbta',
      status: 'failed',
      code: e instanceof AppError ? e.code : 'INVALID_SOURCE_RESPONSE',
    })
  }
}
const report = { at: new Date().toISOString(), results }
console.log(JSON.stringify(report, null, 2))
if (process.env.INTEGRATION_EVIDENCE_DIR)
  await Bun.write(
    process.env.INTEGRATION_EVIDENCE_DIR + '/integration-status.json',
    JSON.stringify(report, null, 2),
  )
