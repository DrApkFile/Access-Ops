import { z } from "zod";
import { AppError } from "../accessops/errors";
import { boundedJson, type Transport } from "./http";
export type GatewayConfig = {
  baseUrl: string;
  username?: string;
  password?: string;
  token?: string;
  orgId?: string;
};
const envelope = z
  .object({
    records: z.array(z.record(z.string(), z.unknown())).max(500),
    pageNumber: z.number().int(),
    pageLimit: z.number().int(),
    totalCount: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .passthrough();
/** Adapts LastMile's live-verified Zetaris 2.4.3 gateway. Internal fixed queries only. */
export class ZetarisGateway {
  constructor(
    private config: GatewayConfig,
    private transport: Transport = fetch,
  ) {
    const u = new URL(config.baseUrl);
    if (
      u.username ||
      u.password ||
      u.search ||
      u.hash ||
      !["", "/"].includes(u.pathname) ||
      !["https:", "http:"].includes(u.protocol)
    )
      throw new AppError("ZETARIS_UI_ORIGIN_REQUIRED", 422);
    if (
      u.protocol !== "https:" &&
      !["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)
    )
      throw new AppError("ZETARIS_HTTPS_REQUIRED", 422);
  }
  private async login() {
    if (this.config.token) {
      if (!/^\d+$/.test(this.config.orgId ?? ""))
        throw new AppError("ZETARIS_ORG_ID_REQUIRED", 503);
      return { token: this.config.token, orgId: this.config.orgId! };
    }
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
      20000,
      0,
    );
    const result = z
      .object({
        idToken: z.string().min(1),
        orgId: z.union([
          z.string().regex(/^\d+$/),
          z.number().int().positive(),
        ]),
      })
      .parse(raw);
    return { token: result.idToken, orgId: String(result.orgId) };
  }
  async read(sql: string, limit = 100) {
    if (
      !/^\s*(SELECT|SHOW)\b/i.test(sql) ||
      /[;]|\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|MERGE|COPY)\b/i.test(
        sql,
      ) ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 500
    )
      throw new AppError("BOUNDED_READ_ONLY_QUERY_REQUIRED", 422);
    const auth = await this.login(),
      requestId = crypto.randomUUID(),
      started = Date.now();
    const raw = await boundedJson(
      this.config.baseUrl + "/api/proxy/query/sql/start",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: "Bearer " + auth.token,
          "X-Org-ID": auth.orgId,
          "X-Request-ID": requestId,
        },
        body: JSON.stringify({ select: sql, pageLimit: limit }),
      },
      this.transport,
      30000,
      0,
    );
    const data = envelope.parse(raw);
    if (
      data.pageNumber !== 1 ||
      data.totalPages > 1 ||
      data.records.length > limit ||
      data.totalCount !== data.records.length
    )
      throw new AppError("ZETARIS_PARTIAL_QUERY_FAILURE", 503);
    return {
      rows: data.records,
      requestId,
      query: sql,
      queryPath: "/api/proxy/query/sql/start",
      durationMs: Date.now() - started,
      execution: "live" as const,
    };
  }
}
export function configuredGateway() {
  const baseUrl = process.env.ZETARIS_BASE_URL;
  if (!baseUrl) throw new AppError("ZETARIS_NOT_CONFIGURED", 503);
  return new ZetarisGateway({
    baseUrl,
    username: process.env.ZETARIS_USERNAME,
    password: process.env.ZETARIS_PASSWORD,
    token: process.env.ZETARIS_API_KEY,
    orgId: process.env.ZETARIS_ORG_ID,
  });
}
