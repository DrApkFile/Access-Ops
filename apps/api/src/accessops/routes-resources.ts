import { Hono } from "hono";
import { and, desc, eq, sql, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  entitySchema,
  sourceSchema,
  graphSchema,
  validateGraph,
  recordSchema,
} from "@accessops/domain";
import { db } from "../db";
import * as t from "./schema";
import { requirePermission, audit, type Env } from "./auth";
import {
  getBuilding,
  getEntity,
  getEntities,
  getSource,
  getObservations,
  latestGraph,
  allowedBuildingIds,
  authorizeProject,
} from "./store";
import { AppError } from "./errors";
import { previewImport, previewPayload } from "./imports";
import { ingest } from "./ingestion";
import { enqueue } from "./jobs";
import { mbtaConfig } from "./connectors";
export const resources = new Hono<Env>();
function bounds(query: Record<string, string>) {
  return z
    .object({
      limit: z.coerce.number().int().min(1).max(200).default(50),
      offset: z.coerce.number().int().min(0).max(10000).default(0),
    })
    .parse(query);
}
resources.get("/buildings", async (c) => {
  const p = c.get("principal"),
    b = bounds(c.req.query());
  return c.json({
    items: await db
      .select()
      .from(t.buildings)
      .where(
        and(
          eq(t.buildings.workspaceId, p.workspaceId),
          inArray(t.buildings.id, await allowedBuildingIds(p)),
        ),
      )
      .orderBy(t.buildings.id)
      .limit(b.limit)
      .offset(b.offset),
  });
});
resources.post("/buildings", requirePermission("operate"), async (c) => {
  const p = c.get("principal"),
    body = z
      .object({
        name: z.string().min(1).max(200),
        category: z.enum(["building", "reference_area"]).default("building"),
        aliases: z.array(z.string().max(200)).max(100).default([]),
      })
      .strict()
      .parse(await c.req.json());
  const id = Bun.randomUUIDv7();
  await db.transaction(async (tx) => {
    await tx
      .insert(t.buildings)
      .values({ id, workspaceId: p.workspaceId, ...body });
    await tx.insert(t.buildingGrants).values({
      workspaceId: p.workspaceId,
      buildingId: id,
      userId: p.userId,
      permission: "manage",
    });
  });
  await audit(p, "building.created", id);
  return c.json({ id }, 201);
});
resources.get("/buildings/:id", async (c) =>
  c.json(await getBuilding(c.get("principal"), c.req.param("id"))),
);
resources.get("/buildings/:id/levels", async (c) => {
  const p = c.get("principal");
  await getBuilding(p, c.req.param("id"));
  return c.json({
    items: await db
      .select()
      .from(t.levels)
      .where(
        and(
          eq(t.levels.workspaceId, p.workspaceId),
          eq(t.levels.buildingId, c.req.param("id")),
        ),
      )
      .limit(200),
  });
});
resources.post(
  "/buildings/:id/levels",
  requirePermission("review"),
  async (c) => {
    const p = c.get("principal");
    await getBuilding(p, c.req.param("id"));
    const body = z
      .object({
        name: z.string().min(1).max(200),
        ordinal: z.number().int().min(-100).max(1000),
      })
      .strict()
      .parse(await c.req.json());
    const id = Bun.randomUUIDv7();
    await db.insert(t.levels).values({
      id,
      workspaceId: p.workspaceId,
      buildingId: c.req.param("id"),
      ...body,
    });
    await audit(p, "level.created", id);
    return c.json({ id }, 201);
  },
);
resources.get("/buildings/:id/entities", async (c) =>
  c.json({ items: await getEntities(c.get("principal"), c.req.param("id")) }),
);
resources.post("/entities", requirePermission("review"), async (c) => {
  const p = c.get("principal");
  const body = entitySchema.omit({ id: true }).parse(await c.req.json());
  await getBuilding(p, body.buildingId);
  if (body.levelId) {
    const level = await db.query.levels.findFirst({
      where: and(
        eq(t.levels.id, body.levelId),
        eq(t.levels.workspaceId, p.workspaceId),
        eq(t.levels.buildingId, body.buildingId),
      ),
    });
    if (!level) throw new AppError("LEVEL_NOT_FOUND", 404);
  }
  const id = Bun.randomUUIDv7();
  await db
    .insert(t.entities)
    .values({ id, workspaceId: p.workspaceId, ...body });
  await audit(p, "entity.created", id);
  return c.json({ id }, 201);
});
resources.get("/sources", async (c) => {
  const p = c.get("principal"),
    buildingId = z.string().min(1).parse(c.req.query("buildingId"));
  await getBuilding(p, buildingId);
  const now = Date.now();
  const items = await db
    .select()
    .from(t.sources)
    .where(
      and(
        eq(t.sources.workspaceId, p.workspaceId),
        eq(t.sources.buildingId, buildingId),
      ),
    )
    .limit(200);
  return c.json({
    items: items.map((s) => ({
      ...s,
      refreshState: s.lastError
        ? "failed"
        : !s.lastSuccessAt
          ? "never"
          : now - s.lastSuccessAt.getTime() > s.freshnessSeconds * 1000
            ? "stale"
            : "current",
    })),
  });
});
resources.post("/sources", requirePermission("sources"), async (c) => {
  const p = c.get("principal");
  const body = sourceSchema.parse(await c.req.json());
  await getBuilding(p, body.buildingId);
  if (body.kind === "mbta") mbtaConfig.parse(body.config);
  else if (Object.keys(body.config).length)
    throw new AppError("UNSUPPORTED_SOURCE_CONFIG", 422);
  if (
    Object.keys(body.config).some((k) => /secret|password|token|key/i.test(k))
  )
    throw new AppError("SERVER_SECRET_REFERENCE_ONLY", 422);
  const id = Bun.randomUUIDv7();
  await db
    .insert(t.sources)
    .values({ id, workspaceId: p.workspaceId, ...body });
  await audit(p, "source.created", id, { kind: body.kind });
  return c.json({ id }, 201);
});
const importSchema = z
  .object({
    format: z.enum(["csv", "json"]),
    content: z.string().max(2 * 1024 * 1024),
    mapping: z.record(z.string(), z.string()).default({}),
    previewHash: z.string().optional(),
    allowPartial: z.boolean().default(false),
    rawSource: z
      .object({
        content: z.string().max(2 * 1024 * 1024),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .strict()
      .optional(),
  })
  .strict();
resources.post(
  "/sources/:id/preview",
  requirePermission("sources"),
  async (c) => {
    await getSource(c.get("principal"), c.req.param("id"));
    const b = importSchema.parse(await c.req.json());
    return c.json(previewPayload(b));
  },
);
resources.post(
  "/sources/:id/import",
  requirePermission("sources"),
  async (c) => {
    const p = c.get("principal");
    await getSource(p, c.req.param("id"));
    const b = importSchema.parse(await c.req.json());
    const preview = previewPayload(b);
    if (!b.previewHash || b.previewHash !== preview.previewHash)
      throw new AppError("PREVIEW_CONFIRMATION_REQUIRED", 409);
    if (preview.errors.length && !b.allowPartial)
      return c.json({ error: "IMPORT_HAS_REJECTED_ROWS", ...preview }, 422);
    const result = await ingest(
      p,
      c.req.param("id"),
      preview.accepted,
      new Date(),
      preview.errors,
      {
        content: b.rawSource?.content ?? b.content,
        format: b.rawSource ? "external-query-json" : b.format,
      },
    );
    return c.json(result, 201);
  },
);
resources.get("/sources/:id/runs", async (c) => {
  const p = c.get("principal");
  await getSource(p, c.req.param("id"));
  const b = bounds(c.req.query());
  return c.json({
    items: await db
      .select()
      .from(t.ingestionRuns)
      .where(
        and(
          eq(t.ingestionRuns.workspaceId, p.workspaceId),
          eq(t.ingestionRuns.sourceId, c.req.param("id")),
        ),
      )
      .orderBy(desc(t.ingestionRuns.createdAt))
      .limit(b.limit)
      .offset(b.offset),
  });
});
resources.post(
  "/sources/:id/refresh",
  requirePermission("sources"),
  async (c) => {
    const p = c.get("principal"),
      s = await getSource(p, c.req.param("id"));
    if (s.kind !== "mbta")
      throw new AppError("SOURCE_REQUIRES_FILE_IMPORT", 422);
    const key = c.req.header("idempotency-key");
    if (!key || key.length > 120)
      throw new AppError("IDEMPOTENCY_KEY_REQUIRED", 422);
    const job = await enqueue(p, "sync", "sync:" + s.id + ":" + key, {
      sourceId: s.id,
    });
    return c.json({ jobId: job!.id, status: job!.status }, 202);
  },
);
resources.get("/observations", async (c) => {
  const p = c.get("principal"),
    buildingId = z.string().parse(c.req.query("buildingId")),
    b = bounds(c.req.query());
  const rows = await getObservations(p, buildingId);
  return c.json({
    items: rows.slice(b.offset, b.offset + b.limit),
    total: rows.length,
  });
});
resources.get("/evidence/:id", async (c) => {
  const p = c.get("principal");
  const row = await db.query.observations.findFirst({
    where: and(
      eq(t.observations.id, c.req.param("id")),
      eq(t.observations.workspaceId, p.workspaceId),
    ),
  });
  if (!row) throw new AppError("NOT_FOUND", 404);
  const s = await getSource(p, row.sourceId);
  const evidence = (await getObservations(p, s.buildingId)).find(
    (o) => o.id === row.id,
  );
  return c.json(evidence!);
});
resources.get("/buildings/:id/matches", async (c) => {
  const p = c.get("principal");
  await getBuilding(p, c.req.param("id"));
  const observations = await getObservations(p, c.req.param("id"));
  return c.json({
    items: observations
      .filter((o) => !o.entityId)
      .map((o) => ({
        id: o.id,
        identityMatch: o.identityMatch,
        externalId: o.externalId,
        name: o.entityName,
        levelId: o.levelId,
      })),
  });
});
resources.post(
  "/matches/:id/confirm",
  requirePermission("review"),
  async (c) => {
    const p = c.get("principal"),
      body = z
        .object({ entityId: z.string(), reason: z.string().min(8).max(1000) })
        .strict()
        .parse(await c.req.json());
    const row = await db.query.observations.findFirst({
      where: and(
        eq(t.observations.id, c.req.param("id")),
        eq(t.observations.workspaceId, p.workspaceId),
      ),
    });
    if (!row) throw new AppError("NOT_FOUND", 404);
    const source = await getSource(p, row.sourceId),
      entity = await getEntity(p, body.entityId),
      r = recordSchema.parse(row.record);
    if (
      entity.buildingId !== source.buildingId ||
      entity.kind !== r.entityKind ||
      (r.levelId && entity.levelId !== r.levelId)
    )
      throw new AppError("MATCH_CONTEXT_CONFLICT", 422);
    const id = Bun.randomUUIDv7();
    await db.transaction(async (tx) => {
      await tx.insert(t.matchDecisions).values({
        id,
        workspaceId: p.workspaceId,
        observationId: row.id,
        entityId: entity.id,
        reviewerId: p.userId,
        reason: body.reason,
      });
      if (r.entityExternalId) {
        await tx.execute(
          sql`select id from ao_entities where id=${entity.id} for update`,
        );
        const fresh = await tx.query.entities.findFirst({
          where: eq(t.entities.id, entity.id),
        });
        const aliases = entitySchema.shape.aliases.parse(fresh!.aliases);
        if (
          !aliases.some(
            (a) =>
              a.namespace === r.namespace &&
              a.externalId === r.entityExternalId,
          )
        ) {
          aliases.push({
            namespace: r.namespace,
            externalId: r.entityExternalId,
            confirmed: true,
          });
          await tx
            .update(t.entities)
            .set({ aliases })
            .where(eq(t.entities.id, entity.id));
        }
      }
    });
    await audit(p, "match.confirmed", row.id, {
      decisionId: id,
      entityId: entity.id,
    });
    return c.json({ id }, 201);
  },
);
resources.get("/buildings/:id/graph", async (c) => {
  const row = await latestGraph(c.get("principal"), c.req.param("id"));
  if (!row) throw new AppError("NOT_FOUND", 404);
  return c.json(row);
});
resources.post("/graphs/validate", requirePermission("review"), async (c) => {
  const p = c.get("principal"),
    graph = graphSchema.parse(await c.req.json());
  const entities = await getEntities(p, graph.buildingId),
    evidence = await getObservations(p, graph.buildingId);
  const errors = validateGraph(
    graph,
    new Set(entities.map((e) => e.id)),
    new Set(evidence.map((e) => e.id)),
    entities,
  );
  return c.json({ valid: errors.length === 0, errors });
});
resources.post("/graphs", requirePermission("review"), async (c) => {
  const p = c.get("principal"),
    graph = graphSchema.parse(await c.req.json());
  if (graph.reviewerId !== p.userId)
    throw new AppError("REVIEWER_ID_MISMATCH", 403);
  const entities = await getEntities(p, graph.buildingId),
    observations = await getObservations(p, graph.buildingId);
  const errors = validateGraph(
    graph,
    new Set(entities.map((e) => e.id)),
    new Set(observations.map((e) => e.id)),
    entities,
  );
  if (errors.length)
    return c.json({ error: "INVALID_GRAPH", issues: errors }, 422);
  const row = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ao_buildings where id=${graph.buildingId} for update`,
    );
    const latest = await tx.query.graphs.findFirst({
      where: and(
        eq(t.graphs.workspaceId, p.workspaceId),
        eq(t.graphs.buildingId, graph.buildingId),
      ),
      orderBy: desc(t.graphs.version),
    });
    const id = Bun.randomUUIDv7(),
      version = (latest?.version ?? 0) + 1;
    await tx.insert(t.graphs).values({
      id,
      workspaceId: p.workspaceId,
      buildingId: graph.buildingId,
      version,
      graph,
      reviewerId: p.userId,
    });
    return { id, version };
  });
  await audit(p, "graph.reviewed", row.id, { version: row.version });
  return c.json(row, 201);
});
resources.post(
  "/buildings/:id/plans",
  requirePermission("review"),
  async (c) => {
    const p = c.get("principal"),
      buildingId = c.req.param("id");
    await getBuilding(p, buildingId);
    const body = z
      .object({
        projectId: z.string(),
        levelId: z.string(),
        modelVersion: z.number().int().positive(),
        reason: z.string().min(12).max(1000),
      })
      .strict()
      .parse(await c.req.json());
    await authorizeProject(p, body.projectId);
    const { projects, floorModels } = await import("../db/schema");
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, body.projectId),
        eq(projects.workspaceId, p.workspaceId),
      ),
    });
    const level = await db.query.levels.findFirst({
      where: and(
        eq(t.levels.id, body.levelId),
        eq(t.levels.workspaceId, p.workspaceId),
        eq(t.levels.buildingId, buildingId),
      ),
    });
    const model = project
      ? await db.query.floorModels.findFirst({
          where: and(
            eq(floorModels.projectId, project.id),
            eq(floorModels.version, body.modelVersion),
          ),
        })
      : null;
    if (!project || !level || !model)
      throw new AppError("PLAN_CONTEXT_NOT_FOUND", 404);
    const id = Bun.randomUUIDv7();
    await db.insert(t.floorPlanLinks).values({
      id,
      workspaceId: p.workspaceId,
      buildingId,
      ...body,
      reviewerId: p.userId,
    });
    await audit(p, "plan.linked", id, {
      projectId: project.id,
      modelVersion: body.modelVersion,
    });
    return c.json({ id }, 201);
  },
);
resources.get("/buildings/:id/plans", async (c) => {
  const p = c.get("principal");
  await getBuilding(p, c.req.param("id"));
  return c.json({
    items: await db
      .select()
      .from(t.floorPlanLinks)
      .where(
        and(
          eq(t.floorPlanLinks.workspaceId, p.workspaceId),
          eq(t.floorPlanLinks.buildingId, c.req.param("id")),
        ),
      )
      .limit(200),
  });
});
resources.post(
  "/sources/:id/import-jobs",
  requirePermission("sources"),
  async (c) => {
    const p = c.get("principal"),
      b = importSchema.parse(await c.req.json());
    await getSource(p, c.req.param("id"));
    const preview = previewPayload(b);
    if (b.previewHash !== preview.previewHash)
      throw new AppError("PREVIEW_CONFIRMATION_REQUIRED", 409);
    if (preview.errors.length && !b.allowPartial)
      throw new AppError("IMPORT_HAS_REJECTED_ROWS", 422);
    const job = await enqueue(
      p,
      "import",
      "import:" + c.req.param("id") + ":" + preview.previewHash,
      {
        sourceId: c.req.param("id"),
        records: preview.accepted,
        rejections: preview.errors,
        raw: {
          content: b.rawSource?.content ?? b.content,
          format: b.rawSource ? "external-query-json" : b.format,
        },
      },
    );
    return c.json({ jobId: job!.id, status: job!.status }, 202);
  },
);

resources.get("/sources/:id/snapshots", async (c) => {
  const p = c.get("principal");
  await getSource(p, c.req.param("id"));
  return c.json({
    items: await db
      .select({
        id: t.snapshots.id,
        hash: t.snapshots.hash,
        recordCount: t.snapshots.recordCount,
        retrievedAt: t.snapshots.retrievedAt,
        rawFormat: t.snapshots.rawFormat,
      })
      .from(t.snapshots)
      .where(
        and(
          eq(t.snapshots.workspaceId, p.workspaceId),
          eq(t.snapshots.sourceId, c.req.param("id")),
        ),
      )
      .orderBy(desc(t.snapshots.createdAt))
      .limit(100),
  });
});
resources.get(
  "/sources/:id/snapshots/:snapshotId",
  requirePermission("sources"),
  async (c) => {
    const p = c.get("principal");
    await getSource(p, c.req.param("id"));
    const row = await db.query.snapshots.findFirst({
      where: and(
        eq(t.snapshots.id, c.req.param("snapshotId")),
        eq(t.snapshots.sourceId, c.req.param("id")),
        eq(t.snapshots.workspaceId, p.workspaceId),
      ),
    });
    if (!row) throw new AppError("NOT_FOUND", 404);
    return c.json(row);
  },
);

const measurementAttributes = new Set([
  "door_clear_width",
  "ramp_slope",
  "threshold_height",
  "lift_served_floors",
  "step_free",
  "accessible_toilet",
  "route_restriction",
]);
for (const kind of ["measurements", "events"] as const) {
  resources.get("/" + kind, async (c) => {
    const buildingId = z.string().min(1).parse(c.req.query("buildingId")),
      b = bounds(c.req.query());
    const rows = (await getObservations(c.get("principal"), buildingId)).filter(
      (o) =>
        kind === "measurements"
          ? measurementAttributes.has(o.attribute)
          : !!o.eventType,
    );
    return c.json({
      items: rows.slice(b.offset, b.offset + b.limit),
      total: rows.length,
    });
  });
  resources.post("/" + kind, requirePermission("sources"), async (c) => {
    const p = c.get("principal"),
      body = z
        .object({ sourceId: z.string(), record: recordSchema })
        .strict()
        .parse(await c.req.json());
    if (
      kind === "measurements"
        ? !measurementAttributes.has(body.record.attribute)
        : !body.record.eventType
    )
      throw new AppError("RECORD_KIND_MISMATCH", 422);
    return c.json(
      await ingest(p, body.sourceId, [body.record], new Date(), [], {
        content: JSON.stringify(body.record),
        format: "json",
      }),
      201,
    );
  });
}
resources.post("/sources/:id/test", requirePermission("sources"), async (c) => {
  const p = c.get("principal"),
    source = await getSource(p, c.req.param("id"));
  if (source.kind === "mbta") {
    const { fetchMbta } = await import("./connectors");
    const result = await fetchMbta(source);
    return c.json({
      connection: "live_public_fetch",
      records: result.records.length,
      pages: result.pages,
      persisted: false,
    });
  }
  if (source.kind === "zetaris") {
    if (process.env.ZETARIS_WORKSPACE_ID !== p.workspaceId)
      throw new AppError("ZETARIS_WORKSPACE_NOT_CONFIGURED", 503);
    const { configuredGateway } = await import("../providers/zetaris-gateway");
    const result = await configuredGateway().read(
      "SELECT 1 AS connection_check",
      5,
    );
    return c.json({
      connection: "live_authenticated_query",
      proof: "connection_only",
      rows: result.rows.length,
      persisted: false,
    });
  }
  return c.json({
    connection: "local_file_import",
    externalServiceRequired: false,
  });
});
resources.post(
  "/observations/:id/verify",
  requirePermission("review"),
  async (c) => {
    const p = c.get("principal"),
      body = z
        .object({
          reason: z.string().min(12).max(1000),
          method: z.string().min(8).max(200),
        })
        .strict()
        .parse(await c.req.json());
    const observation = await db.query.observations.findFirst({
      where: and(
        eq(t.observations.id, c.req.param("id")),
        eq(t.observations.workspaceId, p.workspaceId),
      ),
    });
    if (!observation) throw new AppError("NOT_FOUND", 404);
    await getSource(p, observation.sourceId);
    const original = recordSchema.parse(observation.record);
    if (original.verification === "simulated")
      throw new AppError("SIMULATION_REQUIRES_REAL_SOURCE_OBSERVATION", 422);
    const record = recordSchema.parse({
      ...original,
      verification: "verified",
      lastVerifiedAt: new Date().toISOString(),
      reviewerId: p.userId,
      reviewReason: body.reason,
      method: body.method,
    });
    const result = await ingest(
      p,
      observation.sourceId,
      [record],
      new Date(),
      [],
      {
        content: JSON.stringify({
          reviewedObservationId: observation.id,
          record,
        }),
        format: "review-verification",
      },
    );
    await audit(p, "observation.verified", observation.id, {
      runId: result.runId,
      reason: body.reason,
    });
    return c.json(result, 201);
  },
);
