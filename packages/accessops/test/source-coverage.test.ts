import { test, expect } from "bun:test";
import { recordSchema, deterministicFindings, type Observation } from "../src";
function schema(sourceId: string, fields: string[]): Observation {
  return {
    ...recordSchema.parse({
      externalId: "schema:" + sourceId,
      buildingId: "reference-area",
      levelId: null,
      entityKind: "reference_area",
      entityName: "Public source coverage",
      entityExternalId: sourceId,
      namespace: sourceId,
      attribute: "source_schema",
      value: fields,
      observedAt: "2026-10-27T00:00:00Z",
      method: "Synthetic unit metadata; not a physical survey",
      locator: "unit:columns",
    }),
    id: "e-" + sourceId,
    entityId: "coverage",
    sourceId,
    snapshotId: "snapshot-" + sourceId,
    retrievedAt: "2026-10-27T00:00:00Z",
    contentHash: "unit",
    publisher: "Unit fixture",
    uri: "unit:" + sourceId,
    license: "Synthetic unit fixture",
    trust: 50,
    freshnessSeconds: 86400,
  };
}
test("UNIT: insufficient cross-source coverage is grounded in both independent schemas", () => {
  const result = deterministicFindings(
    [
      schema("zones", ["zone", "borough"]),
      schema("roads", ["segment_id", "way_id"]),
    ],
    null,
    new Date("2026-10-27T00:01:00Z"),
    { kind: "step-free" },
  );
  const finding = result.find((f) =>
    f.title.startsWith("Independent source coverage"),
  );
  expect(finding?.classification).toBe("deterministic");
  expect(finding?.evidenceIds).toEqual(["e-zones", "e-roads"]);
  expect(finding?.rationale).toContain("door_clear_width");
  expect(finding?.uncertainties).toContain(
    "Geographic reference records do not locate or survey a building",
  );
});
test("UNIT: one schema or sufficient combined fields cannot trigger a missing-coverage finding", () => {
  for (const evidence of [
    [schema("zones", ["zone"])],
    [
      schema("zones", ["door_clear_width", "lift_served_floors"]),
      schema("ops", ["operational_status"]),
    ],
  ])
    expect(
      deterministicFindings(evidence, null, new Date("2026-10-27T00:01:00Z"), {
        kind: "step-free",
      }).some((f) => f.title.startsWith("Independent source coverage")),
    ).toBe(false);
});
