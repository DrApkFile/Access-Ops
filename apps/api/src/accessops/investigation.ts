import { projectEvidence } from "./world-model";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  deterministicFindings,
  analyzeGraph,
  graphSchema,
  profileSchema,
  type Finding,
  type Observation,
  stableJson,
} from "@accessops/domain";
import { db } from "../db";
import * as t from "./schema";
import { getBuilding, getObservations, latestGraph } from "./store";
import { audit, can, type Principal } from "./auth";
import { AppError, hash } from "./errors";
import { explain } from "../providers/explanation";
import { zetarisForWorkspace, federatedEvidence } from "../providers/zetaris";
import { config } from "./config";
import { metrics } from "./middleware";
export const investigationInput = z
  .object({
    buildingId: z.string().min(1),
    question: z.string().min(8).max(1000),
    asOf: z.string().datetime({ offset: true }),
    profile: profileSchema,
    previousId: z.string().optional(),
    useZetaris: z.boolean().default(false),
  })
  .strict();
export async function executeInvestigation(p: Principal, id: string) {
  if (!can(p.role, "operate"))
    throw new AppError("INVESTIGATION_ROLE_REVOKED", 403);
  const investigation = await db.query.investigations.findFirst({
    where: and(
      eq(t.investigations.id, id),
      eq(t.investigations.workspaceId, p.workspaceId),
    ),
  });
  if (!investigation) throw new AppError("NOT_FOUND", 404);
  if (investigation.status === "completed") return investigation.result;
  await getBuilding(p, investigation.buildingId);
  await db
    .update(t.investigations)
    .set({ status: "running", error: null })
    .where(eq(t.investigations.id, id));
  try {
    const options = investigation.result as {
      input: z.infer<typeof investigationInput>;
    };
    const input = investigationInput.parse(options.input);
    const trace: { stage: string; at: string; metadata?: unknown }[] = [];
    const stage = (name: string, metadata?: unknown) =>
      trace.push({ stage: name, at: new Date().toISOString(), metadata });
    stage("authorized", { buildingId: input.buildingId, asOf: input.asOf });
    let observations = await getObservations(
      p,
      input.buildingId,
      new Date(input.asOf),
    );
    stage("evidence.retrieved", {
      records: observations.length,
      sources: new Set(observations.map((o) => o.sourceId)).size,
    });
    const projection = await projectEvidence(p.workspaceId, id, observations);
    stage("meterless.engine.projection", projection.engine);
    const projectedIds = new Set(projection.evidenceIds);
    observations = observations.filter((o) => projectedIds.has(o.id));
    const graphRow = await latestGraph(p, input.buildingId);
    const graph = graphRow ? graphSchema.parse(graphRow.graph) : null;
    const findings = deterministicFindings(
      observations,
      graph,
      new Date(input.asOf),
      input.profile,
    ).map((f) => ({ ...f, id: Bun.randomUUIDv7() }));
    stage("deterministic.checks", {
      findings: findings.length,
      graphVersion: graphRow?.version ?? null,
    });
    let federation: unknown = null;
    if (input.useZetaris) {
      try {
        const queried = await zetarisForWorkspace(p.workspaceId).query(
          input.buildingId,
        );
        federation = queried;
        for (const row of queried.rows) {
          if (row.status !== "unavailable") continue;
          const { directory, operation } = federatedEvidence(row, observations);
          findings.push({
            id: Bun.randomUUIDv7(),
            title: "Federated directory and operational records match",
            entityId: directory.entityId,
            severity: "high",
            rationale:
              "A live Zetaris join links an independently registered destination record with a reported unavailable lift record. This establishes an operational dependency requiring reviewed route assessment.",
            classification: "reported",
            evidenceIds: [directory.id, operation.id],
            recommendation:
              "Verify the lift restriction and assess the dependent destination with reviewed connectivity.",
            uncertainties: [
              "Federated dependency does not by itself prove that all routes are blocked",
            ],
            status: "open",
          });
        }
        stage("zetaris.federated", {
          rows: queried.rows.length,
          sources: queried.independentSources,
          requestId: queried.requestId,
        });
      } catch (e) {
        federation = {
          status: "failed",
          code: e instanceof AppError ? e.code : "ZETARIS_RESPONSE_INVALID",
        };
        stage("zetaris.failed", federation);
      }
    }
    const at = new Date(input.asOf);
    let previous: unknown = null;
    if (input.previousId) {
      const old = await db.query.investigations.findFirst({
        where: and(
          eq(t.investigations.id, input.previousId),
          eq(t.investigations.workspaceId, p.workspaceId),
          eq(t.investigations.buildingId, input.buildingId),
        ),
      });
      if (!old) throw new AppError("PREVIOUS_INVESTIGATION_NOT_FOUND", 404);
      const oldResult = old.result as { evidence?: Observation[] };
      const oldHashes = new Set(
        oldResult?.evidence?.map((o) => o.contentHash) ?? [],
      );
      previous = {
        id: old.id,
        historicalAsOf: old.asOf,
        changedEvidence: observations
          .filter((o) => !oldHashes.has(o.contentHash))
          .map((o) => o.id),
        carryForward:
          "Historical findings are context only; all current checks are recomputed with freshness policies",
      };
      stage("history.revalidated", previous);
    }
    const evidenceIds = new Set(observations.map((o) => o.id));
    for (const f of findings)
      if (f.evidenceIds.some((e) => !evidenceIds.has(e)))
        throw new AppError("INVALID_INTERNAL_CITATION", 502);
    const packet = {
      question: input.question,
      findings: findings.slice(0, 30),
      evidence: observations
        .filter((o) => findings.some((f) => f.evidenceIds.includes(o.id)))
        .slice(0, 200),
      asOf: at.toISOString(),
    };
    // Never truncate away cited records. Oversized packets preserve deterministic results without inference.
    const bounded =
      Buffer.byteLength(JSON.stringify(packet)) <= 100000 &&
      findings.every((f) =>
        f.evidenceIds.every((e) => packet.evidence.some((o) => o.id === e)),
      );
    const providerAllowed =
      process.env.ACCESSOPS_AUTO_EXPLANATION === "true" &&
      (process.env.ACCESSOPS_PROVIDER_WORKSPACES ?? "")
        .split(",")
        .includes(p.workspaceId);
    const explanation = bounded
      ? await explain(
          packet,
          providerAllowed ? config.ACCESSOPS_EXPLANATION_PROVIDER : "none",
        )
      : {
          status: "unavailable",
          reason: "Evidence packet exceeds bounded model budget",
        };
    if (explanation.status !== "succeeded") metrics.providerFailures++;
    if ("attempts" in explanation)
      metrics.citationFailures += explanation.attempts.filter(
        (a) =>
          a.status === "INVALID_EVIDENCE_CITATION" ||
          a.status === "UNSUPPORTED_FACTUAL_CLAIM",
      ).length;
    stage("explanation.validated", { status: explanation.status });
    const result = {
      reachability: graph
        ? analyzeGraph(graph, observations, at, input.profile)
        : [],
      schemaVersion: 1,
      engine: projection.engine,
      question: input.question,
      buildingId: input.buildingId,
      asOf: at.toISOString(),
      input,
      findings,
      evidence: observations,
      evidenceHash: hash(stableJson(observations)),
      sourceSnapshotIds: [...new Set(observations.map((o) => o.snapshotId))],
      graphId: graphRow?.id ?? null,
      graphVersion: graphRow?.version ?? null,
      trace,
      explanation,
      federation,
      previous,
      assumptions: [
        "Only supplied travel profile constraints were checked",
        "Reported incidents are not independently verified",
        "This is not a certified accessibility inspection",
      ],
      demo: observations.some(
        (o) => (o as Observation & { demo?: boolean }).demo,
      ),
    };
    await db.transaction(async (tx) => {
      for (const finding of findings) {
        const findingId = finding.id;
        await tx.insert(t.findings).values({
          id: findingId,
          workspaceId: p.workspaceId,
          investigationId: id,
          entityId: finding.entityId,
          finding: { ...finding, id: findingId },
        });
      }
      await tx.insert(t.providerRuns).values({
        id: Bun.randomUUIDv7(),
        workspaceId: p.workspaceId,
        investigationId: id,
        provider:
          "provider" in explanation ? String(explanation.provider) : "none",
        model: "model" in explanation ? String(explanation.model) : null,
        status: explanation.status,
        metadata: explanation,
      });
      await tx.insert(t.auditEvents).values({
        id: Bun.randomUUIDv7(),
        workspaceId: p.workspaceId,
        actorId: p.userId,
        action: "investigation.completed",
        targetId: id,
        metadata: {
          findings: findings.length,
          evidence: observations.length,
          aiStatus: explanation.status,
        },
      });
      await tx
        .update(t.investigations)
        .set({
          result,
          status: "completed",
          completedAt: new Date(),
          error: null,
        })
        .where(
          and(
            eq(t.investigations.id, id),
            eq(t.investigations.workspaceId, p.workspaceId),
          ),
        );
    });
    metrics.investigations++;
    return result;
  } catch (e) {
    await db
      .update(t.investigations)
      .set({
        status: "failed",
        error: e instanceof AppError ? e.code : "INVESTIGATION_FAILED",
      })
      .where(eq(t.investigations.id, id));
    throw e;
  }
}
