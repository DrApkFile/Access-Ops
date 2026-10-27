# Meterless Runtime fallback delivery

## Current selected image provider

OpenRouter `nvidia/nemotron-3.5-super-vl:free` now passes genuine synthetic PNG/PDF Bumps parser/critique/doorway workflows and persistence. Direct NVIDIA Nemotron Lightning text remains independently verified and unchanged. Runtime is still blocked by token/origin; Engine8/8 is separate. No UI redesign or video was created in this pass. Free-only routing and workspace permission remain enforced. See the [latest evidence](vision-provider-evaluation.md); earlier Gemini/Omni failures below describe historical providers, not selected-image failure.

## Earlier evidence (historical; superseded by the current checkpoint above)

Current replacement-key update: Google model discovery succeeds, but actual synthetic-image requests to3.5 Flash,3.5 Flash-Lite and3.8 Flash all return403: this project cannot use the Gemini API free tier. No billing was enabled; no vision extraction succeeded. NVIDIA text settings are unchanged. See the latest [integration record](live-integration-verification.md). Earlier service-busy and missing-key statements below are historical.

Current image-provider checkpoint: [vision evaluation](vision-provider-evaluation.md) selects Gemini 3.6 Flash. The approved test key is now configured; actual requests are blocked by Google HTTP503/high demand. NVIDIA text remains separately live-verified; NVIDIA/Omni vision descriptions below are historical. See [current integration status](live-integration-verification.md) and [hackathon evidence](hackathon-requirement-evidence.md).

Latest hardening checkpoint (27 October 2026): [final technical delivery](accessops-final-hardening-delivery.md), [vision verification](vision-integration-delivery.md) and [dependency remediation](security-dependency-audit.md) supersede older vision/security counts below. NVIDIA text fallback remains verified; the selected Omni vision model passed real image controls, while full clinic-plan parsing still hit 503/timeouts and a final additional control failed transcription. Dependency audit is now zero. UI design and existing evidence are preserved.

## Meterless Runtime Status and NVIDIA Nemotron Fallback

**Root cause: CONFIRMED missing Runtime token; no supplied/known usable Runtime connection in this deployment.** The owner’s ability to obtain an instance/account is **UNVERIFIED**, not diagnosed as an account rejection. No Runtime listener was found on the contract’s default local ports; no real Runtime authentication/completion was attempted with missing access details. Runtime is retained as optional, and is not an immediate prerequisite for operating AccessOps. Full evidence, requirements and future activation steps are in the primary [integration record](live-integration-verification.md#meterless-runtime-status-and-nvidia-nemotron-fallback).

Originally, the missing token alone caused `configuredProvider('meterless')` to return null; the old adapter could derive the documented local8088 default. No default-port listener was found. Requiring an explicit origin is a new AccessOps deliberate-configuration policy, not an account-specific requirement discovered in the Runtime contract. The endpoint value is absent, but a local default is documented/derivable; routing modes are discoverable once authenticated. The owner's ability to obtain/run an instance remains unknown.

The documented secret is an actual instance-generated Bearer token (`METERLESS_RUNTIME_TOKEN`, never `rt-local`). AccessOps additionally requires an explicit authorized `METERLESS_BASE_URL` rather than silently assuming a local service. `METERLESS_MODEL` is optional, default `meterless/auto`, discoverable via authenticated `/models`. App/scope headers are derived; no tenant/project/deployment ID requirement was found. Only the instance owner/admin can supply the real token/origin; code alone cannot manufacture a connection. Whether the owner can obtain them later remains unknown.

The [official provider contract](https://raw.githubusercontent.com/Meterless/Meterless/main/docs/agent-ready/add-meterless-provider.md) and [Nightshift hotspot guide](https://raw.githubusercontent.com/Meterless/Meterless/main/docs/products/nightshift/hotspot.md) were rechecked. The [event page](https://hackathon.genai.works/event/open-agent-hackathon-2026) does not by itself prove a Runtime-only requirement or acceptance of this specific Engine path. No qualification claim is made.

## Existing behavior and changes

Fallback was **partially present**: auto mode tried Runtime then NVIDIA, but the UI/API pinned NVIDIA, there was no independent fallback/data-policy gate, missing settings were generic, and an invalid configured Runtime URL could throw outside the fallback catch. These issues are repaired in the existing provider boundary; there is no second NVIDIA HTTP implementation.

- `providers/selection.ts`: typed safe diagnostics, deliberate Runtime configuration, validated provider policy, per-workspace NVIDIA text consent and a fixed eligible-error list.
- `providers/explanation.ts`: bounded deterministic selection; actual/attempt metadata; structured redacted logs; no requests for missing configuration; explicit policy/auth/transient/integrity outcomes; injected transports labelled mocked; existing grounding validator preserved.
- `providers/workspace-scope.ts`: expose current authenticated worker/request workspace for policy checks; existing consent remains required.
- `accessops/config.ts`: startup validation for mode and true/false fallback opt-in; missing optional Runtime does not block startup.
- `accessops/{stored-explanation,routes-workflows,jobs}.ts`: default server policy instead of pinned UI provider; auto/pinned/none modes carried through durable one-attempt jobs; actual provider stored in provider row; historical evidence unchanged; mocks never labelled live by persistence.
- `accessops/routes-admin.ts`: diagnostic missing field names, safe states and current workspace policy in provider readiness; no secret values.
- `agents` and Bumps geometry/tactile/export behavior remain intact. `accessops/world-model-engine.ts` only adds `.ts` to the facade import so the documented Node conformance command resolves; vendor source is unchanged.
- `scripts/{verify-live-integrations,check-integrations}.ts`: derive Runtime status rather than hardcoding missing-token claims; new guarded `--auto-fallback` live verification; authorized standalone explanation scope preserved.
- `.env.example` and `apps/api/.env.example`: explicit auto mode, optional Runtime origin/token, fallback opt-in and empty external-text consent list. Existing private API configuration updated in place: auto mode, explicit fallback enabled for the already approved local NVIDIA workspace. No unrelated configuration replaced.
- Existing investigation button/copy now use configured policy and expose actual provider; no layout/design-token/asset changes. Design handoff preserved. Related README/integration/deployment/security/checkpoint docs updated consistently.

## Selection policy and remaining edges

Auto mode prefers configured Runtime after authenticated discovery. Missing config skips it with no request. Eligible401/403,429,502/503/504, offline/timeout or unsupported/missing route leads to NVIDIA only when approved. Runtime and NVIDIA each get at most one discovery and one completion per operation; no completion transport retry or automatic explanation-job replay. A second provider may create a second bounded read-only inference after an ambiguous timeout, but never executes a source/operational action or repeats a consequential side effect. No unrestricted SQL/tools are given to either model.

NVIDIA text requires both existing `ACCESSOPS_PROVIDER_WORKSPACES` consent and the new `ACCESSOPS_NVIDIA_TEXT_WORKSPACES` allowlist. Automatic fallback also requires `ACCESSOPS_NVIDIA_FALLBACK=true` (code default false). Empty/denied policy sends no data to NVIDIA. `meterless/local` prohibits cloud routing. Explicit pinned Runtime never switches; explicit permitted NVIDIA is allowed even if automatic fallback is off. `none` preserves deterministic operation, including when no credentials exist. Validation/citation/secret-echo/model-integrity errors stop instead of hiding the failure behind another provider. Historical evidence and rejected responses are not rewritten into success.

Remaining edges: actual Runtime auth/transient fallback is mocked until a real permitted instance exists; no Runtime circuit breaker or health-result cache was introduced (each deliberate request is independently bounded). Interrupted external-intent records may require operator reconciliation, with no automatic replay. NVIDIA text policy does not certify or enable the blocked vision serving identity. Trial/production quota/terms and deployment approval remain separate.

## New actual inference proof

The existing frozen investigation `01a17b01-d49b-7000-8f4b-89e3bf4ea3dd` completed a fresh **LIVE_END_TO_END** auto-mode fallback run. Runtime was skipped (`requestSent:false`) for absent token/origin, then actual NVIDIA returned a validated explanation. Provider row now identifies `nvidia`, not `auto` or Meterless.

Provider run `01a17d0e-aa2f-7000-9b8b-5ab54cd698e4`; model `nvidia/nemotron-3.5-lightning-30b-a3b`; request `chatcmpl-6b5022aa-4a81-4474-bbea-0995d691380e`; measured duration 4313ms. Frozen evidence hash unchanged. Evidence: private `runtime-fallback/live-nvidia/verification.json`, persisted API history and structured provider logs. This is new real evidence; mocked tests are not substituted for it. No new Zetaris query was needed: the preserved historical real source receipts/finding were inspected and used. Their earlier coverage/indoor-federation limitations remain unchanged.

Engine: **new 8/8 PASS**, both Bun and corrected Node conformance; actual frozen-observation projection in the accepted run. First Node command exited 2 on an extensionless import; facade fixed and rerun exited 0. Runtime remains **NOT RUN** for real authentication/completion. No inference was made about Runtime qualification from Engine conformance.

Vision: **prior FAIL-CLOSED, NOT RERUN**. Returned private Super VL serving ID differs from requested documented ID. Exact previous diagnostic remains in the primary record. This task neither relaxes identity validation nor claims text success proves image parsing. No paid alternative, new service or demo video was created.

## Commands and results from this run

Working ZIP tree has no Git metadata. No Git init/reset/clone performed; filesystem hashes/diff replace Git status/diff for review. Existing isolated Postgres 17 on 55434 retained, with fresh tenants for tests, no database reset. Bun 1.3.14 / Node 24.19.0. Commands are from repo root unless indicated. Logs below are private under `.accessops-local/runtime-fallback`.

| Command / check | Actual result | Evidence |
|---|---|---|
| Local config inspection + authorized integration env loader; `ss -ltn` on documented ports; command/process-name checks | CONFIRMED missing token+origin; no listener, no Runtime request | `config-before.json`, `runtime-diagnosis.json` |
| `bun test apps/api/src/providers` | **42 PASS / 151 assertions**, exit 0; UNIT/MOCKED_INTEGRATION | `provider-tests-final.log` |
| `bun run test` | **202 PASS / 801 assertions / 26 files**, exit 0; deterministic, mocked provider, actual local Engine projection | `full-tests-final.log` |
| `ACCESSOPS_INTEGRATION=1 bun run test:integration` | **1 PASS / 177 assertions**, exit 0; real Postgres/API/durable worker, no live provider | `local-integration.log` |
| `bun run typecheck` | **PASS**, all workspaces, exit 0 | `typecheck-final.log` |
| `bun run lint` | **PASS with 5 img warnings / 0 errors**, exit 0 | `lint.log` |
| `bun run security` | **PASS**, source boundaries, exit 0 | `security.log` |
| `bun audit --json` | **FAIL/open**, exit 1; inherited advisories, no suppression | `dependency-audit.json` |
| `bun run build` | **PASS**, API+Next, exit 0 | `build.log` |
| `bun run --cwd apps/api build` after final log-classification change | **PASS**, exit 0 | `api-build-final.log` |
| `WORLD_MODEL_IMPL=./apps/api/src/accessops/world-model-engine.ts node --experimental-transform-types apps/api/vendor/meterless-world-model/conformance/runner.ts` | First exit 2 (import issue), corrected **8/8 PASS**, exit 0 | `engine-conformance.log`, `engine-conformance-node-fixed.log` |
| Same conformance runner with `bun` | **8/8 PASS**, exit 0 | `engine-conformance-bun.log` |
| Existing real verification script with `--complete-nvidia --auto-fallback` | **LIVE_END_TO_END PASS**, exit 0; real Nemotron, zero Runtime requests | `live-nvidia/verification.json`, `live-nvidia.log` |
| Current production browser/regression scripts | **44 PASS**, exit 0; 41 workflow + 3 asset/viewport checks | `browser-results.json`, `browser-asset-results.json` |
| Configured-secret scan + final filesystem diff | **PASS**, no configured-secret matches; safe source diff, no deleted paths | `secret-boundary-result.json`, `change-manifest.json`, `source-changes.diff` |

Live verification command:

```sh
API_URL=http://127.0.0.1:3403 INTEGRATION_EVIDENCE_DIR=/absolute/private/evidence \
  bun run --cwd apps/api scripts/verify-live-integrations.ts \
  --investigation=AUTHORIZED_COMPLETED_ID --complete-nvidia --auto-fallback \
  < /private/admin-login.json
```

Mock cases cover missing token, missing origin with token present, Runtime preferred/success/headers/actual identity, all eligible transient codes,401/403 without retry storm, both providers unavailable, safe exception diagnostics, fallback policy disabled, distinct NVIDIA workspace consent, local-only disposition, pinned modes, malformed URL recovery, integrity/citation/secret-echo rejection, no-AI operation and invalid policy/startup flag validation. Full acceptance additionally verifies immutable evidence, provider-consent denial recorded durably, identity/source/graph/scenario/action/history and original editor corrections/tactile/map+legend STL/stale current-export protection. Original Bumps tests are not weakened.

Browser results are real local app checks, not live provider calls unless explicitly labelled. They inspect the already persisted real NVIDIA run and current provider button, without purchasing or repeating inference.

| Browser check | Status |
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
| actual fallback provider and reason in persisted history | PASS |
| provider policy is applied by the explanation control | PASS |
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

## Recovery, limitations and exact next actions

New source-only backup and hash manifest: `/home/kingghidorah/Documents/projects/bounties/accessops-runtime-fallback-baseline-20261027T110221Z`; existing earlier backups untouched. Private API-env before-copy retained with mode 0600 under `runtime-fallback`. Full source diff/hash manifest excludes secrets/generated artifacts; no migration, source schema, UI CSS, vendor-source or dependency lock change is needed. Only existing provider/integration tests are extended for security fixtures and new assertions; original Bumps test files stay intact. No backup deletions or external resource changes were introduced.

1. **Current Runtime config blocker:** optional for operation. To enable later, owner/admin supplies the actual authorized instance origin and token, checks permitted text routing, configures identical API/worker settings, runs authenticated discovery and a pinned `meterless` completed-investigation explanation. Only that real consumption can establish Runtime success. Do not ask repeatedly or manufacture placeholders.
2. **Runtime qualification:** organizer confirmation needed for the chosen Meterless Engine path or required Runtime path. Code/tests cannot grant qualification.
3. **Actual Runtime failure fallback:** mocked coverage is complete for the listed cases; real transient/auth tests remain **NOT RUN** because no authorized Runtime exists. Execute against a permitted isolated instance later; do not disrupt shared services.
4. **NVIDIA vision:** provider must confirm/fix serving model identity or an approved documented available vision model must be selected; then rerun real parsing/critique/doorway verification. No paid fallback without approval.
5. **Security/deployment:** inherited dependency advisories, operational hosting/license/monitoring/backup/capacity reviews remain open. Passing tests does not establish production readiness. No deployment or video production performed.

Additional local checks: after owned API/worker/web restarts the new accepted fallback provider run and evidence hash reopened unchanged (`restart-evidence-result.json`, exit 0). One local synthetic-fixture attempt failed during the scheduled service restart; `demo-api.log` preserves exit 1, and `demo-api-verified.log` records the completed rerun (exit 0). No external inference or existing user records were replaced by that fixture retry. `git status --short` returned exit 128 because this extracted tree and its parents are not a Git repository; no Git state was created or reset. Source changes are reviewable through the filesystem diff. The type-check cache (`apps/web/tsconfig.tsbuildinfo`) is a changed generated artifact, not an application-source rewrite.

The application continues through approved NVIDIA text while preserving deterministic/non-AI workflows, source/graph/evidence/history and the original Bumps product. Runtime and Engine statuses are deliberately separate.

## Final hardening verification (subsequent pass)

The subsequent [hardening delivery](accessops-final-hardening-delivery.md) freshly re-ran actual auto-mode NVIDIA fallback: provider run `01a17d4d-f73d-7000-94ff-23cbcfc3409d`, request `chatcmpl-63b7b1ef-eb8c-44a3-9b5e-1832ed87f4f9`, actual Lightning model, unchanged frozen evidence hash. Runtime was skipped without request for missing configuration. Engine conformance again passed 8/8, independently of Runtime. Consent, exact grounding, local/pinned restrictions and actual-provider persistence remain enforced.

Current regressions: 228 unit/mocked/local tests, 176 final local acceptance assertions, 44 browser checks, typecheck/lint/build/security PASS; dependency findings remediated from 8 to 0. Earlier counts above remain historical. Vision is separately PARTIAL: documented Omni now passes real image controls with exact identity; larger clinic parsing still returned 503/timeouts and the final independent control transcription was rejected. Neither that limitation nor the prior dependency findings invalidate the fresh verified text fallback. Future Runtime activation checklist above remains applicable; no account-denial or qualification claim is added.
