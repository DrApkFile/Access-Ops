import { withProviderWorkspace } from "../providers/workspace-scope";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { jobs, memberships, users } from "./schema";
import { AppError, log } from "./errors";
import { can, type Principal, type Role } from "./auth";
import { metrics } from "./middleware";

export type JobKind =
  | "investigate"
  | "sync"
  | "import"
  | "parse"
  | "tactile"
  | "explain"
  | "geometry-review";
export async function enqueue(
  p: Principal,
  kind: JobKind,
  key: string,
  payload: Record<string, unknown>,
) {
  const rows = await db
    .insert(jobs)
    .values({
      id: Bun.randomUUIDv7(),
      workspaceId: p.workspaceId,
      kind,
      maxAttempts: ["explain","geometry-review"].includes(kind) ? 1 : 3,
      key,
      payload: {
        ...payload,
        principal: { userId: p.userId, workspaceId: p.workspaceId },
      },
      status: "queued",
    })
    .onConflictDoNothing()
    .returning();
  return (
    rows[0] ??
    (await db.query.jobs.findFirst({
      where: and(eq(jobs.workspaceId, p.workspaceId), eq(jobs.key, key)),
    }))
  );
}

export async function runOne(owner = crypto.randomUUID()): Promise<boolean> {
  const claimed = await db.transaction(async (tx) => {
    await tx.execute(
      sql`update ao_jobs set status='failed',error='LEASE_EXPIRED_RETRY_LIMIT',lease_owner=null,lease_until=null where status='running' and lease_until<now() and attempts>=max_attempts`,
    );
    const rows = await tx.execute(
      sql`select id from ao_jobs where attempts<max_attempts and ((status='queued' and run_after<=now()) or (status='running' and lease_until<now())) order by created_at for update skip locked limit 1`,
    );
    const row = Array.from(rows as unknown as { id: string }[])[0];
    if (!row) return null;
    const result = await tx
      .update(jobs)
      .set({
        status: "running",
        attempts: sql`${jobs.attempts}+1`,
        leaseOwner: owner,
        leaseUntil: new Date(Date.now() + 300000),
      })
      .where(eq(jobs.id, row.id))
      .returning();
    return result[0]!;
  });
  if (!claimed) return false;
  const heartbeat = setInterval(() => {
    void db
      .update(jobs)
      .set({ leaseUntil: new Date(Date.now() + 300000) })
      .where(and(eq(jobs.id, claimed.id), eq(jobs.leaseOwner, owner)))
      .catch(() => {});
  }, 30000);
  try {
    const payload = claimed.payload as Record<string, unknown>;
    const stored = payload.principal as { userId: string; workspaceId: string };
    const member = await db.query.memberships.findFirst({
      where: and(
        eq(memberships.userId, stored.userId),
        eq(memberships.workspaceId, claimed.workspaceId),
      ),
    });
    const user = await db.query.users.findFirst({
      where: eq(users.id, stored.userId),
    });
    if (!member || !user || user.disabled)
      throw new AppError("JOB_ACTOR_REVOKED", 403);
    const sourceJob = ["sync", "import"].includes(claimed.kind);
    const p: Principal = {
      userId: stored.userId,
      workspaceId: claimed.workspaceId,
      role: member.role as Role,
      access: sourceJob ? "manage" : "write",
    };
    if (!can(p.role, sourceJob ? "sources" : "operate"))
      throw new AppError("JOB_ACTOR_ROLE_REVOKED", 403);
    const { authorizeJob } = await import("./store");
    await authorizeJob(p, claimed);
    await withProviderWorkspace(p.workspaceId, async () => {
      if (claimed.kind === "explain") {
        const { explainStoredInvestigation } = await import(
          "./stored-explanation"
        );
        await explainStoredInvestigation(
          p,
          String(payload.investigationId),
          payload.provider as "auto" | "nvidia" | "meterless" | "none",
          String(payload.providerRunId),
        );
      } else if (claimed.kind === "investigate") {
        const { executeInvestigation } = await import("./investigation");
        await executeInvestigation(p, String(payload.investigationId));
      } else if (claimed.kind === "sync") {
        const { synchronize } = await import("./connectors");
        await synchronize(p, String(payload.sourceId));
      } else if (claimed.kind === "import") {
        const { ingest } = await import("./ingestion");
        const { recordSchema } = await import("@accessops/domain");
        const records = (payload.records as unknown[]).map((r) =>
          recordSchema.parse(r),
        );
        await ingest(
          p,
          String(payload.sourceId),
          records,
          new Date(),
          payload.rejections as unknown[],
          payload.raw as { content: string; format: string } | undefined,
        );
      } else if (claimed.kind === "parse") {
        const { runParse } = await import("../parse");
        await runParse(String(payload.projectId), String(payload.planPath));
      } else if (claimed.kind === "geometry-review") {
        if(!can(p.role,'review'))throw new AppError('JOB_REVIEW_PERMISSION_REVOKED',403)
        if(!['doorway-audit','critique'].includes(String(payload.stage)))throw new AppError('INVALID_REVIEW_STAGE',422)
        const {runGeometryReview}=await import('../models')
        await runGeometryReview(String(payload.projectId),Number(payload.expectedVersion),payload.stage as 'doorway-audit'|'critique')
      } else if (claimed.kind === "tactile") {
        const { runConversion } = await import("../tactile");
        await runConversion(
          String(payload.designId),
          payload.model as Parameters<typeof runConversion>[1],
        );
      } else throw new AppError("UNKNOWN_JOB_KIND", 422);
    });
    await db
      .update(jobs)
      .set({
        status: "succeeded",
        completedAt: new Date(),
        leaseUntil: null,
        leaseOwner: null,
        error: null,
      })
      .where(and(eq(jobs.id, claimed.id), eq(jobs.leaseOwner, owner)));
  } catch (e) {
    const permanent = e instanceof AppError && e.status < 500;
    const retry = !permanent && claimed.attempts < claimed.maxAttempts;
    metrics.jobRetries += Number(retry);
    await db
      .update(jobs)
      .set({
        status: retry ? "queued" : "failed",
        error: e instanceof AppError ? e.code : "JOB_EXECUTION_FAILED",
        leaseUntil: null,
        leaseOwner: null,
        runAfter: new Date(Date.now() + 1000 * 2 ** claimed.attempts),
      })
      .where(and(eq(jobs.id, claimed.id), eq(jobs.leaseOwner, owner)));
    log("job.failed", { jobId: claimed.id, kind: claimed.kind, retry });
  } finally {
    clearInterval(heartbeat);
  }
  return true;
}
