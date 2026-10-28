# Geometry benchmark, uncertainty review and reproducible demo delivery

Scope: these three Bumps deliverables only. No provider/model/key changes, dependency upgrades, unrelated UI redesign, Git operations, hackathon research or video production. All fixtures are synthetic and permitted for the configured free vision service. Source baseline and prior backups were preserved.

## Outcomes

- **Eight real PNG fixtures / eight structured live extractions / one passing raw geometry-and-uncertainty case.** Seven failed one or more boundary, door, host or feature-count checks. The successful ambiguous case still requires review. Raw JSON success does not demonstrate accurate geometry.
- **All eight raw exports blocked pending review.** No unresolved geometry was silently exported as authoritative. Physical-scale proposals remain untrusted until confirmed; incomplete but valid relative geometry can be explicitly provisional, not a fabricated measurement.
- **Actual UI demo PASS after explicit operator correction.** Original live extraction remains version2; current corrected/reviewed geometry is version11. Ordinary upload → actual parser/critique/doorway pipeline → review/correction → actual corrected-model critique and doorway audit → history/reopen → tactile validation → browser STL download completed. This is a real corrected workflow, not an uncorrected accuracy success or mocked inference.
- **Actual map and legend binaries PASS independent inspection:**122584bytes/2450triangles and420684bytes/8412triangles respectively; finite nondegenerate triangles, watertight, zero non-manifold edges, positive volumes. Both identify floor version11/current. Detailed verification and source/model hashes: [demo-verification.json](../reports/geometry-benchmark/demo-verification.json).

Full per-case errors and failure reasons: [benchmark](geometry-benchmark.md), [JSON](../reports/geometry-benchmark/results.cached.json), [table](../reports/geometry-benchmark/results.cached.md). Exact user steps, geometry truth, commands and STL checks: [demo runbook](geometry-demo-runbook.md).

## What changed

| Files / modules | Purpose |
|---|---|
| `apps/api/scripts/geometry-benchmark/generate.ts`, `tests/fixtures/geometry-benchmark/*` | Deterministic8 SVG→real PNG fixtures with independent machine-readable truth, deliberate missing/ambiguous cases and coordinate/unit contracts |
| `apps/api/scripts/geometry-benchmark/compare.ts`, `run.ts` | Real parser benchmark; bounded matching, dimension/percentage/boundary/door/host/count metrics, configurable tolerances, live receipts, fingerprinted replay and explicit export gates/failures |
| `apps/api/scripts/geometry-benchmark/demo-evidence.ts`, `check-stl.ts` | Read actual UI project, generate unapplied explicit operator corrections, verify history/provenance/current model inputs, download and inspect real STL bytes |
| `packages/floor-model/src/schema.ts`, `measurement-evidence.ts`, `index.ts` | Optional backwards-compatible `geometryEvidence`; typed extracted/inferred/user_corrected and qualitative review states, retained original values, explicit scale/dimension/opening/feature review, deterministic review/export policy |
| `apps/api/src/agents/parser.ts` | Optional annotation proposals separate from pixel geometry; unknowns stay null; no auto-confirmation of scale or invented dimensions |
| `apps/api/src/models.ts` | Server-owned edit provenance; optimistic correction saves, immutable history/current SVG retrieval, read-only corrected-model critique/doorway audit jobs and input hashes/live receipts |
| `apps/api/src/accessops/jobs.ts`, `store.ts`, `routes-workflows.ts` | Bounded durable `geometry-review` jobs under existing workspace scope and reviewer authorization; no repeated automatic model-job retries |
| `apps/api/src/tactile.ts`, `export.ts` | Review/invalidity gates plus existing stale-design protection; explicit provisional notes, filename, response header and STL header |
| `apps/api/src/geometry/stl-validate.ts` | Actual binary STL structural/topological validator |
| `apps/web/src/app/backend/[...path]/route.ts`, `apps/web/src/lib/geometry-export-proxy.test.ts` | Forward safe source-model/design/status download headers; real gateway handler regression with mocked current/provisional upstream results |
| `apps/web/src/components/map/measurement-review-panel.tsx`, `edit-step.tsx`, `wizard.tsx`, `export-step.tsx` | Small existing editor sidebar additions, specific reasons/edit/confirm forms, original values, read-only audit/history, canonical saved model/version propagation, provisional notices |
| `packages/floor-model/test/measurement-evidence.test.ts`, API measurement/benchmark tests, `tests/integration/geometry-review.test.ts` | Provenance, ambiguity, invalid corrections, legacy compatibility, rotated dimensions, review/export policy, source/current hashes and actual isolated persistence/authorization |
| `package.json`, `README.md`, these docs and `reports/geometry-benchmark/*` | Reproducible commands and truthful evidence |

No database migration is required: evidence is optional metadata in existing versioned floor-model JSONB. Existing schemaVersion1 records parse without invented provenance, and the UI explicitly says provenance was not recorded. The existing provider implementations, server environment, NVIDIA text path and lockfile are checked against the private baseline in the filesystem change manifest.

## Provenance and review policy

`extracted` means the model identified a feature/annotation in the source, **not** independently surveyed or verified. Derived readings are `inferred`; neither becomes trusted merely because a model repeats it. Qualitative states are `unreviewed`, `needs_review`, `reviewed`; no calibrated confidence percentages are invented. Existing model scores are retained but explicitly described as uncalibrated.

Important uncertainty targets include unknown/unreviewed physical scale, unavailable dimensions, weak/off-host/invalid doorways, invalid boundaries, model-proposed edits, unreviewed annotations and >10% disagreement between recorded dimensions and oriented bounding geometry. A missing annotation can legitimately be derived from reviewed scale; unknown dimensions are not replaced by exact values.

Only actual changed-and-saved user geometry gets `user_corrected`; unchanged confirmation retains its original source category. Original geometric/measurement values survive subsequent saves and historical versions. Browser and API corrections use current version checks, validation and existing workspace permissions. Incoming client metadata cannot rewrite an existing model's provenance. Model changes remain inferred and reviewable. New read-only model reviews save their exact input version/hash and suggestions without applying them over corrections.

New geometry with unresolved invalid/ambiguous/conflicting evidence blocks current tactile/export. Explicit relative-scale acknowledgment only permits the allowed missing-scale/dimension cases and keeps uncertainty visible. Otherwise valid but still unreviewed feature geometry is marked provisional automatically. Legacy geometry remains compatible with its previously available workflow; it has no retroactively fabricated provenance or validation guarantee. Historical source versions and stale-design checks are preserved.

## Verification classifications and evidence

- `LIVE_EXTERNAL`: eight actual parser inputs plus the explicitly rerun corrected low-resolution fixture. Exact model/provider/request times, image hashes, HTTP status200 and reported cost0 are retained in `reports/geometry-benchmark/extractions/`.
- `CACHED_LIVE`: final comparison of those immutable outputs; it makes zero new model calls. A first low-resolution drawing scale-label error was independently corrected and that case rerun; old inputs/results were preserved. The report-overwrite issue during early development was fixed with separate cached filenames and is disclosed in the benchmark document.
- `LIVE_END_TO_END`: actual browser ordinary upload and durable parse/critique/doorway workflow; operator corrections saved through the existing UI; actual corrected-model critique/doorway requests; persisted/reopened model and real exported STL. No mock results stand in for any of those calls.
- `UNIT` / `MOCKED_INTEGRATION`: deterministic schema, evidence, provider policy, malformed/model failure, fixture metrics and geometry regression tests. They do not prove live-model accuracy.
- `LOCAL_INTEGRATION`: isolated Postgres/Hono acceptance and geometry-review persistence/authorization tests; no live model is called by those fixtures.

The browser sequence was resumed on the same project after a web rebuild interrupted polling, an expired session, a selector error, a saved-version timing race and an asynchronous project-list check. These harness failures remain in private evidence; the intermediate correction report explicitly retains the history timing failure, and the resumed report proves the successful history/export checks. No answer was fabricated and no expected geometry was revised to fit inference. Post-restart browser testing also caught the existing gateway stripping source-model/provisional headers; the allowlist was corrected and tested for current/provisional exports without forwarding arbitrary upstream credentials. The new web regression initially used Bun-only test types, which the web workspace intentionally lacks; it now follows the existing `node:test`/`node:assert` convention with the same16assertions, rather than adding dependencies or excluding tests from compilation. New read-only audits were made durable after synchronous proxy timeouts exposed the need; they use existing jobs and bounded provider calls.

The corrected live critic returned `needs_refinement`, empty findings, and proposed low confidence for some correct reference features. Its advice remains recorded and unapplied. Do not present this as model approval or independent geometry verification. The doorway audit also remains a proposal; deterministic validation and explicit user review control export.

## Remaining limits

The tiny synthetic sample has no statistical representativeness, and7/8 raw geometric failures prevent a defensible claim of unattended plan accuracy. Door swings are unsupported by the schema. Bounding dimensions do not establish clear widths, internal area or regulatory compliance. Feature-origin labels depend on model-reported annotation/derivation where no independent OCR exists. A closed but semantically wrong boundary can pass structural validity; the benchmark exposes those errors, and unreviewed geometry remains provisional pending human inspection. STL topological checks do not certify printability or real-world accessibility. No new live NVIDIA text call was needed or claimed; its implementation/configuration and existing policy regressions are preserved.

Current dependency audit findings are reported below without modifying unrelated dependencies. Keep any real building data subject to workspace/provider consent. No screen recording, video framework or demo video was created.

## Final checks

Every entry below was executed in this task; no earlier report's test counts are substituted. Private logs and command/result JSON live under `.accessops-local/geometry-benchmark/`; safe command outcomes are copied to [check-results.json](../reports/geometry-benchmark/check-results.json). Failed attempts remain alongside successful reruns; no assertions were removed or timeouts enlarged.

| Command / check | Classification | Actual outcome |
|---|---|---|
| `bun run test` | UNIT / MOCKED_INTEGRATION | Exit0;314pass,0fail,1138Bun expect calls plus16explicit Node assertions in the two gateway tests,34files,27.33s test runtime; original editor/geometry/repair, ingestion, provider/fallback policy and new uncertainty/benchmark tests included |
| `ACCESSOPS_INTEGRATION=1 bun run test:integration` | LOCAL_INTEGRATION | Exit0; two separate process cases,186existing acceptance assertions plus21new geometry/history/correction assertions =207;42.21s total; isolated local Postgres only |
| `bun run typecheck` | STATIC | Exit0 across all workspaces after correcting a route-param optional-string type error; no runtime/provider change |
| `bun run lint` | STATIC | Exit0;0errors,6warnings (five existing image warnings and one added historical-SVG image warning); no lint suppression added |
| `bun run security` | STATIC | Exit0;source-secret boundaries report no failures |
| `bun audit --json` | SECURITY | Exit1;one low-severity advisory in unchanged dev-tool dependency chain, detailed below |
| `bun run build` | BUILD | Exit0; final API+web production build including gateway fix passed in33.32s |
| `bun run benchmark:geometry --live` with documented directory/workspace input | LIVE_EXTERNAL | Exit1 is the honest accuracy result:8structured outputs,1scored geometry/uncertainty pass; all raw exports blocked for review. Revised05 alone also exited1 |
| `bun run benchmark:geometry --cached` with the same directory | CACHED_LIVE | Exit1;reproducibly rescored8actual saved live outputs,1pass; no new calls, no mocked outputs |
| `bun run demo:geometry --project=01a17f95-3703-7000-885c-2d2e25b59271` with documented directory/login stdin | LIVE_END_TO_END verification of persisted results | Exit0;9checks true; map and legend binary inspections pass. Verification itself makes only local authenticated requests; underlying extraction and saved reviews have real live receipts |
| Headless Chromium CDP against `http://localhost:3400`, private `browser/extract.mjs` and `browser/correct-export.mjs --resume-export` | LIVE_END_TO_END | Real ordinary upload/parse, explicit UI edits, current-model critique/audit, history reopen and actual downloaded STL; staged browser JSON retains both intermediate failure and successful resume |

The original combined integration attempt under simultaneous build/typecheck/lint load passed its existing186assertions but the new21-assertion case hit its unchanged30s limit after19assertions. Running the same two-case suite without the competing build passed; the new case took3.66s. A preceding standalone local run had also passed21assertions in3.52s. This was not solved by deleting assertions or increasing timeouts. The current unit suite also passes at its existing limits.

### Dependency observation, deliberately outside implementation scope

The current audit discovers `deepmerge@4.3.1`, low severity, [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), vulnerable range>=4.2.0 <=4.3.1. `bun why deepmerge` identifies the unchanged development-only paths `web → shadcn@4.22.2 → deepmerge` and `web → shadcn → @shadcn/registry@0.2.1 → deepmerge`. It concerns prototype poisoning of returned merged objects. No production exploit was demonstrated by this audit; it is not a clean audit or proof of safety. This geometry-only task does not alter unrelated dependency resolution. Next action: separately assess a compatible patched upstream dev-tool/deepmerge update and rerun its audit/tests. No advisory was suppressed, and the lockfile remains identical to baseline.

### Recoverability and preservation

Original source archive/hash manifest: `/home/kingghidorah/Documents/projects/bounties/bumps-geometry-baseline-20261027T223522Z/`. Do not overwrite it. Current filesystem changes/diff: `.accessops-local/geometry-benchmark/change-manifest.json` and `source.diff`; these intentionally exclude secrets, dependency directories and generated runtime trees. No original source was deleted. Provider implementations, configured API environment, NVIDIA text implementation and `bun.lock` are byte-for-byte unchanged from the baseline; no Git commands were used. Existing database/services and unrelated user files were preserved. The test harness pauses/restores only its owned worker for deterministic recovery assertions and creates independent test tenants, not a reset database.

### Remaining actions and honest readiness

Use a controlled demonstration with source inspection and human review. Do not claim unattended geometry accuracy or production readiness:7/8raw cases fail, and the critic's imperfect advice remains visible. Improve extraction quality in a separate approved task without tuning expected answers to model output; confirm ambiguous geometry and scale before manufacturing/operational use. The low dev-tool advisory needs separate dependency review. Unavailable live inference must remain a real failure with existing manual/deterministic paths available. No NVIDIA text integration or Meterless qualification status is altered by these geometry results.


### Final restarted application check

The final packaged production web build was loaded on localhost3400, and the updated API/worker were restarted using only their recorded owned processes. **Eight of eight final read-only browser checks passed**: corrected version11/80px/m; visible measurement panel; specific user-corrected door; original extracted version2 reopened; history did not overwrite current edits; actual122584-byte STL with version11/current headers; anonymous read denied401; fresh page load preserved provenance. See [post-restart browser evidence](../reports/geometry-benchmark/browser-post-restart.json). The gateway's corrected source-model/design/provisional headers are now verified through the actual browser, not only a mocked test.

The persisted-demo verifier was also rerun against the restarted backend: all9 checks and both actual STL inspections passed, without another inference request. Standalone `check-stl.ts` commands on map/legend both exited0. Root typecheck passed all workspaces; after the final gateway test change, the web-specific `bun run --cwd apps/web typecheck` passed too. Final full lint exited0 with6warnings/0errors; final API+web build exited0. Full unit suite314pass/0fail; local acceptance and geometry suite2pass/207Bun assertions. Mocked proxy cases keep their16Node assertions; tests were adapted to the existing web test runner convention rather than excluded from production type checking.

Exact-secret scans cover configured OpenRouter, Groq, Gemini, NVIDIA, Zetaris password and local-login secret values without printing them, including source, browser bundles, synthetic evidence and private task logs. No matches were found. Unconfigured Meterless/Zetaris API tokens were not represented as present or tested. The source secret-boundary script also passes. `bun audit --json` remains the independently reported one low dev-tool advisory; no zero-advisory claim is made.

Final exact-secret scan:589text files checked, no matches. Source-boundary security check exits0. Preserved provider/environment/lockfile checks are recorded in [preservation.json](../reports/geometry-benchmark/preservation.json). Local web3400 and API3403 readiness both return HTTP200 after the final restart.
