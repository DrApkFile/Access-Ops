# Live integration verification — 2026-10-27

## Current selected vision — 27 October 2026

**PASS: OpenRouter `nvidia/nemotron-3.5-super-vl:free` now handles images. Direct NVIDIA Nemotron Lightning text remains unchanged and passed a fresh LIVE_END_TO_END investigation.** Genuine synthetic PNG and PDF uploads completed the existing durable parser/critique/doorway workflow, stored unreviewed models and reopened their history; full1800×1200 plus detail tiles also passed extraction. Actual receipts report exact model, serving provider Nvidia, HTTP200 and cost0. Groq Qwen returned200/schema-valid output but failed doorway/perimeter coordinates; OpenRouter Qwen free returned404/no remaining provider. Gemini's earlier503/403 and direct Omni failures remain distinct historical statuses.

| Capability | Current result | Evidence / remaining action |
|---|---|---|
| Selected OpenRouter vision | PASS, LIVE_END_TO_END | `.accessops-local/free-vision/{evaluation-ready/evaluation.json,workflow-small/workflow.json,workflow-pdf/workflow.json}`; synthetic accuracy only, human review still required |
| Direct NVIDIA text/fallback | PASS, new LIVE_END_TO_END | `live-text-ready/verification.json`; actual NVIDIA, Runtime skipped without request; private configuration unchanged |
| Meterless Engine | PASS, new8/8 LOCAL_INTEGRATION | `engine.log`; Runtime qualification remains separate |
| Meterless Runtime | BLOCKED / qualification UNVERIFIED | No instance token/explicit origin; no Runtime request or account-denial claim |
| Zetaris | Prior genuine coverage evidence retained | No new query here; indoor federated-data limitations unchanged |
| Security audit | PASS,1 newly discovered advisory patched to0 | qs6.16.0→6.16.1, `audit-final.log`, frozen lock consistent |
| Bumps / AccessOps / browser | See current delivery | New unit/local/acceptance/browser evidence; UI unchanged |

The free vision boundary checks account/catalog eligibility before each request, pins the exact free model, imposes zero maximum prices, disables paid/provider fallback, enforces global+OpenRouter workspace consent and rejects invalid/truncated output. `VISION_PROVIDER=none` keeps manual operation explicit. Configuration diagnostics are not inference proof. Detailed commands, failures/reruns, versions and limits: [current evaluation](vision-provider-evaluation.md) and [current delivery](accessops-final-hardening-delivery.md). No secrets or demo video are included.

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


## Current vision-provider replacement checkpoint

**Vision selects direct Google Gemini 3.6 Flash; NVIDIA Nemotron remains on text. Gemini live execution is BLOCKED, not passed.** The original Bumps code/study, current free API documentation, checked credentials, actual attempted alternatives and exact activation path are in [vision evaluation](vision-provider-evaluation.md). New evidence is private `.accessops-local/vision-provider/`; earlier sections below are historical checkpoints.

| Capability | New actual status | Evidence and precise limitation |
|---|---|---|
| Selected Gemini vision | **IMPLEMENTED; LIVE BLOCKED** | No `GEMINI_API_KEY`, no unbilled-project confirmation, no Gemini workspace approval. Four representative inputs preprocess successfully but live evaluations are NOT RUN; invalid input is rejected. `evaluation/evaluation.json`, exit2, zero Gemini requests. |
| Candidate Google Gemma4 / Meta Llama90B via NVIDIA | **LIVE_EXTERNAL FAIL** | Actual free-catalog synthetic-image requests timed out at120035ms/120038ms (`gemma-control.json`, `llama-control.json`); documented user-only Llama retry also timed out at120209ms. No usable extraction or authenticated model-response identity proof. |
| NVIDIA Nemotron text | **PASS, new LIVE_END_TO_END** | Run `01a17e07-8ede-7000-8857-ecdb78203016`, request `chatcmpl-7f59dc36-deb5-4b8c-b35a-07ab4e52f559`, exact Lightning model,4884ms; `live-text/verification.json`. One observation, not an SLA. |
| Text fallback policy | **PASS** | Runtime skipped without request; actual provider NVIDIA, mode auto, reason missing configuration; original frozen evidence hash unchanged. Vision consent/provider selection is independent. |
| Meterless Engine | **PASS, new8/8 LOCAL_INTEGRATION** | `engine.log`, real facade/vendor conformance; actual frozen-observation Engine projection in the new text result. Not Runtime execution. |
| Meterless Runtime | **BLOCKED; account/qualification UNVERIFIED** | Missing instance token and explicit origin. No real Runtime request. Engine acceptance needs organizer confirmation; [draft question](hackathon-requirement-evidence.md) is prepared, NOT SENT. |
| Zetaris | **Prior real source receipts retained; not newly queried here** | New text run consumes the actual frozen coverage investigation. Geographic data is not indoor accessibility evidence; earlier indoor-federation/join limitations remain. |
| Deterministic/non-AI workflows | **PASS locally** | Full unit and acceptance checks retain source/evidence/graph/action/history/manual editing/tactile/STL flows. Unavailable vision now fails before queueing or modifying the project. |
| Dependency security | **PASS, zero advisories** | Fresh Bun audit and frozen install; no dependency or lockfile change was needed. |

Separate image readiness reports the selected Gemini model, missing field names and workspace policy, never secret values or health inferred from text. There is no automatic vision fallback to NVIDIA/OpenRouter/Vertex/paid models. Actual successful Gemini receipts would preserve reported model/version, request ID and image/source hashes; mocked transports are labelled mocked. Today none exists, and full-plan Gemini quality/latency remain unverified.

Current new checks:257 unit/local/mocked tests,96 focused provider tests,184 local acceptance assertions, Engine8/8; typecheck/lint/build/security passed. All46 final browser checks passed after isolating/fixing private harness sessions; final manifest/secret results are consolidated in [delivery](accessops-final-hardening-delivery.md). Historical228/176/44 counts and Omni results below are not the new image-provider status. The selected provider's no-key boundary is an external access dependency, not fabricated live success.

## Earlier hardening and fallback records (historical)

## Current hardening checkpoint — 27 October 2026, after fallback delivery

This section supersedes earlier vision/security statuses and test counts below; historical receipts remain intact. Detailed evidence and commands: [final hardening delivery](accessops-final-hardening-delivery.md), [vision delivery](vision-integration-delivery.md), [dependency audit](security-dependency-audit.md). New evidence root is private `.accessops-local/hardening/`.

| Capability | Current verified status | New evidence | Remaining action |
|---|---|---|---|
| Meterless Engine | PASS, actual LOCAL_INTEGRATION 8/8 | `engine.log`, exit 0; vendor unchanged | Event qualification is a separate organizer decision. |
| Meterless Runtime | BLOCKED, no authenticated Runtime request | Fresh `live-text/verification.json` explicitly reports missing token/origin, `networkAttempted:false` | Supply actual instance-generated token and explicit authorized origin; account denial/qualification remain UNVERIFIED. |
| NVIDIA Nemotron text | PASS, newly rerun LIVE_END_TO_END | Provider run `01a17d4d-f73d-7000-94ff-23cbcfc3409d`, request `chatcmpl-63b7b1ef-eb8c-44a3-9b5e-1832ed87f4f9`, Lightning model, 5933ms; `live-text/verification.json` | No new text blocker; retain consent, data policy and free quota. |
| Runtime → NVIDIA fallback | PASS for actual missing-configuration branch; configured Runtime failures remain MOCKED_INTEGRATION | Actual provider `nvidia`, `requestedMode:auto`, missing Runtime skipped without request, original evidence hash unchanged | Real Runtime failure tests need a permitted instance. No sponsor Runtime claim. |
| NVIDIA vision | PARTIAL: serving mismatch avoided with documented Omni, real randomized image controls PASS; complete clinic parsing not verified; final additional control transcription rejected | `live-vision-control-source/verification.json` and `live-vision-probe.json`; full parser 503/timeout records in vision delivery | Re-run full parser/critique/doorway workflow against a service able to complete this workload; no reviewed geometry claim. |
| Zetaris source consumption / coverage finding | Preserved prior LIVE_END_TO_END proof; not rerun as an external query this task | Frozen investigation reused in the new real text run; exact source evidence/hash retained | Prior federated-join timeout and missing indoor-data coverage remain open. Geographic records are not building measurements. |
| Dependency security | PASS: 8 original findings → 0 current findings | `audit-before.json`, `audit-last.log`, actual installed dependency traversal | Continue periodic audits; not a guarantee against unknown vulnerabilities. |

Text still uses `nvidia/nemotron-3.5-lightning-30b-a3b`. Vision roles now use `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`, which returned its exact documented identity and correctly recognized randomized image-only text and shape. A final additional control failed transcription (`AXVJARCF` → `0.0`) despite canonical identity and was rejected; see `live-vision-final-control/inspection.json`. No further call was used to replace that failure. The old Super VL private alias is still rejected, not silently trusted. Image/configuration/discovery states are distinct from actual successful inference and from human geometry verification.

The policy-controlled text selector/validator is preserved: both workspace consent lists, explicit fallback opt-in, pinned/local-only restrictions, actual-provider persistence, no retries with absent Runtime configuration and deterministic operation without providers. Meterless Runtime is optional for operating AccessOps and is not impersonated by NVIDIA or local Engine execution. The Runtime activation checklist below remains applicable.

Fresh test evidence is in the consolidated delivery. The earlier 202 tests / 177 assertions / eight-advisory checkpoint below is historical; use the new 228-test full suite, 176-assertion final local acceptance and final audit records for this pass. No video, paid endpoint or external resource was created.

## Previous Runtime fallback checkpoint (historical evidence)

## Meterless Runtime Status and NVIDIA Nemotron Fallback

**CONFIRMED: this deployment has no supplied Runtime token or deliberately configured Runtime endpoint. NVIDIA Nemotron is the operational text fallback when Meterless Runtime cannot be used, subject to explicit provider/data policy and NVIDIA availability. Runtime access is optional for operating AccessOps, not an immediate prerequisite.** This does not establish that the owner lacks an account or cannot obtain a Runtime later.

### Root cause and confidence

The **original decisive code gate was the absent token**: the previous `configuredProvider('meterless')` returned null before constructing any URL. That version could derive the documented local8088 origin if a real token existed. Therefore endpoint absence is not evidence of a missing account-specific endpoint requirement in the original contract. This change deliberately requires an explicit origin as an AccessOps intent/safety policy; it is not presented as a newly discovered tenant/deployment requirement. No local Runtime listener was found to make the documented default usable here.

Fresh local diagnostics loaded AccessOps' existing server environment and its explicitly authorized integration-file reference. Both `METERLESS_RUNTIME_TOKEN` and `METERLESS_BASE_URL` are absent. No listener exists on the documented local discovery ports 8088/8090/8787/11434, and no Meterless executable/process was found through the ordinary command/process-name checks. No authenticated Runtime request was sent. Evidence: private `.accessops-local/runtime-fallback/{config-before,runtime-diagnosis}.json` and focused code/config inspection. No home-directory credential search or unrelated secret copying was performed.

| Candidate cause | Determination | What the evidence actually establishes |
|---|---|---|
| Missing secret | **CONFIRMED, current deployment** | No supplied valid Runtime Bearer token. This is absence, not a tested401 or rejected account. |
| Missing non-secret connection configuration | **CONFIRMED absent explicit value; reachable instance unverified** | No deliberately configured Runtime origin; no running service found on documented local discovery ports. A local default exists in the contract, but cannot be presumed to be a running authorized service. |
| Owner cannot obtain an account / permissions | **UNVERIFIED** | No account rejection or entitlement check occurred. The documented local token is generated by an installed/running Runtime; it is not necessarily a sponsor-issued cloud API key. |
| Runtime adapter defect | **Live contract unverified** | Missing access prevents real auth/completion verification. Mock tests cover documented requests. A separate fallback config-exception defect was repaired; it does not prove the Runtime server is broken. |
| External Runtime service failure | **NOT RUN / UNVERIFIED** | There is no configured authenticated connection to invoke; do not call this a service outage. |
| Runtime-specific event qualification | **UNVERIFIED** | The inspected event page discusses Meterless sponsor integration, but does not establish Runtime-only qualification. Engine conformance is separate and does not prove Runtime auth or organizer acceptance. |

The [official Runtime provider contract](https://raw.githubusercontent.com/Meterless/Meterless/main/docs/agent-ready/add-meterless-provider.md) requires real Bearer authentication and documents an instance-generated token. The [Nightshift hotspot documentation](https://raw.githubusercontent.com/Meterless/Meterless/main/docs/products/nightshift/hotspot.md) describes a local or shared Runtime. Missing connection/token cannot be generated or cleared by editing AccessOps alone; a running authorized instance and its administrator/owner are required. It remains unknown whether the owner can provision one later. No repeated known-impossible login or completion requests are made.

The deployment can use NVIDIA now without resolving Runtime. The known local default is **derivable**, routing IDs are **discoverable after authentication**, while the real instance token/any shared-host connection details come from its owner/admin. Account unavailability remains unverified.

### Required versus optional information

| Item | Secret? | Required / source |
|---|---|---|
| `METERLESS_RUNTIME_TOKEN` | Yes | Real Runtime token from the authorized instance's `<stateDir>/proxy-token` or administrator's approved connection workflow. `rt-local` is rejected. Absent here. Never paste it into chat or documentation. |
| `METERLESS_BASE_URL` | No, but may be internal | Explicit authorized Runtime origin required by AccessOps to signal deliberate configuration. Contract's usual local origin is `http://127.0.0.1:8088/v1`; normalization handles documented suffixes. Absent here. Do not invent a hosted URL. |
| `METERLESS_MODEL` | No | Optional routing ID, default `meterless/auto`; available IDs discovered through authenticated `/v1/models`. `meterless/local` prohibits NVIDIA cloud routing. |
| Tenant/project/deployment ID | No requirement found | Neither current contract nor this adapter requires one. Do not request or fabricate it. |
| `meterless-app`, `meterless-scope` | No | Derived application headers: stable `accessops`, and `user` on chat. Not owner-supplied credentials. |
| `ACCESSOPS_PROVIDER_WORKSPACES` | No | Existing explicit workspace consent; still required before sending evidence to either provider. |
| `ACCESSOPS_NVIDIA_TEXT_WORKSPACES` | No | New separate explicit consent for external NVIDIA **text** evidence. Empty means denied, including pinned NVIDIA requests. No wildcard or implicit inheritance from Runtime consent. |
| `ACCESSOPS_NVIDIA_FALLBACK` | No | `true` enables automatic switch only for permitted workspaces; code defaultfalse. Shipped examples opt in while leaving workspace lists empty. |

No Runtime URL/token is required for application startup, deterministic workflows, or an approved NVIDIA fallback. Invalid policy flag values fail startup validation instead of silently enabling external routing.

### Selection, boundaries and provenance

The existing provider implementation is retained; `providers/selection.ts` centralizes safe configuration/policy diagnosis. `ACCESSOPS_EXPLANATION_PROVIDER=auto` is the default. The UI omits a pinned provider so the server applies this mode. Explicit `meterless` or `nvidia` pins that provider; `none` disables AI, preserving deterministic results. Operator global `none` also disables an explicitly requested AI mode.

In auto mode, a deliberately configured Runtime is preferred. Missing token/endpoint or invalid endpoint is recorded as a configuration skip (`requestSent:false`), with no network request. Configured Runtime discovery uses its real token, app header and `/models`; chat includes `meterless-scope:user`, bounded text evidence, no tools/SQL, and the documented 180-second cold-start budget. Each provider has at most one discovery and one completion per operation; no completion HTTP retries, and explanation jobs retain maxAttempts1/no automatic ambiguous replay.

Eligible Runtime failures are missing/invalid configuration, unavailable model/non-Runtime discovery,401/403,429,502/503/504, offline/timeout. These produce a clear attempt code and only switch if fallback/data policy permits. Validation, unsupported claims, secret echoes, malformed citations and model-integrity failures **stop** rather than being concealed by another provider. A pinned Runtime request never silently switches. `meterless/local` prevents cloud routing even if the fallback flag is true.

NVIDIA is selected only when workspace consent, NVIDIA-text permission, fallback opt-in (auto mode), valid configuration and live model discovery permit it. NVIDIA uses the existing Nemotron text adapter and grounded response validator. Both failures yield `status:unavailable`, actionable code/reason and failed/skipped attempts, never fabricated explanatory text; deterministic findings/history remain usable.

Metadata and structured logs record `requestedMode`, `actualProvider`, `fallbackReason`, attempt phase/status/requestSent, actual model/request ID and execution classification. Stored provider rows are updated to the **actual** provider. Injected transports are marked `execution:mocked`, not live. API/UI show actual provider and history. Secrets and raw transport exception text are excluded from diagnostics/logs; optional private visible-response captures redact configured provider keys and exclude prompts/hidden reasoning.

### New external proof (this task)

At 2026-10-27T11:11:20.783Z, the existing completed source-coverage investigation was sent through **auto fallback**, not a second provider implementation. Runtime was skipped for both missing fields with `requestSent:false`. A real NVIDIA completion returned HTTP200 and passed existing exact-claim, evidence-ID, recommendation, schema and model-identity checks. The result was consumed/persisted by AccessOps and classified **LIVE_END_TO_END**.

Provider run `01a17d0e-aa2f-7000-9b8b-5ab54cd698e4`; actual model `nvidia/nemotron-3.5-lightning-30b-a3b`; request `chatcmpl-6b5022aa-4a81-4474-bbea-0995d691380e`; measured provider workflow duration 4313ms (single observation, not an SLA). `requestedMode:auto`, `actualProvider:nvidia`, `fallbackReason:MISSING_PROVIDER_CONFIGURATION`. Frozen investigation/evidence hash remains `9736455bff9c39d4d61abfb0279370c708ea8e536b6304d4b4eb43ca8b0edafb`. Evidence: `.accessops-local/runtime-fallback/live-nvidia/verification.json`, the persisted provider history and redacted structured logs. Prior NVIDIA success remains historical proof; this is a fresh run.

The Engine actually projected the two frozen observations and recorded `runtimeExecution:false`. The Node conformance command initially failed because the application facade imported an extensionless TS path; adding `.ts` fixes that harness invocation without modifying vendor source. Both Bun and corrected Node runs pass 8/8. This Engine import repair is separate from absent Runtime authentication/access.

### Capability status

| Capability | Status | Evidence | Remaining action |
|---|---|---|---|
| Meterless Engine conformance | **PASS, new 8/8 LOCAL_INTEGRATION** | `engine-conformance-bun.log`, `engine-conformance-node-fixed.log` | None for these checks; organizer qualification remains separate. |
| Runtime authentication/access | **BLOCKED, no live request** | Fresh config diagnosis and no local listener; adapter tests are mocked | Owner/admin supplies an actual instance origin and token. Account inability is not asserted. |
| NVIDIA Nemotron text | **PASS, freshly rerun LIVE_END_TO_END** | New persisted provider run and live receipt above | Keep authorized endpoint/key, consent and quota healthy. |
| Runtime-to-NVIDIA fallback | **PASS for missing-access branch live; deterministic configured-failure branches mocked** | `fallback.test.ts`, full suite, DB acceptance, new actual auto-mode result | Actual Runtime transient/auth-failure fallback cannot be proven live without Runtime access. |
| NVIDIA vision | **Prior FAIL-CLOSED; NOT RERUN here** | Prior `ui-phase/vision-verification.json` / serving diagnostic | Resolve undocumented Super VL returned model alias with provider or select an authorized documented vision alternative. Text success does not prove vision. |

### Enable Runtime later

1. Obtain/run an authorized Nightshift Runtime instance with an enabled text route; confirm permitted data handling and any hardware/service cost. No Runtime installation/resource provisioning is performed by this task.
2. Administrator supplies the real origin and token through secret injection/local private config. Use the real instance token, never a placeholder. No tenant/project ID is required by this contract.
3. Set the same `METERLESS_BASE_URL` / `METERLESS_RUNTIME_TOKEN` on API and worker. Keep `METERLESS_MODEL=meterless/auto` or choose a routing ID returned by that instance. Retain `ACCESSOPS_EXPLANATION_PROVIDER=auto` for approved fallback; pin `meterless` for isolated qualification checks. Restart supervised processes.
4. Use the authenticated provider-readiness endpoint `/v1/providers` to verify model discovery.401/403 means unauthorized; model discovery alone does not prove inference. Auto Detect is a separate opt-in helper and never guesses credentials; no automatic scans run during ordinary selection.
5. As an authorized operator, POST `/v1/investigations/COMPLETED_ID/explanations` with `provider:meterless`, confirmation `explain-frozen-evidence`, cookie/CSRF header and a new idempotency key. Await the durable job, then inspect `/providers` for actual `meterless` execution, valid grounded citations and unchanged frozen evidence hash.
6. Only after actual successful consumption record Runtime LIVE_END_TO_END. Test wrong-token/transient/offline handling in an authorized isolated instance; do not deliberately disrupt shared production services. Verify auto-mode policy and explicit actual-provider metadata.
7. Confirm the event accepts the chosen Meterless integration path. NVIDIA fallback preserves product operation; it does not impersonate Runtime or establish sponsor qualification.

This run's completed checks: **42 provider tests / 151 assertions**, **202 full-suite tests / 801 assertions**, **177 local acceptance assertions**, **44 browser checks**, and **8/8 Engine conformance**. All exited 0; type checking, lint and production build also exited 0. Lint retains 5 img warnings. Source/configured-secret scans passed; dependency audit exited 1 with the existing 8 advisories (5 high, 3 moderate). New fallback evidence survives owned-service restart. Runtime live tests and vision rerun are explicitly NOT RUN for the reasons above.

### Reproducible checks and limits

From repository root (Bun 1.3.14 / Node 24.19.0; isolated Postgres 17 at 127.0.0.1:55434):

```sh
bun test apps/api/src/providers
bun run test
ACCESSOPS_INTEGRATION=1 bun run test:integration
bun run typecheck
bun run lint
bun run security
bun audit --json
bun run build
WORLD_MODEL_IMPL=./apps/api/src/accessops/world-model-engine.ts \
  node --experimental-transform-types apps/api/vendor/meterless-world-model/conformance/runner.ts

API_URL=http://127.0.0.1:3403 INTEGRATION_EVIDENCE_DIR=/absolute/private/evidence \
  bun run --cwd apps/api scripts/verify-live-integrations.ts \
  --investigation=AUTHORIZED_COMPLETED_ID --complete-nvidia --auto-fallback \
  < /private/admin-login.json
```

The last script checks the inspected NVIDIA endpoint/model and requires Runtime to be unconfigured for this specific missing-access fallback verification. It does not make up a Runtime success. Never place keys/passwords in command arguments. Stop only task-owned competing workers for controlled recovery assertions in the integration suite. Exact exit codes, counts and browser outcomes for this run are in [fallback delivery](meterless-runtime-fallback-delivery.md) and private `runtime-fallback` command logs. Missing Runtime is **not** a reason to block normal operation or repeatedly request credentials from the owner.

NVIDIA vision's prior returned `private/nvidia/nemotron-3.5-super-120b-a12b` differs from the requested documented Super VL ID and remains rejected. No image request, new video, paid fallback or external resource mutation was performed here. Advertised NVIDIA free/trial availability is not an unlimited/free production guarantee. Existing source federation, security advisories and deployment gates remain independently documented.

## Earlier verification checkpoint (before this fallback-policy task)



Status is based on actual execution in the existing AccessOps/LastMile folders. Private evidence is under `.accessops-local/ui-phase`; do not publish that directory wholesale. No secret values, private prompts, hidden model reasoning or session/query handles are included in this report. No external catalogs, tables, paid resources or deployments were created. NVIDIA default uses the inspected catalog free endpoints; no paid fallback was selected. Account-wide billing/production availability was not independently audited.

## Classification

`UNIT`: deterministic logic. `MOCKED_INTEGRATION`: injected fake transport. `LOCAL_INTEGRATION`: actual Postgres/API/worker/Engine/browser execution. `LIVE_EXTERNAL`: actual external request completed or failed as recorded. `LIVE_END_TO_END`: actual external result was validated and consumed/persisted by an AccessOps feature. HTTP200, discovery, a mock or a job marked processed alone does not establish successful grounded output.

## Current results

| Capability | Status / classification | Actual result and safe evidence |
|---|---|---|
| Zetaris authentication/connectivity | **PASS — LIVE_EXTERNAL** | Authorized credentials present/valid; login org and UUID request contract verified. `ao-zetaris-connection.json`, `adapted-service-probe.json`. |
| Zetaris independent sources | **PASS — LIVE_EXTERNAL** | Three actual taxi-zone rows and five actual OSM road rows returned by existing permitted tables. Receipts in `live-e2e-current/{NY_TAXI_taxi_zones,LASTMILE_OSM_bronx_ffcc6280994e_csv}.json`. |
| Zetaris results → AccessOps investigation | **PASS — LIVE_END_TO_END, limited scope** | Immutable hash-checked raw receipts, separately normalized reported schema observations, canonical reference-area scope and persisted two-source schema-gap finding. `live-e2e-current/verification.json`; see IDs below. This is a data-coverage result, not an indoor accessibility assessment. |
| Actual federated join | **FAIL — LIVE_EXTERNAL** | Aggregate and bounded taxi-zone/trip joins timed out at 30 seconds; no joined rows returned. `federated-probe.log`, `federated-bounded.log`. No fallback mock. |
| Indoor directory/operational federation | **BLOCKED — NOT RUN** | Permitted `ZETARIS_DIRECTORY_TABLE` / `ZETARIS_OPERATIONS_TABLE` with the required building/lift fields are absent. Existing geographic tables do not substitute for these records. |
| Meterless World Model Engine | **PASS — LOCAL_INTEGRATION** | Unmodified licensed source, actual eight conformance checks, plus real stored-observation projection in investigations/provider execution. `engine-conformance.log`, accepted NVIDIA metadata. |
| Meterless Runtime discovery/completion | **BLOCKED — NOT RUN** | No actual `METERLESS_BASE_URL` / valid `METERLESS_RUNTIME_TOKEN` in the authorized configuration. No authenticated Runtime call claimed. Engine does not prove Runtime or event acceptance. |
| NVIDIA model discovery | **PASS — LIVE_EXTERNAL** | Valid key; selected Lightning/Super VL identifiers available in actual model list. `nvidia-model-discovery.json`, `transport-probe.json`, accepted run evidence. |
| NVIDIA Lightning explanation | **PASS — LIVE_END_TO_END** | Real request, confirmed model, structured schema + exact rationale/classification/recommendation + valid evidence-set checks, durable provider run attached to frozen AccessOps history. `live-nvidia-verified/verification.json`. |
| Rejected NVIDIA text responses | **FAIL, safely rejected — LIVE_EXTERNAL** | Two HTTP200 outputs used a recommendations string instead of an array. Strict validation preserved deterministic findings. `live-e2e-current/verification.json`, `live-nvidia-retry/verification.json`, redacted visible responses in `provider-responses/`. Instruction now explicitly types the JSON array; no validation weakening or fabricated output. |
| NVIDIA Super VL PNG parsing | **FAIL-CLOSED — LIVE_EXTERNAL** | Two real synthetic PNG requests returned a different, undocumented serving ID (`private/nvidia/nemotron-3.5-super-120b-a12b`) than requested (`nvidia/nemotron-3.5-super-vl-120b-a12b`). Rejected before geometry persistence. `vision-verification.json`, `vision-check*.log`, private `provider-responses/vision-*.json`. |
| Full live image critique/doorway loop | **BLOCKED / NOT RUN** | Vision identity must first be resolved with provider confirmation or a documented currently free available alternative. Original Gemini/OpenRouter credentials absent; no paid switch made. |
| Original PNG/PDF/manual/tactile/STL | **PASS — LOCAL_INTEGRATION / regression** | Unit raster/geometry/editor suites and real Postgres acceptance cover original behavior, stale exports, historical retrieval and regenerated map/legend output. No claim that model-assisted parsing succeeded. |
| LastMile provider tests | **PASS — MOCKED_INTEGRATION** | Four existing source/provider files, 70 tests, exit 0. `lastmile-tests.log`. Injected transport; not live provider proof. |

## Inspectable actual source finding

Building category `reference_area`, ID `01a17b01-d10c-7000-8b4f-ba058d8b71e8`; label explicitly says no indoor survey. Investigation `01a17b01-d49b-7000-8f4b-89e3bf4ea3dd`; finding `01a17b01-d6da-7001-9fb6-4bc874d758f6`.

The finding cites observations `01a17b01-d419-7000-b384-de8dacd66c38` and `01a17b01-d2b9-7000-bfde-c4a54df8bba1`, from separate sources/snapshots. Returned schemas omit the required union of `door_clear_width`, `lift_served_floors`, `operational_status`; they cannot establish indoor routes or current lift condition. Raw records are retained; normalized observations explicitly identify a schema inspection, not a measured event. Effective/retrieval/source metadata remains distinct. Taxi data license/freshness is not certified; do not redistribute it without confirmation. OSM records retain contributor/ODbL attribution.

Open the investigation through the authorized UI at `/investigations/01a17b01-d49b-7000-8f4b-89e3bf4ea3dd`. Evidence tab reveals the immutable observation provenance; Sources reveals exact raw snapshots. A geographic query schema does not establish absent measurements in every possible upstream dataset, nor a safe route.

## Verified NVIDIA execution

Provider run `01a17cd7-5cfe-7000-92ae-848f0d3f0b98`, returned model `nvidia/nemotron-3.5-lightning-30b-a3b`, request `chatcmpl-f96724e5-da1e-4f72-8230-ca0b0e19aab8`. Duration 5083ms for this request, not a performance SLA. The response copies only the actual deterministic finding and both valid evidence IDs. The application persists the result separately from historical findings; it is visible in the provider panel. Engine metadata confirms two actual observations/facts, and `runtimeExecution:false`. Frozen investigation evidence hash remains `9736455bff9c39d4d61abfb0279370c708ea8e536b6304d4b4eb43ca8b0edafb`.

## Reproduction commands and exit codes

Run from AccessOps root with Bun 1.3.14, Node 24.19.0 and the isolated Postgres 17 service. Configure credentials privately and consent the workspace. Standard start: `bun run dev --web-port=3400`; migrations: `bun run --cwd apps/api db:migrate`. Do not overwrite existing `.env` with examples.

```sh
# Read actual permitted existing sources and persist a local coverage investigation.
API_URL=http://127.0.0.1:3403 INTEGRATION_EVIDENCE_DIR=/absolute/private/evidence \
  bun run --cwd apps/api scripts/verify-live-integrations.ts --import-reference \
  < /private/admin-login.json

# Explicit bounded inference over an existing completed authorized investigation.
API_URL=http://127.0.0.1:3403 INTEGRATION_EVIDENCE_DIR=/absolute/private/evidence \
  bun run --cwd apps/api scripts/verify-live-integrations.ts \
  --investigation=AUTHORIZED_COMPLETED_ID --complete-nvidia < /private/admin-login.json

WORLD_MODEL_IMPL=./apps/api/src/accessops/world-model-engine.ts \
  node --experimental-transform-types apps/api/vendor/meterless-world-model/conformance/runner.ts
```

Actual combined source-import/text attempt exited 1 because AI validation failed, while the independently verified source import/investigation succeeded. Diagnostic text retry exited 1; final `live-nvidia-verified` run exited 0. Vision diagnostic runs exited 1. Engine conformance exited 0. Initial probes also preserve rejected `SHOW TABLES IN NY_TAXI` (HTTP400 unsupported syntax) and the first malformed request-ID attempt (400, corrected to documented UUID); they were not hidden or relabelled success. An interruption-time verification failed during DB shutdown/recovery; it was not classified as an inference success.

Private `live-probe.ts` uses the real AccessOps adapter; `vision-check.ts` exercises the original parser with the synthetic clinic image. These scripts contain no secret values; credential input/env paths remain private. Use the source-controlled verification script for repeatable permitted requests, rather than copying private credentials into command arguments.

## Cost, rules and precise remaining gates

Official [Lightning catalog](https://build.nvidia.com/nvidia/nemotron-3.5-lightning-30b-a3b) and [Super VL catalog](https://build.nvidia.com/nvidia/nemotron-3.5-super-vl-120b-a12b) advertised free endpoints when checked. No chargeable provider/deployment was substituted. If a replacement/production endpoint requires paid quota, obtain confirmation before using it. The older Nano VL free endpoint is deprecated; a stale example is not proof of current availability.

Official sources: [event](https://hackathon.genai.works/event/open-agent-hackathon-2026), [Runtime contract](https://raw.githubusercontent.com/Meterless/Meterless/main/docs/agent-ready/add-meterless-provider.md), [World Model Engine](https://github.com/Meterless/Meterless/tree/main/engines/world-model), [Zetaris scripts](https://github.com/zetaris/getting-started/tree/main/scripts), [Lightning API](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-5-lightning-30b-a3b-infer), [Super VL API](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3_5-super-vl-120b-a12b-infer). The event's required sponsor integration does not by itself certify this particular Engine/source-gap demonstration; confirm organizer acceptance and finish meaningful indoor federation with permitted records.

Next actions: supply authorized indoor source views; investigate service join timeouts; provision authorized Meterless Runtime access if that path is required; obtain authoritative vision serving-ID confirmation (no undocumented allowlist shortcut); rerun those specific external end-to-end cases. Hosting, production operational approval, original-code/font/video licensing, external monitoring and dependency remediation remain deployment gates.
