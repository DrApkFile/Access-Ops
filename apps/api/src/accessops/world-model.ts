import type { Observation } from "@accessops/domain";
import { WorldModel } from "./world-model-engine";
import { AppError, hash } from "./errors";
/** A bounded projection of exact persisted observations. Postgres and deterministic reconciliation remain authoritative. */
export async function projectEvidence(
  workspaceId: string,
  runId: string,
  observations: Observation[],
) {
  if (
    observations.length > 5000 ||
    new Set(observations.map((o) => o.id)).size !== observations.length
  )
    throw new AppError("ENGINE_EVIDENCE_BUDGET_OR_DUPLICATE", 422);
  const world = new WorldModel({
    namespace: "accessops:" + workspaceId + ":" + runId,
    storage: "memory",
  });
  const mapping = new Map<string, string>();
  for (const o of [...observations].sort((a, b) => a.id.localeCompare(b.id))) {
    const source = {
      kind: "api",
      at: o.observedAt,
      url: o.uri,
      checksum: o.contentHash,
      runId,
    };
    // External keys prevent the upstream name-based auto-merger from changing canonical identities.
    const subject = await world.upsertEntity({
      type: "observation",
      externalKey: { system: workspaceId, id: o.id },
      name: o.externalId,
      attrs: {
        evidenceId: o.id,
        sourceId: o.sourceId,
        snapshotId: o.snapshotId,
      },
      source,
    });
    if (o.entityId) {
      const entity = await world.upsertEntity({
        type: "spatial-entity",
        externalKey: { system: workspaceId, id: o.entityId },
        name: o.entityName,
        attrs: { buildingId: o.buildingId, levelId: o.levelId },
        source,
      });
      await world.relate({
        from: subject.id,
        type: "evidence-for",
        to: entity.id,
        source,
      });
    }
    await world.assertFact({
      about: subject.id,
      predicate: "source-observation",
      value: {
        evidenceId: o.id,
        attribute: o.attribute,
        value: o.value,
        unit: o.unit,
        verification: o.verification,
        contentHash: o.contentHash,
      },
      source,
    });
    mapping.set(subject.id, o.id);
  }
  const evidenceIds: string[] = [];
  for (const [subject, id] of mapping) {
    const facts = world.view("facts").about(subject);
    const fact = facts.find((f) => f.predicate === "source-observation");
    if (!fact || (fact.value as { evidenceId?: string }).evidenceId !== id)
      throw new AppError("ENGINE_EVIDENCE_PROJECTION_MISMATCH", 502);
    evidenceIds.push(id);
  }
  if (evidenceIds.length !== observations.length)
    throw new AppError("ENGINE_EVIDENCE_PROJECTION_INCOMPLETE", 502);
  return {
    evidenceIds,
    engine: {
      name: "Meterless World Model",
      execution: "LOCAL_INTEGRATION" as const,
      storage: "reconstructed from immutable Postgres observations",
      namespace: "workspace-and-investigation-scoped",
      observations: observations.length,
      facts: evidenceIds.length,
      projectionSha256: hash(world.stateShapeCanonical()),
      runtimeExecution: false,
      source: "vendor/meterless-world-model/UPSTREAM.json",
    },
  };
}
