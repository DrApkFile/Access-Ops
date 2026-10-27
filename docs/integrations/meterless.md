# Meterless Engine and optional Runtime

Two distinct paths are implemented. **Engine: actual local execution and 8/8 conformance PASS. Runtime: BLOCKED, no endpoint/token configured.** Do not present one as proof of the other. Organizer qualification remains an external decision.

## Engine

The unmodified Apache-2.0 upstream World Model snapshot copied from LastMile is under `apps/api/vendor/meterless-world-model`. LICENSE/NOTICE/UPSTREAM hashes are preserved. `accessops/world-model-engine.ts` exposes the real interfaces; `world-model.ts` projects exact immutable observations into workspace/investigation-scoped entities, facts and provenance. External keys avoid upstream fuzzy merging; a reviewed room on one level cannot be silently merged by a similar label. The engine verifies the evidence set used by actual investigations and frozen-evidence provider runs. Trace metadata preserves engine identity, observation/fact counts and projection hash.

Postgres remains the durable source of truth; the bounded Engine projection is rebuilt from frozen observations, not claimed as its own persistent distributed database or an LLM runtime. Deterministic identity, conflict, freshness and route checks remain authoritative.

```sh
WORLD_MODEL_IMPL=./apps/api/src/accessops/world-model-engine.ts \
  node --experimental-transform-types apps/api/vendor/meterless-world-model/conformance/runner.ts
```

This runs the vendor's actual eight stable-ID/merge-boundary/provenance/idempotency/bitemporal/audit checks. Live NVIDIA run metadata separately shows actual Engine use over two stored source observations.

## Runtime

See the current [Runtime status and NVIDIA fallback](../live-integration-verification.md#meterless-runtime-status-and-nvidia-nemotron-fallback) for exact diagnosis, policy settings and activation steps.

`providers/explanation.ts` and `http.ts` follow the documented [Runtime provider contract](https://raw.githubusercontent.com/Meterless/Meterless/main/docs/agent-ready/add-meterless-provider.md): normalized `/v1` origin, real Bearer token (`rt-local` rejected), stable `meterless-app: accessops`, chat `meterless-scope: user`, `/models` discovery, documented routing names and 180-second cold-start budget. Text-only path does not receive floor-plan images. Unauthorized/offline/validation states remain explicit. Auto mode tries configured usable Runtime then NVIDIA, recording the provider actually used; normal mode defaults to policy-controlled `auto`; permitted NVIDIA fallback is explicit and missing Runtime never triggers network retries.

Needed: authorized `METERLESS_BASE_URL`, `METERLESS_RUNTIME_TOKEN`, model access and explicit workspace consent in `ACCESSOPS_PROVIDER_WORKSPACES`. The token and endpoint are absent from authorized configuration; general workspace consent is present. Owner account/access-grant availability is unverified. No actual Runtime completion occurred. Once supplied, POST `/v1/investigations/:id/explanations` with provider `meterless`, explicit confirmation and an idempotency key, then inspect the durable job and provider-run record. A model list or health response alone is insufficient. No Runtime resources were provisioned or paid for.

References: [official Engine](https://github.com/Meterless/Meterless/tree/main/engines/world-model), [organizer event](https://hackathon.genai.works/event/open-agent-hackathon-2026). Snapshot conformance is implementation evidence, not a sponsor endorsement or guarantee that this deployment meets all event criteria.

Automatic NVIDIA text fallback additionally requires `ACCESSOPS_NVIDIA_FALLBACK=true` and the workspace in both `ACCESSOPS_PROVIDER_WORKSPACES` and `ACCESSOPS_NVIDIA_TEXT_WORKSPACES`. A pinned Runtime request never switches; `meterless/local` forbids cloud routing. The newly verified missing-access fallback is operational without a Runtime instance, and does not claim Runtime qualification.
