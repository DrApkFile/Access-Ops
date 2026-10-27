# Vision provider evaluation and implementation

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


27 October 2026. **Selected: Google Gemini 3.6 Flash for vision; NVIDIA Nemotron Lightning remains the text provider. Gemini is implemented but live verification is BLOCKED.** No configured Gemini key exists, no free-project confirmation has been made, and no workspace has approved its unpaid-service data sharing. The application does not substitute another provider when this path is unavailable.

## Original Bumps evidence

This extracted working tree has no Git metadata (`git status --short`: exit128). History was recovered read-only from `/home/kingghidorah/Documents/projects/bounties/accessops-baseline-20261026T213809Z/original-source.tar.gz` and its manifest, rather than pretending there were commits to inspect. The new pre-change archive/manifest is `/home/kingghidorah/Documents/projects/bounties/accessops-vision-provider-baseline-20261027T130708Z/`. Earlier source and configuration backups remain intact.

The actual original `apps/api/src/agents/llm.ts` imported Google ADK `Gemini`, `LlmAgent`, `Runner` and ephemeral sessions. Default provider was direct Gemini, model `gemini-3.7-flash`, with per-role model overrides; `USE_INTERACTIONS_API=true` selected Interactions, while false used generate-content. Its optional OpenRouter route used `https://openrouter.ai/api/v1/chat/completions` and `google/gemini-3.7-flash`. These were not originally NVIDIA implementations.

Archived `INSTRUCTIONS.md` recommends OpenRouter and describes direct AI Studio free use. Its broad description is qualified by the actual archived `pipeline_tests/REPORT.md`: that study reports Gemini 3.6 Flash as the strongest critical parser/critic observed, completed V&A and the superseded Kwun attempt, while 3.7 encountered quota/structured-output retries. The study contains partial failures and does not establish that every corpus plan passed. Its historical exhausted daily quota is not this account's current quota. The default model, claimed setup and recorded study observations are deliberately distinguished.

The original input/schema/rendering/critique/doorway/editor pipeline remains. Direct Gemini is reused as a service and message contract, with a bounded REST boundary for image requests so actual `modelVersion`, response identity, consent, limits and failure states are inspectable. No new SDK/dependency was required; existing ADK definitions and non-image legacy paths were retained. We did not blindly restore unprotected ephemeral execution or weaken the current validators.

## Candidate comparison

| Candidate | Official free/access evidence | Current project access / actual result | Decision |
|---|---|---|---|
| **Gemini 3.6 Flash, direct API** | [Current pricing](https://ai.google.dev/gemini-api/docs/pricing) lists free input/output; [model reference](https://ai.google.dev/gemini-api/docs/models/gemini-3.6-flash) confirms image/PDF/JSON support and stable availability. [Billing](https://ai.google.dev/gemini-api/docs/billing) documents an unbilled free project, separate from paid upgrades. | No `GEMINI_API_KEY` or supported Google-key alias in existing project/process/authorized reference. New local/mocked contracts pass; actual requests NOT RUN. Original study provides historical floor-plan evidence, not a new live result. | **Provisional primary**, supported by original product evidence; must pass new live evaluation before being called working. |
| Gemini 3.7 Flash | Same official pricing/model catalog confirms free API access. | No key; archived study did not demonstrate an advantage over 3.6. | Configurable supported stable alternative; no automatic fallback or additional integration. |
| Groq `qwen/qwen3.8-27b` | [Vision docs](https://console.groq.com/docs/vision) and [free rate table](https://console.groq.com/docs/rate-limits) explicitly list it. Current published free ceilings:30RPM/1000RPD/8000TPM/200000TPD; max3 images/request,20MB URL-image request. | No Groq key. Account/region access, card requirement and actual free availability for this owner are not verified. Existing full-plan path uses five images, so compatibility would require an explicit evaluated strategy. | Not selected; no speculative adapter added. |
| Google Gemma 4 31B via NVIDIA trial | [Catalog](https://build.nvidia.com/google/gemma-4-31b-it) explicitly offers a free image-capable endpoint; [model/API contract](https://docs.api.nvidia.com/nim/reference/google-gemma-4-31b-it) documents multimodal input and empty-thought wrapper behavior. | Existing authorized NVIDIA key and real model discovery; actual synthetic-image completion timed out at120035ms, no usable response. | LIVE_EXTERNAL FAIL; not a working replacement. This is Google's model served by NVIDIA, not Nemotron. |
| Meta Llama3.2 90B Vision via NVIDIA trial | [Catalog](https://build.nvidia.com/meta/llama-3.2-90b-vision-instruct) offers a free image endpoint and OpenAI-compatible image content. | Existing key; real synthetic-image request timed out at120038ms. A second request matching the documented user-only message format with512 output tokens also timed out at120209ms; system-message removal did not produce usable output. | LIVE_EXTERNAL FAIL; not selected. |
| Other existing NVIDIA-catalog options | Gemma3 27B and Phi3 Vision pages mark free routes deprecated; Gemma3 4B/12B pages did not expose a verifiable current free route. Llama3.2 11B page redirected to a location-unavailable notice for the research client. | Catalog discovery alone is not free inference proof, regional rejection of this owner, or model quality evidence. | No paid/partner route or region bypass attempted. |
| Local VLM | No hosted fee if genuinely running locally; open weights alone do not supply hardware or a free hosted API. | No installed Ollama/model or NVIDIA runtime was found in the checked environment; usable local capacity is unverified. | No large model download or hardware provisioning performed. |
| Original OpenRouter | Original adapter remains; original routed Gemini ID is not a verified zero-cost API route. | No key; no account/free-route proof. | No potentially paid request or silent fallback. |

All safe candidate completions were limited to the exact catalog endpoints advertising free access; no paid resource, account upgrade or partner endpoint was created. Quota/account billing cannot be inferred from model discovery or key syntax. Credential evidence reports only PRESENT/ABSENT in private `vision-provider/credentials.json`; authorized scope is this project and its existing LastMile reference, not unrelated applications.

## Selected model restrictions and privacy

Gemini 3.6 accepts image/PDF input and structured text output, with documented1,048,576 input/65,536 output token limits. Application limits are deliberately lower:16 images,5MiB/4million pixels per decoded image,19MiB serialized inline request including instructions, max16384 output tokens,120-second timeout and no inner completion retry. Existing parser/crop/page relationships are retained. The original API first-page PDF workflow is retained; no multi-page extraction is claimed. PDF is rendered locally; raw documents are not uploaded to a file-store API.

Current free quota is account/project dependent and must be inspected in [AI Studio limits](https://ai.google.dev/gemini-api/docs/rate-limits); no universal daily allowance is promised. A free-tier key must belong to a project without active billing. The API key cannot prove this locally, so `GEMINI_FREE_TIER_CONFIRMED=true` is an explicit operator attestation, not an API-verified fact. No billing link/upgrade is performed, and unknown/paid-only model IDs and alternate serving origins are rejected.

[Google's unpaid-service terms](https://ai.google.dev/gemini-api/terms) permit improvement use and human review of submitted data and prohibit sensitive/confidential/personal submissions. Nigeria appears in the [supported-region list](https://ai.google.dev/gemini-api/docs/available-regions); account eligibility and actual network access remain untested. Use only public/synthetic nonconfidential plans approved for this service. The NVIDIA trial candidates likewise have [trial data-use restrictions](https://assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf); synthetic controls contain no real facility/person data. Groq account-specific privacy/region conditions were not assumed in the absence of access.

## Evaluation fixtures and new results

Ground truth: own `tests/fixtures/vision-evaluation/two-room-plan.svg` and README. It contains RECEPTION/CLINIC, a visible partition doorway, entry gap and labelled stair symbol. These are drawing facts, not measured accessibility characteristics or a physical survey. The source-controlled fixture builder produces:

| Case | Local preprocessing | Coordinate/source preservation | Gemini live extraction |
|---|---|---|---|
| Small readable plan | PASS,600×400 PNG | Whole image included | BLOCKED: key/free-project confirmation/workspace consent absent |
| Right-side labels/symbols crop | PASS,450×600 PNG | Explicit transform back to600×400 source; x offset300 | BLOCKED, no request |
| Full detailed-scale plan | PASS,1800×1200 PNG plus four detail tiles | Original complete image remains included; every tile names full-source bounds | BLOCKED, no request |
| Own PDF-derived page | PASS,1667×1112 PNG plus four detail tiles | Original PDF retained; actual raster dimensions determine source transform | BLOCKED, no request |
| Deliberately malformed input | PASS: safely rejected | No inference or geometry fabricated | Not sent |

`apps/api/scripts/evaluate-vision.ts --live` produced **exit2**, four BLOCKED and one locally rejected/PASS result. All valid preprocessor checks passed; zero Gemini requests were attempted. This is LOCAL_INTEGRATION configuration/decoder evidence, not LIVE_EXTERNAL inference. Private receipt: `.accessops-local/vision-provider/evaluation/evaluation.json`. The expected latency, actual labels, schema completeness and full-plan extraction quality for Gemini are **UNVERIFIED** until authorized access is configured.

The two other real candidate requests are separate LIVE_EXTERNAL failures (`gemma-control.json`, `llama-control.json`, `llama-user-only-control.json`); they are not Gemini tests. Previous Omni image passes/transcription failures and full-plan timeouts remain historical evidence, not evidence for the newly selected provider.

## Implementation and verification boundaries

`providers/vision-selection.ts` centralizes provider/model/capability diagnostics. `agents/vision.ts` routes image-bearing turns; Gemini failure never routes to NVIDIA, OpenRouter, Vertex or another model. Explicit `none` preserves non-AI operation. An explicit legacy NVIDIA opt-in remains recoverable, but is neither selected nor automatically used. The older NVIDIA-only live script refuses ordinary Gemini configuration; use the new evaluator.

`agents/gemini-vision.ts` uses the documented generate-content JSON/image contract, fixed HTTPS origin and `x-goog-api-key` header rather than secret-bearing URLs. It checks free-project attestation, existing global provider consent and separate `ACCESSOPS_GEMINI_VISION_WORKSPACES`. It validates actual stable model/version identity, STOP status, visible JSON object, size/timeout/auth/rate/model errors and secret echoes. Hidden thoughts are excluded. Requests/failures log safe provider/model/hash metadata; successful response receipts distinguish live from injected transports and retain actual `modelVersion`/request ID. JSON/schema validity is never treated as correct transcription.

The original parser's strict normalization and duplicate/wall-reference/zero-length checks remain. `lib/extracted-geometry.ts` additionally rejects empty structural proposals and out-of-image coordinates before version storage. Physical scale remains unknown. Proposals and receipts are marked unreviewed; human correction, deterministic geometry repair/validation and existing tactile/export gates remain. In-bounds hallucinations cannot be ruled out by schemas: source review is still essential.

Parse requests preflight readiness before queueing. Missing key/consent/disabled inference returns503 with safe diagnostics, leaves the project unchanged and creates no futile background job. Downstream failures retain actionable safe messages. The database schema, migration history and text selector are unchanged.

## Reproduction and exact next action

From repository root, Bun1.3.14 on PATH:

```sh
bun test apps/api/src/agents/gemini-vision.test.ts apps/api/src/agents/vision-fixtures.test.ts
INTEGRATION_EVIDENCE_DIR=/absolute/private/new-evaluation API_URL=http://127.0.0.1:3403 \
  bun run --cwd apps/api scripts/evaluate-vision.ts --live \
  < /private/admin-login.json
```

1. Configure an actual key from an **unbilled** AI Studio project as `GEMINI_API_KEY` in private `apps/api/.env`; do not paste it into chat or source. Existing code cannot generate account access.
2. After checking that project's billing and unpaid-data terms, set `GEMINI_FREE_TIER_CONFIRMED=true` and explicitly approve only permitted workspace IDs in `ACCESSOPS_GEMINI_VISION_WORKSPACES` and existing `ACCESSOPS_PROVIDER_WORKSPACES`. No such approval is assumed today.
3. Restart the same API/worker, inspect `/v1/providers`, and rerun the new evaluator in a new evidence directory. Inspect the complete extracted models against the source; a response is not an extraction pass. `--persist` additionally reopens accepted unreviewed results through the authorized local API; it never implies human geometry review.
4. Only after actual success record LIVE_EXTERNAL/LIVE_END_TO_END. Then exercise normal `/projects/:id/parse` critique/doorway/review/tactile/export; the evaluator's parser-stage result does not establish the complete agent loop.

Full local/security/build/browser counts and fresh NVIDIA text status are in [delivery](accessops-final-hardening-delivery.md). Hackathon compliance questions and submission gates are in [requirement evidence](hackathon-requirement-evidence.md). No demo video was produced.
