import {selectedVisionReadiness} from '../providers/vision-selection'
import { Hono } from 'hono'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import * as t from './schema'
import { requirePermission, audit, type Env } from './auth'
import { AppError } from './errors'
import { getEntity, getObservations, getBuilding } from './store'
import { stateAt } from '@accessops/domain'
import {
  configuredProvider,
  inspectProvider,
  explanationPolicy,
  discover,
} from '../providers/explanation'
import { zetarisForWorkspace, registrationPlan } from '../providers/zetaris'
import { metrics } from './middleware'
export const adminRoutes = new Hono<Env>()
adminRoutes.post('/users', requirePermission('admin'), async (c) => {
  const p = c.get('principal'),
    b = z
      .object({
        email: z.string().email().max(254),
        password: z.string().min(14).max(256),
        role: z.enum([
          'viewer',
          'operator',
          'reviewer',
          'source_admin',
          'admin',
        ]),
      })
      .strict()
      .parse(await c.req.json())
  const id = Bun.randomUUIDv7()
  await db.transaction(async (tx) => {
    await tx.insert(t.users).values({
      id,
      email: b.email.toLowerCase(),
      passwordHash: await Bun.password.hash(b.password, {
        algorithm: 'argon2id',
        memoryCost: 19456,
        timeCost: 2,
      }),
    })
    await tx
      .insert(t.memberships)
      .values({ workspaceId: p.workspaceId, userId: id, role: b.role })
  })
  await audit(p, 'user.created', id, { role: b.role })
  return c.json({ id }, 201)
})
adminRoutes.get('/users', async (c) => {
  const p = c.get('principal')
  const rows = await db
    .select({ id: t.users.id, email: t.users.email, role: t.memberships.role })
    .from(t.memberships)
    .innerJoin(t.users, eq(t.users.id, t.memberships.userId))
    .where(eq(t.memberships.workspaceId, p.workspaceId))
    .limit(200)
  return c.json({ items: rows })
})
adminRoutes.get('/audit-events', requirePermission('admin'), async (c) => {
  const rows = await db
    .select()
    .from(t.auditEvents)
    .where(eq(t.auditEvents.workspaceId, c.get('principal').workspaceId))
    .orderBy(sql`${t.auditEvents.createdAt} desc`)
    .limit(100)
  return c.json({ items: rows })
})
adminRoutes.get('/metrics', requirePermission('admin'), async (c) => {
  const w = c.get('principal').workspaceId
  const completion =
    await db.$client`select status,count(*)::int as count from ao_investigations where workspace_id=${w} group by status`
  const actions =
    await db.$client`select status,count(*)::int as count from ao_actions where workspace_id=${w} group by status`
  const ingestion =
    await db.$client`select status,count(*)::int as count from ao_ingestion_runs where workspace_id=${w} group by status`
  return c.json({
    processMetrics: metrics,
    workspace: { investigations: completion, actions, ingestion },
  })
})
adminRoutes.get('/providers', requirePermission('sources'), async (c) => {
  const states = []
  for (const name of ['meterless', 'nvidia'] as const) {
    const inspected = inspectProvider(name),
      config = inspected.config
    if (!config) {
      states.push({
        provider: name,
        state: inspected.status,
        missing: inspected.missing,
        networkAttempted: false,
      })
      continue
    }
    try {
      const models = await discover(config)
      states.push({
        provider: name,
        state: 'online',
        model: config.model,
        models,
      })
    } catch (e) {
      states.push({
        provider: name,
        state: e instanceof AppError ? e.code : 'invalid_response',
      })
    }
  }
  return c.json({
    items: states,
    vision: selectedVisionReadiness(c.get('principal').workspaceId),
    textPolicy: explanationPolicy(c.get('principal').workspaceId),
    zetaris:
      process.env.ZETARIS_WORKSPACE_ID === c.get('principal').workspaceId
        ? 'configured_not_queried'
        : 'not_configured',
  })
})
adminRoutes.post('/zetaris/query', requirePermission('sources'), async (c) => {
  const p = c.get('principal'),
    body = z
      .object({
        buildingId: z.string(),
        limit: z.number().int().min(1).max(500).default(100),
        offset: z.number().int().min(0).max(10000).default(0),
      })
      .strict()
      .parse(await c.req.json())
  await getBuilding(p, body.buildingId)
  const result = await zetarisForWorkspace(p.workspaceId).query(
    body.buildingId,
    body.limit,
    body.offset,
  )
  await audit(p, 'zetaris.federated_query', body.buildingId, {
    rows: result.rows.length,
    requestId: result.requestId,
    sources: result.independentSources,
  })
  return c.json(result)
})
adminRoutes.post(
  '/conflicts/resolve',
  requirePermission('review'),
  async (c) => {
    const p = c.get('principal'),
      body = z
        .object({
          entityId: z.string(),
          attribute: z.string().max(100),
          selectedEvidenceId: z.string(),
          evidenceIds: z.array(z.string()).min(2).max(100),
          reason: z.string().min(12).max(2000),
        })
        .strict()
        .parse(await c.req.json())
    const entity = await getEntity(p, body.entityId),
      observations = await getObservations(p, entity.buildingId)
    const evidence = observations.filter((o) => body.evidenceIds.includes(o.id))
    if (
      evidence.length !== body.evidenceIds.length ||
      evidence.some(
        (o) => o.entityId !== entity.id || o.attribute !== body.attribute,
      )
    )
      throw new AppError('CONFLICT_EVIDENCE_CONTEXT_MISMATCH', 422)
    const selected = evidence.find((o) => o.id === body.selectedEvidenceId)
    if (!selected || stateAt(selected, new Date()) !== 'verified')
      throw new AppError('CURRENT_VERIFIED_SELECTION_REQUIRED', 422)
    const id = Bun.randomUUIDv7()
    await db.insert(t.resolutions).values({
      id,
      workspaceId: p.workspaceId,
      entityId: entity.id,
      attribute: body.attribute,
      evidenceIds: body.evidenceIds,
      reason: body.reason,
      reviewerId: p.userId,
      decision: { selectedId: body.selectedEvidenceId },
    })
    await audit(p, 'conflict.resolved', id, {
      entityId: entity.id,
      evidenceIds: body.evidenceIds,
    })
    return c.json({ id }, 201)
  },
)

adminRoutes.post(
  '/zetaris/register',
  requirePermission('sources'),
  async (c) => {
    const p = c.get('principal'),
      b = z
        .object({
          datasets: z
            .array(
              z
                .object({
                  role: z.enum(['directory', 'operations']),
                  url: z.string().url(),
                })
                .strict(),
            )
            .length(2),
          execute: z.boolean().default(false),
          confirmation: z.string().optional(),
        })
        .strict()
        .parse(await c.req.json())
    const plan = registrationPlan(p.workspaceId, b.datasets)
    if (!b.execute) return c.json({ plan, dryRun: true })
    if (b.confirmation !== plan.database)
      throw new AppError('REGISTRATION_PLAN_CONFIRMATION_REQUIRED', 409)
    const result = await zetarisForWorkspace(p.workspaceId).register(plan)
    await audit(p, 'zetaris.sources_registered', plan.database, {
      tables: plan.tables,
    })
    return c.json(result, 201)
  },
)
adminRoutes.post(
  '/buildings/:id/grants',
  requirePermission('admin'),
  async (c) => {
    const p = c.get('principal')
    await getBuilding(p, c.req.param('id'))
    const body = z
      .object({
        userId: z.string(),
        permission: z.enum(['read', 'write', 'review', 'manage']),
      })
      .strict()
      .parse(await c.req.json())
    if (
      !(await db.query.memberships.findFirst({
        where: and(
          eq(t.memberships.userId, body.userId),
          eq(t.memberships.workspaceId, p.workspaceId),
        ),
      }))
    )
      throw new AppError('MEMBER_NOT_FOUND', 404)
    await db
      .insert(t.buildingGrants)
      .values({
        workspaceId: p.workspaceId,
        buildingId: c.req.param('id'),
        ...body,
      })
      .onConflictDoUpdate({
        target: [
          t.buildingGrants.workspaceId,
          t.buildingGrants.buildingId,
          t.buildingGrants.userId,
        ],
        set: { permission: body.permission },
      })
    await audit(p, 'building.grant.updated', c.req.param('id'), body)
    return c.json({ ok: true })
  },
)
adminRoutes.post(
  '/projects/:id/grants',
  requirePermission('admin'),
  async (c) => {
    const p = c.get('principal')
    const { authorizeProject } = await import('./store')
    await authorizeProject(p, c.req.param('id'))
    const body = z
      .object({
        userId: z.string(),
        permission: z.enum(['read', 'write', 'review', 'manage']),
      })
      .strict()
      .parse(await c.req.json())
    if (
      !(await db.query.memberships.findFirst({
        where: and(
          eq(t.memberships.userId, body.userId),
          eq(t.memberships.workspaceId, p.workspaceId),
        ),
      }))
    )
      throw new AppError('MEMBER_NOT_FOUND', 404)
    await db
      .insert(t.projectGrants)
      .values({
        workspaceId: p.workspaceId,
        projectId: c.req.param('id'),
        ...body,
      })
      .onConflictDoUpdate({
        target: [
          t.projectGrants.workspaceId,
          t.projectGrants.projectId,
          t.projectGrants.userId,
        ],
        set: { permission: body.permission },
      })
    await audit(p, 'project.grant.updated', c.req.param('id'), body)
    return c.json({ ok: true })
  },
)

adminRoutes.patch('/users/:id', requirePermission('admin'), async (c) => {
  const p = c.get('principal'),
    userId = c.req.param('id'),
    body = z
      .object({
        role: z.enum([
          'viewer',
          'operator',
          'reviewer',
          'source_admin',
          'admin',
        ]),
        revokeSessions: z.boolean().default(true),
      })
      .strict()
      .parse(await c.req.json())
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ao_workspaces where id=${p.workspaceId} for update`,
    )
    const member = await tx.query.memberships.findFirst({
      where: and(
        eq(t.memberships.workspaceId, p.workspaceId),
        eq(t.memberships.userId, userId),
      ),
    })
    if (!member) throw new AppError('MEMBER_NOT_FOUND', 404)
    if (member.role === 'admin' && body.role !== 'admin') {
      const admins = await tx
        .select()
        .from(t.memberships)
        .where(
          and(
            eq(t.memberships.workspaceId, p.workspaceId),
            eq(t.memberships.role, 'admin'),
          ),
        )
      if (admins.length <= 1) throw new AppError('LAST_ADMIN_REQUIRED', 409)
    }
    await tx
      .update(t.memberships)
      .set({ role: body.role })
      .where(
        and(
          eq(t.memberships.workspaceId, p.workspaceId),
          eq(t.memberships.userId, userId),
        ),
      )
    if (body.revokeSessions)
      await tx
        .delete(t.sessions)
        .where(
          and(
            eq(t.sessions.workspaceId, p.workspaceId),
            eq(t.sessions.userId, userId),
          ),
        )
    await tx.insert(t.auditEvents).values({
      id: Bun.randomUUIDv7(),
      workspaceId: p.workspaceId,
      actorId: p.userId,
      action: 'membership.role.updated',
      targetId: userId,
      metadata: { role: body.role, revokeSessions: body.revokeSessions },
    })
  })
  return c.json({ ok: true })
})
