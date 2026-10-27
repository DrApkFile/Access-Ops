import { and, desc, eq, lte, inArray } from "drizzle-orm";
import { db } from "../db";
import * as t from "./schema";
import type { Principal } from "./auth";
import { grantsAccess } from "./permissions";
import { AppError } from "./errors";
import type { Entity, Observation, SourceRecord } from "@accessops/domain";
export async function getBuilding(p: Principal, id: string) {
  const r = await db.query.buildings.findFirst({
    where: and(
      eq(t.buildings.id, id),
      eq(t.buildings.workspaceId, p.workspaceId),
    ),
  });
  if (!r) throw new AppError("NOT_FOUND", 404);
  if (p.role !== "admin") {
    const grant = await db.query.buildingGrants.findFirst({
      where: and(
        eq(t.buildingGrants.workspaceId, p.workspaceId),
        eq(t.buildingGrants.buildingId, id),
        eq(t.buildingGrants.userId, p.userId),
      ),
    });
    if (!grant || !grantsAccess(grant.permission, p.access ?? "read"))
      throw new AppError("NOT_FOUND", 404);
  }
  return r;
}
export async function getSource(p: Principal, id: string) {
  const r = await db.query.sources.findFirst({
    where: and(eq(t.sources.id, id), eq(t.sources.workspaceId, p.workspaceId)),
  });
  if (!r) throw new AppError("NOT_FOUND", 404);
  await getBuilding(p, r.buildingId);
  return r;
}
export async function getEntity(p: Principal, id: string) {
  const r = await db.query.entities.findFirst({
    where: and(
      eq(t.entities.id, id),
      eq(t.entities.workspaceId, p.workspaceId),
    ),
  });
  if (!r) throw new AppError("NOT_FOUND", 404);
  await getBuilding(p, r.buildingId);
  return r;
}
export async function getEntities(
  p: Principal,
  buildingId: string,
): Promise<Entity[]> {
  await getBuilding(p, buildingId);
  const rows = await db
    .select()
    .from(t.entities)
    .where(
      and(
        eq(t.entities.workspaceId, p.workspaceId),
        eq(t.entities.buildingId, buildingId),
      ),
    )
    .limit(2000);
  return rows.map((e) => ({
    ...e,
    kind: e.kind as Entity["kind"],
    aliases: e.aliases as Entity["aliases"],
  }));
}
export async function getObservations(
  p: Principal,
  buildingId: string,
  asOf = new Date(),
): Promise<Observation[]> {
  await getBuilding(p, buildingId);
  const rows = await db
    .select({
      observation: t.observations,
      source: t.sources,
      snapshot: t.snapshots,
    })
    .from(t.observations)
    .innerJoin(
      t.sources,
      and(
        eq(t.sources.id, t.observations.sourceId),
        eq(t.sources.workspaceId, p.workspaceId),
      ),
    )
    .innerJoin(
      t.snapshots,
      and(
        eq(t.snapshots.id, t.observations.snapshotId),
        eq(t.snapshots.workspaceId, p.workspaceId),
      ),
    )
    .where(
      and(
        eq(t.observations.workspaceId, p.workspaceId),
        eq(t.sources.buildingId, buildingId),
      ),
    )
    .orderBy(desc(t.observations.createdAt))
    .limit(5001);
  if (rows.length > 5000)
    throw new AppError(
      "EVIDENCE_LIMIT_EXCEEDED",
      422,
      "Narrow the building evidence window before investigating",
    );
  const decisions = await db
    .select()
    .from(t.matchDecisions)
    .where(
      and(
        eq(t.matchDecisions.workspaceId, p.workspaceId),
        lte(t.matchDecisions.createdAt, asOf),
      ),
    )
    .orderBy(desc(t.matchDecisions.createdAt))
    .limit(10000);
  const byObservation = new Map<string, string>();
  for (const d of decisions)
    if (!byObservation.has(d.observationId))
      byObservation.set(d.observationId, d.entityId);
  const resolutions = await db
    .select()
    .from(t.resolutions)
    .where(
      and(
        eq(t.resolutions.workspaceId, p.workspaceId),
        lte(t.resolutions.createdAt, asOf),
      ),
    )
    .orderBy(desc(t.resolutions.createdAt))
    .limit(10000);
  return rows.map(({ observation: o, source: s, snapshot: sn }) => ({
    ...(o.record as SourceRecord),
    id: o.id,
    sourceId: s.id,
    snapshotId: sn.id,
    identityMatch: byObservation.has(o.id)
      ? {
          state: "confirmed",
          entityId: byObservation.get(o.id)!,
          candidates: [byObservation.get(o.id)!],
          reason: decisions.find((d) => d.observationId === o.id)!.reason,
        }
      : (o.match as Observation["identityMatch"]),
    entityId: byObservation.get(o.id) ?? o.entityId,
    retrievedAt: sn.retrievedAt.toISOString(),
    contentHash: o.hash,
    sourceContentHash: sn.hash,
    ingestionRunId: sn.runId,
    sourceRefreshError: s.lastError ?? undefined,
    lastSuccessfulSyncAt: s.lastSuccessAt?.toISOString(),
    publisher: s.publisher,
    uri: s.uri,
    license: s.license,
    trust: s.trust,
    freshnessSeconds: s.freshnessSeconds,
    demo: s.demo,
    reviewDecision: (() => {
      const r = resolutions.find(
        (r) =>
          r.entityId === (byObservation.get(o.id) ?? o.entityId) &&
          r.attribute === (o.record as SourceRecord).attribute,
      );
      return r
        ? {
            id: r.id,
            reviewedAt: r.createdAt.toISOString(),
            selectedId: String(
              (r.decision as { selectedId?: string }).selectedId,
            ),
            evidenceIds: r.evidenceIds as string[],
            reason: r.reason,
          }
        : undefined;
    })(),
  }));
}
export async function latestGraph(p: Principal, buildingId: string) {
  await getBuilding(p, buildingId);
  return db.query.graphs.findFirst({
    where: and(
      eq(t.graphs.workspaceId, p.workspaceId),
      eq(t.graphs.buildingId, buildingId),
    ),
    orderBy: desc(t.graphs.version),
  });
}

export async function allowedBuildingIds(p: Principal) {
  const rows = await db
    .select({ id: t.buildings.id })
    .from(t.buildings)
    .where(eq(t.buildings.workspaceId, p.workspaceId))
    .limit(2000);
  if (p.role === "admin") return rows.map((r) => r.id);
  const grants = await db
    .select()
    .from(t.buildingGrants)
    .where(
      and(
        eq(t.buildingGrants.workspaceId, p.workspaceId),
        eq(t.buildingGrants.userId, p.userId),
      ),
    );
  return grants
    .filter((g) => grantsAccess(g.permission, p.access ?? "read"))
    .map((g) => g.buildingId);
}
export async function authorizeProject(p: Principal, projectId: string) {
  const { projects } = await import("../db/schema");
  const project = await db.query.projects.findFirst({
    where: and(
      eq(projects.id, projectId),
      eq(projects.workspaceId, p.workspaceId),
    ),
  });
  if (!project) throw new AppError("NOT_FOUND", 404);
  if (p.role === "admin" || project.createdBy === p.userId) return project;
  const grant = await db.query.projectGrants.findFirst({
    where: and(
      eq(t.projectGrants.workspaceId, p.workspaceId),
      eq(t.projectGrants.projectId, projectId),
      eq(t.projectGrants.userId, p.userId),
    ),
  });
  if (grant && grantsAccess(grant.permission, p.access ?? "read"))
    return project;
  const links = await db
    .select()
    .from(t.floorPlanLinks)
    .where(
      and(
        eq(t.floorPlanLinks.projectId, projectId),
        eq(t.floorPlanLinks.workspaceId, p.workspaceId),
      ),
    )
    .limit(100);
  const allowed = new Set(await allowedBuildingIds(p));
  if (links.some((l) => allowed.has(l.buildingId))) return project;
  throw new AppError("NOT_FOUND", 404);
}

export async function authorizeJob(
  p: Principal,
  job: typeof t.jobs.$inferSelect,
) {
  const payload = job.payload as Record<string, unknown>;
  if (job.kind === "sync" || job.kind === "import") {
    await getSource(p, String(payload.sourceId));
    return;
  }
  if (job.kind === "investigate" || job.kind === "explain") {
    const inv = await db.query.investigations.findFirst({
      where: and(
        eq(t.investigations.id, String(payload.investigationId)),
        eq(t.investigations.workspaceId, p.workspaceId),
      ),
    });
    if (!inv) throw new AppError("NOT_FOUND", 404);
    await getBuilding(p, inv.buildingId);
    return;
  }
  if (job.kind === "parse" || job.kind === 'geometry-review') {
    await authorizeProject(p, String(payload.projectId));
    return;
  }
  if (job.kind === "tactile") {
    const design = await db.query.tactileDesigns.findFirst({
      where: (table, { eq }) => eq(table.id, String(payload.designId)),
    });
    if (!design) throw new AppError("NOT_FOUND", 404);
    await authorizeProject(p, design.projectId);
    return;
  }
  throw new AppError("UNKNOWN_JOB_KIND", 422);
}
