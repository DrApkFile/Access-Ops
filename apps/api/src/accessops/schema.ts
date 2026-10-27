import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  uniqueIndex,
  index,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
const created = () =>
  timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
export const organizations = pgTable("ao_organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: created(),
});
export const workspaces = pgTable("ao_workspaces", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  createdAt: created(),
});
export const users = pgTable("ao_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  disabled: boolean("disabled").notNull().default(false),
  createdAt: created(),
});
export const memberships = pgTable(
  "ao_memberships",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    role: text("role").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.userId] }),
    check(
      "ao_member_role",
      sql`${t.role} in ('viewer','operator','reviewer','source_admin','admin')`,
    ),
  ],
);
export const sessions = pgTable("ao_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: created(),
});
const scope = () => ({
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspaces.id),
  createdAt: created(),
});
export const buildings = pgTable("ao_buildings", {
  ...scope(),
  name: text("name").notNull(),
  category: text("category").notNull().default("building"),
  aliases: jsonb("aliases").notNull().default([]),
});
export const levels = pgTable(
  "ao_levels",
  {
    ...scope(),
    buildingId: text("building_id")
      .notNull()
      .references(() => buildings.id),
    name: text("name").notNull(),
    ordinal: integer("ordinal").notNull(),
  },
  (t) => [
    uniqueIndex("ao_level_number").on(t.workspaceId, t.buildingId, t.ordinal),
  ],
);
export const entities = pgTable(
  "ao_entities",
  {
    ...scope(),
    buildingId: text("building_id")
      .notNull()
      .references(() => buildings.id),
    levelId: text("level_id").references(() => levels.id),
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    aliases: jsonb("aliases").notNull().default([]),
  },
  (t) => [
    index("ao_entity_context").on(t.workspaceId, t.buildingId, t.levelId),
  ],
);
export const sources = pgTable(
  "ao_sources",
  {
    ...scope(),
    buildingId: text("building_id")
      .notNull()
      .references(() => buildings.id),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    namespace: text("namespace").notNull(),
    publisher: text("publisher").notNull(),
    uri: text("uri").notNull(),
    license: text("license").notNull(),
    trust: integer("trust").notNull(),
    freshnessSeconds: integer("freshness_seconds").notNull(),
    demo: boolean("demo").notNull().default(false),
    config: jsonb("config").notNull().default({}),
    lastSuccessAt: timestamp("last_success_at", { withTimezone: true }),
    lastError: text("last_error"),
  },
  (t) => [
    uniqueIndex("ao_source_namespace").on(
      t.workspaceId,
      t.buildingId,
      t.namespace,
    ),
  ],
);
export const ingestionRuns = pgTable("ao_ingestion_runs", {
  ...scope(),
  sourceId: text("source_id")
    .notNull()
    .references(() => sources.id),
  status: text("status").notNull(),
  summary: jsonb("summary").notNull().default({}),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
export const snapshots = pgTable(
  "ao_snapshots",
  {
    ...scope(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    runId: text("run_id")
      .notNull()
      .references(() => ingestionRuns.id),
    hash: text("hash").notNull(),
    rawContent: text("raw_content"),
    rawFormat: text("raw_format"),
    recordCount: integer("record_count").notNull(),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("ao_snapshot_content").on(t.workspaceId, t.sourceId, t.hash),
  ],
);
export const observations = pgTable(
  "ao_observations",
  {
    ...scope(),
    sourceId: text("source_id")
      .notNull()
      .references(() => sources.id),
    snapshotId: text("snapshot_id")
      .notNull()
      .references(() => snapshots.id),
    entityId: text("entity_id").references(() => entities.id),
    externalId: text("external_id").notNull(),
    hash: text("hash").notNull(),
    record: jsonb("record").notNull(),
    match: jsonb("match").notNull(),
  },
  (t) => [
    uniqueIndex("ao_observation_once").on(t.workspaceId, t.sourceId, t.hash),
    index("ao_observation_entity").on(t.workspaceId, t.entityId),
  ],
);
export const matchDecisions = pgTable("ao_match_decisions", {
  ...scope(),
  observationId: text("observation_id")
    .notNull()
    .references(() => observations.id),
  entityId: text("entity_id")
    .notNull()
    .references(() => entities.id),
  reviewerId: text("reviewer_id")
    .notNull()
    .references(() => users.id),
  reason: text("reason").notNull(),
});
export const resolutions = pgTable("ao_resolutions", {
  ...scope(),
  entityId: text("entity_id")
    .notNull()
    .references(() => entities.id),
  attribute: text("attribute").notNull(),
  decision: jsonb("decision").notNull().default({}),
  evidenceIds: jsonb("evidence_ids").notNull(),
  reason: text("reason").notNull(),
  reviewerId: text("reviewer_id")
    .notNull()
    .references(() => users.id),
});
export const graphs = pgTable(
  "ao_graphs",
  {
    ...scope(),
    buildingId: text("building_id")
      .notNull()
      .references(() => buildings.id),
    version: integer("version").notNull(),
    graph: jsonb("graph").notNull(),
    reviewerId: text("reviewer_id")
      .notNull()
      .references(() => users.id),
  },
  (t) => [
    uniqueIndex("ao_graph_version").on(t.workspaceId, t.buildingId, t.version),
  ],
);
export const investigations = pgTable("ao_investigations", {
  ...scope(),
  buildingId: text("building_id")
    .notNull()
    .references(() => buildings.id),
  question: text("question").notNull(),
  asOf: timestamp("as_of", { withTimezone: true }).notNull(),
  status: text("status").notNull(),
  result: jsonb("result"),
  error: text("error"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  previousId: text("previous_id"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
export const findings = pgTable("ao_findings", {
  ...scope(),
  investigationId: text("investigation_id")
    .notNull()
    .references(() => investigations.id),
  entityId: text("entity_id").references(() => entities.id),
  finding: jsonb("finding").notNull(),
});
export const actions = pgTable("ao_actions", {
  ...scope(),
  findingId: text("finding_id")
    .notNull()
    .references(() => findings.id),
  ownerId: text("owner_id").references(() => users.id),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("proposed"),
  proposal: text("proposal").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  approvedBy: text("approved_by").references(() => users.id),
  resolution: jsonb("resolution"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const scenarios = pgTable("ao_scenarios", {
  ...scope(),
  buildingId: text("building_id")
    .notNull()
    .references(() => buildings.id),
  graphId: text("graph_id")
    .notNull()
    .references(() => graphs.id),
  definition: jsonb("definition").notNull(),
  result: jsonb("result").notNull(),
  evidence: jsonb("evidence").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
});
export const providerRuns = pgTable("ao_provider_runs", {
  ...scope(),
  investigationId: text("investigation_id").references(() => investigations.id),
  provider: text("provider").notNull(),
  model: text("model"),
  status: text("status").notNull(),
  metadata: jsonb("metadata").notNull(),
});
export const auditEvents = pgTable(
  "ao_audit_events",
  {
    ...scope(),
    actorId: text("actor_id").notNull(),
    action: text("action").notNull(),
    targetId: text("target_id").notNull(),
    metadata: jsonb("metadata").notNull().default({}),
  },
  (t) => [index("ao_audit_workspace").on(t.workspaceId, t.createdAt)],
);
export const jobs = pgTable(
  "ao_jobs",
  {
    ...scope(),
    kind: text("kind").notNull(),
    key: text("key").notNull(),
    payload: jsonb("payload").notNull(),
    status: text("status").notNull().default("queued"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    runAfter: timestamp("run_after", { withTimezone: true })
      .notNull()
      .defaultNow(),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    leaseOwner: text("lease_owner"),
    error: text("error"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("ao_job_idempotency").on(t.workspaceId, t.key),
    index("ao_job_claim").on(t.status, t.runAfter),
  ],
);
export const rateLimits = pgTable("ao_rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamp("reset_at", { withTimezone: true }).notNull(),
});
export const floorPlanLinks = pgTable("ao_floor_plan_links", {
  ...scope(),
  buildingId: text("building_id")
    .notNull()
    .references(() => buildings.id),
  levelId: text("level_id")
    .notNull()
    .references(() => levels.id),
  projectId: text("project_id").notNull(),
  modelVersion: integer("model_version").notNull(),
  reviewerId: text("reviewer_id")
    .notNull()
    .references(() => users.id),
  reason: text("reason").notNull(),
});
export const workers = pgTable("ao_workers", {
  id: text("id").primaryKey(),
  heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }).notNull(),
});
export const buildingGrants = pgTable(
  "ao_building_grants",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    buildingId: text("building_id")
      .notNull()
      .references(() => buildings.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    permission: text("permission").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.buildingId, t.userId] }),
    check(
      "ao_building_grant_permission",
      sql`${t.permission} in ('read','write','review','manage')`,
    ),
  ],
);
export const projectGrants = pgTable(
  "ao_project_grants",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id),
    projectId: text("project_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    permission: text("permission").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.projectId, t.userId] }),
    check(
      "ao_project_grant_permission",
      sql`${t.permission} in ('read','write','review','manage')`,
    ),
  ],
);
