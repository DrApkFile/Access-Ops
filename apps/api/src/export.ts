import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { desc, eq, sql } from 'drizzle-orm'
import { AppError } from './accessops/errors'
import { Hono } from 'hono'
import type { TactileDesign } from '@bumps/floor-model'
import {floorModelSchema,geometryExportStatus} from '@bumps/floor-model'
import {
  buildLegendMeshes,
  buildMapMesh,
  buildPlateMeshes,
  meshInfo,
  meshToBinaryStl,
  type MeshInfo,
} from './geometry/mesh'
import { db } from './db'
import {
  exports as exportsTable,
  projects,
  tactileDesigns,
  floorModels,
} from './db/schema'

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? 'data/uploads'

export const exportRoutes = new Hono()

// The export gate: only zero-violation designs become STLs.
exportRoutes.post('/:id/export', async (c) => {
  const projectId = c.req.param('id')
  const row = await db.query.tactileDesigns.findFirst({
    orderBy: desc(tactileDesigns.createdAt),
    where: eq(tactileDesigns.projectId, projectId),
  })
  if (!row || row.status !== 'done') {
    return c.json({ error: 'No finished tactile design for this project' }, 404)
  }
  const latest = await db.query.floorModels.findFirst({
    where: eq(floorModels.projectId, projectId),
    orderBy: desc(floorModels.version),
  })
  if (row.floorModelVersion !== latest?.version)
    return c.json(
      {
        error: 'STALE_TACTILE_DESIGN',
        designVersion: row.floorModelVersion,
        currentVersion: latest?.version,
      },
      409,
    )
  if (!row.valid) {
    return c.json(
      {
        error: 'Design has standards violations — export is blocked',
        violations: row.violations,
      },
      409,
    )
  }
  const review=geometryExportStatus(floorModelSchema.parse(latest!.model))
  if(!review.allowed)return c.json({error:'GEOMETRY_REVIEW_REQUIRED',issues:review.issues},409)
  const encode=(mesh:Parameters<typeof meshToBinaryStl>[0])=>{
    const bytes=meshToBinaryStl(mesh)
    if(review.provisional)bytes.set(new TextEncoder().encode('PROVISIONAL MAP: geometry or physical scale remains unreviewed.').slice(0,80),0)
    return bytes
  }

  const design = row.design as TactileDesign
  const grid = design.grid ?? { cols: 1, rows: 1 }
  const dir = path.join(UPLOADS_DIR, projectId, 'export', row.id)
  await mkdir(dir, { recursive: true })

  const files: { info: MeshInfo; kind: string; path: string }[] = []
  // 'map' is the assembled composite: the only file for a single plate,
  // and the seamless 3D preview for a multi-plate grid.
  const map = buildMapMesh(design)
  const mapPath = path.join(dir, 'map.stl')
  await Bun.write(mapPath, encode(map.getMesh()))
  files.push({ info: meshInfo(map), kind: 'map', path: mapPath })

  // Multi-plate grids also get one print file per plate, sliced from the
  // same solid so assembled seams align exactly.
  const total = grid.rows * grid.cols
  for (const plate of buildPlateMeshes(design, map)) {
    const n = plate.row * grid.cols + plate.col + 1
    const kind = `plate-${n}of${total}`
    const platePath = path.join(dir, `${kind}.stl`)
    await Bun.write(platePath, encode(plate.manifold.getMesh()))
    files.push({ info: meshInfo(plate.manifold), kind, path: platePath })
  }

  const legends = buildLegendMeshes(design)
  for (const [index, legend] of legends.entries()) {
    const kind =
      legends.length === 1 ? 'legend' : `legend-${index + 1}of${legends.length}`
    const legendPath = path.join(dir, `${kind}.stl`)
    await Bun.write(legendPath, encode(legend.getMesh()))
    files.push({ info: meshInfo(legend), kind, path: legendPath })
  }

  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from projects where id=${projectId} for update`,
    )
    const current = await tx.query.floorModels.findFirst({
      where: eq(floorModels.projectId, projectId),
      orderBy: desc(floorModels.version),
    })
    if (current?.version !== row.floorModelVersion)
      throw new AppError('STALE_TACTILE_DESIGN', 409)
    for (const file of files)
      await tx
        .insert(exportsTable)
        .values({
          id: Bun.randomUUIDv7(),
          kind: file.kind,
          tactileDesignId: row.id,
          floorModelVersion: row.floorModelVersion,
          path: file.path,
          projectId,
        })
  })
  return c.json(
    {
      designId: row.id,
      floorModelVersion: row.floorModelVersion,
      files: files.map((file) => ({
        bbox: file.info.bbox,
        kind: file.kind,
        triangles: file.info.triangles,
      })),
      grid,
      provisional:review.provisional,
      geometryWarnings:review.issues,
    },
    201,
  )
})

exportRoutes.get('/:id/export/:file', async (c) => {
  const projectId = c.req.param('id')
  const match =
    /^(map|legend(?:-\d{1,2}of\d{1,2})?|plate-\d{1,2}of\d{1,2})\.stl$/.exec(
      c.req.param('file'),
    )
  if (!match) {
    return c.json({ error: 'Unknown export file' }, 404)
  }
  const kind = match[1]!
  const row = await db.query.exports.findFirst({
    orderBy: desc(exportsTable.createdAt),
    where: (table, { and }) =>
      and(
        eq(table.projectId, projectId),
        eq(table.kind, kind),
        c.req.query('designId')
          ? eq(table.tactileDesignId, c.req.query('designId')!)
          : undefined,
      ),
  })
  if (!row) {
    return c.json({ error: 'No export yet' }, 404)
  }
  if (!c.req.query('designId')) {
    const current = await db.query.floorModels.findFirst({
      where: eq(floorModels.projectId, projectId),
      orderBy: desc(floorModels.version),
    })
    if (row.floorModelVersion !== current?.version)
      return c.json({ error: 'STALE_TACTILE_DESIGN' }, 409)
  }
  const file = Bun.file(row.path)
  if (!(await file.exists())) {
    return c.json({ error: 'Export file missing' }, 404)
  }
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  })
  const sourceVersion=row.floorModelVersion
  const sourceModel=sourceVersion===null?undefined:await db.query.floorModels.findFirst({where:(t,{and,eq})=>and(eq(t.projectId,projectId),eq(t.version,sourceVersion))})
  const provisional=sourceModel?geometryExportStatus(floorModelSchema.parse(sourceModel.model)).provisional:false
  const base = (project?.name ?? 'tactile-map')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .slice(0, 100)
  return new Response(file, {
    headers: {
      'content-disposition': `attachment; filename="${base}${provisional?'-provisional':''}-${kind}.stl"`,
      'content-type': 'model/stl',
      'x-tactile-design-id': row.tactileDesignId ?? '',
      'x-floor-model-version': String(row.floorModelVersion),
      'x-geometry-status':provisional?'provisional':'current',
    },
  })
})
