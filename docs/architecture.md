# Architecture

AccessOps is an additive extension of the Bun/Hono + Next.js + Drizzle/Postgres Bumps application. It does not replace the strict floor-model contract or derive navigability from drawn polylines.

| Boundary | Implementation | Responsibility |
|---|---|---|
| UI | `apps/web/src/components/operations/operations-console.tsx`, `/operations` | Minimal authenticated operational controls using existing components |
| Same-origin gateway | `apps/web/src/app/backend/[...path]/route.ts` | Cookie forwarding, bounded body, explicit allowed paths, no browser server secrets |
| API composition | `apps/api/src/app.ts`, `src/index.ts` | Session authorization, CSRF, limits, request IDs, safe errors, graceful server shutdown |
| Domain | `packages/accessops/src` | Strict contracts, identity, freshness/conflicts, graph validation/reachability, findings |
| Persistence | `apps/api/src/accessops/schema.ts`, `drizzle` | Tenant-scoped entities and history, composite foreign keys, immutable evidence triggers |
| Ingestion | `accessops/imports.ts`, `ingestion.ts`, `connectors.ts` | Preview, validation, raw snapshots, hashes, idempotence, MBTA pagination and failures |
| Investigation | `accessops/investigation.ts`, `routes-workflows.ts` | Bounded retrieval, deterministic checks, evidence packet, explanation validation, frozen history |
| Providers | `src/providers/{http,explanation,zetaris}.ts` | Bounded validated transport, actual provider identity, consent and workspace binding |
| Worker | `src/worker.ts`, `accessops/jobs.ts` | Durable leases, membership revalidation, backoff, expired-job recovery |
| Bumps | `projects.ts`, `parse.ts`, `models.ts`, `tactile.ts`, `export.ts`, `geometry/`, `agents/` | Original image/model/manual correction/repair/export workflow |

An ingestion transaction serializes by source, retains the raw submitted document and normalized observations, records match decisions, and updates run accounting. Re-importing identical content records a successful skipped run. A failed refresh preserves the last successful snapshot and exposes failure; it cannot represent a healthy empty dataset.

Investigations are durable jobs. Each run authorizes its actor again, retrieves bounded evidence, reconciles observations, evaluates the reviewed graph, creates deterministic findings, optionally executes a configured federated join, requests a bounded extractive explanation, validates citations and claims, and commits findings plus the evidence snapshot. Historical results are never recomputed on read. A follow-up records changed evidence and recomputes all current checks instead of trusting old status.

A scenario captures graph version and observations, applies changes to an isolated in-memory copy and persists baseline/result/affected destinations. It never updates actual source records. General pedestrian and step-free profiles support explicitly supplied measurement limits. Reachability means only that the supplied technical constraints were supported. It is not a certified route assessment.

Bumps models are append-only versions saved under a project row lock. Tactile designs retain the input model version. Current export rejects stale designs; explicit historical design retrieval remains available. Export paths include design identity so later generations cannot overwrite historical STL files. Vision agents load ADK only on a real inference request. Bundled font loading and immutable-input raster/placement caches remove repeated host scans/computation without weakening geometry assertions.

Current operational boundaries: one configured Zetaris workspace per deployment; server-environment provider secrets; no managed SSO, credential vault UI or multi-region queue. Persistent upload volumes are required for deployment. See security and deployment gates before using sensitive real facilities data.

## Current UI and provider extensions (2026-10-27)

The operational React workspace now uses `components/workspace` screens under `(workspace)`, sharing source-scoped hooks and the existing cookie/CSRF same-origin gateway. Original map Wizard/canvas/tactile routes remain. `styles/accessops-brand.css` and `accessops-workspace.css` share tokens with the landing; see [exact design](ui-design-system.md).

The real licensed Meterless Engine is an evidence projection, not the durable authority: exact immutable Postgres observations enter a scoped Engine, its returned evidence IDs are checked, and deterministic reconciliation/graph analysis uses those records. Frozen re-explanation is a one-attempt durable job with a pre-request provider intent; historical investigation evidence is never rewritten by a later model call. Explicit workspace consent protects both text explanation and NVIDIA image requests. Authorized integration configuration is referenced server-side through an allowlist.

A tested Zetaris gateway adapter implements this installed distribution's authenticated query-start interface. Raw returned receipts are hash-bound to preview/import and immutable snapshots; normalized records remain separately traceable. Migration `0009_source_scope.sql` adds a backward-compatible building/reference-area category, so geographic coverage reviews are not presented as surveyed buildings. Actual external successes and failures are recorded in [live verification](live-integration-verification.md).
