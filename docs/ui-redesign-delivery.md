# AccessOps LastMile reuse and UI delivery

## Current selected image provider

OpenRouter `nvidia/nemotron-3.5-super-vl:free` now passes genuine synthetic PNG/PDF Bumps parser/critique/doorway workflows and persistence. Direct NVIDIA Nemotron Lightning text remains independently verified and unchanged. Runtime is still blocked by token/origin; Engine8/8 is separate. No UI redesign or video was created in this pass. Free-only routing and workspace permission remain enforced. See the [latest evidence](vision-provider-evaluation.md); earlier Gemini/Omni failures below describe historical providers, not selected-image failure.

## Earlier evidence (historical; superseded by the current checkpoint above)

Current replacement-key update: Google model discovery succeeds, but actual synthetic-image requests to3.5 Flash,3.5 Flash-Lite and3.8 Flash all return403: this project cannot use the Gemini API free tier. No billing was enabled; no vision extraction succeeded. NVIDIA text settings are unchanged. See the latest [integration record](live-integration-verification.md). Earlier service-busy and missing-key statements below are historical.

Current image-provider checkpoint: [vision evaluation](vision-provider-evaluation.md) selects Gemini 3.6 Flash. The approved test key is now configured; actual requests are blocked by Google HTTP503/high demand. NVIDIA text remains separately live-verified; NVIDIA/Omni vision descriptions below are historical. See [current integration status](live-integration-verification.md) and [hackathon evidence](hackathon-requirement-evidence.md).

Latest hardening checkpoint (27 October 2026): [final technical delivery](accessops-final-hardening-delivery.md), [vision verification](vision-integration-delivery.md) and [dependency remediation](security-dependency-audit.md) supersede older vision/security counts below. NVIDIA text fallback remains verified; the selected Omni vision model passed real image controls, while full clinic-plan parsing still hit 503/timeouts and a final additional control failed transcription. Dependency audit is now zero. UI design and existing evidence are preserved.

Latest provider update: [Meterless Runtime Status and NVIDIA Nemotron Fallback](live-integration-verification.md#meterless-runtime-status-and-nvidia-nemotron-fallback). Current default is policy-controlled `auto`; missing Runtime is optional for operation, and a new real NVIDIA fallback run passed. Earlier counts/status descriptions below describe the prior checkpoint. See [fallback delivery](meterless-runtime-fallback-delivery.md) for this run.


**Delivered: working local AccessOps/Bumps application, consistent landing/workspace design, genuine NVIDIA text execution and Zetaris reference-data consumption. Production readiness and full sponsor compliance are not claimed. No demo video or video project was created.**

Source: `/home/kingghidorah/Documents/projects/bounties/bumps-main`. LastMile's exact existing folder was inspected read-only. No Git metadata was assumed or created; original user files/configuration and databases were retained.

## What changed

- Actual installed Zetaris login/query-start adapter, strict bounded read-only transport, org/request headers and explicit partial/error states; original SQL-editor adapter retained for explicit distribution selection. No guessed external registration was executed.
- Real licensed Meterless World Model snapshot and conformance facade. Actual immutable source observations flow through a scoped Engine projection before investigation/re-explanation; Postgres, reviewed identity and deterministic graph rules stay authoritative.
- NVIDIA is the normal configured explanation provider. Actual frozen-evidence explanation runs through an explicit consented, one-attempt durable job. History/evidence is unchanged. Thinking disabled for the documented Lightning path; strict model/schema/citation/claim validation retained. Optional private redacted visible-response diagnostics identify real provider failures.
- NVIDIA multimodal adapter for Bumps, preserving original Gemini/OpenRouter implementations and schema/geometry boundaries. The tested Super VL response is rejected on its undocumented serving model identity; no successful live vision parsing is claimed.
- Hash-bound raw external query receipts, derived reported schema observations, source coverage finding and additive `0009_source_scope.sql` category for non-building reference areas. No operating data was forced into floor-model geometry.
- Protected project listing and building-scoped action lists for the real UI. Append-only reviewer observation verification remains authorized. Worker waits for unavailable Postgres at startup and shuts down gracefully; it does not acknowledge queued work before a successful heartbeat.
- Complete shared design language: existing Bumps logo artwork, licensed local Geist fallback, remote Inter/Bubbledot, supplied external background-video URL and FontAwesome integrity, monochrome tokens/pills/dot headings, responsive sidebar, compact tables/split panes, accessible state components, menus and investigation tabs.
- Functional screens for sources/import/provenance, identity review, graph editing/review, investigations/evidence/provider history, scenarios, owned approved actions/verified resolution, projects and administration. Original map editor/tactile/history/export remains available. No fabricated dashboard values.

## Routes / modules

`/` landing; `/product`, `/case-studies`, `/contact` real destinations; `/dashboard`, `/projects`, `/sources`, `/entities`, `/graph`, `/investigations`, `/investigations/[id]`, `/scenarios`, `/actions`, `/settings`, `/operations/advanced`; `/operations` redirects to the dashboard. Existing informational/pitch routes retained. `/map/[id]` retains the original Wizard/canvas and export flow with a compact brand bar.

Frontend: `apps/web/src/components/{brand,workspace}/*`, `(landing)` and `(workspace)` app routes, `styles/accessops-{brand,workspace}.css`, `data/accessops-ui.ts`, `lib/accessops.ts`, root/map layouts and error/loading boundaries. Backend: `providers/{integration-environment,zetaris-gateway,explanation,workspace-scope}.ts`, `agents/nvidia.ts`, `accessops/{world-model,stored-explanation,investigation,jobs,routes-*,imports,schema}.ts`, projects routing and worker. Typed domain additions and regression tests are in `packages/accessops` and API test modules. Exact file sizes/hashes are in the change manifest.

## Commands and observed checks

Bun 1.3.14, Node 24.19.0, Postgres17, shared Linux developer machine. Existing lockfile/runtime versions preserved; no application dependencies were added in this phase. Prettier3.6.2 was used as an ephemeral formatting tool; root `bun.lock` is unchanged from baseline. Use installed Bun (`.accessops-local/bin/bun` in this workspace) on PATH.

```sh
bun install --frozen-lockfile
# Existing configuration is already present here; never overwrite it.
bun run --cwd apps/api db:migrate
bun run dev --web-port=3400
bun run test
bun run typecheck
bun run lint
bun run security
bun audit --json
bun run build
ACCESSOPS_INTEGRATION=1 bun run test:integration
```

`bun run setup` is for a fresh template initialization, not a replacement for this existing private configuration. Authenticated bootstrap/demo commands are in README and the demo runbook. Providers are configured server-side and require explicit workspace consent. No password/key should be placed in command arguments or pasted into chat.

| Check | Status / exit | Evidence |
|---|---|---|
| Unit + mocked provider + actual Engine projection suite | **PASS**, 180 tests, 711 assertions, 25 files; exit 0 | `unit-final.log` (115.53s on shared host) |
| Local Postgres/API/controlled-worker acceptance | **PASS**, 1 end-to-end test / 163 assertions; exit 0 | `local-integration.log` (75.30s) |
| Existing LastMile mocked source/provider tests | **PASS**, 70 tests / 4 files; exit 0 | `lastmile-tests.log` |
| Real vendor Engine conformance | **PASS**, 8/8; exit 0 | `engine-conformance.log` |
| Type check after fixes | **PASS**, all workspaces; exit 0 | `typecheck-verified.log` |
| ESLint | **PASS with 5 warnings**, 0 errors; exit 0 | `lint-verified.log`; existing ordinary img recommendations, no rule disabled |
| Production build | **PASS**, API and Next; exit 0 | `build-final.log`; current running web built from source |
| Source secret-boundary check | **PASS**, exit 0 | `security.log` |
| Actual configured-secret scan | **PASS**, 347 text files/client bundles/docs/response evidence; no configured key/password matches, exit 0 | `secret-boundary-result.json` |
| Dependency advisories | **FAIL/open**, 8 findings (5 high / 3 moderate), exit 1 | `dependency-audit.json`; brace-expansion, esbuild and nested Zod, not suppressed |
| Migration0009 on own existing DB | **PASS**, exit 0 | `migrate.log`; additive category only |
| Fresh isolated migration + idempotent reapply | **PASS**, both exit 0, 31 public tables | `fresh-migrations.log`; new DB only, existing DB not reset |
| Worker startup with unavailable DB | **PASS — LOCAL_INTEGRATION**, remains alive, reports dependency failure, graceful stop; exit 0 | `worker-startup-result.json` |
| Actual provider/history persistence after owned services restart | **PASS — LOCAL_INTEGRATION**, unchanged evidence hash, accepted provider run reopened, no new inference | `restart-evidence-result.json` |
| Browser | See exact results below | `browser-results.json`, browser logs and PNG evidence |

The interruption included a real host/database shutdown. Postgres's existing volume performed crash recovery; no reset or unsafe recovery command was used. Readiness returned503 while unavailable. An initial worker heartbeat failure was corrected so startup waits rather than exits. The subsequent isolated offline-worker test verifies the fix. Original archived baseline/backups were not overwritten.

The earlier original-product verification includes backup/restore and representative load evidence in `implementation-delivery.md`; those numbers describe that earlier checkpoint, not a new capacity benchmark. This phase repeats migrations/restart/acceptance and the relevant source/geometry regressions. No production load, external outage failover, cloud deployment, or operational certification is claimed. Browser automation startup/cached-session/collapsed-details waits were corrected; prior failed logs remain available rather than being relabelled passes.

## Browser evidence

Desktop 1440×900, mobile390×844; current production runtime through the real same-origin authenticated gateway. Checks exercise exact landing content, four/two-column first viewport, menu state/dismissals, reduced motion, video failure fallback, real login, all operational routes, persisted external evidence, original editor/reopen, and actual source/investigation/scenario/action workflows where listed. PNGs are verification artifacts, not a rendered video. Original confidential evidence/configuration is not public fixture material.

| Check | Result |
|---|---|
| desktop landing first viewport | PASS |
| real marketing /product | PASS |
| real marketing /case-studies | PASS |
| real marketing /contact | PASS |
| mobile landing fits | PASS |
| mobile menu state | PASS |
| Escape dismissal | PASS |
| overlay dismissal | PASS |
| desktop resize dismissal | PASS |
| reduced-motion final content | PASS |
| failed video remains usable | PASS |
| anonymous API denied | PASS |
| real login and workspace | PASS |
| operational route /projects | PASS |
| operational route /sources | PASS |
| operational route /entities | PASS |
| operational route /graph | PASS |
| operational route /investigations | PASS |
| operational route /scenarios | PASS |
| operational route /actions | PASS |
| operational route /settings | PASS |
| operational route /operations/advanced | PASS |
| real external evidence finding shown | PASS |
| source evidence visible | PASS |
| original Bumps editor opens | PASS |
| editor reopens persisted geometry | PASS |
| browser import preview | PASS |
| browser idempotent import commit | PASS |
| browser investigation form completes | PASS |
| browser scenario changes reachability | PASS |
| browser owned action proposal | PASS |
| browser human approval | PASS |
| browser evidence-backed resolution | PASS |
| mobile operational /dashboard | PASS |
| mobile operational /sources | PASS |
| mobile operational /graph | PASS |
| mobile operational /investigations | PASS |
| mobile operational /actions | PASS |
| uncaught browser exceptions | PASS |
| actual browser remote assets | PASS |
| small viewport 320x568 | PASS |
| small viewport 720x700 | PASS |

Browser outcomes above are generated from the actual recorded results, not assumed from compilation. See the associated JSON for route headings, alerts, overflow and failed conditions. Prior browser logs preserve investigation into environment and test-instrumentation failures. Automated checking is not a full WCAG certification or exhaustive assistive-technology audit.

## External integration truth

See [full live verification](live-integration-verification.md). NVIDIA text inference is genuinely consumed/persisted in AccessOps. Zetaris returns actual independent source rows and contributes a bounded schema-coverage finding; attempted joins timed out, and no positive indoor federated finding is claimed. Meterless Engine is real/local and passes conformance; authenticated Runtime execution is blocked by missing endpoint/token. Live vision HTTP200 output failed model identity, so no unverified geometry was saved. No paid provider/deployment was used as fallback; advertised trial endpoints are not a guarantee of future free availability.

## Preserved behavior and stakeholder proof

The 163-assertion local acceptance covers independent sources/idempotence, canonical identities, ambiguity/conflicts/freshness, reviewed graph/reachability/scenario isolation, durable investigation/history, approved owned action, relevant fresh verified resolution and recalculation. It additionally covers tenant/building/project isolation, provider consent, raw snapshots, job recovery, immutable evidence, stale current STL rejection, regeneration and historical design retrieval. Original 15 Bumps test files remain byte-identical to their original baseline. PNG/PDF processing and deterministic geometry/editor/tactile/repair/legend/map STL tests pass; live AI image parsing remains explicitly blocked.

[Stakeholder value-to-proof](stakeholder-value-and-proof.md) maps execution-to-action, governed source lineage, historical context and deterministic engineering to real services/tests. The actual Engine/provider evidence supplements those priorities without implying endorsements or replacing missing indoor federation proof.

## Recovery and remaining gates

Baseline: `/home/kingghidorah/Documents/projects/bounties/accessops-ui-baseline-20261027T003603Z`, two source archives and SHA-256/size manifests. Earlier original Bumps baseline remains at `/home/kingghidorah/Documents/projects/bounties/accessops-baseline-20261026T213809Z`. Current changes: `.accessops-local/ui-phase/change-manifest.json`, `integrity-summary.log`. LastMile baseline files remain unchanged; no original source files were removed, no Git initialized, no root dependency lock changes.

1. **BLOCKED — external access/data:** provide permitted indoor directory/operational views and identifiers; obtain a successful genuine federated result that materially supports a real building finding. Resolve sample join timeouts; do not call connection-only or geographic coverage evidence full compliance.
2. **BLOCKED — external access:** provide authorized Runtime URL/token if required by the event; run frozen-evidence completion and record actual consumption. Organizer must confirm Engine-path qualification.
3. **BLOCKED — observed provider behavior:** obtain authoritative confirmation of the Super VL serving alias or a currently free available documented vision alternative, then rerun extraction/critique/doorway stages. Validation remains strict; Gemini/OpenRouter need separate authorized credentials. Notify owner before paid usage.
4. **OPEN — security:** remediate inherited dependency advisories with compatible upstream tooling/SDK updates and revalidate. Existing tests/alerts are not weakened to produce a clean audit. No production-ready claim until addressed or formally assessed.
5. **OPEN — deployment/operations:** approve hosting/secrets, original project/asset/data licensing, external monitoring, HTTPS/session origin config, persistent upload volume, backup schedules/restore drills, retention and production load/security review. Prepared deployment/runbooks remain available; no deployment was performed.
6. **OPEN — public claims/assets:** confirm/remove reference adoption/performance claims before public use. They are visibly marked unverified. Confirm remote font/video rights and target-browser availability. No nonexistent logo.webp or local Bubbledot font is claimed.
7. **NOT RUN — exhaustive acceptance:** no full manual screen-reader/keyboard audit of every original editor tool, cross-browser matrix or production dataset assessment. Existing deterministic/browser regression proof is scoped above.

## Design handoff / deferred work

[ui-design-system.md](ui-design-system.md) preserves complete shipped tokens/CSS, typography/CDNs/SRI, logo/font paths, video URL, animations/easing/delays, breakpoints, menu/focus rules, route/component map and truthful future evidence. Use the actual app/components for any later walkthrough. No independent fake dashboard is needed.

Intentionally deferred: video production of any kind, narration/timelines/MP4, new illustrative asset generation, marketing-claim confirmation, broader usability/accessibility studies and optional editor-specific micro-polish. Some operational lists are bounded to their first API page; full pagination/filter tooling and an exhaustive accessibility audit remain follow-up work. Interrupted provider intent records may require operator reconciliation; automatic replay is deliberately disabled. The landing and operational UI redesign itself is implemented; this is not a proposal to defer it.

Current local endpoints: web `http://localhost:3400`, API/ready `http://127.0.0.1:3403/ready`; worker separate. Private process manifest identifies only task-owned services. Credentials remain private. Stop/start via documented application commands without changing unrelated LastMile/Zetaris services.
