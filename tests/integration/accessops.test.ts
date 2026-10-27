import { describe, test, expect, afterAll } from "bun:test";
import { randomBytes } from "node:crypto";
const enabled = process.env.ACCESSOPS_INTEGRATION === "1";
describe.skipIf(!enabled)("isolated PostgreSQL API acceptance", () => {
  test("independent sources → reconciliation → impact → approved action → verified resolution → historical report, plus tenant isolation and stale STL protection", async () => {
    if (!process.env.DATABASE_URL?.includes("127.0.0.1:55434"))
      throw new Error(
        "Use the isolated AccessOps test database on 127.0.0.1:55434; refusing another database",
      );
    const { db } = await import("../../apps/api/src/db");
    const t = await import("../../apps/api/src/accessops/schema");
    const { app } = await import("../../apps/api/src/app");
    const { runOne } = await import("../../apps/api/src/accessops/jobs");
    const { runDemo } = await import("../../apps/api/scripts/demo-workflow");
    const { eq, sql } = await import("../../apps/api/node_modules/drizzle-orm");
    const evidence: Record<string, unknown> = {};
    let working = false;
    const timer = setInterval(() => {
      if (!working) {
        working = true;
        void runOne().finally(() => {
          working = false;
        });
      }
    }, 30);
    async function tenant(label: string) {
      const userId = crypto.randomUUID(),
        orgId = crypto.randomUUID(),
        workspaceId = crypto.randomUUID(),
        password = randomBytes(20).toString("hex"),
        email = label + "-" + userId + "@test.invalid";
      await db.transaction(async (tx) => {
        await tx
          .insert(t.organizations)
          .values({ id: orgId, name: "Isolated acceptance " + label });
        await tx
          .insert(t.workspaces)
          .values({ id: workspaceId, organizationId: orgId, name: label });
        await tx.insert(t.users).values({
          id: userId,
          email,
          passwordHash: await Bun.password.hash(password, {
            algorithm: "argon2id",
            memoryCost: 19456,
            timeCost: 2,
          }),
        });
        await tx
          .insert(t.memberships)
          .values({ userId, workspaceId, role: "admin" });
      });
      let cookie = "";
      const client = {
        async raw(
          path: string,
          method = "GET",
          body?: unknown,
          headers: Record<string, string> = {},
        ) {
          const r = await app.request(
            path,
            {
              method,
              headers: {
                cookie,
                "x-accessops-request": "1",
                "content-type": "application/json",
                "idempotency-key": crypto.randomUUID(),
                ...headers,
              },
              body: body === undefined ? undefined : JSON.stringify(body),
            },
            { remoteIp: label },
          );
          const sc = r.headers.get("set-cookie");
          if (sc) cookie = sc.split(";")[0]!;
          return r;
        },
        async request(
          path: string,
          method = "GET",
          body?: unknown,
          expected = 200,
        ) {
          const r = await this.raw(path, method, body);
          const data = (await r.json()) as any;
          expect(r.status, "API " + path + ": " + JSON.stringify(data)).toBe(
            expected,
          );
          return data;
        },
        async upload(bytes: Uint8Array, name: string, mime: string) {
          const form = new FormData();
          form.set("file", new File([bytes], name, { type: mime }));
          const r = await app.request(
            "/projects",
            {
              method: "POST",
              headers: { cookie, "x-accessops-request": "1" },
              body: form,
            },
            { remoteIp: label },
          );
          expect(r.status).toBe(201);
          return r.json() as Promise<any>;
        },
        cookie: () => cookie,
      };
      await client.request("/auth/login", "POST", {
        email,
        password,
        workspaceId,
      });
      return { client, userId, workspaceId };
    }
    try {
      const first = await tenant("a"),
        other = await tenant("b");
      const result = await runDemo(first.client, first.userId);
      evidence.workflow = result.steps;
      const previousVision = process.env.VISION_PROVIDER;
      try {
        process.env.VISION_PROVIDER = "none";
        const before = await first.client.request("/projects/" + result.projectId);
        const [beforeJobs] = await db.$client`select count(*)::int as count from ao_jobs where workspace_id=${first.workspaceId} and kind='parse'`;
        const unavailable = await first.client.request("/projects/" + result.projectId + "/parse", "POST", {}, 503);
        expect(unavailable.code).toBe("VISION_NOT_READY");
        expect(unavailable.vision.provider).toBe("none");
        expect(unavailable.vision.state).toBe("disabled");
        const after = await first.client.request("/projects/" + result.projectId);
        const [afterJobs] = await db.$client`select count(*)::int as count from ao_jobs where workspace_id=${first.workspaceId} and kind='parse'`;
        expect(after.status).toBe(before.status);
        expect(afterJobs.count).toBe(beforeJobs.count);
        evidence.visionUnavailable = { blockedBeforeQueue: true, projectUnchanged: true, externalRequests: 0 };
      } finally {
        if (previousVision === undefined) delete process.env.VISION_PROVIDER;
        else process.env.VISION_PROVIDER = previousVision;
      }
      const ownProjects = await first.client.request("/projects");
      const foreignProjects = await other.client.request("/projects");
      expect(
        ownProjects.items.some(
          (r: { id: string }) => r.id === result.projectId,
        ),
      ).toBe(true);
      expect(
        foreignProjects.items.some(
          (r: { id: string }) => r.id === result.projectId,
        ),
      ).toBe(false);
      expect(JSON.stringify(ownProjects)).not.toContain("planPath");
      const frozen = await first.client.request(
        "/v1/investigations/" + result.impactedId,
      );
      expect(frozen.result.engine.name).toBe("Meterless World Model");
      expect(frozen.result.engine.observations).toBe(
        frozen.result.evidence.length,
      );
      expect(frozen.result.engine.runtimeExecution).toBe(false);
      expect(
        (
          await first.client.raw(
            "/v1/investigations/" + result.impactedId + "/explanations",
            "POST",
            { provider: "nvidia", confirmation: "explain-frozen-evidence" },
          )
        ).status,
      ).toBe(403);
      expect(
        (
          await other.client.raw(
            "/v1/investigations/" + result.impactedId + "/providers",
          )
        ).status,
      ).toBe(404);
      // Real Postgres + durable worker: missing Runtime and denied cloud policy must
      // persist a truthful unavailable run, without calling either external service.
      const policyKeys = [
        "ACCESSOPS_PROVIDER_WORKSPACES",
        "ACCESSOPS_NVIDIA_TEXT_WORKSPACES",
        "METERLESS_RUNTIME_TOKEN",
        "METERLESS_BASE_URL",
      ] as const;
      const policyBefore = Object.fromEntries(
        policyKeys.map((k) => [k, process.env[k]]),
      );
      try {
        process.env.ACCESSOPS_PROVIDER_WORKSPACES = first.workspaceId;
        process.env.ACCESSOPS_NVIDIA_TEXT_WORKSPACES = "";
        delete process.env.METERLESS_RUNTIME_TOKEN;
        delete process.env.METERLESS_BASE_URL;
        const queued = await first.client.request(
          "/v1/investigations/" + result.impactedId + "/explanations",
          "POST",
          { provider: "auto", confirmation: "explain-frozen-evidence" },
          202,
        );
        let run;
        for (let n = 0; n < 150; n++) {
          const records = await first.client.request(
            "/v1/investigations/" + result.impactedId + "/providers",
          );
          run = records.items.find(
            (r: { id: string }) => r.id === queued.providerRunId,
          );
          if (run && run.status !== "running") break;
          await Bun.sleep(40);
        }
        expect(run.status).toBe("unavailable");
        expect(run.metadata.requestedMode).toBe("auto");
        expect(run.metadata.actualProvider).toBeNull();
        expect(run.metadata.attempts[0].missing).toEqual([
          "METERLESS_RUNTIME_TOKEN",
          "METERLESS_BASE_URL",
        ]);
        expect(
          run.metadata.attempts.every(
            (a: { requestSent: boolean }) => a.requestSent === false,
          ),
        ).toBe(true);
        expect(run.metadata.code).toBe("NVIDIA_TEXT_NOT_ALLOWED_FOR_WORKSPACE");
        expect(run.metadata.classification).toBe("NOT_VERIFIED");
        const history = await first.client.request(
          "/v1/investigations/" + result.impactedId,
        );
        expect(history.result.evidenceHash).toBe(frozen.result.evidenceHash);
      } finally {
        for (const k of policyKeys) {
          if (policyBefore[k] === undefined) delete process.env[k];
          else process.env[k] = policyBefore[k];
        }
      }
      const scopedActions = await first.client.request(
        "/v1/actions?buildingId=" + result.buildingId,
      );
      expect(
        scopedActions.items.some(
          (r: { id: string }) => r.id === result.actionId,
        ),
      ).toBe(true);
      expect(
        (await other.client.raw("/v1/actions?buildingId=" + result.buildingId))
          .status,
      ).toBe(404);

      for (const route of [
        "/v1/buildings/" + result.buildingId,
        "/v1/buildings/" + result.buildingId + "/entities",
        "/v1/evidence/" + result.evidenceId,
        "/v1/investigations/" + result.impactedId,
        "/v1/investigations/" + result.impactedId + "/report",
        "/v1/scenarios/" + result.scenarioId,
        "/v1/findings/" + result.findingId,
        "/projects/" + result.projectId,
        "/projects/" + result.projectId + "/plan",
        "/projects/" + result.projectId + "/model",
        "/projects/" + result.projectId + "/export/map.stl",
      ])
        expect(
          (await other.client.raw(route)).status,
          "cross-tenant " + route,
        ).toBe(404);
      expect(
        (
          await other.client.raw(
            "/v1/sources/" + result.sourceId + "/import",
            "POST",
            { format: "json", content: "[]", previewHash: "invalid" },
          )
        ).status,
      ).toBe(404);
      expect(
        (
          await other.client.raw("/v1/actions/" + result.actionId, "PATCH", {
            status: "resolved",
            reason: "Cross tenant test",
            evidenceIds: [],
          })
        ).status,
      ).toBe(404);
      expect((await app.request("/projects/" + result.projectId)).status).toBe(
        401,
      );
      expect(
        (
          await first.client.raw(
            "/v1/buildings",
            "POST",
            { name: "csrf" },
            { "x-accessops-request": "" },
          )
        ).status,
      ).toBe(403);
      expect(
        (
          await first.client.raw(
            "/v1/buildings",
            "POST",
            { name: "bad-origin" },
            { origin: "https://attacker.invalid" },
          )
        ).status,
      ).toBe(403);
      // Role changes immediately invalidate privileged behavior, even with an existing session.
      await db
        .update(t.memberships)
        .set({ role: "viewer" })
        .where(eq(t.memberships.userId, first.userId));
      expect(
        (
          await first.client.raw("/v1/buildings", "POST", {
            name: "unauthorized",
          })
        ).status,
      ).toBe(403);
      await db
        .update(t.memberships)
        .set({ role: "admin" })
        .where(eq(t.memberships.userId, first.userId));
      // Physical/export regression uses original geometry, not inferred accessibility measurements.
      await first.client.request(
        "/projects/" + result.projectId + "/tactile",
        "POST",
        {},
        202,
      );
      async function done() {
        for (let n = 0; n < 150; n++) {
          const row = await first.client.request(
            "/projects/" + result.projectId + "/tactile",
          );
          if (row.status === "done") return row;
          if (row.status === "failed") throw new Error("Tactile failed");
          await Bun.sleep(50);
        }
        throw new Error("Tactile worker timeout");
      }
      const design = await done();
      const { runConversion } = await import("../../apps/api/src/tactile");
      await runConversion(design.id, {} as never);
      expect(
        (
          await first.client.request(
            "/projects/" + result.projectId + "/tactile",
          )
        ).design,
      ).toEqual(design.design);
      expect(design.valid).toBe(true);
      const exported = await first.client.request(
        "/projects/" + result.projectId + "/export",
        "POST",
        {},
        201,
      );
      expect(exported.files.some((f: any) => f.kind === "legend")).toBe(true);
      await first.client.request(
        "/projects/" + result.projectId + "/model/operations",
        "POST",
        {
          operations: [{ op: "relabel", id: "r-ne", label: "Updated clinic" }],
        },
        201,
      );
      expect(
        (
          await first.client.raw(
            "/projects/" + result.projectId + "/export",
            "POST",
            {},
          )
        ).status,
      ).toBe(409);
      expect(
        (
          await first.client.request(
            "/projects/" + result.projectId + "/tactile",
          )
        ).stale,
      ).toBe(true);
      expect(
        (
          await first.client.raw(
            "/projects/" + result.projectId + "/export/map.stl",
          )
        ).status,
      ).toBe(409);
      expect(
        (
          await first.client.raw(
            "/projects/" +
              result.projectId +
              "/export/map.stl?designId=" +
              exported.designId,
          )
        ).status,
      ).toBe(200);
      await first.client.request(
        "/projects/" + result.projectId + "/tactile",
        "POST",
        {},
        202,
      );
      await done();
      expect(
        (
          await first.client.raw(
            "/projects/" + result.projectId + "/export",
            "POST",
            {},
          )
        ).status,
      ).toBe(201);
      const historical = await first.client.raw(
        "/projects/" +
          result.projectId +
          "/export/map.stl?designId=" +
          exported.designId,
      );
      expect(historical.headers.get("x-tactile-design-id")).toBe(
        exported.designId,
      );
      expect(
        (
          await first.client.raw(
            "/projects/" +
              result.projectId +
              "/export/map.stl?designId=does-not-exist",
          )
        ).status,
      ).toBe(404);
      // Malformed and oversized files are rejected by actual API validation.
      const badForm = new FormData();
      badForm.set(
        "file",
        new File(["not a PDF"], "bad.pdf", { type: "application/pdf" }),
      );
      expect(
        (
          await app.request("/projects", {
            method: "POST",
            headers: {
              cookie: first.client.cookie(),
              "x-accessops-request": "1",
            },
            body: badForm,
          })
        ).status,
      ).toBe(422);
      // Database-level evidence immutability and tenant-key constraints.
      let immutable = false;
      try {
        await db.$client`update ao_observations set external_id='tampered' where id=${result.evidenceId}`;
      } catch {
        immutable = true;
      }
      expect(immutable).toBe(true);
      let tenantFk = false;
      try {
        await db.$client`insert into ao_levels (id,workspace_id,building_id,name,ordinal) values (${crypto.randomUUID()},${other.workspaceId},${result.buildingId},'illegal',999)`;
      } catch {
        tenantFk = true;
      }
      expect(tenantFk).toBe(true);
      // A duplicate queue key maps to one job; committed history is not re-executed.
      const requestBody = {
        buildingId: result.buildingId,
        question: "What changed in the recorded building evidence?",
        asOf: new Date().toISOString(),
        profile: { kind: "step-free" },
      };
      const key = crypto.randomUUID();
      const a = await first.client.raw(
          "/v1/investigations",
          "POST",
          requestBody,
          { "idempotency-key": key },
        ),
        b = await first.client.raw("/v1/investigations", "POST", requestBody, {
          "idempotency-key": key,
        });
      expect((await a.json()).id).toBe((await b.json()).id);
      const rows =
        await db.$client`select count(*)::int as count from ao_jobs where workspace_id=${first.workspaceId} and key=${"investigate:" + key}`;
      expect(rows[0].count).toBe(1);
      // Building and project grants are independent of workspace membership.
      const operatorPassword = randomBytes(20).toString("hex"),
        operatorEmail = "operator-" + crypto.randomUUID() + "@test.invalid";
      const operator = await first.client.request(
        "/v1/users",
        "POST",
        { email: operatorEmail, password: operatorPassword, role: "operator" },
        201,
      );
      const login = await app.request(
        "/auth/login",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-accessops-request": "1",
          },
          body: JSON.stringify({
            email: operatorEmail,
            password: operatorPassword,
            workspaceId: first.workspaceId,
          }),
        },
        { remoteIp: "operator" },
      );
      expect(login.status).toBe(200);
      const operatorCookie = login.headers.get("set-cookie")!.split(";")[0]!;
      const operatorRequest = (path: string, method = "GET", body?: unknown) =>
        app.request(
          path,
          {
            method,
            headers: {
              cookie: operatorCookie,
              "content-type": "application/json",
              "x-accessops-request": "1",
              "idempotency-key": crypto.randomUUID(),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
          },
          { remoteIp: "operator" },
        );
      expect(
        (await operatorRequest("/v1/buildings/" + result.buildingId)).status,
      ).toBe(404);
      expect(
        (await operatorRequest("/projects/" + result.projectId + "/plan"))
          .status,
      ).toBe(404);
      await first.client.request(
        "/v1/buildings/" + result.buildingId + "/grants",
        "POST",
        { userId: operator.id, permission: "read" },
      );
      expect(
        (await operatorRequest("/v1/buildings/" + result.buildingId)).status,
      ).toBe(200);
      expect(
        (await operatorRequest("/projects/" + result.projectId + "/plan"))
          .status,
      ).toBe(200);
      expect(
        (await operatorRequest("/v1/investigations", "POST", requestBody))
          .status,
      ).toBe(404);
      await first.client.request(
        "/v1/buildings/" + result.buildingId + "/grants",
        "POST",
        { userId: operator.id, permission: "write" },
      );
      expect(
        (await operatorRequest("/v1/investigations", "POST", requestBody))
          .status,
      ).toBe(202);
      expect((await operatorRequest("/v1/sources", "POST", {})).status).toBe(
        403,
      );
      // A crashed worker lease is claimable; duplicate import retries are safe through content hashes.
      const queuedId = crypto.randomUUID();
      await db.insert(t.jobs).values({
        id: queuedId,
        workspaceId: first.workspaceId,
        kind: "sync",
        key: "recovery-" + queuedId,
        payload: {
          sourceId: result.sourceId,
          principal: { userId: first.userId, workspaceId: first.workspaceId },
        },
        status: "running",
        attempts: 1,
        leaseOwner: "crashed-test-worker",
        leaseUntil: new Date(Date.now() - 60000),
      });
      for (let n = 0; n < 50; n++) {
        const row = await db.query.jobs.findFirst({
          where: eq(t.jobs.id, queuedId),
        });
        if (row?.status === "failed") {
          expect(row.attempts).toBe(2);
          break;
        }
        await Bun.sleep(50);
      }
      const recovered = await db.query.jobs.findFirst({
        where: eq(t.jobs.id, queuedId),
      });
      expect(recovered?.status).toBe("failed");
      expect(recovered?.error).toBe(
        "SOURCE_REQUIRES_IMPORT_OR_FEDERATED_QUERY",
      );
      const expiredToken = "expired-session-" + crypto.randomUUID();
      const { hash } = await import("../../apps/api/src/accessops/errors");
      await db.insert(t.sessions).values({
        tokenHash: hash(expiredToken),
        workspaceId: first.workspaceId,
        userId: first.userId,
        expiresAt: new Date(Date.now() - 1000),
      });
      expect(
        (
          await app.request("/auth/me", {
            headers: { cookie: "ao_session=" + expiredToken },
          })
        ).status,
      ).toBe(401);
      expect(
        (
          await first.client.raw("/v1/users/" + first.userId, "PATCH", {
            role: "viewer",
          })
        ).status,
      ).toBe(409);
      await first.client.request("/v1/users/" + operator.id, "PATCH", {
        role: "viewer",
        revokeSessions: true,
      });
      expect((await operatorRequest("/auth/me")).status).toBe(401);
      const oversize = new FormData();
      oversize.set(
        "file",
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], "too-large.png", {
          type: "image/png",
        }),
      );
      expect(
        (
          await app.request("/projects", {
            method: "POST",
            headers: {
              cookie: first.client.cookie(),
              "x-accessops-request": "1",
            },
            body: oversize,
          })
        ).status,
      ).toBe(413);
      expect(
        (
          await app.request("/v1/buildings", {
            method: "POST",
            headers: {
              cookie: first.client.cookie(),
              "x-accessops-request": "1",
              "content-type": "application/json",
            },
            body: "{broken",
          })
        ).status,
      ).toBe(400);
      const measurements = await first.client.request(
        "/v1/measurements?buildingId=" + result.buildingId,
      );
      expect(measurements.items.length).toBeGreaterThan(0);
      expect(
        (
          await other.client.raw(
            "/v1/measurements?buildingId=" + result.buildingId,
          )
        ).status,
      ).toBe(404);
      const snapshots = await first.client.request(
        "/v1/sources/" + result.sourceId + "/snapshots",
      );
      expect(snapshots.items.length).toBeGreaterThan(0);
      const rawSnapshot = await first.client.request(
        "/v1/sources/" +
          result.sourceId +
          "/snapshots/" +
          snapshots.items[0].id,
      );
      expect(typeof rawSnapshot.rawContent).toBe("string");
      expect(
        (
          await other.client.raw(
            "/v1/sources/" +
              result.sourceId +
              "/snapshots/" +
              snapshots.items[0].id,
          )
        ).status,
      ).toBe(404);
      await first.client.request(
        "/v1/observations/" + measurements.items[0].id + "/verify",
        "POST",
        {
          reason:
            "Explicit acceptance reviewer rechecked this synthetic measurement",
          method: "Demonstration fixture review only",
        },
        201,
      );
      evidence.security = {
        crossTenantReads: 11,
        crossTenantWrites: 2,
        csrf: true,
        roleRevocation: true,
        immutableEvidence: true,
        tenantForeignKeys: true,
      };
      evidence.staleExport = {
        blocked: true,
        historicalRetrieval: true,
        regeneration: true,
      };
      await Bun.write(
        new URL(
          "../../.accessops-local/integration-results.json",
          import.meta.url,
        ),
        JSON.stringify(evidence, null, 2),
      );
    } finally {
      clearInterval(timer);
      while (working) await Bun.sleep(20);
      await db.$client.close();
    }
  }, 120000);
});
