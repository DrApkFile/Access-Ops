import { z } from "zod";

export const id = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-zA-Z0-9_.:-]+$/);
export const instant = z.string().datetime({ offset: true });
export const entityKinds = [
  "building",
  "reference_area",
  "level",
  "room",
  "destination",
  "entrance",
  "door",
  "corridor",
  "stairs",
  "ramp",
  "lift",
  "toilet",
] as const;
export const entitySchema = z
  .object({
    id,
    buildingId: id,
    levelId: id.nullable(),
    kind: z.enum(entityKinds),
    name: z.string().min(1).max(200),
    aliases: z
      .array(
        z.object({
          namespace: z.string().min(1).max(100),
          externalId: z.string().min(1).max(200),
          confirmed: z.boolean(),
        }),
      )
      .max(100)
      .default([]),
  })
  .strict();
export type Entity = z.infer<typeof entitySchema>;
export const evidenceStates = [
  "verified",
  "reported",
  "stale",
  "conflicting",
  "unknown",
  "simulated",
] as const;
export const recordSchema = z
  .object({
    externalId: z.string().min(1).max(200),
    buildingId: id,
    levelId: id.nullable().default(null),
    entityKind: z.enum(entityKinds),
    entityName: z.string().min(1).max(200),
    entityExternalId: z.string().max(200).optional(),
    namespace: z.string().min(1).max(100),
    attribute: z.enum([
      "source_schema",
      "directory",
      "door_clear_width",
      "ramp_slope",
      "threshold_height",
      "lift_served_floors",
      "step_free",
      "accessible_toilet",
      "route_restriction",
      "operational_status",
      "relocation",
      "topology",
    ]),
    value: z.union([
      z.string().max(2000),
      z.number().finite(),
      z.boolean(),
      z.array(z.string().max(120)).max(100),
    ]),
    unit: z
      .enum(["mm", "cm", "m", "percent", "degrees", "none"])
      .default("none"),
    observedAt: instant,
    effectiveFrom: instant.optional(),
    effectiveTo: instant.optional(),
    lastVerifiedAt: instant.optional(),
    sourceTimezone: z.string().max(80).default("UTC"),
    verification: z
      .enum(["verified", "reported", "simulated"])
      .default("reported"),
    method: z.string().min(1).max(200),
    observer: z.string().max(200).optional(),
    locator: z.string().min(1).max(500),
    originalField: z.string().max(200).optional(),
    eventType: z
      .enum([
        "lift_outage",
        "entrance_closure",
        "maintenance_restriction",
        "route_closure",
        "restoration",
        "relocation",
      ])
      .optional(),
    reviewerId: id.optional(),
    reviewReason: z.string().max(1000).optional(),
  })
  .strict()
  .superRefine((r, c) => {
    if (
      r.effectiveFrom &&
      r.effectiveTo &&
      Date.parse(r.effectiveTo) <= Date.parse(r.effectiveFrom)
    )
      c.addIssue({
        code: "custom",
        message: "Effective end must follow start",
      });
    if (
      ["door_clear_width", "threshold_height"].includes(r.attribute) &&
      (typeof r.value !== "number" ||
        r.value < 0 ||
        !["mm", "cm", "m"].includes(r.unit))
    )
      c.addIssue({
        code: "custom",
        message:
          "Length requires a nonnegative numeric value and mm, cm or m unit",
      });
    if (
      r.attribute === "ramp_slope" &&
      (typeof r.value !== "number" ||
        r.value < 0 ||
        !["percent", "degrees"].includes(r.unit))
    )
      c.addIssue({
        code: "custom",
        message: "Slope requires numeric value and percent or degrees",
      });
    if (
      ["step_free", "accessible_toilet"].includes(r.attribute) &&
      typeof r.value !== "boolean"
    )
      c.addIssue({ code: "custom", message: "Boolean measurement required" });
    if (
      r.attribute === "operational_status" &&
      !["available", "unavailable", "restricted", "unknown"].includes(
        String(r.value),
      )
    )
      c.addIssue({ code: "custom", message: "Unsupported operational state" });
    if (r.attribute === "lift_served_floors" && !Array.isArray(r.value))
      c.addIssue({ code: "custom", message: "Served levels must be an array" });
  });
export type SourceRecord = z.infer<typeof recordSchema>;
export type Observation = SourceRecord & {
  id: string;
  sourceId: string;
  snapshotId: string;
  identityMatch?: {
    state: string;
    entityId: string | null;
    candidates: string[];
    reason: string;
  };
  retrievedAt: string;
  contentHash: string;
  entityId: string | null;
  publisher: string;
  uri: string;
  license: string;
  trust: number;
  freshnessSeconds: number;
  sourceContentHash?: string;
  ingestionRunId?: string;
  sourceRefreshError?: string;
  lastSuccessfulSyncAt?: string;
  demo?: boolean;
  reviewDecision?: {
    id: string;
    reviewedAt: string;
    selectedId: string;
    evidenceIds: string[];
    reason: string;
  };
};
export const sourceSchema = z
  .object({
    buildingId: id,
    name: z.string().min(1).max(200),
    kind: z.enum(["csv", "json", "mbta", "zetaris"]),
    namespace: z.string().min(1).max(100),
    publisher: z.string().min(1).max(200),
    uri: z.string().max(1000),
    license: z.string().min(1).max(2000),
    trust: z.number().int().min(0).max(100).default(50),
    freshnessSeconds: z.number().int().min(60).max(31536000).default(86400),
    demo: z.boolean().default(false),
    config: z.record(z.string(), z.unknown()).default({}),
  })
  .strict();
export type Source = z.infer<typeof sourceSchema>;
export const graphSchema = z
  .object({
    buildingId: id,
    complete: z.boolean().default(false),
    reviewed: z.boolean(),
    reviewerId: id.optional(),
    reviewReason: z.string().max(1000).optional(),
    evidenceIds: z.array(id).max(1000),
    nodes: z
      .array(
        z
          .object({
            id,
            entityId: id,
            levelId: id,
            entry: z.boolean().default(false),
            destination: z.boolean().default(false),
          })
          .strict(),
      )
      .min(1)
      .max(2000),
    edges: z
      .array(
        z
          .object({
            id,
            from: id,
            to: id,
            kind: z.enum(["walkway", "door", "stairs", "ramp", "lift"]),
            entityId: id,
            reviewed: z.boolean(),
            bidirectional: z.boolean().default(true),
            stepFree: z.boolean().nullable(),
            evidenceIds: z.array(id).max(100),
            measurementEvidenceIds: z.array(id).max(100).default([]),
          })
          .strict(),
      )
      .max(5000),
  })
  .strict();
export type Graph = z.infer<typeof graphSchema>;
export const profileSchema = z
  .object({
    kind: z.enum(["step-free", "pedestrian"]),
    minimumDoorWidthMm: z.number().positive().max(3000).optional(),
    maximumRampSlopePercent: z.number().positive().max(100).optional(),
    maximumThresholdMm: z.number().nonnegative().max(500).optional(),
  })
  .strict();
export type Profile = z.infer<typeof profileSchema>;
export const scenarioSchema = z
  .object({
    changes: z
      .array(
        z.discriminatedUnion("kind", [
          z.object({ kind: z.literal("close"), entityId: id }),
          z.object({ kind: z.literal("reopen"), entityId: id }),
          z.object({
            kind: z.literal("relocate"),
            destinationId: id,
            toNodeId: id,
          }),
        ]),
      )
      .min(1)
      .max(100),
    reason: z.string().min(1).max(1000),
  })
  .strict();
export type Scenario = z.infer<typeof scenarioSchema>;
export type Finding = {
  id: string;
  title: string;
  entityId: string | null;
  severity: "high" | "medium" | "information";
  rationale: string;
  classification:
    | "reported"
    | "deterministic"
    | "simulated"
    | "unknown"
    | "conflicting";
  evidenceIds: string[];
  recommendation: string;
  uncertainties: string[];
  status: "open";
};
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(stableJson).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => JSON.stringify(k) + ":" + stableJson(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
