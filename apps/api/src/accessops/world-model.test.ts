import { test, expect } from "bun:test";
import { recordSchema, type Observation } from "@accessops/domain";
import { projectEvidence } from "./world-model";
const observation: Observation = {
  ...recordSchema.parse({
    externalId: "source-row",
    buildingId: "building",
    levelId: null,
    entityKind: "lift",
    entityName: "Synthetic lift",
    namespace: "unit",
    attribute: "operational_status",
    value: "unavailable",
    unit: "none",
    observedAt: "2026-10-27T00:00:00Z",
    verification: "reported",
    method: "Unit fixture only",
    locator: "unit:row1",
  }),
  id: "evidence-1",
  entityId: "lift-1",
  sourceId: "operations",
  snapshotId: "snapshot-1",
  retrievedAt: "2026-10-27T00:00:00Z",
  contentHash: "unit-hash",
  publisher: "Unit fixture",
  uri: "unit:source",
  license: "Synthetic unit fixture",
  trust: 50,
  freshnessSeconds: 86400,
};
test("LOCAL_INTEGRATION: actual licensed engine projects persisted evidence without promoting verification or merging entities", async () => {
  const before = JSON.stringify(observation);
  const result = await projectEvidence("workspace-a", "run-1", [
    observation,
    {
      ...observation,
      id: "evidence-2",
      entityId: "lift-2",
      sourceId: "different-source",
    },
  ]);
  expect(result.evidenceIds).toEqual(["evidence-1", "evidence-2"]);
  expect(result.engine.name).toBe("Meterless World Model");
  expect(result.engine.facts).toBe(2);
  expect(result.engine.runtimeExecution).toBe(false);
  expect(JSON.stringify(observation)).toBe(before);
  expect(observation.verification).toBe("reported");
});
test("UNIT: engine refuses duplicate evidence and isolates projection namespaces", async () => {
  await expect(
    projectEvidence("w", "r", [observation, observation]),
  ).rejects.toThrow("ENGINE_EVIDENCE_BUDGET_OR_DUPLICATE");
  const a = await projectEvidence("workspace-a", "run", [observation]),
    b = await projectEvidence("workspace-b", "run", [observation]);
  expect(a.engine.projectionSha256).not.toBe(b.engine.projectionSha256);
});
