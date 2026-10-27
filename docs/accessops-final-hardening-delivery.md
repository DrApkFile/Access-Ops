# AccessOps final technical hardening delivery

## Current free-vision delivery — 27 October 2026

**Selected vision: OpenRouter `nvidia/nemotron-3.5-super-vl:free`, verified LIVE_END_TO_END. NVIDIA text remains direct `nvidia/nemotron-3.5-lightning-30b-a3b` and passed a fresh real investigation.** Earlier Gemini/Omni blockers below are historical for those separate paths, not the current selected vision status. No video, account upgrade, paid fallback or external deployment was created.

### Candidate evidence and decision

1. Groq was checked first: the supplied key authenticated and its catalog listed exact `qwen/qwen3.8-27b` active. Its free-plan billing status is not exposed by that discovery API, so image execution waited for owner confirmation. The owner confirmed Free plan/no billing and synthetic-image permission. The actual image request then returnedHTTP200 in7974ms with the exact model, `stop`, and account headers1000 requests/day and8000 tokens/minute, matching the documented free limits. The Bumps parser schema and labels passed, but spatial content **FAILED**: the partition doorway was at(300,135) instead of the drawn(300,200), and the bottom perimeter at232 instead of350. This was neither an authentication failure nor timeout. No bad geometry was accepted into a project and the oracle was not relaxed. Groq is not selected.
2. OpenRouter `/api/v1/key` returnedHTTP200 and `is_free_tier:true`. Its authenticated catalog did not contain `qwen/qwen-vl-plus:free`; an actual request returnedHTTP404 explicitly saying no provider serves it anymore. No paid similarly named model was substituted.
3. Exact `nvidia/nemotron-3.5-super-vl:free` exists, accepts image input and advertises zero input/output prices. An initial real request with default reasoning and4096 output tokens returnedHTTP200 but `finish_reason:length`; it was rejected. With the documented `reasoning:{enabled:false}` and8192 cap, the actual Bumps prompt on the known synthetic floor plan returned `stop`, schema-valid and content-valid geometry in4300ms,750 completion tokens and reported cost0. Both changes are recorded; this is not a claim that HTTP200 alone proves extraction quality.

The user-approved source is the existing own synthetic `two-room-plan.svg`, not a confidential building. Original Bumps remains Gemini/Google ADK with optional OpenRouter as identified in the archived baseline below; this is an extension of its current replaceable vision boundary, not a blind restoration or NVIDIA text change.

### Actual representative-image and workflow results

All new results below are from the actual Google-independent OpenRouter image endpoint, with exact reported model identity, serving provider `Nvidia`, HTTP200, reported cost0 and source hashes. The crop is only a transcription check; small/full/PDF parser cases also validate room labels and sides, partition doorway, stairs, absence of invented elevator, strict geometry bounds and unknown physical scale. They persist/reopen only accepted unreviewed proposals. Full-plan processing retains the entire image and all four detail tiles with full-source coordinate annotations; no region is silently dropped.

| Fixture | Pixels | Images sent | Classification | Result | Total elapsed ms |
|---|---|---|---|---|---|
| small | 600×400 | 1 | LIVE_END_TO_END | PASS | 6050 |
| crop | 450×600 | 1 | LIVE_EXTERNAL | PASS | 1144 |
| full | 1800×1200 | 5 | LIVE_END_TO_END | PASS | 14276 |
| pdf | 1667×1112 | 5 | LIVE_END_TO_END | PASS | 31691 |
| invalid | —×— | — | LOCAL_INTEGRATION | PASS | — |

Additionally, the genuine user workflow was exercised through the existing API and durable worker, not by injecting a saved floor model:

- PNG project `01a17f6d-742b-7000-9c18-e75d9a107b4d`: upload201 → parse202 → live parser → live image critique → live doorway audit → parsed state → version2/history/reopen; all10 content/provenance checks PASS in28837ms.
- PDF project `01a17f6e-4a74-7000-9154-58c5539f18f0`: actual PDF upload/rasterization, whole page/details, same parser/critique/audit and persisted history; all10 checks PASS in86706ms. Its longer critique is within the two-attempt bound and is not an SLA.
- Actual provider receipts contain `provider:openrouter`, exact model ID, serving provider, timestamp, HTTP status, latency, zero reported cost, request ID and original/sent image hashes. Geometry remains `unreviewed_ai_extraction`; the model's confidence is not independent verification.
- Historical PNG/PDF content hashes and receipts survived an API/worker restart. The existing editor, human correction/review and tactile/export gates are retained. These synthetic observations do not establish accuracy on complex real building plans, physical measurements, accessible routes or certified compliance.

Private evidence root: `.accessops-local/free-vision/`. Safe receipts: `discovery.json`, `groq-qwen_qwen3.8-27b-probe.json`, `openrouter-qwen_qwen-vl-plus_free-probe.json`, `openrouter-nemotron-initial-truncation.json`, `openrouter-nvidia_nemotron-3.5-super-vl_free-probe.json`, `evaluation-ready/evaluation.json`, `workflow-small/workflow.json`, `workflow-pdf/workflow.json`, `live-text-ready/verification.json`, `final-state.json`. Credentials/private environment backups are deliberately excluded from public evidence.

### Implementation, failure behavior and policy

To configure a permitted local environment, edit only these fields in private `apps/api/.env`; keep existing NVIDIA text/provider settings. Merge the approved workspace into the existing global consent list rather than removing other entries:

```dotenv
VISION_PROVIDER=openrouter
OPENROUTER_API_KEY=<private-openrouter-key>
OPENROUTER_VISION_MODEL=nvidia/nemotron-3.5-super-vl:free
OPENROUTER_VISION_MAX_OUTPUT_TOKENS=8192
ACCESSOPS_OPENROUTER_VISION_WORKSPACES=<approved-public-or-synthetic-workspace-id>
# Existing ACCESSOPS_PROVIDER_WORKSPACES must also include that workspace.
```

Restart the ordinary API and worker after changing server environment. A fresh template has no workspace/key preapproved. This task enabled only the owner's already authorized synthetic-test workspace. Groq credentials were stored privately for the approved candidate test but are not an active vision route. No additional SDK/dependency was needed for vision.


`apps/api/src/agents/openrouter-vision.ts` implements the fixed HTTPS image/JSON contract using existing bounded HTTP and RGB-PNG preprocessing. `providers/vision-selection.ts` admits only this exact free model for `VISION_PROVIDER=openrouter`; `agents/vision.ts` routes images independently of NVIDIA text. Before each inference the adapter validates the current free account plus catalog image/JSON capability and zero pricing. Each request pins the exact `:free` ID, disables provider fallbacks and sets prompt/completion/request/image maximum prices to0. There is no model-array, paid route or text-only substitute.

The existing global workspace permission AND `ACCESSOPS_OPENROUTER_VISION_WORKSPACES` are required. Only the approved local synthetic workspace was enabled; other workspaces retain consent boundaries. Key presence is not a claim of healthy inference. Configuration/readiness remains separate from actual execution evidence. Private keys are in server-side environment files0600; none is in client code or reports. OpenRouter/NVIDIA's free endpoint forbids confidential/personal inputs and may log for product improvement; use only approved public/synthetic plans under its terms.

PNG/JPEG/WebP decode/MIME,5MiB/image,4-million-pixel/image,16-image and19MiB serialized-request limits apply before sending. PDF rendering is unchanged. Output is capped, must stop normally, match actual model identity and parse as an object; secret echoes, truncation, unsupported identity and malformed responses fail. Existing agent-specific schemas, geometry normalization/validation, human review and source attribution stay downstream. HTTP401/403,404,429,5xx and network/timeout have separate safe codes; only eligible transient failures receive one bounded HTTP retry with existing backoff,60s per attempt. Permanent access/model/input errors are not retried. Ordinary deterministic/manual workflows stay available. `VISION_PROVIDER=none` explicitly disables inference; Gemini/legacy NVIDIA remain explicit compatibility options, never automatic fallbacks.

Text provider code, endpoint/model, consent/fallback restrictions and frozen evidence are unchanged, verified by private before/after comparison. New real text result: `live-text-ready/verification.json`; Runtime explicitly skipped with no request because token/origin are absent. Meterless Engine8/8 is local conformance, not Runtime access or hackathon qualification. Prior genuine Zetaris coverage receipts remain; no new federated/indoor-data result is claimed.

### Verification commands and outcomes (newly executed)

Run from root with Bun1.3.14 on PATH; credentials travel only via private environment/stdin. Each `*.result.json` captures exact argv, exit code, UTC time and duration.

| Command | Exit | Result/classification |
|---|---|---|
| `bun test apps/api/src/agents/openrouter-vision.test.ts apps/api/src/agents/gemini-vision.test.ts apps/api/src/agents/vision-fixtures.test.ts` | 0 | UNIT / MOCKED_INTEGRATION,61 tests/168 assertions |
| `bun run test` | 0 | 289 tests,1033 assertions,30 files; deterministic/mocked/local, not live AI |
| `bun run test:integration` | 0 | LOCAL_INTEGRATION: isolated PostgreSQL,1 test/186 assertions; Bumps editing/history/tactile/map+legend STL, stale export, permissions and AccessOps workflow |
| `bun run typecheck` | 0 | All workspaces |
| `bun run lint` | 0 | 0 errors;5 pre-existing img-element warnings |
| `bun run security` | 0 | Source secret-boundary checks |
| `bun audit --json` | 0 | 0 advisories; preceding audit found1 new qs issue |
| `bun install` | 0 | Targeted qs patch; no major upgrades |
| `bun install --frozen-lockfile` | 0 | Manifest and Bun lock agree; no changes |
| `bun run build` | 0 | Bun API + Next production build |
| `env WORLD_MODEL_IMPL=./apps/api/src/accessops/world-model-engine.ts node --experimental-transform-types apps/api/vendor/meterless-world-model/conformance/runner.ts` | 0 | LOCAL_INTEGRATION:8/8, distinct from Runtime |
| `node .accessops-local/free-vision/browser/browser-check.mjs` | 0 | LOCAL_INTEGRATION:43 actual desktop/mobile workflow checks |
| `node .accessops-local/free-vision/browser/browser-assets.mjs` | 0 | LOCAL_INTEGRATION:3 real asset/small-viewport checks |
| `bun .accessops-local/free-vision/qs-verification.ts` | 0 | Patched6.16.1 handles both hostile comma-array variants without an uncaught exception |
| `bun --env-file=apps/api/.env .accessops-local/free-vision/final-state.ts` | 0 | Web/health/readiness200; NVIDIA config unchanged; PNG/PDF historical hashes and provider receipts survive process restart |

Live commands (all exit0 after local service recovery; individual inference/content results above are authoritative):

```sh
INTEGRATION_EVIDENCE_DIR=/absolute/private/evaluation API_URL=http://127.0.0.1:3403 \
  bun run --cwd apps/api scripts/evaluate-vision.ts --live --persist < /private/admin-login.json
INTEGRATION_EVIDENCE_DIR=/absolute/private/workflow API_URL=http://127.0.0.1:3403 \
  bun run --cwd apps/api scripts/verify-vision-workflow.ts --live --fixture=small < /private/admin-login.json
# Repeat the second command with --fixture=pdf and a new evidence directory.
INTEGRATION_EVIDENCE_DIR=/absolute/private/text API_URL=http://127.0.0.1:3403 \
  bun run --cwd apps/api scripts/verify-live-integrations.ts \
  --investigation=01a17b01-d49b-7000-8f4b-89e3bf4ea3dd --complete-nvidia --auto-fallback < /private/admin-login.json
```

Preserved failures and fixes: initial selected-model unit expectation still rejected OpenRouter, so it was updated to assert the newly supported free model plus rejection of unknown providers. No assertion/timeout was removed. The new workflow script initially used unavailable ambient `BodyInit`; `RequestInit['body']` fixed the type error. An initial local evaluator failed because the pre-existing Postgres container was stopped and had lost its bridge attachment after a failed port bind. Only that owned container was restarted/reconnected; its volume/database were retained, not reset. The first browser harness run lacked its private fixture manifest; a fresh real synthetic operational workflow produced it. An overlapping full-suite run had288 passes/1 existing geometry timeout at5418ms under concurrent compilation; the isolated full rerun is recorded above, with its unchanged5000ms timeout. Earlier failure logs/receipts remain alongside successful reruns.

### Dependency security and remaining limits

Fresh audit found one newly indexed moderate `qs` issue, [GHSA-6pq8-jhm2-2vcw / CVE-2026-110816](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw), in pinned6.16.0. The compatible documented patch6.16.1 replaces only the root override and matching Bun lock entry. `bun install`, frozen reinstall, actual installed-version/two hostile-comma-input checks and final audit all passed: **1 current advisory →0**. The prior eight-advisory remediation remains historical. No blanket update or finding suppression was used.

This is suitable for a **controlled synthetic demonstration and further development**, not a production-readiness certificate. Free quota/availability and provider data-use terms remain operational limits; real architectural-plan quality is not benchmarked. Meterless Runtime token/explicit origin and organizer acceptance are unresolved; direct NVIDIA is not Runtime execution. Existing indoor-federation/licensing/deployment/backup/accessibility-review limitations remain. No demo video was created or rendered. No UI design changes were needed.

Official contracts: [Groq vision](https://console.groq.com/docs/vision), [Groq free limits](https://console.groq.com/docs/rate-limits), [Qwen model controls](https://console.groq.com/docs/model/qwen/qwen3.8-27b), [OpenRouter free variants](https://openrouter.ai/docs/guides/routing/model-variants/free), [exact Nemotron model and free data terms](https://openrouter.ai/nvidia/nemotron-3.5-super-vl:free), [routing price controls](https://openrouter.ai/docs/guides/routing/provider-selection), [reasoning controls](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens). Actual account/free-model catalog and reported cost evidence supplement documentation; free pricing is not inferred from a model name alone.



### Final preservation and review record

Filesystem review (no Git metadata): **22 modified paths, 3 created paths,0 deletions**. Source-only baseline: `/home/kingghidorah/Documents/projects/bounties/accessops-free-vision-baseline-20261027T220515Z/source.tar.gz` and `manifest.json`; previous original/implementation/UI/vision backups remain intact. Current hashes and unified source diff: private `.accessops-local/free-vision/{change-manifest.json,source.diff}`. Server environment backup is separately private0600; no secret is in the source archive or public report. Review confirms UI source, floor-model/editor implementation and direct NVIDIA text/provider implementation are unchanged. Only the documented qs patch altered dependency resolution.

New source files are `apps/api/src/agents/openrouter-vision.ts`, its test file, and `apps/api/scripts/verify-vision-workflow.ts`. Related changes extend the existing vision selector/router/receipts, evaluator, safe parse diagnostics, redaction/source scanning and environment example. No database migration, API authorization bypass, static mock UI or video infrastructure was introduced.

Actual fresh NVIDIA text run: `01a17f6d-8964-7000-88de-e7beb6ac8571`, request `chatcmpl-b8d80e88-6132-4558-9e30-28d43fdfe119`,3593ms, actual provider `nvidia` and exact Lightning model. Runtime was explicitly skipped without request. Original frozen evidence hash remains `9736455bff9c39d4d61abfb0279370c708ea8e536b6304d4b4eb43ca8b0edafb`. The live result predates only the compatible qs patch; final full provider/unit/acceptance checks after that patch passed, and provider configuration plus saved history were rechecked after restart. No extra external request was needed to manufacture another pass.

Configured-secret scan passed across464 text files initially and471 at the final scan, checking actual OpenRouter/Groq/Gemini/NVIDIA/Zetaris/admin secrets with zero matches. Existing API/worker and web are healthy at3403/3400, and both genuine PNG/PDF live models reopen after process restart with exact historical hashes and receipts.

## Earlier evidence (historical; superseded by the current checkpoint above)

## Latest replacement-key test — 27 October 2026

New verification:29 focused UNIT/MOCKED_INTEGRATION tests passed (88 assertions, exit0); secret scan PASS across372 files; own API/worker restarted, web/health/readiness HTTP200; protected NVIDIA/fallback configuration unchanged. NVIDIA live text was not rerun for this key-only change. Exact commands and exit codes are in private `.accessops-local/gemini-replacement-20261027T171437Z/commands.json`. Full regression/build/security-audit totals below remain the prior checkpoint, not newly rerun.

The owner requested Gemini3.5 or another free model using a replacement key. The three leading periods in the message were prose punctuation: the exact pasted form failed with `API_KEY_INVALID`; removing only that prefix produced a genuine Google model-discovery HTTP200. The validated replacement is stored in private `apps/api/.env` (0600); the previous environment is preserved privately. No credential value is included in this report.

**LIVE_EXTERNAL inference: BLOCKED by project free-tier eligibility.** Actual synthetic-crop requests to `gemini-3.5-flash`, `gemini-3.5-flash-lite` and `gemini-3.8-flash` each returned HTTP403 / `PERMISSION_DENIED`: “The Gemini API free tier is not available for this project.” No output, extraction, geometry or model-execution success was accepted. Discovery success does not establish inference access. No billing upgrade, paid fallback or repeated inference requests were performed. This is a newly observed project-access restriction, distinct from the earlier key's HTTP503 service-busy results.

Google's [Gemini3.5 documentation](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash) states that3.5 Flash is deprecated and automatically routed to3.6 Flash. [Official pricing](https://ai.google.dev/gemini-api/docs/pricing) lists free tiers for3.5 Flash-Lite and3.8 Flash, but this project's actual response denies access to that tier. Do not enable billing to bypass the owner's free-only requirement. Next action: resolve free-tier project eligibility through Google AI Studio or configure another authorized unbilled project with working free inference; then rerun the synthetic evaluator. Model selection remains3.6; the unverified alternatives were not added to the application's allowlist.

Private current receipts: `.accessops-local/gemini-replacement-20261027T171437Z/credential-validation.json` (exact pasted form), `credential-validation-without-ellipsis.json` (HTTP200), and `availability.json` (three real403 responses). The saved NVIDIA/text/fallback settings and workspace policies are preserved. Earlier sections below are historical checkpoints; no successful Gemini extraction is claimed.

## Latest Gemini credential activation and live test — 27 October 2026

The owner supplied a key and confirmed an unbilled project plus permission for synthetic tests. It is now stored only in private `apps/api/.env` (mode0600), with the approved local test workspace enabled. API/worker were restarted. Earlier missing-key/free-confirmation statements below are historical.

**Model discovery: PASS, HTTP200. Actual vision extraction: FAIL/BLOCKED by Google service availability.** Four real Gemini3.6 requests (small plan, crop, complete1800×1200 plan plus details, and PDF-derived page) all returnedHTTP503. No model or geometry was accepted/persisted; invalid input was rejected locally. Minimal image requests to both Gemini3.6 and3.7 also returnedHTTP503 with upstream status `UNAVAILABLE` and an explicit high-demand message. This is observed service failure, not an invalid-key diagnosis or proof of extraction quality. No paid endpoint/model was substituted.

New private evidence: `.accessops-local/gemini-live-20261027T164401Z/{model-discovery.json,evaluation/evaluation.json,availability.json,final-check.json}`. The live evaluator exited1; it did not convert failed HTTP responses into a success. Zero successful Gemini floor-plan extractions are claimed. NVIDIA text/provider/fallback settings remain unchanged; the existing application continues operating independently of vision. Retry the documented evaluation in a new evidence directory after the service recovers; no recovery time is promised.

The new check used `scripts/evaluate-vision.ts --live --persist`, private login stdin, the already-approved synthetic fixtures and the actual Google endpoint. No source-code/dependency changes or broad regression rerun were needed for this configuration-only action; earlier regression totals below remain the previous tested checkpoint. No secret value is included in reports or source examples.


## Current delivery: independent Gemini vision, preserved NVIDIA text

27 October 2026. **Gemini 3.6 Flash is integrated as the selected image provider, but actual Gemini inference and full-plan extraction remain BLOCKED by missing access.** NVIDIA Nemotron text passed another real end-to-end investigation after the separation. The original Bumps application, its current UI, deterministic validation and all earlier backups are preserved. No video, external deployment, account/billing upgrade or Git repository was created.

### Decisions and changes

Original Bumps used Gemini/Google ADK, default3.7 Flash, with optional OpenRouter; its archived study's best completed critical-parser observations used3.6 Flash. Original archive/manifest, default-versus-study discrepancy and current official free API/region/privacy evidence are documented in [vision evaluation](vision-provider-evaluation.md). Google still documents3.6 as available with free API input/output. This is a provisional evidence-based selection, not a new quality benchmark.

Other candidates usable with the existing authorized key were actually tried: Google Gemma4 and Meta Llama90B on NVIDIA's advertised free catalog. Both image completions timed out; neither was silently accepted or replaced by a paid route. No Gemini/Groq/OpenRouter key exists in the checked project/process/authorized LastMile reference. No unrelated credential search or key copying occurred.

Implemented:

- `providers/vision-selection.ts` and `agents/vision.ts`: explicit replaceable image routing, separate from NVIDIA text; selected Gemini, explicit disable, recoverable legacy NVIDIA opt-in, no automatic fallback.
- `agents/gemini-vision.ts`: documented fixed-origin generate-content REST image/JSON contract, bounded size/time/output, typed failure/response handling, exact actual model/version, visible JSON only, no thought/secret echo, actual provider/source receipts. Existing SDK dependencies were not changed.
- `agents/llm.ts`: image-bearing turns use the selected vision boundary; non-image edit/layout and the dedicated grounded text explanation selector retain NVIDIA. Readiness/model diagnostics show the two capabilities separately.
- `lib/vision-image.ts`: reuse bounded PNG/JPEG/WebP preprocessing through a provider-independent name. PDF rendering and full-plan/detail coordinate relationships remain intact.
- `agents/parser.ts` + `lib/extracted-geometry.ts`: same strict normalization/domain validators, plus empty-structure/out-of-image rejection before model storage; unknown physical scale stays null. Source proposals remain unreviewed, with manual correction, geometry repair, history and tactile/export gates retained.
- `parse.ts`: preflight unavailable/unapproved vision before enqueue or project mutation; safe actionable failure messages. `accessops/{config,routes-admin}.ts` validate/show the selected capability without making optional keys a startup dependency.
- Source evaluation harness/builders and synthetic ground truth; new unit/mocked tests and an additive acceptance block. No existing assertion was removed or timeout increased.
- Environment examples now document only selected-image settings plus existing text/source configuration; no actual key or inferred consent. Private settings select Gemini with free confirmation false and approval empty. NVIDIA text/fallback/consent values are preserved.

### Consolidated current status

| Area | Actual result | Evidence / remaining action |
|---|---|---|
| Original vision recovery | **PASS inspection; service reused with hardened image boundary** | Original archive `original-source.tar.gz`, `INSTRUCTIONS.md`, corpus study; see evaluation. No Git history exists. |
| Selected Gemini image integration | **LOCAL/MOCKED PASS; LIVE BLOCKED** | No key, free-project confirmation or Gemini workspace consent. Four valid image/crop/full/PDF cases preprocess; zero Gemini requests; evaluator exit2. Configure only a permitted unbilled project and rerun actual content evaluation. |
| Actual full-plan extraction | **NOT RUN for Gemini** | Representative1800×1200 whole plan plus all four tiles are preserved; no model output exists to inspect. No fake pass from a caption, mock or subset. |
| Existing-key free alternatives | **LIVE_EXTERNAL FAIL** | Gemma4 timeout120035ms; Llama90B timeout120038ms. Existing original Omni failures remain historical. |
| NVIDIA text | **PASS, fresh LIVE_END_TO_END** | Run `01a17e07-8ede-7000-8857-ecdb78203016`, request `chatcmpl-7f59dc36-deb5-4b8c-b35a-07ab4e52f559`, actual Lightning model,4884ms. Runtime skipped, frozen hash unchanged. |
| Consent/fallback boundaries | **PASS** | Global and Gemini-specific permission plus explicit free-project attestation; existing NVIDIA text policy/pinned/local/no-AI restrictions retained. No provider switch on vision failure. |
| Meterless Engine / Runtime | **8/8 LOCAL PASS / Runtime BLOCKED** | Real conformance and application projection; no Runtime token/origin or authenticated execution. Qualification remains unconfirmed. |
| Dependency security | **PASS, zero findings** | Fresh audit exit0; frozen install exit0, no dependency/lockfile changes. Prior8→0 remediation preserved. |
| Bumps/AccessOps regression | **PASS locally** |257 tests and184 acceptance assertions retain editing/correction/history/tactile/map+legend STL, tenant isolation, imports/provenance, graph/scenario/action/resolution/history; live Gemini remains separate. |
| Typecheck/lint/build | **PASS after one diagnosed fixture typing error** | Explicit fixture contract fixed an inferred-empty-array `never` type; final all-workspace check passes. Lint keeps5 existing image warnings,0 errors. Production API+Next builds pass. |
| Browser/smoke | See final browser record below | Existing UI unchanged; new selected-provider/preflight checks added to actual app browser tests. |
| Hackathon submission | **PARTIAL / NOT qualification-certified** | [Requirement matrix](hackathon-requirement-evidence.md): mandatory sponsor acceptance needs clarification, real indoor federation incomplete; GitHub/deck/video package not produced by this task. |

### Exact commands and results from this pass

Evidence below is private under `.accessops-local/vision-provider/`. Bun1.3.14 from `.accessops-local/bin`, Node24.19 and isolated existing Postgres17 on55434 were retained. No database was reset or schema migration needed.

| Command | New actual outcome | Classification / evidence |
|---|---|---|
| `git status --short` | Exit128, no Git metadata | Filesystem backup/diff used; no Git initialized. |
| Read archived original source/instructions/corpus report | Confirmed Gemini/ADK and optional OpenRouter, not original NVIDIA | New evaluation and original archive. Initial guessed archive filename failed; corrected to actual `original-source.tar.gz`, no source changed by that read. |
| Authorized environment presence check + actual NVIDIA `/v1/models` | Only NVIDIA key present; live discovery succeeded | `credentials.json`, `existing-model-discovery.json`; discovery is not inference/free-quota proof. |
| Two guarded free candidate control requests | Both exit1, real120s timeouts | LIVE_EXTERNAL `gemma-control.json`, `llama-control.json`; no successful response or extraction. |
| `bun test apps/api/src/agents/gemini-vision.test.ts apps/api/src/agents/vision-fixtures.test.ts` | Exit0,29 PASS/88 assertions | UNIT/MOCKED/LOCAL, `vision-tests-final.log`. Initial new zero-wall test expected our error, but the stricter existing domain check rejected first; corrected expected existing error, did not weaken validation. |
| `bun run test` | Exit0,257 PASS/953 assertions/29 files | `full-tests.log`, ordinary deterministic/mocked/local tests; not live inference. |
| `bun test apps/api/src/providers apps/api/src/agents/gemini-vision.test.ts apps/api/src/agents/nvidia.test.ts apps/api/src/agents/vision-fixtures.test.ts` | Exit0,96 PASS/303 assertions | Focused provider regression after final adapter logging changes; `provider-tests-final.log`. |
| `ACCESSOPS_INTEGRATION=1 bun run test:integration` | Exit0,1 PASS/184 assertions | Real isolated DB/API/job processing; `acceptance.log`. New checks prove disabled vision queues no job and leaves project unchanged. |
| `INTEGRATION_EVIDENCE_DIR=/absolute/private/evaluation bun run --cwd apps/api scripts/evaluate-vision.ts --live < /private/admin-login.json` | Exit2,4 BLOCKED/1 invalid-input rejection PASS; zero Gemini requests | LOCAL_INTEGRATION `evaluation/evaluation.json`; preprocessing all valid inputs PASS, live extraction NOT RUN. |
| Existing live verifier with `--investigation=01a17b01-d49b-7000-8f4b-89e3bf4ea3dd --complete-nvidia --auto-fallback` | Exit0, real persisted NVIDIA result | LIVE_END_TO_END `live-text/verification.json`; no Runtime request. |
| `WORLD_MODEL_IMPL=./apps/api/src/accessops/world-model-engine.ts node --experimental-transform-types apps/api/vendor/meterless-world-model/conformance/runner.ts` | Exit0,8/8 | LOCAL_INTEGRATION `engine.log`, distinct from Runtime. |
| `bun install --frozen-lockfile` / `bun audit --json` | Both exit0; no install changes / zero findings | `frozen-install.log`, `audit.log`; no lockfile suppression. |
| `bun run typecheck` | First exit2 on fixture union; corrected final exit0 all workspaces | `typecheck.log`, `typecheck-final.log`, targeted API recheck. Runtime assertions unchanged. |
| `bun run lint` / `bun run security` | Both exit0;5 img warnings / no source-boundary failures | `lint.log`, `security.log`; configured-secret scan recorded below. |
| `bun run build` | Exit0, final API and Next production | `build.log`; no deployment or video render. |

Four valid evaluation inputs have known source hashes/transforms and complete coverage; invalid input is rejected before inference. The crop cannot masquerade as a full plan. Real Gemini content/latency/accuracy are unknown, and mocks do not establish them. The evaluator's optional persistence gate reopens accepted unreviewed output but never claims a human review or complete critique/doorway loop.

Fresh text uses actual `nvidia/nemotron-3.5-lightning-30b-a3b`; source-evidence hash remains `9736455bff9c39d4d61abfb0279370c708ea8e536b6304d4b4eb43ca8b0edafb`. Its grounding validator and immutable history are unchanged. No sponsor evidence is inferred from provider names, a mocked response or Engine conformance alone.

### Remaining actions and suitability

1. **External Gemini access/configuration:** key from an unbilled AI Studio project, explicit free-project confirmation, and authorized public/synthetic workspace data approval. No current key/tier is invented. Add these locally, restart the same API/worker and run the new evaluator, then normal critique/doorway/manual-review/tactile/export before claiming live vision complete. Do not paste secrets into chat.
2. **Representative extraction quality:** currently UNVERIFIED. Inspect actual room labels, wall/door coordinates, symbols and full-region coverage. In-bounds hallucinations require source/human review; deterministic checks do not certify them.
3. **Meterless:** obtain an actual instance/token if required and ask the prepared organizer question. No Runtime, account-denial or qualification success is claimed. NVIDIA text does not impersonate Runtime.
4. **Zetaris:** preserved real coverage-gap evidence is useful but does not supply real indoor measurements/operations or a successful indoor federated join. Obtain permitted records for stronger real-world findings.
5. **Submission/deployment:** source publication/licensing declaration, slide deck and the separate truthful video task remain outside this work; production infrastructure/privacy/backup/monitoring/operational approvals are not certified by passing local tests. No video was created.

The app is suitable for further development and a controlled demonstration of **verified text/deterministic/manual/source/action/tactile workflows**, with synthetic incidents labelled and vision shown as blocked. It is not a completed live-vision demonstration, complete hackathon submission or certified production deployment.

### Recovery and final evidence

Pre-change source/size/SHA-256 archive+manifest: `/home/kingghidorah/Documents/projects/bounties/accessops-vision-provider-baseline-20261027T130708Z/`. Private before-config is mode0600; original ZIP/implementation/UI/fallback/hardening backups are retained. Final hashes/unified diff: `vision-provider/change-manifest.json`, `source-changes.diff`. No Git reset/clean/clone/init or unrelated service/database manipulation.

Current changes are additive provider/fixture/evaluator/tests and scoped routing/diagnostic/parser safety/config/docs updates. No migration, dependency change, UI stylesheet/design-system or vendored Engine modification was required. Final browser, source-diff, original-test and configured-secret results are recorded below after their actual checks.

### Final browser, restart and review evidence

**46/46 browser checks PASS**:43 workflow checks and3 remote-asset/small-viewport checks, both final commands exit0:

```sh
node .accessops-local/vision-provider/browser/browser-check.mjs
node .accessops-local/vision-provider/browser/browser-assets.mjs
```

These ran against the newly built production UI and real authorized local API/DB/worker. They cover existing desktop/mobile routes, authentication/denial, original editor and persisted geometry, idempotent source import, investigations/evidence/history, deterministic scenarios, owned action/approval/attributable resolution, actual NVIDIA provider history, plus new explicit Gemini-versus-text diagnostics and503 preflight with unchanged project. The exact remote background video/font and320×568/720×700 layouts passed. No new video was rendered.

The first concurrent harness run shared a CDP port/profile and interfered with navigation; it is INCONCLUSIVE, not an application pass. An isolated rerun then exposed a harness race selecting an owner before fetched options were present. Waiting for loaded owner options fixed that race using the existing timeout and unchanged assertions. Earlier failures are preserved under `browser/{harness-interference,owner-options-race}/`; final runs use separate profiles/ports and sequential execution. No product behavior, assertion or timeout was weakened.

The additional Meta Llama control using the documented user-only payload/512-token cap also failed with a120209ms timeout. This is a separate retained LIVE_EXTERNAL failure (`llama-user-only-control.json`), not Gemini evidence or a paid fallback. No working free vision provider was established using existing credentials.

Fresh NVIDIA text and its exact frozen hash reopened after owned API/worker/web restart (`restart-evidence-result.json`, exit0, LOCAL_INTEGRATION; no new inference). Source/context persistence and actual-provider identity survived the restart. Current application smoke checks and final source/secret comparison are recorded in `verification-summary.json`, `change-manifest.json` and `secret-boundary-result.json`.

Original Bumps test hash comparison:15/15 unchanged (`original-tests-proof.json`). The additive AccessOps acceptance checks retain existing assertions. UI CSS/design-system and Engine vendor source are unchanged; package manifests/lockfile remain unchanged. Protected before-config and every previous backup remain present. The final configured-secret scan includes source/scripts/docs/client bundles and safe evidence, excluding private configuration/browser profiles; it does not claim to detect arbitrary unknown secrets.

Final source review:31 changed/created source paths (19 modified,12 new), no deletions. Lockfile, UI styles/design-system and vendored Engine remain unchanged. Configured-secret scan PASS with zero matches in443 checked text artifacts; actual configured NVIDIA/Zetaris/local-admin values were compared without printing them. Gemini has no configured key to compare. Final landing, API health and readiness returned HTTP200. Exact source hashes/diff and command exit codes remain in the private review artifacts. No account access, API completion or external-resource result was fabricated.

## Prior NVIDIA vision/dependency hardening checkpoint (historical)

27 October 2026. Repository: `/home/kingghidorah/Documents/projects/bounties/bumps-main`. Existing local application: `http://localhost:3400`; isolated API 3403 and Postgres 55434. Bun 1.3.14, Node 24.19.0, Postgres 17. This is a local engineering delivery, not a production deployment or sponsor-qualification certificate.

## Outcome

The eight reproduced dependency findings were remediated; the final audit returns zero and actual installed-package traversal agrees. The working policy-controlled NVIDIA text fallback passed a fresh real persisted investigation. NVIDIA vision now uses a documented Nemotron model that returned its expected identity and passed randomized real-image controls. A final extra control returned the right model/circle but transcribed `AXVJARCF` as `0.0`; it was rejected and not retried into success. The complete clinic-plan extraction workload is still **PARTIAL**: real requests returned 503 or exceeded the bounded timeout. No unsuccessful inference was converted into geometry or a reviewed accessibility claim.

The source/UI, authorization, provenance, durable jobs, reviewed graph/scenario/action workflow and original tactile-map system were retained. All 15 original Bumps test files match the untouched original ZIP baseline. No Git metadata, external resource, paid endpoint, alternate demo app or video was created.

## Consolidated status

Evidence paths below are relative to private `.accessops-local/hardening/` unless stated otherwise. Each result was newly executed in this pass unless explicitly labelled historical.

| Area | Final status | Evidence | Remaining action |
|---|---|---|---|
| NVIDIA text inference | **PASS, LIVE_END_TO_END** | `live-text/verification.json`; new actual persisted Lightning run, exact evidence hash/citations/provider | Retain valid free access and approved workspace policy. |
| NVIDIA vision inference | **PARTIAL**: real randomized controls PASS; full clinic parsing FAIL on 503/timeout; final extra control failed transcription | `live-vision-control-source/verification.json`, `live-vision-probe.json`, full-floor failure receipts | Obtain a service able to finish the authorized workload; re-run actual parsing/critique/doorway and inspect geometry. |
| Meterless Engine | **PASS, LOCAL_INTEGRATION 8/8** | `engine.log`, exit 0; frozen-observation projection in real text run | Organizer qualification remains separate. |
| Meterless Runtime | **BLOCKED** for this deployment; account/qualification UNVERIFIED | `live-text/verification.json`: missing instance token/origin, no request sent | Owner/admin supplies real instance token and explicit origin, then real pinned Runtime inference. |
| NVIDIA fallback policy | **PASS** for actual missing-Runtime branch and controlled regression branches | Real actual-provider receipt plus provider/unit/local tests | Real configured Runtime error branches remain mocked until instance access exists. |
| Dependency advisories | **PASS: 8 → 0** | `audit-before.json`, `audit-last.log`, `installed-dependency-proof.json` 8/8 | Continue recurring audits; keep documented loader override under review. |
| Bumps regression coverage | **PASS** for deterministic/editor/tactile/history/STL/PNG/PDF tests; live AI parsing separately PARTIAL | Full suite and final PostgreSQL acceptance; `original-tests-proof.json` | Human review and successful complete live vision workflow still required for AI extraction claims. |
| Typecheck, lint, build | **PASS**, lint has 5 existing image warnings and no errors | `typecheck-last.log`, `lint.log`, `build.log`, `api-build-last.log` | Warnings retained, not suppressed; operational gates below remain. |
| Browser/acceptance | **PASS: 44 browser checks / 176 final acceptance assertions** | `acceptance-final.log`, browser evidence | No failure in these checks; live full-plan AI parsing remains separate. |

## Vision diagnosis and correction

**High confidence in the observed serving-identity cause.** Super VL was requested using its official canonical ID, which discovery advertised. The HTTP200 completion identified itself as `private/nvidia/nemotron-3.5-super-120b-a12b`. There is no verified authoritative alias mapping. The existing identity validator correctly rejected it; it was not loosened.

Selected `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` is another documented NVIDIA Nemotron vision model on the existing official endpoint. It returned that exact identity and correctly read randomized text and a shape from images; expected text was absent from prompts. Two independent accepted controls were inspected, not merely counted by HTTP status. A third independent final image control failed transcription despite canonical model identity; its image and visible response were inspected and rejected (`live-vision-final-control/{verification,inspection,visible-response}.json`). Full clinic-plan schema extraction still hit real 503/timeouts, including a bounded smaller-token diagnostic. That observed service/workload failure is not evidence of account rejection or a fabricated missing secret.

`providers/vision-configuration.ts`, `lib/vision-image.ts` and the existing NVIDIA adapter validate capabilities, canonical encoding, real MIME/signature, decoding, sizes, pixels, image count, aggregate bytes, token limits and responses. PNG/JPEG are flattened to RGB PNG without moving coordinates. Existing WebP is decoded using patched sharp 0.35.5; upload normalization preserves the original and a capped PNG. PDF follows existing rasterization. Unsupported/raw PDF model input is rejected before HTTP. Thinking is explicitly disabled per the documented model contract. Model identity, truncation, empty output, rate limits/auth/timeout and secret echo remain fail-closed.

Request-local model receipts preserve actual provider/model/request, live/mock distinction, original/sent hashes, dimensions, response hash and unreviewed status. `parse.ts` adds these to existing model-version critique metadata. No geometry schema or migration was needed. Configuration/model discovery never asserts healthy vision, and valid AI output never asserts human review or regulatory compliance. Full contracts, official references, failure inventory and reproduction: [vision delivery](vision-integration-delivery.md).

## Dependency remediation

The initial **8 findings: 5 high / 3 moderate** comprise six range-specific brace-expansion entries, one legacy esbuild entry and one Zod entry. [The individual advisory inventory](security-dependency-audit.md) records every ID/range/path, usage and remediation.

- Brace-expansion stays on existing major lines: 1.1.18 → 1.1.21 and 5.0.9 → 5.0.12.
- shadcn 4.18.0 → 4.22.2 adopts its supported Zod 4 path; all active Zod resolves 4.6.7. The actual imported shadcn CSS remains present and was built/browser-checked.
- The archived esbuild-kit loader is explicitly aliased to its upstream-recommended tsx 4.23.12 successor. Its esbuild is 0.28.2; Drizzle's direct esbuild remains patched 0.25.12. Drizzle itself was not unnecessarily major-upgraded. Two isolated TypeScript schema generations passed after reinstall, without touching an existing database/schema.
- API sharp 0.35.5 is now explicit for real WebP decoding; this exact patched version was already installed elsewhere in the tree. No new unreviewed major version was introduced.

Only targeted brace lock resolution used temporary Bun 1.4.4 after an isolated experiment; declared/application Bun stays 1.3.14. No manual lock editing or blanket force upgrade. An initial clean lock audit concealed stale installed links: generated dependency directories were preserved by rename and freshly installed from the frozen lock. Actual traversal then passed all eight checked paths. Final frozen install reports no changes and the final audit exits 0 with `{}`. Registry audit coverage is not proof of absence of all vulnerabilities.

## Text fallback and sponsor distinctions

Fresh LIVE_END_TO_END text provider run: `01a17d4d-f73d-7000-94ff-23cbcfc3409d`; request `chatcmpl-63b7b1ef-eb8c-44a3-9b5e-1832ed87f4f9`; actual model `nvidia/nemotron-3.5-lightning-30b-a3b`; 5933ms for this one operation. Runtime was skipped with `requestSent:false`; actual provider is persisted as NVIDIA, not Runtime/auto. Original frozen evidence hash remains `9736455bff9c39d4d61abfb0279370c708ea8e536b6304d4b4eb43ca8b0edafb`.

Both workspace consent lists, fallback opt-in, local-only/pinned restrictions, bounded provider attempts, exact claims/citations, secret redaction and deterministic operation without AI remain in the existing selector. No Gemini/OpenRouter request was used as a fallback. The single local verification harness that omitted API environment selected the root Gemini default and failed before any inference; it is explicitly excluded from live proof, and the corrected source verifier pins NVIDIA.

The missing Meterless instance token is confirmed; an explicitly supplied origin is also absent. No authenticated Runtime request, denied-account diagnosis or Runtime qualification claim is made. Engine's actual 8/8 local conformance does not establish Runtime access. Zetaris's prior real source receipts and evidence-backed **coverage-gap** finding remain intact and were consumed by the new real text run; no new external Zetaris query is claimed. Prior geographic/indoor-data and federated-join timeout limitations remain open. See [primary integration record](live-integration-verification.md).

## Commands and actual results

From repository root with `$PWD/.accessops-local/bin` on PATH (Bun 1.3.14). No credentials appear in command arguments; authorized login input comes from private stdin. Normal install/start/test commands remain those in README; no Git is needed.

| Exact check/command | Actual result and classification | Evidence |
|---|---|---|
| `git status --short` | No Git metadata, exit 128; filesystem comparison used instead | Baseline and final change manifest |
| `bun audit --json` before changes | Exit 1, 8 findings, 5 high / 3 moderate | `audit-before.json` |
| `bun install` after targeted overrides/shadcn, then explicit API sharp | Exit 0; lockfile generated by Bun | Install logs, root/workspace manifests and `bun.lock` |
| `bun x bun@1.4.4 update brace-expansion --lockfile-only` | Exit 0 after isolated compatibility experiment | `update-brace-targeted.log`; runtime remains 1.3.14 |
| Fresh `bun install --frozen-lockfile` | Exit 0, 1806 packages; final repeat exit 0, no changes | `fresh-frozen-install.log`, `frozen-lock-last.log` |
| Actual Node parent-package resolution | Exit 0, 8/8 PASS, not just lockfile inspection | `installed-dependency-proof.json`, `installed-dependency-final.log` |
| Isolated Drizzle `generate --config=/isolated/config`, twice | Both exit 0, LOCAL_INTEGRATION | `dependency-tools-result.json`, `dependency-tools-fresh.log` |
| `bun test apps/api/src/agents/nvidia.test.ts apps/api/src/lib/vision-image.test.ts` | Exit 0, **29 PASS / 72 assertions**, UNIT/MOCKED_INTEGRATION | `vision-tests-decoder.log` |
| `bun test apps/api/src/providers apps/api/src/agents/nvidia.test.ts` | Exit 0, **67 PASS / 215 assertions**; before four additional decoder tests | `provider-vision-tests.log` |
| `bun run test` final | Exit 0, **228 PASS / 865 assertions / 27 files**, UNIT/MOCKED_INTEGRATION and actual local Engine logic | `full-tests-verified.log` |
| `ACCESSOPS_INTEGRATION=1 bun run test:integration` final | Exit 0, **1 PASS / 176 assertions**, LOCAL_INTEGRATION real isolated DB/API/jobs | `acceptance-final.log` |
| Real WebP upload → private original → authorized PNG retrieval | Exit 0, LOCAL_INTEGRATION, 500×280 PNG with matching original hash | `webp-api-result.json`, `webp-api.log` |
| `bun run typecheck` final | Exit 0, all four workspaces | `typecheck-last.log` |
| `bun run lint` | Exit 0, 0 errors / 5 existing img warnings | `lint.log` |
| `bun run security` | Exit 0, source-boundary checks | `security.log`; configured-secret scan separately below |
| `bun audit --json` final | Exit 0, **0 findings** | `audit-last.log` |
| `bun run build` + final `bun run --cwd apps/api build` | Both exit 0, Next production and final API with image decoder | `build.log`, `api-build-last.log` |
| `WORLD_MODEL_IMPL=./apps/api/src/accessops/world-model-engine.ts node --experimental-transform-types apps/api/vendor/meterless-world-model/conformance/runner.ts` | Exit 0, **8/8 LOCAL_INTEGRATION**; not Runtime | `engine.log` |
| Existing real verifier `--investigation=01a17b01-d49b-7000-8f4b-89e3bf4ea3dd --complete-nvidia --auto-fallback` | Exit 0, fresh NVIDIA LIVE_END_TO_END, Runtime NOT RUN | `live-text/verification.json` |
| New source verifier `--control=true`, 512 output-token budget | Exit 0, fresh NVIDIA LIVE_EXTERNAL image control, strict visual/output validation | `live-vision-control-source/verification.json` |
| Final independent source image control | Exit 1, LIVE_EXTERNAL actual model/response but wrong printed code; safely rejected, no fake pass | `live-vision-final-control/{verification,inspection,visible-response}.json` |
| New source verifier `--image=/authorized/synthetic-clinic.png` | Exit 1, LIVE_EXTERNAL 503/timeouts; no fake extraction | `live-vision-floor-ready/verification.json`, `live-vision-floor-2048/verification.json` |
| `node .accessops-local/hardening/browser/browser-check.mjs` + `browser-assets.mjs` | Both exit 0, **44 PASS**, LOCAL_INTEGRATION with actual Chromium | `browser/{browser-results,browser-asset-results}.json` |
| Configured-secret scanner and filesystem manifest/diff | PASS, no configured-secret matches or deleted source files | `secret-boundary-result.json`, `change-manifest.json`, `source-changes.diff` |
| Original ZIP test hash comparison | **15/15 unchanged** | `original-tests-proof.json` |

Exact authorized live invocation templates are in [vision delivery](vision-integration-delivery.md) and [fallback delivery](meterless-runtime-fallback-delivery.md). Local scripts/evidence also retain diagnostic commands and intermediate failures: an initial JPEG fixture construction issue was corrected; the first WebP attempt exposed the real unsupported decoder; source verifier TypeScript errors were fixed and the full checks rerun. No test timeout was increased and no original assertion weakened. Earlier acceptance runs returned 179 assertions; the final worker-paused run returned 176 because existing polling/conditional checks vary with job timing. The test source is unchanged. These are actual reported counts, not a fixed acceptance SLA.

## Browser, restart and operational checks

**Browser: 44/44 PASS, exits 0.** `node .accessops-local/hardening/browser/browser-check.mjs` passed 41 real desktop/mobile/operational checks; `node .accessops-local/hardening/browser/browser-assets.mjs` passed 3 actual remote-video/font and small-viewport checks. Evidence: `browser/{browser-results,browser-asset-results}.json` and private screenshots. These use the rebuilt Next production runtime and real authorized API/worker/database, not static mock screens. No new video was rendered.

Verified landing/navigation/mobile-menu/reduced-motion/video-failure handling, authentication/anonymous denial, all workspace routes, real preserved external source evidence and persisted NVIDIA provider display, policy-driven explanation controls, original editor/persisted geometry, source preview/idempotent commit, investigation execution, scenario reachability, owned proposal/human approval/attributable resolution, mobile operational layouts and no uncaught browser exceptions. The actual remote video and display font loaded; 320×568 and 720×700 layouts did not overflow. The fresh source/graph/action fixture itself completed through the actual API before browser execution (`browser/demo-fixture.log`, exit 0). Reproduction: `API_URL=http://127.0.0.1:3403 DEMO_EVIDENCE_PATH=/absolute/private/demo-ui-results.json bun run --cwd apps/api scripts/accessops-demo.ts < /private/admin-login.json`, then the two browser commands in the table. This uses labelled synthetic source records and operational events, not live incidents.

The new live text provider run and unchanged source-evidence hash were also reopened after owned API/worker/web restarts (`restart-evidence-result.json`, LOCAL_INTEGRATION, no new inference).

Configured-secret scan passed with zero matches across source/scripts/docs, client bundles and authorized safe evidence. Actual values checked were the configured NVIDIA key, Zetaris password and private local-admin password; Runtime has no token to compare. No secret values appear in results. Evidence: `secret-boundary-result.json`. This is not a claim to detect every unknown credential. The source-boundary security script also passed.

Final filesystem comparison: **26 changed/created paths (16 modified, 10 new), no deletions**, deliberate manifest/lock changes, UI styles/design-system and vendor Engine source unchanged. Only the AccessOps-added NVIDIA test file was extended; all 15 original Bumps tests are byte-identical to the original ZIP baseline. The private before-config and backups remain intact.

Operational startup observation: The first copied production web runtime's startup readiness window expired during the cold restart; its subsequent real landing request returned HTTP200 in 0.48 seconds and the owned-service startup check passed. No source fix, suppressed check or old-runtime substitution was used to hide that observation. API readiness correctly returned503 while the worker was deliberately paused for acceptance, then returned healthy after it resumed.

## Changed files and recovery

Source backup and 492-file SHA-256/size manifest outside the tree:
`/home/kingghidorah/Documents/projects/bounties/accessops-hardening-baseline-20261027T115119Z/{source.tar.gz,manifest.json}`.

Existing original/implementation/UI/fallback backups are untouched. Private `hardening/api-env-before` is mode0600; generated dependency directories were moved to `hardening/dependencies-before/`, not deleted. The final source remains in the original extracted directory.

Important changes:

- Root `package.json`, `apps/{api,web}/package.json`, `bun.lock`: targeted dependency fixes and explicit patched image decoder.
- `apps/api/src/providers/{vision-configuration,model-executions}.ts`: capability validation and bounded execution provenance.
- `apps/api/src/lib/vision-image.ts` and tests: validated image decoding/normalization/resource limits.
- Existing `agents/nvidia.ts` and tests: actual model/response checks, safe image wire format, receipts and secret-safe diagnostics.
- Existing `projects.ts`: original-preserving WebP normalization; `parse.ts`: unreviewed inference receipts in version metadata; `accessops/routes-admin.ts`: separate vision state.
- `apps/api/scripts/verify-live-vision.ts`, explicitly labelled test fixture, environment examples and the linked integration/security/delivery docs.

No database migration, UI layout/token/asset redesign or vendor Engine source change was required. Full modified/created/deleted file hashes and unified source diff are generated at `hardening/change-manifest.json` and `hardening/source-changes.diff`; there is no Git diff because no Git repository exists. Private environment/generated artifacts are excluded from that source diff.

## Remaining blockers and suitability

1. **Full live floor-plan pipeline: observed external service/workload failure.** Correct model identity and two successful controls are verified, but the final independent transcription control failed and clinic extraction failed with503/timeouts. Obtain model-quality diagnostics and repeat representative accuracy assessment; do not treat schema-valid text as true. Next: re-run the source verifier when the authorized endpoint can serve the workload; inspect actual geometry, then execute critique/doorway and human review. Provider-side diagnosis or separately approved compatible capacity may be needed; no silent paid switch.
2. **Meterless Runtime: missing access/configuration.** Supply the real instance token and authorized origin to API/worker, discover actual routes, then run a pinned completed-investigation explanation and inspect persisted provider identity. Account denial and event qualification remain unverified. Missing Runtime does not block NVIDIA or deterministic work.
3. **Real configured-Runtime failure fallback tests: blocked by the same absent instance.** Controlled mock branches pass; run authorized isolated failure tests later.
4. **Zetaris indoor/federated coverage: preserved prior limitations.** Obtain permitted building/measurement/operational sources and a query able to complete; do not describe geographic reference rows as indoor evidence. New text execution uses genuine historical source coverage, not new live source synchronization.
5. **Production operations: not deployed or certified.** Production secret injection, HTTPS, persistent DB/files, tenancy/operational review, capacity, retention, restore drills, dependency maintenance, source/model licensing and quota/terms still require deployment-specific approval and verification. See existing deployment/operations/security runbooks; this task did not mutate production resources.

The project is suitable for **further development and a controlled local demonstration** of its verified source/evidence/graph/action/tactile/text workflows, with clearly labelled synthetic data and the vision limits above. It is **not certified production-ready** by this pass. A future demo may reuse the actual current UI/design system and verified receipts; no video or independent fake dashboard was produced.

Final targeted checks after formatting/provenance/verifier diagnostics: API typecheck and API build passed again (`api-typecheck-last.log`, `api-typecheck-verifier.log`, `api-build-final.log`, all exit 0). Source verifier diagnostics retain expected/observed controls and distinguish local input/configuration failures from actual external attempts. Final source/secret review includes the unified lockfile diff; generated dependency backups and private configurations are preserved but excluded from public source evidence.

Final review: `api-typecheck-final.log` exited 0 after the verifier retained expected/observed controls. `lock-version-review.json` found no unexpected existing-package major change (intentional Zod unification only); Bun hoisting/optional-platform changes are distinguished from version upgrades. Final actual landing, API health and API readiness checks all returned HTTP200 (`verification-summary.json`). No further external inference was attempted after the rejected final visual control.
