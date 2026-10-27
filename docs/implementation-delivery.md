# AccessOps implementation delivery

## Current selected image provider

OpenRouter `nvidia/nemotron-3.5-super-vl:free` now passes genuine synthetic PNG/PDF Bumps parser/critique/doorway workflows and persistence. Direct NVIDIA Nemotron Lightning text remains independently verified and unchanged. Runtime is still blocked by token/origin; Engine8/8 is separate. No UI redesign or video was created in this pass. Free-only routing and workspace permission remain enforced. See the [latest evidence](vision-provider-evaluation.md); earlier Gemini/Omni failures below describe historical providers, not selected-image failure.

## Earlier evidence (historical; superseded by the current checkpoint above)

Current replacement-key update: Google model discovery succeeds, but actual synthetic-image requests to3.5 Flash,3.5 Flash-Lite and3.8 Flash all return403: this project cannot use the Gemini API free tier. No billing was enabled; no vision extraction succeeded. NVIDIA text settings are unchanged. See the latest [integration record](live-integration-verification.md). Earlier service-busy and missing-key statements below are historical.

Current image-provider checkpoint: [vision evaluation](vision-provider-evaluation.md) selects Gemini 3.6 Flash. The approved test key is now configured; actual requests are blocked by Google HTTP503/high demand. NVIDIA text remains separately live-verified; NVIDIA/Omni vision descriptions below are historical. See [current integration status](live-integration-verification.md) and [hackathon evidence](hackathon-requirement-evidence.md).

Latest hardening checkpoint (27 October 2026): [final technical delivery](accessops-final-hardening-delivery.md), [vision verification](vision-integration-delivery.md) and [dependency remediation](security-dependency-audit.md) supersede older vision/security counts below. NVIDIA text fallback remains verified; the selected Omni vision model passed real image controls, while full clinic-plan parsing still hit 503/timeouts and a final additional control failed transcription. Dependency audit is now zero. UI design and existing evidence are preserved.

Latest provider update: [Meterless Runtime Status and NVIDIA Nemotron Fallback](live-integration-verification.md#meterless-runtime-status-and-nvidia-nemotron-fallback). Current default is policy-controlled `auto`; missing Runtime is optional for operation, and a new real NVIDIA fallback run passed. Earlier counts/status descriptions below describe the prior checkpoint. See [fallback delivery](meterless-runtime-fallback-delivery.md) for this run.


This document records the earlier implementation baseline. For subsequent LastMile reuse, actual external execution and the shipped UI redesign, see [current delivery](ui-redesign-delivery.md), [live verification](live-integration-verification.md) and [design system](ui-design-system.md). Earlier missing-credential and UI-deferred statements below describe that earlier checkpoint.

Status: **working local implementation with open production and external-integration gates**. This is implementation evidence, not a feasibility verdict. Work was performed in the extracted ZIP directory `/home/kingghidorah/Documents/projects/bounties/bumps-main`; Git was neither required nor initialized. No external deployment or unrelated service/catalog modification was performed.

## Delivered behavior

The application now supports authenticated workspaces, building/project grants, canonical buildings/levels/spatial entities, independent CSV/JSON sources and a live public MBTA connector, raw immutable source snapshots, observation provenance, contextual matching and reviewer decisions, freshness/conflicts, reviewed graph versions, deterministic reachability, isolated scenarios, durable investigations, approved owned actions, evidence-backed resolution, historical context and HTML/JSON reports.

The verified synthetic clinic workflow combines directory, measured doorway/threshold/lift-service information, reviewed topology and operational records. It produces a destination-impact finding that cites three independent sources; no single floor-plan inference produces that result. An approved action is resolved using fresh attributable verification, a follow-up recalculates connectivity, and the original outage investigation stays unchanged. Stale/conflicting measurements yield unknown results until reviewed. Demonstration sources and incidents are explicitly labelled; these are not real surveyed clinic conditions.

Bumps' upload, manual geometry editor, version history, tactile conversion, deterministic repair, validation, map/legend STL and historical designs remain available. PNG ingestion and a repository PDF upload/rasterization were exercised. Current exports reject stale model versions. A final regression also proves that requesting an old design after a new export returns that exact design, that unknown design IDs fail, and that duplicate completed tactile jobs do not rewrite history. Export publication rechecks the model version under a project lock.

## Recoverable ZIP baseline

Original backup: `/home/kingghidorah/Documents/projects/bounties/accessops-baseline-20261026T213809Z`.

- `original-source.tar.gz` and `manifest.json`: 371 original files, sizes and SHA-256 hashes.
- `original-frontend-data-supplement.tar.gz` and `frontend-data-supplement-manifest.json`: eight additional original frontend data files preserved before editing. The initial generic `data` exclusion missed these; the supplement makes the baseline complete without overwriting the first archive.
- Current filesystem differences: `.accessops-local/change-manifest.json`; baseline/original test integrity and environment: `.accessops-local/environment-and-integrity.json`.

The baseline has no dependency or generated build directories. Original environment files were absent in the extracted source. New private local configuration and an isolated Postgres 17 container (`accessops-development-20261026`, loopback port 55434) were created; no existing database was reset. The initial source archive lacked installed dependencies. Source/license ownership remains unresolved because no root distribution license was supplied. Obtain owner permission before redistribution/deployment claims.

## Important implementation files

| Area | Files |
|---|---|
| Domain | `packages/accessops/src/{contracts,identity,reconcile,graph,findings}.ts` |
| Persistence | `apps/api/src/accessops/schema.ts`; additive `apps/api/drizzle/0001`–`0008` and metadata; tenant/immutable constraints in `0005` and `0007` |
| Security | `accessops/{auth,permissions,middleware,config,store,errors}.ts`, `src/app.ts` |
| Imports and sources | `accessops/{imports,ingestion,connectors,routes-resources}.ts` |
| Intelligence/actions/scenarios | `accessops/{investigation,routes-workflows,routes-admin}.ts` |
| Durable jobs | `accessops/jobs.ts`, `src/worker.ts` |
| Providers | `src/providers/{http,explanation,zetaris}.ts` |
| Bumps repairs | `agents/llm.ts`, `lib/svg-font.ts`, geometry caches, `model-versions.ts`, `models.ts`, `tactile.ts`, `export.ts` |
| Functional UI | `apps/web/src/components/operations/*`, `/operations`, same-origin `/backend/[...path]`, API/server helpers |
| Reproduction/recovery | `apps/api/scripts/{bootstrap,demo-workflow,accessops-demo,check-integrations,backup,restore}.ts`, `scripts/dev.ts`, Dockerfiles/Compose |
| API contract | Authenticated `/v1/openapi.json`; reusable JSON Schemas for domain contracts and operation inventory. Some operation request/response schemas remain described by service contracts rather than fully expanded OpenAPI components. |

The current architecture uses the existing Postgres/Drizzle stack rather than adding a separate queue or replacing Bumps. Evidence and graph versions remain separate from floor-model JSON. Native geometry stays deterministic. ADK is loaded lazily only on an actual vision request. Bundled licensed fonts remove host font scans and Google Fonts build-network dependencies. Dependency versions/overrides and Bun lock changes are deliberate security/reproducibility changes, recorded in the change manifest and install logs.

## Run and verification commands

```sh
bun install --frozen-lockfile
bun run setup
bun run --cwd apps/api db:migrate
bun run --cwd apps/api bootstrap < /private/initial-admin.json
bun run dev --web-port=3400
bun run test
ACCESSOPS_INTEGRATION=1 bun run test:integration
bun run typecheck
bun run lint
bun run security
bun run build
bun audit --json
API_URL=http://localhost:3403 DEMO_EVIDENCE_PATH=/private/demo-results.json \
  bun run demo < /private/admin-login.json
```

Configure `apps/api/.env` and `apps/web/.env.local` as in README; do not overwrite existing configuration. Integration tests only accept the isolated database on `127.0.0.1:55434` and run without a competing worker. The delivery's local admin-login JSON is mode 0600 in `.accessops-local/admin-login.json`; no password/token values are printed here. Local process metadata is `.accessops-local/processes.json`. The delivered application runs at **http://localhost:3400/operations**, API **http://localhost:3403**. It is a local development configuration, not a public production deployment.

## Verification results and evidence

| Check | Actual outcome | Evidence under `.accessops-local/` |
|---|---|---|
| Frozen installation | Passed, exit 0, Bun 1.3.14 lockfile | `frozen-install-final.log`, `final-checks.json` |
| Required template setup | Passed, exit 0; missing config only | `setup.log` |
| Deterministic regression suite | 168 tests passed, 0 failed; 669 assertions | `unit-complete.log` |
| Real Postgres API/worker acceptance | 1 acceptance test passed; 145 assertions; exit 0 | `integration-complete.log`, `integration-results.json` |
| Workspace typecheck | All workspaces passed; subsequent API checks cover final export/provider fixes | `typecheck-final.log`, `api-typecheck-last.log` |
| Lint and secret-boundary scan | Passed; no source-secret findings | `lint-last.log`, `secret-scan-last.log` |
| Production build | Web/API passed with local fonts; final API rebuild covers subsequent backend fixes | `build-offline-fonts.log`, `api-build-last.log` |
| Fresh migration and repeat | Both exit 0 on a new isolated database; 31 public tables | `fresh-migration-results.json`, `migration-fresh-*.log` |
| TCP multi-source workflow | Passed all scripted steps through authenticated real HTTP API | `demo-current.log`, `demo-current-results.json` |
| Browser | Real login form; anonymous denial; operational controls; historical evidence through gateway; original editor; reopen/navigation | `browser-results.json` |
| Process restart persistence | API, worker and standalone web replaced; same persisted session, evidence hash, private PNG and STL bytes afterward | `restart-results.json`, `restart-verified.log` |
| PDF regression | Repository PDF accepted (201), rendered private PNG inspected by byte count/hash; AI parsing not claimed | `restart-results.json` |
| Encrypted backup/restore | Both exit 0; restored into new DB/uploads; 11 files/hash checks and eight table counts matched | `backup-results.json`, `backup.log`, `restore.log` |
| Live public source | Six MBTA facility records fetched, one page, original response hash retained | `integrations/integration-status.json`, `integrations/mbta.json` |
| Dependency security audit | Exit 1: eight residual development-tool advisories (five high, three moderate); no claim of a clean dependency tree | `dependency-audit-last.json`, `dependency-paths.log` |

The original 15 test files were verified byte-for-byte unchanged against the source backup; no assertions or timeouts were changed. The final command ledger is `.accessops-local/verification-complete.json`, and final running-service checks are `.accessops-local/final-service-status.json`. The prior timeout issues were addressed through caching immutable work and eliminating repeated system-font scans. A final production build initially failed because Google Fonts downloads were unavailable; it now uses the same font families bundled with licenses. An attempted dereferenced standalone package lost Bun's dependency links; preserving relative links fixed it and the standalone server was actually exercised. A first restart harness misidentified Next's changed process title; the corrected check verifies the owned process/cwd and all three real replacements before recording final evidence. Superseded logs remain private for diagnosis.

### Measured local performance

Intel Core i3 M370, four logical CPUs, about 7.7 GiB RAM, Node 24.19.0, Bun 1.3.14, shared Linux developer host with observed disk pressure. Workload and raw measurements are in `performance-results.json`.

- 500 records / 227,783 JSON bytes: preview about 256 ms, import about 2.59 s; identical re-import skipped all 500.
- 20 authenticated reads, concurrency four: p50 about 189 ms, p95 about 1.50 s, max about 1.56 s.
- Three concurrent deterministic investigations: all completed in about 2.72 s.

These meet a modest local interactive budget (2 s p95 reads; 10 s for this import/concurrent investigation batch). They do not establish production capacity or a sustained-load SLO. Test representative real records, storage, database failure and deployment concurrency before setting production budgets. No inference latency is claimed without live providers.

## Integration proof matrix

| Integration | Implemented/tested | Actual operation | Missing dependency and next action |
|---|---|---|---|
| Zetaris | Typed supported UI-proxy adapter, owned-namespace registration plan/confirmation, two distinct tables, generated bounded join, source/row identity/value/time validation, mocked failures/pagination/scope tests | No real registration/query; local service image/version only inspected | Supply assigned account/org/token, workspace binding, permitted endpoints/tables. Review dry run, register only own datasets, execute join, import matching lineage, run `useZetaris:true`, retain returned rows/hash and resulting finding. |
| Meterless | Runtime 0.90 contract, real Bearer token/header rules, model discovery/auto-detect, 180 s text timeout, strict output tests | No authenticated Runtime completion; no Engine conformance claim | Configure own runtime token/origin/routing mode and consented workspace; run `check-integrations.ts` with a completed investigation. |
| NVIDIA Nemotron | Server-only base/key/explicit-model path, account discovery/model identity, grounded extractive structured explanation and citation/fact rejection tests | No live NVIDIA completion | Supply permitted key, select an actually available Nemotron model, consent the workspace, run the same grounded execution check and retain request/model metadata. |
| Gemini/OpenRouter Bumps vision | Original multimodal paths retained with lazy initialization and explicit missing-credential errors | Live image parsing blocked by missing vision credentials | Configure the original provider and run a real PNG/PDF parse plus critique/opening/layout stages. Manual fixture review is not vision proof. |

The official contract references and verification commands are in `docs/integrations/*`. Mocks, discovery and local source imports do not satisfy live sponsor execution or event qualification. No credentials from unrelated services were copied.

## Acceptance status and exact remaining actions

| Requirement group | Status/category | Next action |
|---|---|---|
| Original Bumps local deterministic workflow, source/observation history, contextual identity, conflicts/freshness, multi-source findings, reviewed simulator, actions, historical reports | Implemented and exercised locally | Rehearse with facility-owner permitted records and an independently reviewed connectivity survey. |
| Authentication, roles, tenant/building/project isolation, CSRF, private downloads, file/import validation, secret redaction, bounded external requests | Implemented; tested coverage as above | Conduct an independent threat review and operator-specific identity/account-recovery policy review before real sensitive data. |
| Durable leases, retry safety, actor revocation, fresh migrations, restore and application restart | Implemented and exercised in isolation | Rehearse DB/network interruption and forced mid-transaction process termination on the intended host; current recovery test uses an expired crashed-worker lease. |
| Actual Zetaris cross-source result and stakeholder federation proof | **Blocked by missing external access** | Configure authorized account, schema/table contracts and permitted sources; run and retain real query/finding proof. |
| Actual Meterless Runtime execution | **Blocked by missing external access** | Supply own valid runtime token and run grounded completion; obtain organizer qualification confirmation. |
| Actual Nemotron explanation and vision critique/parsing | **Blocked by missing external access** | Configure valid separate provider credentials/models; execute real acceptance cases. |
| Fully clean dependency audit | **Observed unresolved dependency issue** | Review/upgrade legacy development-tool dependency chains (`brace-expansion`, old tooling `esbuild`, tooling `zod`). Direct/runtime security dependencies were patched; do not suppress the residual audit. Run audit again and regression-test any cross-major tool changes. |
| Production deployment, TLS, hosted persistence, secrets/monitoring integration, actual Docker image/target-platform smoke | **Unverified infrastructure/operation** | Build images, provision approved TLS DB/private volumes/HTTPS ingress/secrets/supervisors, rehearse restore, run smoke/load/security checks. Local standalone runtime was tested; a hosted release was not performed. |
| Real building reconciliation and physical accessibility conclusion | **Blocked by missing permitted real records and physical verification** | Obtain matching directory/audit/maintenance records with IDs, dates, units and permission; have responsible reviewers confirm topology and measurements. |
| Automated scheduled source refresh/re-investigation | **Incomplete implementation** | Add an approved schedule/trigger policy using existing durable refresh/investigation jobs. Current refresh and follow-up investigation are explicit user actions. |
| Incremental remote synchronization | **Incomplete beyond connector capability** | Implement source-specific cursor/ETag contracts where offered. MBTA currently uses bounded full paginated snapshots; it does not claim a durable incremental cursor. |
| Complete generated OpenAPI request/response coverage | **Incomplete documentation detail** | Expand operation-specific schemas/examples from existing validated service contracts; inventory and core JSON Schemas are available now. |
| Evidence erasure/retention expiry, account recovery/password-management UI, per-source credential vault UI | **Incomplete operator-facing lifecycle features** | Agree policies and implement authorized maintenance/identity workflows before collecting applicable sensitive/personal records. Immutable evidence is deliberately not deletable through ordinary API routes. Secrets currently use server environment injection. |
| Large deployment backup scale, sustained concurrency and failure-injection performance | **Unverified capacity** | Test realistic volumes; current encrypted backup buffers archives and was verified with 11 files, not multi-gigabyte estates. Use a reviewed streaming/managed backup arrangement before large deployment. |
| Ownership/distribution rights | **Missing owner approval/license** | Obtain Bumps redistribution rights and review each dataset/provider's usage terms. Bundled font licenses/attribution are included. |
| Full UI/branding redesign | **Intentionally deferred by the user** | Build the later UI against the implemented APIs. Keep current Bumps editor, operational controls and evidence views functional. |

## Stakeholder proof and deferred UI

[stakeholder-value-and-proof.md](stakeholder-value-and-proof.md) maps each supplied stakeholder priority to an implemented service, user outcome, acceptance test, evidence and limitation. Action-oriented execution and durable contextual revalidation have local proof. Real sponsor federation and model execution remain explicit external gates; no stakeholder endorsement is asserted.

Deferred UI work: polished source-mapping wizard, visual entity-match/conflict review, graph authoring and route overlay, accessible evidence/finding detail pages, action assignment ergonomics, scenario comparison visualizations, branding/navigation consolidation and a redesigned dashboard. Current controls intentionally reuse existing styling and expose some structured JSON. Backend/domain state is implemented rather than replaced with speculative frontend fixtures.

## Production release order

1. Resolve ownership, facility-data permission and identity/retention policies.
2. Close residual dependency/tooling advisories and obtain independent security review.
3. Configure and execute the three actual sponsor paths and original vision pipeline; capture grounded proof.
4. Validate actual permitted facility records and reviewed graph/measurement assumptions.
5. Build deployment images; provision TLS database, private persistent uploads, secret injection, backups, supervision and monitoring.
6. Rehearse restore, failure recovery, host-native geometry, load and all acceptance tests on isolated deployment infrastructure.
7. Review the remaining lifecycle/scheduling/API documentation gaps and complete those required by the operator before admitting real users or publishing a production-readiness claim.

Bumps has been preserved and extended. The source is runnable in the extracted directory; the original backup remains recoverable. This delivery stops at a tested local system and honest release gates, without publishing or claiming unverified external execution.
