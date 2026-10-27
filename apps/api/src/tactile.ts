import { desc, eq, and, ne } from 'drizzle-orm'
import { Hono } from 'hono'
import {
  buildValidationContext,
  convertToTactile,
  floorModelSchema,
  type FloorModel,
  geometryExportStatus,
} from '@bumps/floor-model'
import { runTactileLayout } from './agents/tactile-layout'
import { db } from './db'
import { enqueue } from './accessops/jobs'
import type { Env } from './accessops/auth'
import { AppError } from './accessops/errors'
import { floorModels, projects, tactileDesigns } from './db/schema'

export const tactileRoutes = new Hono<Env>()

export async function runConversion(rowId: string, model: FloorModel) {
  const existing = await db.query.tactileDesigns.findFirst({
    where: eq(tactileDesigns.id, rowId),
  })
  if (existing?.status === 'done') return
  try {
    const { design: initial, notes } = convertToTactile(model)
    if(geometryExportStatus(model).provisional)notes.push({kind:'provisional',elementId:'plan',message:'PROVISIONAL: extracted geometry or physical scale remains unreviewed.'})
    const context = buildValidationContext(model)
    const layout = await runTactileLayout(initial, context)
    await db
      .update(tactileDesigns)
      .set({
        design: layout.design,
        iterations: layout.iterations,
        notes,
        status: 'done',
        valid: layout.valid,
        violations: layout.violations,
      })
      .where(
        and(eq(tactileDesigns.id, rowId), ne(tactileDesigns.status, 'done')),
      )
  } catch (error) {
    const message =
      'Layout failed; check provider configuration and job diagnostics'
    await db
      .update(tactileDesigns)
      .set({ error: message.slice(0, 400), status: 'failed' })
      .where(
        and(eq(tactileDesigns.id, rowId), ne(tactileDesigns.status, 'done')),
      )
    throw new AppError('TACTILE_CONVERSION_FAILED', 503)
  }
}

// Convert the latest floor model, validate against the standards, and run
// the agent layout loop until zero violations or the iteration cap — in the
// background; the client polls GET. The stored `valid` flag is the export
// gate: false designs never print.
tactileRoutes.post('/:id/tactile', async (c) => {
  const projectId = c.req.param('id')
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  })
  if (!project) {
    return c.json({ error: 'Project not found' }, 404)
  }
  if (project.status !== 'parsed') {
    return c.json(
      { error: 'Project must finish parsing before tactile conversion' },
      409,
    )
  }
  const latest = await db.query.floorModels.findFirst({
    orderBy: desc(floorModels.version),
    where: eq(floorModels.projectId, projectId),
  })
  if (!latest) {
    return c.json({ error: 'No floor model for this project' }, 404)
  }
  const review=geometryExportStatus(floorModelSchema.parse(latest.model))
  if(!review.allowed)return c.json({error:'GEOMETRY_REVIEW_REQUIRED',issues:review.issues},409)
  const running = await db.query.tactileDesigns.findFirst({
    where: eq(tactileDesigns.projectId, projectId),
    orderBy: desc(tactileDesigns.createdAt),
  })
  if (running?.status === 'running') {
    return c.json({ status: 'running' }, 202)
  }
  const rowId = Bun.randomUUIDv7()
  const model = floorModelSchema.parse(latest.model)
  const { design, notes } = convertToTactile(model)
  if(review.provisional)notes.push({kind:'provisional',elementId:'plan',message:'PROVISIONAL: extracted geometry or physical scale remains unreviewed.'})
  await db.insert(tactileDesigns).values({
    design,
    floorModelVersion: latest.version,
    id: rowId,
    notes,
    projectId,
    status: 'running',
  })
  await enqueue(c.get('principal'), 'tactile', 'tactile:' + rowId, {
    designId: rowId,
    model,
  })
  return c.json({ status: 'running' }, 202)
})

tactileRoutes.get('/:id/tactile', async (c) => {
  const requested = c.req.query('designId')
  const row = await db.query.tactileDesigns.findFirst({
    orderBy: desc(tactileDesigns.createdAt),
    where: (t, { and, eq }) =>
      and(
        eq(t.projectId, c.req.param('id')),
        requested ? eq(t.id, requested) : undefined,
      ),
  })
  if (!row) {
    return c.json({ error: 'No tactile design for this project' }, 404)
  }
  const latest = await db.query.floorModels.findFirst({
    where: eq(floorModels.projectId, c.req.param('id')),
    orderBy: desc(floorModels.version),
  })
  const stale = row.floorModelVersion !== latest?.version
  return c.json({
    id: row.id,
    stale,
    design: row.design,
    error: row.error,
    floorModelVersion: row.floorModelVersion,
    iterations: row.iterations,
    notes: row.notes,
    status: row.status,
    valid: row.valid && (!stale || Boolean(requested)),
    violations: row.violations,
  })
})
