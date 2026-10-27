import { configuredGateway } from "./zetaris-gateway";
import type { Observation } from "@accessops/domain";
import { z } from "zod";
import { boundedJson, type Transport } from "./http";
import { AppError } from "../accessops/errors";
const identifier = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,62}$/);
export type ZetarisConfig = {
  baseUrl: string;
  orgId: string;
  token?: string;
  username?: string;
  password?: string;
  directoryTable: string;
  operationsTable: string;
};
export function tableName(value: string) {
  const parts = value.split(".");
  if (parts.length !== 2)
    throw new AppError("QUALIFIED_ZETARIS_TABLE_REQUIRED", 422);
  return parts.map((p) => identifier.parse(p)).join(".");
}
export function federationSql(
  directoryTable: string,
  operationsTable: string,
  buildingId: string,
  limit = 100,
  offset = 0,
) {
  const directory = tableName(directoryTable),
    operations = tableName(operationsTable);
  if (!/^[a-zA-Z0-9_.:-]{1,120}$/.test(buildingId))
    throw new AppError("INVALID_BUILDING_ID", 422);
  if (limit < 1 || limit > 500 || offset < 0 || offset > 10000)
    throw new AppError("QUERY_BOUNDS", 422);
  return `SELECT d.external_id AS directory_record_id, d.destination_id, d.building_id, d.level_id, d.lift_id, o.external_id AS operation_record_id, o.status, o.observed_at FROM ${directory} d JOIN ${operations} o ON d.building_id = o.building_id AND d.lift_id = o.lift_id WHERE d.building_id = '${buildingId}' ORDER BY d.external_id, o.external_id LIMIT ${limit} OFFSET ${offset}`;
}
const rowSchema = z
  .object({
    directory_record_id: z.string(),
    destination_id: z.string(),
    building_id: z.string(),
    level_id: z.string(),
    lift_id: z.string(),
    operation_record_id: z.string(),
    status: z.enum(["available", "unavailable", "restricted", "unknown"]),
    observed_at: z.string().datetime({ offset: true }),
  })
  .strict();
export class ZetarisAdapter {
  constructor(
    private config: ZetarisConfig,
    private transport: Transport = fetch,
  ) {
    const u = new URL(config.baseUrl);
    if (
      u.pathname !== "/" ||
      u.username ||
      u.password ||
      u.search ||
      u.hash ||
      !/^https?:$/.test(u.protocol)
    )
      throw new AppError("ZETARIS_UI_ORIGIN_REQUIRED", 422);
    if (
      u.protocol !== "https:" &&
      !["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)
    )
      throw new AppError("ZETARIS_HTTPS_REQUIRED", 422);
    if (!/^\d+$/.test(config.orgId))
      throw new AppError("ZETARIS_ORG_ID_REQUIRED", 422);
    tableName(config.directoryTable);
    tableName(config.operationsTable);
    if (config.directoryTable === config.operationsTable)
      throw new AppError("INDEPENDENT_ZETARIS_SOURCES_REQUIRED", 422);
  }
  private async token() {
    if (this.config.token) return this.config.token;
    if (!this.config.username || !this.config.password)
      throw new AppError("ZETARIS_CREDENTIALS_REQUIRED", 503);
    const raw = await boundedJson(
      this.config.baseUrl + "/api/auth/login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Request-ID": crypto.randomUUID(),
        },
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
        }),
      },
      this.transport,
      15000,
      0,
    );
    const parsed = z
      .object({
        idToken: z.string().optional(),
        token: z.string().optional(),
        accessToken: z.string().optional(),
      })
      .parse(raw);
    const token = parsed.idToken ?? parsed.token ?? parsed.accessToken;
    if (!token) throw new AppError("ZETARIS_LOGIN_NO_TOKEN", 503);
    return token;
  }
  async register(plan: ReturnType<typeof registrationPlan>) {
    const token = await this.token();
    const outcomes: { index: number; status: string }[] = [];
    for (const [index, statement] of plan.commands.entries()) {
      const raw = await boundedJson(
        this.config.baseUrl + "/api/proxy/sql-editor/sqls/run-query",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
            "X-Org-ID": this.config.orgId,
            "X-Request-ID": crypto.randomUUID(),
            "content-type": "application/json",
          },
          body: JSON.stringify({ sql: statement, limit: 1 }),
        },
        this.transport,
        30000,
        0,
      );
      if (
        raw &&
        typeof raw === "object" &&
        "error" in raw &&
        (raw as { error: unknown }).error
      )
        throw new AppError("ZETARIS_REGISTRATION_FAILED_AT_" + index, 503);
      outcomes.push({ index, status: "executed" });
    }
    return {
      outcomes,
      tables: plan.tables,
      execution: "live",
      note: "Registration is not query proof; inspect normalized column shapes and execute the federated investigation.",
    };
  }
  async query(buildingId: string, limit = 100, offset = 0) {
    const token = await this.token(),
      query = federationSql(
        this.config.directoryTable,
        this.config.operationsTable,
        buildingId,
        limit,
        offset,
      );
    const requestId = crypto.randomUUID();
    const raw = await boundedJson(
      this.config.baseUrl + "/api/proxy/sql-editor/sqls/run-query",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "X-Org-ID": this.config.orgId,
          "X-Request-ID": requestId,
          "content-type": "application/json",
        },
        body: JSON.stringify({ sql: query, limit }),
      },
      this.transport,
      30000,
      1,
    );
    // UI distributions differ; accept only explicitly documented row objects, never infer columns from positions.
    const envelope = z
      .object({
        data: z.array(z.unknown()).optional(),
        rows: z.array(z.unknown()).optional(),
        error: z.unknown().optional(),
      })
      .passthrough()
      .parse(raw);
    if (envelope.error)
      throw new AppError("ZETARIS_PARTIAL_QUERY_FAILURE", 503);
    const rows = z
      .array(rowSchema)
      .max(limit)
      .parse(envelope.rows ?? envelope.data);
    if (rows.some((r) => r.building_id !== buildingId))
      throw new AppError("ZETARIS_RESULT_SCOPE_MISMATCH", 502);
    return {
      rows,
      requestId,
      query,
      independentSources: [
        this.config.directoryTable,
        this.config.operationsTable,
      ],
      nextOffset: rows.length === limit ? offset + limit : null,
      execution: "live" as const,
    };
  }
}
export function zetarisForWorkspace(workspaceId: string) {
  if (process.env.ZETARIS_WORKSPACE_ID !== workspaceId)
    throw new AppError("ZETARIS_WORKSPACE_NOT_CONFIGURED", 503);
  if (process.env.ZETARIS_QUERY_PROTOCOL !== "sql-editor") {
    const directory = tableName(process.env.ZETARIS_DIRECTORY_TABLE ?? ""),
      operations = tableName(process.env.ZETARIS_OPERATIONS_TABLE ?? "");
    if (directory === operations)
      throw new AppError("INDEPENDENT_ZETARIS_SOURCES_REQUIRED", 422);
    return {
      async query(buildingId: string, limit = 100, offset = 0) {
        const query = federationSql(
            directory,
            operations,
            buildingId,
            limit,
            offset,
          ),
          result = await configuredGateway().read(query, limit),
          rows = z.array(rowSchema).max(limit).parse(result.rows);
        if (rows.some((r) => r.building_id !== buildingId))
          throw new AppError("ZETARIS_RESULT_SCOPE_MISMATCH", 502);
        return {
          ...result,
          rows,
          independentSources: [directory, operations],
          nextOffset: rows.length === limit ? offset + limit : null,
        };
      },
      async register(
        _plan: ReturnType<typeof registrationPlan>,
      ): Promise<never> {
        throw new AppError("RESOURCE_CREATION_NOT_AUTHORIZED", 403);
      },
    };
  }
  const c = z
    .object({
      baseUrl: z.string(),
      orgId: z.string(),
      directoryTable: z.string(),
      operationsTable: z.string(),
    })
    .parse({
      baseUrl: process.env.ZETARIS_BASE_URL,
      orgId: process.env.ZETARIS_ORG_ID,
      directoryTable: process.env.ZETARIS_DIRECTORY_TABLE,
      operationsTable: process.env.ZETARIS_OPERATIONS_TABLE,
    });
  return new ZetarisAdapter({
    ...c,
    token: process.env.ZETARIS_API_KEY,
    username: process.env.ZETARIS_USERNAME,
    password: process.env.ZETARIS_PASSWORD,
  });
}

export function registrationPlan(
  workspaceId: string,
  datasets: { role: "directory" | "operations"; url: string }[],
) {
  const dbName =
    "AO_" +
    new Bun.CryptoHasher("sha256")
      .update(workspaceId)
      .digest("hex")
      .slice(0, 16)
      .toUpperCase();
  if (
    datasets.length !== 2 ||
    new Set(datasets.map((d) => d.role)).size !== 2 ||
    new Set(datasets.map((d) => d.url)).size !== 2
  )
    throw new AppError("TWO_INDEPENDENT_DATASETS_REQUIRED", 422);
  const commands = [
    `CREATE LIGHTNING DATABASE ${dbName} DESCRIBE BY "AccessOps workspace-owned independent sources";`,
  ];
  const allowed = (process.env.ZETARIS_SOURCE_ALLOWED_HOSTS ?? "")
    .split(",")
    .filter(Boolean);
  for (const d of datasets) {
    const u = new URL(d.url);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      u.search ||
      u.hash ||
      !allowed.includes(u.hostname) ||
      /["\r\n]/.test(u.toString())
    )
      throw new AppError("ZETARIS_SOURCE_URL_NOT_ALLOWLISTED", 422);
    commands.push(
      `CREATE LIGHTNING REST TABLE ${d.role} FROM ${dbName} REQUEST(endpoint "${u.toString()}", method "get", response_type "json", http_encoding "URLENCODED") HEADER () BODY ();`,
    );
  }
  return {
    database: dbName,
    commands,
    tables: {
      directory: dbName.toLowerCase() + ".directory",
      operations: dbName.toLowerCase() + ".operations",
    },
    requires:
      "Source responses must expose the documented normalized columns; inspect DESCRIBE before federation",
    source:
      "https://raw.githubusercontent.com/zetaris/getting-started/main/docs/guides/first-dataset.md",
  };
}

// A returned join row must resolve unambiguously to the exact registered facts.
export function federatedEvidence(
  row: z.infer<typeof rowSchema>,
  observations: Observation[],
) {
  const directories = observations.filter(
    (o) =>
      o.externalId === row.directory_record_id &&
      o.attribute === "directory" &&
      o.buildingId === row.building_id &&
      o.levelId === row.level_id &&
      (o.entityId === row.destination_id ||
        o.entityExternalId === row.destination_id),
  );
  const operations = observations.filter(
    (o) =>
      o.externalId === row.operation_record_id &&
      o.attribute === "operational_status" &&
      o.buildingId === row.building_id &&
      o.value === row.status &&
      Date.parse(o.observedAt) === Date.parse(row.observed_at) &&
      (o.entityId === row.lift_id || o.entityExternalId === row.lift_id),
  );
  if (
    directories.length !== 1 ||
    operations.length !== 1 ||
    directories[0]!.sourceId === operations[0]!.sourceId ||
    !directories[0]!.entityId ||
    !operations[0]!.entityId
  )
    throw new AppError("FEDERATED_LINEAGE_NOT_REGISTERED", 502);
  return { directory: directories[0]!, operation: operations[0]! };
}
