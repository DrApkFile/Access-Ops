/** Read-only external probes and explicitly requested local import/inference. No external catalogs are created. */
import { loadIntegrationEnvironment } from "../src/providers/integration-environment";
import { configuredGateway } from "../src/providers/zetaris-gateway";
import {
  configuredProvider,
  discover,
  inspectProvider,
} from "../src/providers/explanation";
import { AppError, hash } from "../src/accessops/errors";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
await loadIntegrationEnvironment();
const output = process.env.INTEGRATION_EVIDENCE_DIR;
if (!output || !path.isAbsolute(output))
  throw new Error("A private absolute INTEGRATION_EVIDENCE_DIR is required");
await mkdir(output, { recursive: true, mode: 0o700 });
const origin = process.env.API_URL ?? "http://127.0.0.1:3403";
if (
  new URL(origin).hostname !== "127.0.0.1" &&
  new URL(origin).hostname !== "localhost"
)
  throw new Error(
    "Verification targets a permitted local AccessOps server only",
  );
const credentials = JSON.parse(await Bun.stdin.text()) as {
  email: string;
  password: string;
  workspaceId: string;
};
let cookie = "";
async function api<T = any>(
  route: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(origin + route, {
    method,
    headers: {
      cookie,
      "content-type": "application/json",
      "x-accessops-request": "1",
      "idempotency-key": crypto.randomUUID(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
  if (response.headers.get("set-cookie"))
    cookie = response.headers.get("set-cookie")!.split(";")[0]!;
  const json = (await response.json()) as { code?: string; error?: string };
  if (!response.ok)
    throw new AppError(
      json.code ?? json.error ?? "VERIFICATION_API_FAILURE",
      response.status as 503,
    );
  return json as T;
}
const results: Record<string, unknown>[] = [];
try {
  const me = await api("/auth/login", "POST", credentials);
  try {
    const config = configuredProvider("nvidia");
    if (config) {
      const models = await discover(config);
      results.push({
        provider: "nvidia",
        test: "discovery",
        status: "PASS",
        classification: "LIVE_EXTERNAL",
        model: config.model,
        available: models.includes(config.model),
      });
    } else
      results.push({
        provider: "nvidia",
        status: "BLOCKED",
        missing: ["NVIDIA_API_KEY", "NVIDIA_MODEL"],
      });
  } catch (error) {
    results.push({
      provider: "nvidia",
      test: "discovery",
      status: "FAIL",
      classification: "LIVE_EXTERNAL",
      code: error instanceof AppError ? error.code : "INVALID_RESPONSE",
    });
  }
  const runtime = inspectProvider("meterless");
  if (!runtime.config)
    results.push({
      provider: "meterless-runtime",
      status: "BLOCKED",
      classification: "NOT RUN",
      diagnosis: runtime.status,
      missing: runtime.missing,
      networkAttempted: false,
      engineConformanceIsSeparate: true,
    });
  else {
    try {
      await discover(runtime.config);
      results.push({
        provider: "meterless-runtime",
        status: "PASS",
        classification: "LIVE_EXTERNAL",
        scope:
          "authenticated model discovery only; no Runtime completion proof",
        engineConformanceIsSeparate: true,
      });
    } catch (error) {
      results.push({
        provider: "meterless-runtime",
        status: "FAIL",
        classification: "LIVE_EXTERNAL",
        code: error instanceof AppError ? error.code : "INVALID_RESPONSE",
      });
    }
  }
  let target = process.argv
    .find((v) => v.startsWith("--investigation="))
    ?.split("=")[1];
  if (process.argv.includes("--import-reference")) {
    const queries = [
      {
        name: "NYC taxi-zone reference",
        table: "NY_TAXI.taxi_zones",
        sql: "SELECT LocationID, zone, borough FROM NY_TAXI.taxi_zones WHERE LocationID IN ('1','2','3') LIMIT 3",
        license:
          "Upstream usage rights/freshness not established; local permitted reference verification only; do not redistribute",
      },
      {
        name: "Bronx OSM road reference",
        table: "LASTMILE_OSM.bronx_ffcc6280994e_csv",
        sql: "SELECT segment_id, way_id, from_lat, from_lon, to_lat, to_lon, name, way_timestamp, retrieved_at, source_url, license FROM LASTMILE_OSM.bronx_ffcc6280994e_csv LIMIT 5",
        license:
          "OpenStreetMap contributors, ODbL 1.0 https://opendatacommons.org/licenses/odbl/1-0/",
      },
    ];
    const responses = [];
    for (const query of queries) {
      const response = await configuredGateway().read(query.sql, 5);
      if (!response.rows.length)
        throw new AppError("EMPTY_LIVE_REFERENCE_SOURCE", 503);
      responses.push({ query, response, at: new Date().toISOString() });
      await writeFile(
        path.join(output, query.table.replaceAll(".", "_") + ".json"),
        JSON.stringify(response, null, 2),
        { mode: 0o600 },
      );
    }
    const site = await api("/v1/buildings", "POST", {
      name: "NYC-region public source coverage review — no indoor survey",
      category: "reference_area",
    });
    const scope = await api("/v1/entities", "POST", {
      buildingId: site.id,
      levelId: null,
      kind: "reference_area",
      name: "Public-source evidence coverage",
      aliases: queries.map((q) => ({
        namespace: "zetaris:" + q.table,
        externalId: q.table,
        confirmed: true,
      })),
    });
    const sources = [];
    for (const { query, response, at } of responses) {
      const source = await api("/v1/sources", "POST", {
        buildingId: site.id,
        name: query.name,
        kind: "zetaris",
        namespace: "zetaris:" + query.table,
        publisher: query.table.startsWith("LASTMILE_OSM")
          ? "OpenStreetMap contributors via permitted Zetaris table"
          : "Permitted Zetaris sample source",
        uri: "zetaris:" + query.table,
        license: query.license,
        trust: 50,
        freshnessSeconds: 86400,
        demo: false,
        config: {},
      });
      const records = [
        {
          externalId: "schema:" + query.table,
          buildingId: site.id,
          levelId: null,
          entityKind: "reference_area",
          entityName: "Public-source evidence coverage",
          entityExternalId: query.table,
          namespace: "zetaris:" + query.table,
          attribute: "source_schema",
          value: Object.keys(response.rows[0]!).sort(),
          unit: "none",
          observedAt: at,
          verification: "reported",
          method:
            "Authenticated query result inspected at observedAt; this is schema metadata, not a physical survey or event time",
          locator:
            query.table +
            " / returned columns; raw source rows retained in snapshot",
          originalField: "query_result.columns",
        },
      ];
      // Preserve actual response rows and the derived, labelled schema observation in the immutable import document.
      const content = JSON.stringify(records),
        rawContent = JSON.stringify(response),
        rawSource = { content: rawContent, sha256: hash(rawContent) },
        preview = await api("/v1/sources/" + source.id + "/preview", "POST", {
          format: "json",
          content,
          rawSource,
        });
      const imported = await api(
        "/v1/sources/" + source.id + "/import",
        "POST",
        {
          format: "json",
          content,
          rawSource,
          previewHash: preview.previewHash,
        },
      );
      const snapshots = await api(
        "/v1/sources/" + source.id + "/snapshots/" + imported.snapshotId,
      );
      if (
        snapshots.hash !== rawSource.sha256 ||
        JSON.parse(snapshots.rawContent).rows.length !== response.rows.length
      )
        throw new AppError("RAW_QUERY_PROVENANCE_MISMATCH", 502);
      // The immutable snapshot contains the exact query receipt; normalized observations identify the derived schema inspection.
      sources.push({
        id: source.id,
        table: query.table,
        snapshotId: imported.snapshotId,
        rows: response.rows.length,
        rowHash: hash(JSON.stringify(response.rows)),
        query: response.query,
        requestId: response.requestId,
        scopeEntityId: scope.id,
      });
    }
    const inv = await api("/v1/investigations", "POST", {
      buildingId: site.id,
      question:
        "Do these independently queried public datasets provide enough evidence to assess indoor accessibility?",
      asOf: new Date().toISOString(),
      profile: { kind: "step-free" },
      useZetaris: false,
    });
    target = inv.id;
    let stored;
    for (let n = 0; n < 150; n++) {
      stored = await api("/v1/investigations/" + inv.id);
      if (["completed", "failed"].includes(stored.status)) break;
      await Bun.sleep(200);
    }
    if (stored?.status !== "completed")
      throw new AppError("LIVE_REFERENCE_INVESTIGATION_FAILED", 503);
    const finding = stored.result.findings.find(
      (f: any) =>
        f.title ===
        "Independent source coverage is insufficient for indoor accessibility assessment",
    );
    if (
      !finding ||
      new Set(
        finding.evidenceIds.map(
          (id: string) =>
            stored.result.evidence.find((o: any) => o.id === id)?.sourceId,
        ),
      ).size !== 2
    )
      throw new AppError("CROSS_SOURCE_COVERAGE_FINDING_NOT_VERIFIED", 502);
    results.push({
      provider: "zetaris",
      status: "PASS",
      classification: "LIVE_END_TO_END",
      buildingId: site.id,
      scope: "reference_area, not a physical building",
      investigationId: inv.id,
      findingId: finding.id,
      evidenceIds: finding.evidenceIds,
      sources,
      engine: stored.result.engine,
      federatedBuildingJoin: false,
      limitation:
        "Independent real query results establish a schema-coverage gap only; they do not establish indoor routes, measurements or current lift status",
    });
  }
  if (process.argv.includes("--complete-nvidia")) {
    if (!target)
      throw new Error(
        "A completed --investigation=ID or --import-reference is required",
      );
    const config = configuredProvider("nvidia");
    if (
      !config ||
      config.baseUrl !== "https://integrate.api.nvidia.com/v1" ||
      config.model !== "nvidia/nemotron-3.5-lightning-30b-a3b"
    )
      throw new Error(
        "This verification permits only the inspected NVIDIA free catalog endpoint/model",
      );
    const autoFallback = process.argv.includes("--auto-fallback");
    if (autoFallback && inspectProvider("meterless").config)
      throw new Error(
        "Fallback verification requires Runtime to be unavailable; use a separately authorized Runtime check when configured",
      );
    const before = await api("/v1/investigations/" + target);
    const started = await api(
      "/v1/investigations/" + target + "/explanations",
      "POST",
      {
        provider: autoFallback ? "auto" : "nvidia",
        confirmation: "explain-frozen-evidence",
      },
    );
    let job;
    for (let n = 0; n < 300; n++) {
      job = await api("/v1/jobs/" + started.jobId);
      if (["succeeded", "failed"].includes(job.status)) break;
      await Bun.sleep(200);
    }
    const runs = await api("/v1/investigations/" + target + "/providers"),
      run = runs.items.find((r: any) => r.id === started.providerRunId);
    const passed =
      run?.status === "succeeded" &&
      run.provider === "nvidia" &&
      run?.metadata?.provider === "nvidia" &&
      run.metadata.execution === "live" &&
      run.metadata.investigationEvidenceHash === before.result.evidenceHash &&
      (!autoFallback ||
        (run.metadata.requestedMode === "auto" &&
          run.metadata.actualProvider === "nvidia" &&
          run.metadata.attempts.some(
            (a: any) => a.provider === "meterless" && a.requestSent === false,
          ))) &&
      run.metadata.engine?.name === "Meterless World Model";
    results.push({
      provider: "nvidia",
      status: passed ? "PASS" : "FAIL",
      classification: passed ? "LIVE_END_TO_END" : "LIVE_EXTERNAL",
      investigationId: target,
      providerRunId: started.providerRunId,
      jobStatus: job?.status,
      metadata: run?.metadata ?? null,
      freeEndpointReference:
        "https://build.nvidia.com/nvidia/nemotron-3.5-lightning-30b-a3b",
      additionalPaidResourcesCreated: false,
    });
    if (!passed) process.exitCode = 1;
  }
} catch (error) {
  results.push({
    status: "FAIL",
    code: error instanceof AppError ? error.code : "VERIFICATION_FAILED",
  });
  process.exitCode = 1;
}
await writeFile(
  path.join(output, "verification.json"),
  JSON.stringify(
    {
      at: new Date().toISOString(),
      results,
      externalResourcesCreated: false,
      recordsAreGeographicReferencesNotBuildingMeasurements: true,
    },
    null,
    2,
  ),
  { mode: 0o600 },
);
console.log(
  JSON.stringify(
    results.map((r) => ({
      provider: r.provider,
      status: r.status,
      classification: r.classification,
      investigationId: r.investigationId,
      code: r.code,
    })),
  ),
);
