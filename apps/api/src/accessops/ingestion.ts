import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import * as t from './schema'
import { hash, AppError } from './errors'
import { audit, can, type Principal } from './auth'
import { getSource, getEntities } from './store'
import { matchEntity, stableJson, type SourceRecord } from '@accessops/domain'
import { metrics } from './middleware'
export async function ingest(
  p: Principal,
  sourceId: string,
  records: SourceRecord[],
  retrievedAt = new Date(),
  rejections: unknown[] = [],
  raw?: { content: string; format: string },
) {
  const source = await getSource(p, sourceId)
  const entities = await getEntities(p, source.buildingId)
  if (records.length > 5000) throw new AppError('IMPORT_TOO_LARGE', 413)
  for (const r of records) {
    if (r.buildingId !== source.buildingId || r.namespace !== source.namespace)
      throw new AppError('SOURCE_SCOPE_MISMATCH', 422)
    if (
      r.verification === 'verified' &&
      (!r.lastVerifiedAt ||
        r.reviewerId !== p.userId ||
        !r.reviewReason ||
        r.reviewReason.length < 8)
    )
      throw new AppError('VERIFIED_RECORD_REVIEW_PROVENANCE_REQUIRED', 422)
    if (r.verification === 'verified' && !can(p.role, 'review'))
      throw new AppError('VERIFICATION_REQUIRES_REVIEWER', 403)
    if (
      (r.observedAt &&
        Date.parse(r.observedAt) > retrievedAt.getTime() + 300000) ||
      (r.lastVerifiedAt &&
        Date.parse(r.lastVerifiedAt) > retrievedAt.getTime() + 300000)
    )
      throw new AppError('FUTURE_OBSERVATION_TIME', 422)
    if (
      r.levelId &&
      !entities.some((e) => e.levelId === r.levelId) &&
      r.entityKind !== 'level'
    )
      throw new AppError('UNKNOWN_LEVEL_CONTEXT', 422)
  }
  const runId = Bun.randomUUIDv7()
  await db
    .insert(t.ingestionRuns)
    .values({
      id: runId,
      workspaceId: p.workspaceId,
      sourceId,
      status: 'running',
    })
  try {
    const summary = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${sourceId}))`)
      const snapshotHash = raw
        ? hash(raw.content)
        : hash(
            stableJson(
              [...records].sort((a, b) =>
                stableJson(a).localeCompare(stableJson(b)),
              ),
            ),
          )
      const existing = await tx.query.snapshots.findFirst({
        where: and(
          eq(t.snapshots.sourceId, sourceId),
          eq(t.snapshots.workspaceId, p.workspaceId),
          eq(t.snapshots.hash, snapshotHash),
        ),
      })
      const summary = {
        fetched: records.length + rejections.length,
        accepted: 0,
        changed: 0,
        rejected: rejections.length,
        skipped: 0,
        unresolved: 0,
        snapshotId: existing?.id ?? Bun.randomUUIDv7(),
        errors: rejections,
        paginationComplete: true,
      }
      if (existing) {
        summary.skipped = records.length
      } else {
        await tx
          .insert(t.snapshots)
          .values({
            id: summary.snapshotId,
            workspaceId: p.workspaceId,
            sourceId,
            runId,
            hash: snapshotHash,
            rawContent: raw?.content,
            rawFormat: raw?.format,
            recordCount: records.length,
            retrievedAt,
          })
        for (const r of records) {
          const digest = hash(stableJson(r))
          const match = matchEntity(r, entities)
          const result = await tx
            .insert(t.observations)
            .values({
              id: Bun.randomUUIDv7(),
              workspaceId: p.workspaceId,
              sourceId,
              snapshotId: summary.snapshotId,
              entityId: match.state === 'confirmed' ? match.entityId : null,
              externalId: r.externalId,
              hash: digest,
              record: r,
              match,
            })
            .onConflictDoNothing()
            .returning({ id: t.observations.id })
          if (result.length) {
            summary.accepted++
            summary.changed++
            if (match.state !== 'confirmed') summary.unresolved++
          } else summary.skipped++
        }
      }
      await tx
        .update(t.sources)
        .set({ lastSuccessAt: retrievedAt, lastError: null })
        .where(
          and(
            eq(t.sources.id, sourceId),
            eq(t.sources.workspaceId, p.workspaceId),
          ),
        )
      await tx
        .update(t.ingestionRuns)
        .set({ status: 'succeeded', summary, completedAt: new Date() })
        .where(eq(t.ingestionRuns.id, runId))
      return summary
    })
    metrics.ingestions++
    await audit(p, 'source.ingested', sourceId, {
      runId,
      ...summary,
      errors: rejections.length,
    })
    return { runId, ...summary }
  } catch (e) {
    await db
      .update(t.ingestionRuns)
      .set({
        status: 'failed',
        summary: {
          error: e instanceof AppError ? e.code : 'INGESTION_FAILED',
          retryEligible: !(e instanceof AppError && e.status < 500),
        },
        completedAt: new Date(),
      })
      .where(eq(t.ingestionRuns.id, runId))
    await db
      .update(t.sources)
      .set({ lastError: e instanceof AppError ? e.code : 'INGESTION_FAILED' })
      .where(eq(t.sources.id, sourceId))
    throw e
  }
}
