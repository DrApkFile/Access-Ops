import { test, expect } from "bun:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ZetarisGateway } from "./zetaris-gateway";
import { loadIntegrationEnvironment } from "./integration-environment";
import { AppError } from "../accessops/errors";
test("MOCKED_INTEGRATION: gateway uses login org and exact verified query contract", async () => {
  const calls: { url: string; body: unknown; headers: Headers }[] = [];
  const client = new ZetarisGateway(
    {
      baseUrl: "http://127.0.0.1:3000",
      username: "unit-user",
      password: "unit-password",
    },
    async (url, init) => {
      calls.push({
        url: String(url),
        body: JSON.parse(String(init?.body)),
        headers: new Headers(init?.headers),
      });
      return String(url).endsWith("/login")
        ? Response.json({ idToken: "unit-token-only", orgId: 321 })
        : Response.json({
            records: [{ connection_check: "1" }],
            pageNumber: 1,
            pageLimit: 5,
            totalCount: 1,
            totalPages: 1,
            queryToken: "never-export-query-handle",
          });
    },
  );
  const result = await client.read("SELECT 1 AS connection_check", 5);
  expect(calls[1]!.url).toEndWith("/api/proxy/query/sql/start");
  expect(calls[1]!.body).toEqual({
    select: "SELECT 1 AS connection_check",
    pageLimit: 5,
  });
  expect(calls[1]!.headers.get("X-Org-ID")).toBe("321");
  expect(calls[1]!.headers.get("X-Request-ID")).toMatch(/^[0-9a-f-]{36}$/);
  expect(result.rows).toEqual([{ connection_check: "1" }]);
  expect(JSON.stringify(result)).not.toContain("unit-token-only");
  expect(JSON.stringify(result)).not.toContain("never-export-query-handle");
});
test("MOCKED_INTEGRATION: incomplete datasets and authentication failures never become empty healthy sources", async () => {
  const client = new ZetarisGateway(
    { baseUrl: "http://localhost", token: "unit-token", orgId: "1" },
    async () =>
      Response.json({
        records: [],
        pageNumber: 1,
        pageLimit: 5,
        totalCount: 50,
        totalPages: 10,
      }),
  );
  await expect(client.read("SELECT x FROM permitted.table", 5)).rejects.toThrow(
    "ZETARIS_PARTIAL_QUERY_FAILURE",
  );
  const unauthorized = new ZetarisGateway(
    { baseUrl: "http://localhost", token: "unit-token", orgId: "1" },
    async () => new Response("", { status: 401 }),
  );
  await expect(unauthorized.read("SELECT 1")).rejects.toThrow(
    "PROVIDER_UNAUTHORIZED",
  );
});
test("UNIT: read-only gateway refuses mutations and unbounded queries", async () => {
  let calls = 0;
  const client = new ZetarisGateway(
    { baseUrl: "http://localhost", token: "unit", orgId: "1" },
    async () => {
      calls++;
      return Response.json({});
    },
  );
  await expect(client.read("DROP TABLE original")).rejects.toThrow(
    "BOUNDED_READ_ONLY_QUERY_REQUIRED",
  );
  await expect(client.read("SELECT 1; DELETE FROM original")).rejects.toThrow();
  await expect(client.read("SELECT 1", 10000)).rejects.toThrow();
  expect(calls).toBe(0);
});
test("UNIT: explicit configuration reference copies only permitted server credentials", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "ao-config-"));
  try {
    const file = path.join(directory, "integration.env");
    await writeFile(
      file,
      "NVIDIA_API_KEY=unit-key-only\nDATABASE_URL=must-not-import\nNEXT_PUBLIC_API_URL=must-not-import\n",
      { mode: 0o600 },
    );
    const env: Record<string, string | undefined> = {
      ACCESSOPS_INTEGRATION_ENV_FILE: file,
    };
    await loadIntegrationEnvironment(env);
    expect(env.NVIDIA_API_KEY).toBe("unit-key-only");
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.NEXT_PUBLIC_API_URL).toBeUndefined();
    await expect(
      loadIntegrationEnvironment({
        ACCESSOPS_INTEGRATION_ENV_FILE: "relative.env",
      }),
    ).rejects.toBeInstanceOf(AppError);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
