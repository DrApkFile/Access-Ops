# NVIDIA vision hardening — 27 October 2026

## Current selected image provider

OpenRouter `nvidia/nemotron-3.5-super-vl:free` now passes genuine synthetic PNG/PDF Bumps parser/critique/doorway workflows and persistence. Direct NVIDIA Nemotron Lightning text remains independently verified and unchanged. Runtime is still blocked by token/origin; Engine8/8 is separate. No UI redesign or video was created in this pass. Free-only routing and workspace permission remain enforced. See the [latest evidence](vision-provider-evaluation.md); earlier Gemini/Omni failures below describe historical providers, not selected-image failure.

## Earlier evidence (historical; superseded by the current checkpoint above)

Current replacement-key update: Google model discovery succeeds, but actual synthetic-image requests to3.5 Flash,3.5 Flash-Lite and3.8 Flash all return403: this project cannot use the Gemini API free tier. No billing was enabled; no vision extraction succeeded. NVIDIA text settings are unchanged. See the latest [integration record](live-integration-verification.md). Earlier service-busy and missing-key statements below are historical.

Current image-provider checkpoint: [vision evaluation](vision-provider-evaluation.md) selects Gemini 3.6 Flash. The approved test key is now configured; actual requests are blocked by Google HTTP503/high demand. NVIDIA text remains separately live-verified; NVIDIA/Omni vision descriptions below are historical. See [current integration status](live-integration-verification.md) and [hackathon evidence](hackathon-requirement-evidence.md).

**Serving-identity mismatch resolved for the selected provider path; full floor-plan extraction remains PARTIAL.** Two genuine image-understanding controls passed with the documented NVIDIA Nemotron Nano Omni model and exact returned identity. A final independent control failed transcription and was rejected; this is a material accuracy limitation. Repeated larger clinic-plan parsing requests encountered real 503/120-second transport timeouts. No extracted clinic geometry was fabricated, persisted as a success, or marked reviewed.

## Diagnosis and authoritative contract

The former request used `https://integrate.api.nvidia.com/v1/chat/completions`, model `nvidia/nemotron-3.5-super-vl-120b-a12b`, authenticated with the configured server-side Bearer key. `/models` advertised the requested canonical ID, but the completion returned `private/nvidia/nemotron-3.5-super-120b-a12b`. AccessOps correctly rejected it with `PROVIDER_MODEL_IDENTITY_MISMATCH`, even though the HTTP status was 200 and image-derived text was present. This was an observed serving/identity incompatibility, not proof of bad credentials, unsupported PNG encoding, or an application response-parser defect.

The [official Super VL request reference](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3_5-super-vl-120b-a12b-infer) specifies the canonical model. No authoritative confirmation that the returned private ID is its equivalent alias was available. A matching public forum report was only a user's report, so no alias exception or weaker identity check was added. Resolving that original server behavior still requires NVIDIA's confirmation/correction; AccessOps now uses a separate supported Nemotron vision model.

Selected model: **`nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`** on the same NVIDIA origin. It was present in actual model discovery and its [official model card](https://build.nvidia.com/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning/modelcard) documents vision/document input. The [official API reference](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3-nano-omni-30b-a3b-reasoning-infer) uses OpenAI-compatible image content. The [hosted catalog](https://build.nvidia.com/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning?nim=hosted&section=deploy) advertised a free endpoint when inspected. This is a related NVIDIA Nemotron vision path, not an unrelated substitute or a paid endpoint deployment. Account quota/terms must still be checked for future use.

## Configuration and request flow

- `.env.example`, `apps/api/.env.example` and the existing private API configuration select Omni for `NVIDIA_VISION_MODEL`, `MODEL_CRITICAL`, `MODEL_COMPARE`. The private before-copy is preserved; no key was copied to code or documentation. `NVIDIA_MODEL`, `MODEL_FAST`, `MODEL_LAYOUT` remain Lightning, and text fallback/consent settings stay intact.
- `providers/vision-configuration.ts` centrally declares the two documented vision models and resource budgets. Text-only/unknown model IDs fail clearly before a request. Configuration/discovery does not assert healthy vision inference; `/v1/providers` exposes a distinct vision configuration state.
- Existing authenticated upload → private original file → PDF rendering/image normalization → parser full image/detail views → `runAgentTurn` → existing `agents/nvidia.ts` remains the execution path. Raw PDF is rasterized before inference. Deterministic geometry schemas, critique/doorway stages, human correction, validation and tactile generation are retained.
- The actual wire format is `messages[].content[]` with text and `image_url.url=data:image/png;base64,...`. Images are decoded and flattened to RGB PNG without moving their pixel coordinates. PNG/JPEG are supported directly; existing WebP uploads are decoded into PNG. Originals remain stored separately. No model is allowed to infer physical measurement units from pixel dimensions.
- Canonical base64, actual image signature/MIME agreement, successful native decoding, per-image 5 MiB/4 million pixel bounds, 16-image/20 MiB aggregate bounds and 1–16384 output-token bounds are enforced. Upload limits remain 10 MiB/50 million source pixels with a 2000-pixel maximum stored-plan side. WebP normalization uses the already-patched sharp version as an explicit API dependency, rather than pretending MuPDF can decode WebP.
- Requests disable thinking using the documented `chat_template_kwargs.enable_thinking=false`, use JSON-safe server credentials, enforce live model discovery, exact response identity, nonempty output and no truncation/secret echo. Existing parser schema validation still applies after the provider response. No fabricated fallback geometry is returned on failure.
- Completion transport timeout is 120 seconds with no inner HTTP retry. The existing parser's outer retry policy remains bounded and may retry a qualifying 503; one 2048-token diagnostic recorded a retry, then a timeout. This vision policy is separate from the single-attempt durable text explanation/fallback policy.

## Provenance and review boundary

`providers/model-executions.ts` captures request-local execution receipts: actual/requested model, request ID, live versus injected/mock transport, capability, duration, original/sent image hashes, dimensions and response-text hash. Pixels, prompts, Bearer headers and hidden reasoning are excluded. `parse.ts` stores accumulated receipts in each model version's existing critique metadata, with `geometryReview:unreviewed_ai_extraction`. Geometry schemas are unchanged and no migration is required. A provider returning a valid response does not certify image accuracy, physical accessibility or human review.

Opt-in private visible-response diagnostics redact active provider secrets and omit prompts/hidden reasoning. They remain authorized server evidence, not browser/public assets. Failed responses are never promoted to successful reviewed geometry.

## Actual external evidence, including failures

Evidence root: `.accessops-local/hardening/` (private, excluded from public source artifacts).

| Test | Classification and actual result | Evidence |
|---|---|---|
| Original Super VL identity | LIVE_EXTERNAL, HTTP200 but FAIL-CLOSED; returned undocumented private identity | `live-vision-probe-attempt1.json`, matching private visible response |
| Initial Omni image | LIVE_EXTERNAL, exact canonical identity and image-derived response, but printed O/0 was misread; not accepted as a control pass | `live-vision-probe-attempt1.json` |
| Intermediate availability probes | LIVE_EXTERNAL FAIL, real HTTP503 | `live-vision-probe-attempt2.json`, `live-vision-probe-attempt3.json` |
| Randomized image control | **LIVE_EXTERNAL PASS**; exact image-only code and circle, exact canonical model, 2768ms for one control | `live-vision-probe.json`; request `chatcmpl-a607261c-064c-475c-8e80-2a80d451131e` |
| Source-controlled control verifier | **LIVE_EXTERNAL PASS**; second independently randomized image, no expected code in prompt | `live-vision-control-source/verification.json`; request `chatcmpl-9c99471f-8893-436d-9519-d81cc938685b` |
| Final independent control after production decoder changes | **LIVE_EXTERNAL FAIL**, exact model/circle but printed `AXVJARCF` became `0.0`; schema-valid text was correctly rejected, not accepted on HTTP200 | `live-vision-final-control/{verification,inspection,visible-response}.json`, inspected `synthetic-control.png`; request `chatcmpl-e3acb523-810f-48ca-87a8-07ddc77a0eb4` |
| Existing synthetic clinic parser, 8192 token budget | LIVE_EXTERNAL FAIL, `PROVIDER_OFFLINE_OR_TIMEOUT` | `live-vision/verification.json`, `live-vision-floor-ready/verification.json` |
| Same clinic parser, bounded 2048-token diagnostic | LIVE_EXTERNAL FAIL, real 503/retry followed by timeout; no output rewritten into success | `live-vision-floor-2048/verification.json`, corresponding log |
| Two local harness failures | NOT live provider proof: first selected the root default Gemini because API env was omitted; second ran during an owned API restart | `vision-floor-check-attempt2.log`, `live-vision-floor-final.log`; corrected source verifier pins NVIDIA and records failure stage |

The final failed control image and visible response were both inspected. Its original/sent hashes and actual model/request identity are retained; it is not reclassified as a pass and no further call was made to fish for a green result. Schema validation alone cannot establish correct visual transcription. Human review remains essential; obtain model-quality/provider diagnostics before trusting extracted facts.

Each successful control is more than HTTP200: its strict JSON contract, actual returned model, randomized image-only code and shape were checked. It demonstrates working vision inference, **not** the entire floor-plan parser or a surveyed building result. The clinic request failures do not identify an account entitlement denial; the observed blocker is endpoint unavailability/timeout for that workload. Provider-side logs/capacity/latency diagnostics are unavailable. No fresh access token, paid endpoint or alias bypass is invented as a solution.

## Reproduction and tests

The source-controlled explicit live verifier authenticates to the authorized local API and obtains provider workspace consent. It permits only the inspected official Omni endpoint/model. Its floor-plan mode persists/reopens the actual schema-validated result only after extraction succeeds; failed calls create no successful model. Credentials are read from private stdin.

From repository root (Bun 1.3.14 on PATH):

```sh
# Actual randomized control, real NVIDIA request; requires configured authorized free access.
API_URL=http://127.0.0.1:3403 MODEL_MAX_OUTPUT_TOKENS=512 \
  INTEGRATION_EVIDENCE_DIR=/absolute/private/new-control-evidence \
  bun run --cwd apps/api scripts/verify-live-vision.ts \
  --control=true --label='Randomized synthetic image, not a survey' \
  < /private/admin-login.json

# Full parser stage plus authorized persistence/reopen; not currently a passing live check.
API_URL=http://127.0.0.1:3403 \
  INTEGRATION_EVIDENCE_DIR=/absolute/private/new-floor-evidence \
  bun run --cwd apps/api scripts/verify-live-vision.ts \
  --image=/absolute/authorized/test-plan.png --label='Explicitly synthetic test plan' \
  < /private/admin-login.json

bun test apps/api/src/agents/nvidia.test.ts apps/api/src/lib/vision-image.test.ts
```

Controlled tests cover actual PNG/JPEG decoding, WebP conversion/provenance, supported MIME/signatures, malformed/oversized/base64/pixel/count limits, correct request/model/auth/thinking, separate capability state, actual mocked transport labelling, model absence/mismatch,401/403/404/429/503, timeouts, malformed/empty/truncated output, secret echoes and receipt retention. These are UNIT/MOCKED_INTEGRATION, not live claims. Full final counts and PNG/PDF/editor/tactile regressions are in [final delivery](accessops-final-hardening-delivery.md).

## Remaining action

Keep the selected documented Omni path and strict identity validation. Re-run the full parser stage when the authorized NVIDIA service can complete that workload within its bounded timeout; inspect extracted wall/room/opening coordinates against the source, run critique/doorway stages, and review geometry before treating it as useful building evidence. If the endpoint continues timing out, obtain provider-side diagnostics or an explicitly approved compatible deployment; do not silently purchase capacity. Meterless Runtime, Engine conformance and text fallback remain separate statuses. No video was created.
