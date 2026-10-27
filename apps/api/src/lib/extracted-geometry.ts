import type { FloorModel } from '@bumps/floor-model'
import { AppError } from '../accessops/errors'

/** Applies only to AI proposals. Manual editor/domain schema behavior stays unchanged. */
export function assertExtractedGeometry(model: FloorModel) {
  if (!model.walls.length && !model.rooms.length && !model.roads.length)
    throw new AppError('EXTRACTION_HAS_NO_STRUCTURAL_GEOMETRY', 422)
  const points = [
    ...model.walls.flatMap((w) => [w.a, w.b]),
    ...model.openings.map((o) => o.at),
    ...model.features.map((f) => f.at),
    ...model.rooms.flatMap((r) => r.polygon),
    ...model.furniture.flatMap((f) => f.polygon),
    ...model.paths.flatMap((p) => p.points),
    ...model.roads.flatMap((r) => r.points),
  ]
  for (const p of points) {
    if (
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.y) ||
      p.x < 0 ||
      p.y < 0 ||
      p.x > model.plan.widthPx ||
      p.y > model.plan.heightPx
    )
      throw new AppError('EXTRACTED_COORDINATES_OUTSIDE_SOURCE_IMAGE', 422)
  }
}
