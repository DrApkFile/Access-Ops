# NVIDIA Nemotron

## Current selected image provider

OpenRouter `nvidia/nemotron-3.5-super-vl:free` now passes genuine synthetic PNG/PDF Bumps parser/critique/doorway workflows and persistence. Direct NVIDIA Nemotron Lightning text remains independently verified and unchanged. Runtime is still blocked by token/origin; Engine8/8 is separate. No UI redesign or video was created in this pass. Free-only routing and workspace permission remain enforced. See the [latest evidence](../vision-provider-evaluation.md); earlier Gemini/Omni failures below describe historical providers, not selected-image failure.

## Earlier evidence (historical; superseded by the current checkpoint above)

Current replacement-key update: Google model discovery succeeds, but actual synthetic-image requests to3.5 Flash,3.5 Flash-Lite and3.8 Flash all return403: this project cannot use the Gemini API free tier. No billing was enabled; no vision extraction succeeded. NVIDIA text settings are unchanged. See the latest [integration record](../live-integration-verification.md). Earlier service-busy and missing-key statements below are historical.

Current vision is Gemini 3.6 Flash, configured with the approved test key but currently returning Google HTTP503/high demand; NVIDIA Nemotron stays on text. Earlier image descriptions below are historical. See [vision evaluation](../vision-provider-evaluation.md) and [current integration status](../live-integration-verification.md).

Default text mode is `auto`; NVIDIA Nemotron is the explicit operational fallback when Runtime is unavailable and data/provider policy permits. Current status: **Lightning grounded explanation LIVE_END_TO_END PASS**, **Omni vision control LIVE_EXTERNAL PASS; full clinic-plan extraction PARTIAL (503/timeouts and rejected final control transcription)**. See [verification report](../live-integration-verification.md) for exact commands/evidence. Credentials are referenced from explicitly authorized server configuration, never copied to source/browser or ordinary logs.

## Text investigations

Configure `NVIDIA_API_KEY`, `NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1`, `NVIDIA_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b`, `ACCESSOPS_PROVIDER_WORKSPACES` and `ACCESSOPS_NVIDIA_TEXT_WORKSPACES`. Automatic switching additionally requires `ACCESSOPS_NVIDIA_FALLBACK=true`. Ordinary investigations preserve deterministic results without automatic inference unless `ACCESSOPS_AUTO_EXPLANATION=true`; the UI offers an explicit frozen-evidence explanation request. Each durable explanation job has one attempt, records intent before the external call, and never automatically replays an interrupted ambiguous inference.

`providers/explanation.ts` verifies `/models`, sends bounded OpenAI-compatible `/chat/completions` with thinking disabled for Lightning, and validates actual model identity and exact structured output. Claims must copy a supplied deterministic rationale/classification and exact valid evidence set; recommendations and summary must come from supplied findings. Imported text is untrusted. No unrestricted model SQL/shell/source access exists. Unknown citations, changed measurements, malformed arrays and unsupported factual statements fail validation; deterministic history survives.

Real model discovery succeeded, then two completed HTTP200 responses were rejected because recommendations was a string rather than an array. An explicit typed JSON example in the instruction corrected that output format; the subsequent real response passed all existing grounding checks and was persisted against the unchanged investigation snapshot. No validator was weakened or response rewritten. Provider run `01a17cd7-5cfe-7000-92ae-848f0d3f0b98`, request `chatcmpl-f96724e5-da1e-4f72-8230-ca0b0e19aab8`, model confirmed, measured provider duration 5083ms (one request, not a latency benchmark).

```sh
API_URL=http://127.0.0.1:3403 INTEGRATION_EVIDENCE_DIR=/absolute/private/evidence \
  bun run --cwd apps/api scripts/verify-live-integrations.ts \
  --investigation=AUTHORIZED_COMPLETED_ID --complete-nvidia < /private/login.json
```

The verification script deliberately allows only the inspected free NVIDIA catalog endpoint/model; ordinary application configuration supports explicit alternatives without claiming they are free. Catalog labels [Lightning](https://build.nvidia.com/nvidia/nemotron-3.5-lightning-30b-a3b) and [Super VL](https://build.nvidia.com/nvidia/nemotron-3.5-super-vl-120b-a12b) Free Endpoint Available at this check. No paid provisioning or account purchase occurred. Trial quotas/terms can change: confirm before switching endpoints or scaling calls.

## Original Bumps multimodal path

`agents/nvidia.ts` maps actual image parts to documented `image_url` data URIs, enforces workspace consent and image/token limits, checks model discovery/returned identity/truncation, and retains existing parser/critique/doorway/editor schemas. Select `MODEL_PROVIDER=nvidia`, `NVIDIA_VISION_MODEL`, and matching `MODEL_CRITICAL`/`MODEL_COMPARE`. Text-only roles may use Lightning. Existing Gemini/OpenRouter code remains available with its own credentials.

Historical Super VL diagnostic (still rejected; no undocumented alias exception): a real synthetic clinic PNG was sent to the documented Super VL endpoint. HTTP200 returned `private/nvidia/nemotron-3.5-super-120b-a12b` rather than requested `nvidia/nemotron-3.5-super-vl-120b-a12b`. The application rejected it as `PROVIDER_MODEL_IDENTITY_MISMATCH` and did not persist unverified geometry. A diagnostic retry confirmed this identity. We do not silently allow an undocumented alias or claim successful live parsing. The next action is provider confirmation of the serving alias or another currently free, available, documented vision model with verified identity; then rerun full image extraction/critique/doorway stages. Older Nano VL's free endpoint is marked deprecated, so no paid fallback was used.

References: [official Super VL API](https://docs.api.nvidia.com/nim/reference/nvidia-nemotron-3_5-super-vl-120b-a12b-infer), [NIM LLM catalog](https://docs.api.nvidia.com/nim/reference/llm-apis). A public developer-forum report describes the same alias mismatch, but that is not provider confirmation and is not used to bypass validation.

Private opt-in `ACCESSOPS_PROVIDER_EVIDENCE_DIR` stores redacted visible response text/IDs/hashes with 0700/0600 permissions for diagnosis. It excludes prompts and hidden reasoning; source-derived visible text remains sensitive. Do not publish that directory. Ordinary structured logs omit credentials and private payloads.

A fresh auto-mode fallback run, with zero Runtime requests and unchanged frozen evidence, is recorded in [current verification](../live-integration-verification.md#meterless-runtime-status-and-nvidia-nemotron-fallback). The earlier successful pinned-NVIDIA request above remains historical evidence.

## Selected vision path after hardening

`NVIDIA_VISION_MODEL`, `MODEL_CRITICAL` and `MODEL_COMPARE` now select `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning`. This documented NVIDIA vision model returned its exact canonical identity and correctly read independently randomized image-only codes and a circle. PNG/JPEG and normalized WebP input are bounded, decoded and sent as RGB PNG; PDF still follows the existing rasterizer. Text stays on Lightning. Configuration/discovery never marks vision inference healthy. Production parsing records model receipts and unreviewed status in model-version critique metadata. See [vision delivery](../vision-integration-delivery.md) for actual failures, successful controls, source-controlled live commands and the remaining full-parser service prerequisite. Do not infer successful geometry extraction from the control result.

The final independent hardening control returned the correct canonical model/circle but transcribed printed `AXVJARCF` as `0.0`. It was rejected; the inspected image/response and prior two passing controls are all preserved. This accuracy limitation is separate from serving identity and text inference. Do not treat schema-valid vision output as a verified observation.
