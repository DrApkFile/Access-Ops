import { desc, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import {
  applyOperations,
  EditOperationError,
  editOperationSchema,
  floorModelSchema,
  renderFloorModelSvg,
  type FloorModel,
  recordGeometryEdits,
  applyMeasurementCorrection,
  measurementCorrectionSchema,
  geometryReviewIssues,
} from '@bumps/floor-model'
import {captureModelExecutions} from './providers/model-executions'
import {runOpeningsAudit} from './agents/openings-audit'
import {hash,AppError} from './accessops/errors'
import {enqueue} from './accessops/jobs'
import {selectedVisionReadiness} from './providers/vision-selection'
import {runCritique} from './agents/critique'
import {loadPlanImageParts} from './agents/parser'
import {renderFloorTopologyOverlaySvg} from '@bumps/floor-model'
import {Resvg} from '@resvg/resvg-js'
import {svgFont} from './lib/svg-font'
import { EditConversionError, runEditAgent } from './agents/edit'
import { db } from './db'
import { saveModelVersion } from './model-versions'
import { requirePermission,audit,type Env } from './accessops/auth'
import { floorModels, projects } from './db/schema'

// Floor model versions are append-only: every save is a new version,
// which gives the editor undo and the critique loop its iteration trail.

async function latestModelRow(projectId: string) {
  return db.query.floorModels.findFirst({
    orderBy: desc(floorModels.version),
    where: eq(floorModels.projectId, projectId),
  })
}

// Stored models predate schema additions (e.g. furniture); re-parsing
// applies defaults so every model leaving the API is current-shape.
function normalizeModel(raw: unknown): FloorModel {
  return floorModelSchema.parse(raw)
}

async function projectExists(projectId: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  })
  return project !== undefined
}

export const modelRoutes = new Hono<Env>()

modelRoutes.post('/:id/model', async (c) => {
  const projectId = c.req.param('id')
  if (!(await projectExists(projectId))) {
    return c.json({ error: 'Project not found' }, 404)
  }
  const parsed = floorModelSchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json(
      { error: 'Invalid floor model', issues: parsed.error.issues },
      422,
    )
  }
  const latest = await latestModelRow(projectId)
  const expected = c.req.header('if-match')
  const next = latest ? recordGeometryEdits(normalizeModel(latest.model),parsed.data,'human') : parsed.data
  const version = await saveModelVersion(projectId, next, expected ? Number(expected) : latest?.version ?? 0,
    latest?.critique ? {critique:{...(latest.critique as object),geometryChangedSinceCritique:true}} : {})
  return c.json({ version,model:next }, 201)
})

modelRoutes.get('/:id/model', async (c) => {
  const projectId = c.req.param('id')
  const requested = c.req.query('version')
  const row = requested
    ? await db.query.floorModels.findFirst({
        orderBy: desc(floorModels.version),
        where: (table, { and }) =>
          and(eq(table.projectId, projectId), eq(table.version, Number(requested))),
      })
    : await latestModelRow(projectId)
  if (!row) {
    return c.json({ error: 'No floor model for this project' }, 404)
  }
  return c.json({
    critique: row.critique,
    iteration: row.iteration,
    model: normalizeModel(row.model),
    version: row.version,
  })
})

modelRoutes.get('/:id/model/versions', async (c) => {
  const rows = await db.query.floorModels.findMany({
    columns: { createdAt: true, version: true },
    orderBy: desc(floorModels.version),
    where: eq(floorModels.projectId, c.req.param('id')),
  })
  return c.json({ versions: rows })
})

const operationsBodySchema = z.object({
  operations: z.array(editOperationSchema).min(1),
  reviewReason:z.string().trim().min(12).max(1000).optional(),
})

// Applies a batch of edit operations to the latest version and saves the
// result as a new version. The only write path besides a full model save.
modelRoutes.post('/:id/model/operations', async (c) => {
  const projectId = c.req.param('id')
  const latest = await latestModelRow(projectId)
  if (!latest) {
    return c.json({ error: 'No floor model for this project' }, 404)
  }
  const parsed = operationsBodySchema.safeParse(await c.req.json())
  if (!parsed.success) {
    return c.json(
      { error: 'Invalid operations', issues: parsed.error.issues },
      422,
    )
  }
  let next: FloorModel
  try {
    next = floorModelSchema.parse(
      applyOperations(normalizeModel(latest.model), parsed.data.operations),
    )
  } catch (error) {
    if (error instanceof EditOperationError) {
      return c.json({ error: error.message }, 422)
    }
    return c.json({ error: 'Operations produced an invalid model' }, 422)
  }
  const corrected = recordGeometryEdits(normalizeModel(latest.model),next,'human')
  if(geometryReviewIssues(corrected).some(i=>i.reason==='boundary_invalid'))return c.json({error:'Corrected boundary is invalid or outside the image'},422)
  if(parsed.data.reviewReason)for(const meta of corrected.geometryEvidence?.features??[])
    if(meta.origin==='user_corrected'&&parsed.data.operations.some(op=>('id'in op&&op.id===meta.elementId)||('element'in op&&op.element.id===meta.elementId)))meta.note=parsed.data.reviewReason
  const version = await saveModelVersion(projectId, corrected, latest.version,
    latest.critique ? {critique:{...(latest.critique as object),geometryChangedSinceCritique:true}} : {})
  return c.json({ version, model: corrected }, 201)
})

const editBodySchema = z.object({
  prompt: z.string().min(1),
  selectedId: z.string().nullable().optional(),
})

// Natural-language editing: the EditAgent proposes operations, code validates
// and applies them; anything referencing unknown ids is rejected wholesale.
modelRoutes.post('/:id/model/edit', async (c) => {
  const projectId = c.req.param('id')
  const latest = await latestModelRow(projectId)
  if (!latest) {
    return c.json({ error: 'No floor model for this project' }, 404)
  }
  const body = editBodySchema.safeParse(await c.req.json())
  if (!body.success) {
    return c.json({ error: 'Invalid request', issues: body.error.issues }, 422)
  }

  let result
  try {
    result = await runEditAgent({
      model: normalizeModel(latest.model),
      prompt: body.data.prompt,
      selectedId: body.data.selectedId ?? null,
    })
  } catch (error) {
    if (error instanceof EditConversionError) {
      return c.json({ error: error.message }, 422)
    }
    return c.json({ error: 'EDIT_PROVIDER_UNAVAILABLE' }, 502)
  }

  if (result.action === 'clarify') {
    return c.json({ action: 'clarify', question: result.question })
  }

  let next: FloorModel
  try {
    next = floorModelSchema.parse(
      applyOperations(normalizeModel(latest.model), result.operations),
    )
  } catch (error) {
    if (error instanceof EditOperationError) {
      return c.json({ error: error.message }, 422)
    }
    return c.json({ error: 'Edit produced an invalid model' }, 422)
  }

  next = recordGeometryEdits(normalizeModel(latest.model),next,'model')
  const version = await saveModelVersion(projectId, next, latest.version,
    latest.critique ? {critique:{...(latest.critique as object),geometryChangedSinceCritique:true}} : {})
  return c.json({
    action: 'applied',
    model: next,
    operationCount: result.operations.length,
    summary: result.summary,
    version,
  })
})

modelRoutes.get('/:id/model/svg', async (c) => {
  const requested=c.req.query('version')
  if(requested&&(!Number.isInteger(Number(requested))||Number(requested)<1))return c.json({error:'Invalid version'},422)
  const row = requested?await db.query.floorModels.findFirst({where:(t,{and,eq})=>and(eq(t.projectId,c.req.param('id')),eq(t.version,Number(requested)))}):await latestModelRow(c.req.param('id'))
  if (!row) {
    return c.json({ error: 'No floor model for this project' }, 404)
  }
  const svg = renderFloorModelSvg(normalizeModel(row.model))
  return c.body(svg, 200, { 'Content-Type': 'image/svg+xml' })
})

modelRoutes.get('/:id/model/review-details',async c=>{
 const rows=await db.query.floorModels.findMany({where:eq(floorModels.projectId,c.req.param('id')),orderBy:desc(floorModels.version),limit:10,
  columns:{version:true,iteration:true,critique:true,createdAt:true}})
 return c.json({reviews:rows.filter(r=>r.critique!==null),limit:10})
})
modelRoutes.post('/:id/model/measurement-review',async c=>{
 const parsed=z.object({expectedVersion:z.number().int().positive(),correction:measurementCorrectionSchema}).strict().safeParse(await c.req.json())
 if(!parsed.success)return c.json({error:'Invalid measurement correction'},422)
 const latest=await latestModelRow(c.req.param('id')!)
 if(!latest)return c.json({error:'No floor model'},404)
 if(latest.version!==parsed.data.expectedVersion)return c.json({error:'MODEL_VERSION_CONFLICT'},409)
 let next:FloorModel
 try{next=applyMeasurementCorrection(normalizeModel(latest.model),parsed.data.correction)}catch{return c.json({error:'Correction rejected: check values, image bounds, host wall and review reason'},422)}
 const version=await saveModelVersion(c.req.param('id'),next,latest.version,{critique:{...((latest.critique as object)??{}),geometryChangedSinceCritique:true}})
 await audit(c.get('principal'),'floor_model.measurement_corrected',latest.id,{version,kind:parsed.data.correction.kind,reason:parsed.data.correction.reason})
 return c.json({model:next,version},201)
})
export async function runGeometryReview(projectId:string,expectedVersion:number,stage:'doorway-audit'|'critique'){
 const latest=await latestModelRow(projectId),project=await db.query.projects.findFirst({where:eq(projects.id,projectId)})
 if(!latest||!project)throw new AppError('NOT_FOUND',404)
 if(latest.version!==expectedVersion)throw new AppError('MODEL_VERSION_CONFLICT',409)
 const model=normalizeModel(latest.model),source=await Bun.file(project.planPath).bytes()
 const captured=await captureModelExecutions(async()=>{
  if(stage==='doorway-audit')return {ops:await runOpeningsAudit({planBytes:source,mimeType:'image/png',model})}
  const render=(svg:string)=>Buffer.from(new Resvg(svg,{font:svgFont}).render().asPng()).toString('base64')
  return {result:await runCritique({planParts:await loadPlanImageParts(project.planPath),overlayParts:[{inlineData:{mimeType:'image/png',data:render(renderFloorTopologyOverlaySvg(model,'data:image/png;base64,'+Buffer.from(source).toString('base64')))}}],renderPngBase64:render(renderFloorModelSvg(model)),modelJson:JSON.stringify(model)})}
 })
 const review={sourceModelVersion:latest.version,sourceModelSha256:hash(JSON.stringify(model)),...captured.value,executions:captured.executions,applied:false,note:'Read-only model suggestions; user corrections are not overwritten.'}
 await saveModelVersion(project.id,model,latest.version,{critique:{...((latest.critique as object)??{}),[stage==='doorway-audit'?'doorwayAudit':'currentGeometryCritique']:review}})
}
for(const stage of ['doorway-audit','critique'] as const)modelRoutes.post('/:id/model/'+stage,requirePermission('review'),async c=>{
 const body=z.object({expectedVersion:z.number().int().positive()}).strict().safeParse(await c.req.json())
 if(!body.success)return c.json({error:'Expected model version required'},422)
 const latest=await latestModelRow(c.req.param('id')!)
 if(!latest)return c.json({error:'No floor model'},404)
 if(latest.version!==body.data.expectedVersion)return c.json({error:'MODEL_VERSION_CONFLICT'},409)
 const ready=selectedVisionReadiness(c.get('principal').workspaceId)
 if('workspacePermitted'in ready&&!ready.workspacePermitted)return c.json({error:'VISION_CONSENT_REQUIRED'},403)
 if(!ready.configured)return c.json({error:'VISION_NOT_READY'},503)
 const job=await enqueue(c.get('principal'),'geometry-review','geometry-review:'+Bun.randomUUIDv7(),{projectId:c.req.param('id'),expectedVersion:latest.version,stage})
 await audit(c.get('principal'),'floor_model.review_requested',latest.id,{version:latest.version,stage,jobId:job!.id})
 return c.json({jobId:job!.id,status:'queued'},202)
})

// A human may import/review geometry without pretending model extraction succeeded.
modelRoutes.post('/:id/model/review', requirePermission('review'), async c => {
 const body=z.object({version:z.number().int().positive(),reason:z.string().min(12).max(1000)}).strict().parse(await c.req.json())
 const latest=await latestModelRow(c.req.param('id'))
 if(!latest||latest.version!==body.version)return c.json({error:'MODEL_VERSION_CONFLICT'},409)
 await db.update(projects).set({status:'parsed',parseError:null}).where(eq(projects.id,c.req.param('id')))
 await audit(c.get('principal'),'floor_model.human_reviewed',latest.id,{version:latest.version,reason:body.reason,origin:'human-imported or human-corrected; not proof of AI extraction'})
 return c.json({version:latest.version,status:'parsed',origin:'human-reviewed'})
})
