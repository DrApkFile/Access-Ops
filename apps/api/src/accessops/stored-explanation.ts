import { and, eq } from "drizzle-orm";
import { db } from "../db";
import * as t from "./schema";
import { getBuilding } from "./store";
import { can, type Principal } from "./auth";
import { AppError } from "./errors";
import { projectEvidence } from "./world-model";
import { explain, type Packet } from "../providers/explanation";
export async function explainStoredInvestigation(
  p: Principal,
  investigationId: string,
  provider: "auto" | "nvidia" | "meterless" | "none",
  runId: string,
) {
  if (!can(p.role, "operate")) throw new AppError("FORBIDDEN", 403);
  if (
    !(process.env.ACCESSOPS_PROVIDER_WORKSPACES ?? "")
      .split(",")
      .includes(p.workspaceId)
  )
    throw new AppError("WORKSPACE_PROVIDER_CONSENT_REQUIRED", 403);
  const row = await db.query.investigations.findFirst({
    where: and(
      eq(t.investigations.id, investigationId),
      eq(t.investigations.workspaceId, p.workspaceId),
    ),
  });
  if (!row) throw new AppError("NOT_FOUND", 404);
  await getBuilding(p, row.buildingId);
  if (row.status !== "completed")
    throw new AppError("INVESTIGATION_NOT_COMPLETE", 409);
  const previous = await db.query.providerRuns.findFirst({
    where: and(
      eq(t.providerRuns.id, runId),
      eq(t.providerRuns.workspaceId, p.workspaceId),
    ),
  });
  if (previous) {
    if (previous.status === "running") {
      const [unknown] = await db
        .update(t.providerRuns)
        .set({
          status: "unverified",
          metadata: {
            reason: "ATTEMPT_OUTCOME_UNKNOWN_AFTER_INTERRUPTION",
            automaticReplay: false,
          },
        })
        .where(eq(t.providerRuns.id, runId))
        .returning();
      return unknown!;
    }
    return previous;
  }
  const result = row.result as Packet;
  const projection = await projectEvidence(
    p.workspaceId,
    runId,
    result.evidence,
  );
  const eligible = result.findings
    .filter((f) => f.evidenceIds.length > 0 && f.evidenceIds.length <= 50)
    .slice(0, 3);
  const evidenceIds = new Set(eligible.flatMap((f) => f.evidenceIds));
  const packet: Packet = {
    question: row.question,
    asOf: row.asOf.toISOString(),
    findings: eligible,
    evidence: result.evidence.filter(
      (o) => evidenceIds.has(o.id) && projection.evidenceIds.includes(o.id),
    ),
  };
  if (!eligible.length || Buffer.byteLength(JSON.stringify(packet)) > 100000)
    throw new AppError("EXPLANATION_EVIDENCE_BUDGET", 422);
  // Record intent before inference. Ambiguous/crashed attempts are never automatically replayed.
  await db.insert(t.providerRuns).values({
    id: runId,
    workspaceId: p.workspaceId,
    investigationId,
    provider,
    status: "running",
    metadata: {
      engine: projection.engine,
      phase: "request-intent",
      evidenceIds: [...evidenceIds],
      asOf: packet.asOf,
    },
  });
  const explanation = await explain(packet, provider);
  const [updated] = await db
    .update(t.providerRuns)
    .set({
      provider:
        explanation.status === "succeeded" ? explanation.provider : provider,
      model: "model" in explanation ? explanation.model : null,
      status: explanation.status,
      metadata: {
        ...explanation,
        engine: projection.engine,
        evidenceIds: [...evidenceIds],
        asOf: packet.asOf,
        investigationEvidenceHash: (row.result as { evidenceHash: string })
          .evidenceHash,
        classification:
          explanation.status === "succeeded"
            ? explanation.execution === "live"
              ? "LIVE_END_TO_END"
              : "MOCKED_INTEGRATION"
            : "NOT_VERIFIED",
      },
    })
    .where(
      and(
        eq(t.providerRuns.id, runId),
        eq(t.providerRuns.workspaceId, p.workspaceId),
      ),
    )
    .returning();
  return updated!;
}
