import { config } from "./config";
import { Hono, type Context } from "hono";
import { and, desc, eq, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  graphSchema,
  profileSchema,
  scenarioSchema,
  simulate,
  reconcile,
  stateAt,
  type Observation,
  type Finding,
} from "@accessops/domain";
import { db } from "../db";
import * as t from "./schema";
import { requirePermission, audit, can, type Env } from "./auth";
import {
  getBuilding,
  getObservations,
  latestGraph,
  getEntity,
  allowedBuildingIds,
  authorizeJob,
} from "./store";
import { AppError, hash } from "./errors";
import { investigationInput } from "./investigation";
import { enqueue } from "./jobs";
import { safeCsvCell } from "./imports";
import { metrics } from "./middleware";
export const workflows = new Hono<Env>();
const limitSchema = z.coerce.number().int().min(1).max(200).default(50);
workflows.post("/investigations", requirePermission("operate"), async (c) => {
  const p = c.get("principal"),
    input = investigationInput.parse(await c.req.json());
  await getBuilding(p, input.buildingId);
  const key = c.req.header("idempotency-key");
  if (!key || key.length > 120)
    throw new AppError("IDEMPOTENCY_KEY_REQUIRED", 422);
  const result = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${p.workspaceId + ":" + key}))`,
    );
    const existing = await tx.query.jobs.findFirst({
      where: and(
        eq(t.jobs.workspaceId, p.workspaceId),
        eq(t.jobs.key, "investigate:" + key),
      ),
    });
    if (existing) {
      const payload = existing.payload as {
        investigationId: string;
        inputHash: string;
      };
      if (payload.inputHash !== hash(JSON.stringify(input)))
        throw new AppError("IDEMPOTENCY_KEY_REUSED_WITH_OTHER_INPUT", 409);
      return {
        id: payload.investigationId,
        jobId: existing.id,
        status: existing.status,
      };
    }
    const id = Bun.randomUUIDv7(),
      jobId = Bun.randomUUIDv7();
    await tx.insert(t.investigations).values({
      id,
      workspaceId: p.workspaceId,
      buildingId: input.buildingId,
      question: input.question,
      asOf: new Date(input.asOf),
      status: "queued",
      result: { input },
      previousId: input.previousId,
      createdBy: p.userId,
    });
    await tx.insert(t.jobs).values({
      id: jobId,
      workspaceId: p.workspaceId,
      kind: "investigate",
      key: "investigate:" + key,
      payload: {
        investigationId: id,
        inputHash: hash(JSON.stringify(input)),
        principal: { userId: p.userId, workspaceId: p.workspaceId },
      },
      status: "queued",
    });
    return { id, jobId, status: "queued" };
  });
  await audit(p, "investigation.requested", result.id);
  return c.json(result, 202);
});
workflows.get("/investigations", async (c) => {
  const p = c.get("principal"),
    buildingId = z.string().parse(c.req.query("buildingId"));
  await getBuilding(p, buildingId);
  return c.json({
    items: await db
      .select({
        id: t.investigations.id,
        question: t.investigations.question,
        status: t.investigations.status,
        asOf: t.investigations.asOf,
        createdAt: t.investigations.createdAt,
        error: t.investigations.error,
      })
      .from(t.investigations)
      .where(
        and(
          eq(t.investigations.workspaceId, p.workspaceId),
          eq(t.investigations.buildingId, buildingId),
        ),
      )
      .orderBy(desc(t.investigations.createdAt))
      .limit(limitSchema.parse(c.req.query("limit"))),
  });
});
async function investigation(c: Context<Env>) {
  const p = c.get("principal");
  const row = await db.query.investigations.findFirst({
    where: and(
      eq(t.investigations.id, c.req.param("id")!),
      eq(t.investigations.workspaceId, p.workspaceId),
    ),
  });
  if (!row) throw new AppError("NOT_FOUND", 404);
  await getBuilding(p, row.buildingId);
  return row;
}
workflows.get("/investigations/:id", async (c) =>
  c.json(await investigation(c)),
);
workflows.get("/investigations/:id/evidence/:evidenceId", async (c) => {
  const row = await investigation(c);
  const evidence = (row.result as { evidence?: Observation[] })?.evidence?.find(
    (o) => o.id === c.req.param("evidenceId"),
  );
  if (!evidence) throw new AppError("NOT_FOUND", 404);
  return c.json(evidence);
});
workflows.get("/investigations/:id/findings", async (c) => {
  const row = await investigation(c);
  return c.json({
    items: await db
      .select()
      .from(t.findings)
      .where(
        and(
          eq(t.findings.workspaceId, c.get("principal").workspaceId),
          eq(t.findings.investigationId, row.id),
        ),
      )
      .limit(100),
  });
});
const escape = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
workflows.get("/investigations/:id/report", async (c) => {
  const row = await investigation(c);
  if (row.status !== "completed")
    throw new AppError("INVESTIGATION_NOT_COMPLETE", 409);
  const actions = await db
    .select({ action: t.actions })
    .from(t.actions)
    .innerJoin(
      t.findings,
      and(
        eq(t.findings.id, t.actions.findingId),
        eq(t.findings.workspaceId, c.get("principal").workspaceId),
      ),
    )
    .where(
      and(
        eq(t.findings.investigationId, row.id),
        eq(t.actions.workspaceId, c.get("principal").workspaceId),
      ),
    )
    .limit(200);
  const report = {
    investigation: row,
    actionStateExportedAt: new Date().toISOString(),
    actions: actions.map((a) => a.action),
    notice:
      "Historical evidence snapshot. Action status is current at export time. Simulations and demonstration sources are labelled. Not a certified accessibility inspection.",
  };
  if (c.req.query("format") !== "html") return c.json(report);
  c.header(
    "content-security-policy",
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
  );
  return c.html(
    '<!doctype html><html lang="en"><meta charset="utf-8"><title>AccessOps investigation report</title><h1>AccessOps investigation report</h1><p>' +
      escape(row.question) +
      "</p><p>" +
      escape(report.notice) +
      '</p><pre style="white-space:pre-wrap">' +
      escape(JSON.stringify(report, null, 2)) +
      "</pre></html>",
  );
});
workflows.get("/findings/:id", async (c) => {
  const p = c.get("principal");
  const row = await db.query.findings.findFirst({
    where: and(
      eq(t.findings.id, c.req.param("id")),
      eq(t.findings.workspaceId, p.workspaceId),
    ),
  });
  if (!row) throw new AppError("NOT_FOUND", 404);
  if ("buildingId" in row) await getBuilding(p, String(row.buildingId));
  else {
    const inv = await db.query.investigations.findFirst({
      where: and(
        eq(t.investigations.id, row.investigationId),
        eq(t.investigations.workspaceId, p.workspaceId),
      ),
    });
    if (!inv) throw new AppError("NOT_FOUND", 404);
    await getBuilding(p, inv.buildingId);
  }
  return c.json(row);
});
workflows.post("/actions", requirePermission("operate"), async (c) => {
  const p = c.get("principal"),
    body = z
      .object({
        findingId: z.string(),
        ownerId: z.string().nullable().default(null),
        priority: z.enum(["high", "medium", "low"]),
        proposal: z.string().min(8).max(2000),
        dueAt: z.string().datetime({ offset: true }).optional(),
      })
      .strict()
      .parse(await c.req.json());
  const finding = await db.query.findings.findFirst({
    where: and(
      eq(t.findings.id, body.findingId),
      eq(t.findings.workspaceId, p.workspaceId),
    ),
  });
  if (!finding) throw new AppError("NOT_FOUND", 404);
  const inv = await db.query.investigations.findFirst({
    where: eq(t.investigations.id, finding.investigationId),
  });
  await getBuilding(p, inv!.buildingId);
  if (
    body.ownerId &&
    !(await db.query.memberships.findFirst({
      where: and(
        eq(t.memberships.userId, body.ownerId),
        eq(t.memberships.workspaceId, p.workspaceId),
      ),
    }))
  )
    throw new AppError("OWNER_NOT_IN_WORKSPACE", 422);
  const id = Bun.randomUUIDv7();
  await db.insert(t.actions).values({
    id,
    workspaceId: p.workspaceId,
    ...body,
    dueAt: body.dueAt ? new Date(body.dueAt) : null,
  });
  await audit(p, "action.proposed", id);
  return c.json({ id, status: "proposed" }, 201);
});
workflows.get("/actions", async (c) => {
  const p = c.get("principal");
  const requestedBuilding = c.req.query("buildingId");
  if (requestedBuilding) await getBuilding(p, requestedBuilding);
  const rows = await db
    .select({ action: t.actions })
    .from(t.actions)
    .innerJoin(t.findings, eq(t.findings.id, t.actions.findingId))
    .innerJoin(
      t.investigations,
      eq(t.investigations.id, t.findings.investigationId),
    )
    .where(
      and(
        eq(t.actions.workspaceId, p.workspaceId),
        inArray(t.investigations.buildingId, await allowedBuildingIds(p)),
        requestedBuilding
          ? eq(t.investigations.buildingId, requestedBuilding)
          : undefined,
      ),
    )
    .orderBy(desc(t.actions.updatedAt))
    .limit(limitSchema.parse(c.req.query("limit")));
  return c.json({ items: rows.map((r) => r.action) });
});
workflows.patch("/actions/:id", requirePermission("operate"), async (c) => {
  const p = c.get("principal"),
    body = z
      .object({
        status: z.enum(["approved", "in_progress", "resolved", "rejected"]),
        reason: z.string().min(8).max(2000),
        evidenceIds: z.array(z.string()).max(100).default([]),
      })
      .strict()
      .parse(await c.req.json());
  const row = await db.query.actions.findFirst({
    where: and(
      eq(t.actions.id, c.req.param("id")),
      eq(t.actions.workspaceId, p.workspaceId),
    ),
  });
  if (!row) throw new AppError("NOT_FOUND", 404);
  const parentFinding = await db.query.findings.findFirst({
    where: eq(t.findings.id, row.findingId),
  });
  const parentInvestigation = await db.query.investigations.findFirst({
    where: eq(t.investigations.id, parentFinding!.investigationId),
  });
  await getBuilding(p, parentInvestigation!.buildingId);
  const transitions: Record<string, string[]> = {
    proposed: ["approved", "rejected"],
    approved: ["in_progress", "rejected"],
    in_progress: ["resolved", "rejected"],
    resolved: [],
    rejected: [],
  };
  if (!transitions[row.status]?.includes(body.status))
    throw new AppError("INVALID_ACTION_TRANSITION", 409);
  if (body.status !== "in_progress" && !can(p.role, "review"))
    throw new AppError("REVIEWER_APPROVAL_REQUIRED", 403);
  if (
    body.status === "in_progress" &&
    row.ownerId !== p.userId &&
    !can(p.role, "review")
  )
    throw new AppError("ACTION_OWNER_REQUIRED", 403);
  if (body.status === "resolved") {
    const finding = await db.query.findings.findFirst({
      where: and(
        eq(t.findings.id, row.findingId),
        eq(t.findings.workspaceId, p.workspaceId),
      ),
    });
    const inv = await db.query.investigations.findFirst({
      where: and(
        eq(t.investigations.id, finding!.investigationId),
        eq(t.investigations.workspaceId, p.workspaceId),
      ),
    });
    const observations = await getObservations(p, inv!.buildingId);
    const f = finding!.finding as Finding;
    const historical = (inv!.result as { evidence: Observation[] }).evidence;
    const relevantEntities = new Set(
      historical
        .filter((o) => f.evidenceIds.includes(o.id))
        .map((o) => o.entityId),
    );
    if (
      !body.evidenceIds.length ||
      body.evidenceIds.some(
        (id) =>
          !observations.some(
            (o) =>
              o.id === id &&
              stateAt(o, new Date()) === "verified" &&
              o.lastVerifiedAt &&
              relevantEntities.has(o.entityId),
          ),
      )
    )
      throw new AppError("CURRENT_VERIFIED_RESOLUTION_EVIDENCE_REQUIRED", 422);
  }
  const updated = await db
    .update(t.actions)
    .set({
      status: body.status,
      approvedBy: body.status === "approved" ? p.userId : row.approvedBy,
      resolution:
        body.status === "resolved"
          ? {
              reason: body.reason,
              evidenceIds: body.evidenceIds,
              reviewerId: p.userId,
              at: new Date().toISOString(),
            }
          : row.resolution,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(t.actions.id, row.id),
        eq(t.actions.workspaceId, p.workspaceId),
        eq(t.actions.status, row.status),
      ),
    )
    .returning({ id: t.actions.id });
  if (!updated.length) throw new AppError("ACTION_CONCURRENT_UPDATE", 409);
  await audit(p, "action." + body.status, row.id, {
    reason: body.reason,
    evidenceIds: body.evidenceIds,
  });
  return c.json({ id: row.id, status: body.status });
});
workflows.post("/scenarios", requirePermission("operate"), async (c) => {
  const p = c.get("principal"),
    body = z
      .object({
        buildingId: z.string(),
        asOf: z.string().datetime({ offset: true }),
        profile: profileSchema,
        scenario: scenarioSchema,
      })
      .strict()
      .parse(await c.req.json());
  const graph = await latestGraph(p, body.buildingId);
  if (!graph) throw new AppError("REVIEWED_GRAPH_REQUIRED", 422);
  const evidence = await getObservations(
      p,
      body.buildingId,
      new Date(body.asOf),
    ),
    definition = graphSchema.parse(graph.graph),
    result = simulate(
      definition,
      evidence,
      new Date(body.asOf),
      body.profile,
      body.scenario,
    ),
    id = Bun.randomUUIDv7();
  await db.insert(t.scenarios).values({
    id,
    workspaceId: p.workspaceId,
    buildingId: body.buildingId,
    graphId: graph.id,
    definition: body,
    result,
    evidence,
    createdBy: p.userId,
  });
  metrics.scenarios++;
  await audit(p, "scenario.created", id, { affected: result.affected.length });
  return c.json({ id, result }, 201);
});
workflows.get("/scenarios/:id", async (c) => {
  const p = c.get("principal");
  const row = await db.query.scenarios.findFirst({
    where: and(
      eq(t.scenarios.id, c.req.param("id")),
      eq(t.scenarios.workspaceId, p.workspaceId),
    ),
  });
  if (!row) throw new AppError("NOT_FOUND", 404);
  await getBuilding(p, row.buildingId);
  return c.json(row);
});
workflows.get("/buildings/:id/reconciliation", async (c) => {
  const evidence = await getObservations(c.get("principal"), c.req.param("id"));
  return c.json({
    items: reconcile(evidence, new Date()),
    unresolved: evidence.filter((o) => !o.entityId).map((o) => o.id),
  });
});
workflows.get("/jobs/:id", async (c) => {
  const p = c.get("principal"),
    row = await db.query.jobs.findFirst({
      where: and(
        eq(t.jobs.id, c.req.param("id")),
        eq(t.jobs.workspaceId, p.workspaceId),
      ),
    });
  if (!row) throw new AppError("NOT_FOUND", 404);
  await authorizeJob(p, row);
  return c.json({
    id: row.id,
    kind: row.kind,
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.maxAttempts,
    error: row.error,
    runAfter: row.runAfter,
    completedAt: row.completedAt,
  });
});
workflows.post("/jobs/:id/retry", requirePermission("read"), async (c) => {
  const p = c.get("principal"),
    row = await db.query.jobs.findFirst({
      where: and(
        eq(t.jobs.id, c.req.param("id")),
        eq(t.jobs.workspaceId, p.workspaceId),
      ),
    });
  if (!row) throw new AppError("NOT_FOUND", 404);
  if (
    !can(p.role, row.kind==='geometry-review'?'review':["sync", "import"].includes(row.kind) ? "sources" : "operate")
  )
    throw new AppError("FORBIDDEN", 403);
  await authorizeJob(
    {
      ...p,
      access: ["sync", "import"].includes(row.kind) ? "manage" : "write",
    },
    row,
  );
  if (row.status !== "failed") throw new AppError("JOB_NOT_FAILED", 409);
  await db
    .update(t.jobs)
    .set({ status: "queued", attempts: 0, error: null, runAfter: new Date() })
    .where(
      and(
        eq(t.jobs.id, row.id),
        eq(t.jobs.workspaceId, p.workspaceId),
        eq(t.jobs.status, "failed"),
      ),
    );
  await audit(p, "job.retried", row.id);
  return c.json({ status: "queued" });
});
workflows.get("/sources/:id/runs/:runId/rejected.csv", async (c) => {
  const p = c.get("principal");
  const { getSource } = await import("./store");
  await getSource(p, c.req.param("id"));
  const run = await db.query.ingestionRuns.findFirst({
    where: and(
      eq(t.ingestionRuns.id, c.req.param("runId")),
      eq(t.ingestionRuns.sourceId, c.req.param("id")),
      eq(t.ingestionRuns.workspaceId, p.workspaceId),
    ),
  });
  if (!run) throw new AppError("NOT_FOUND", 404);
  const errors = (run.summary as { errors?: unknown[] }).errors ?? [];
  c.header("content-type", "text/csv");
  c.header("content-disposition", 'attachment; filename="rejected-rows.csv"');
  return c.body(
    "row,error\n" +
      errors
        .map((e, index) =>
          [safeCsvCell(index + 1), safeCsvCell(JSON.stringify(e))].join(","),
        )
        .join("\n"),
  );
});

workflows.post("/jobs/:id/cancel", requirePermission("read"), async (c) => {
  const p = c.get("principal"),
    row = await db.query.jobs.findFirst({
      where: and(
        eq(t.jobs.id, c.req.param("id")),
        eq(t.jobs.workspaceId, p.workspaceId),
      ),
    });
  if (!row) throw new AppError("NOT_FOUND", 404);
  if (
    !can(p.role, ["sync", "import"].includes(row.kind) ? "sources" : "operate")
  )
    throw new AppError("FORBIDDEN", 403);
  await authorizeJob(
    {
      ...p,
      access: ["sync", "import"].includes(row.kind) ? "manage" : "write",
    },
    row,
  );
  if (row.status !== "queued")
    throw new AppError("ONLY_QUEUED_JOBS_CAN_BE_CANCELLED", 409);
  const updated = await db
    .update(t.jobs)
    .set({ status: "cancelled", completedAt: new Date() })
    .where(and(eq(t.jobs.id, row.id), eq(t.jobs.status, "queued")))
    .returning({ id: t.jobs.id });
  if (!updated.length) throw new AppError("JOB_CONCURRENT_UPDATE", 409);
  await audit(p, "job.cancelled", row.id);
  return c.json({ status: "cancelled" });
});

workflows.get("/investigations/:id/providers", async (c) => {
  const row = await investigation(c);
  return c.json({
    items: await db
      .select()
      .from(t.providerRuns)
      .where(
        and(
          eq(t.providerRuns.workspaceId, c.get("principal").workspaceId),
          eq(t.providerRuns.investigationId, row.id),
        ),
      )
      .orderBy(desc(t.providerRuns.createdAt))
      .limit(30),
  });
});
workflows.post(
  "/investigations/:id/explanations",
  requirePermission("operate"),
  async (c) => {
    const row = await investigation(c),
      p = c.get("principal");
    if (row.status !== "completed")
      throw new AppError("INVESTIGATION_NOT_COMPLETE", 409);
    if (
      !(process.env.ACCESSOPS_PROVIDER_WORKSPACES ?? "")
        .split(",")
        .includes(p.workspaceId)
    )
      throw new AppError("WORKSPACE_PROVIDER_CONSENT_REQUIRED", 403);
    const body = z
      .object({
        provider: z.enum(["auto", "nvidia", "meterless", "none"]).optional(),
        confirmation: z.literal("explain-frozen-evidence"),
      })
      .strict()
      .parse(await c.req.json());
    const provider = body.provider ?? config.ACCESSOPS_EXPLANATION_PROVIDER;
    const key = c.req.header("idempotency-key");
    if (!key || key.length > 120)
      throw new AppError("IDEMPOTENCY_KEY_REQUIRED", 422);
    const providerRunId = Bun.randomUUIDv7(),
      job = await enqueue(
        p,
        "explain",
        "explain:" + row.id + ":" + provider + ":" + key,
        { investigationId: row.id, provider, providerRunId },
      );
    await db
      .update(t.jobs)
      .set({ maxAttempts: 1 })
      .where(and(eq(t.jobs.id, job!.id), eq(t.jobs.status, "queued")));
    await audit(p, "explanation.requested", row.id, {
      provider,
      providerRunId: (job!.payload as { providerRunId: string }).providerRunId,
    });
    return c.json(
      {
        jobId: job!.id,
        providerRunId: (job!.payload as { providerRunId: string })
          .providerRunId,
        status: job!.status,
      },
      202,
    );
  },
);
