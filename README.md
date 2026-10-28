# AccessOps — Building Accessibility Intelligence

Current vision: **OpenRouter `nvidia/nemotron-3.5-super-vl:free`**, tested with real synthetic PNG/PDF upload, parser, critique, doorway audit and persisted history. NVIDIA Nemotron Lightning remains the independently verified text provider. Free-only routing and workspace consent are enforced. See [current vision setup/evidence](docs/vision-provider-evaluation.md). Earlier Gemini notices below are historical.

Geometry accuracy and correction evidence: [eight-case benchmark](docs/geometry-benchmark.md), [actual upload → correction → history → STL walkthrough](docs/geometry-demo-runbook.md), and [delivery results](docs/geometry-delivery.md). All eight returned structured geometry, but only one passed the raw geometry/uncertainty benchmark; successful parsing is not a claim of accurate geometry.



Current Gemini replacement-key test: model discovery succeeds, but three real synthetic-image requests returned403 because Google denies this project the free tier. No billing was enabled and no vision extraction succeeded. NVIDIA text configuration is unchanged. See [current integration status](docs/live-integration-verification.md).


AccessOps extends Bumps with independent source imports, provenance, canonical identities, reviewed connectivity, deterministic impact analysis, investigations, actions and historical reports. Bumps' floor-plan editor and tactile/STL pipeline remain available at `/map/[projectId]`. The operational workspace is `/dashboard` (`/operations` redirects there); `/operations/advanced` retains the original compact controls. The landing and all operational routes now share the LastMile-derived monochrome design.

**Status:** the local multi-source workflow is implemented and tested against isolated PostgreSQL. This is not a claim of production readiness, certified accessibility compliance, sponsor qualification. Live NVIDIA text inference and actual Zetaris reference-data consumption are now verified; indoor federation and Runtime qualification remain open. Vision selects Gemini 3.6 Flash; the approved test key is now configured, but real requests currently return Google HTTP503 high-demand errors. No successful Gemini extraction is claimed. See [current UI delivery](docs/ui-redesign-delivery.md), [live integration proof](docs/live-integration-verification.md) and the [earlier implementation baseline](docs/implementation-delivery.md). Original project documentation is preserved in [bumps-original-readme.md](docs/bumps-original-readme.md); older hackathon/architecture documents describe the original product and are historical where they disagree with these instructions.

## Requirements and install

Bun **1.3.14**, Node **22 or newer**, PostgreSQL **17**, Linux native geometry dependencies, and a persistent upload directory. This delivery was tested with Bun 1.3.14 and Node 24.19.0. PostgreSQL command-line tools are required for backup/restore. No Git metadata is required.

```sh
bun install --frozen-lockfile
bun run setup
```

Setup creates missing local configuration only; inspect existing files before running it. Configure `apps/api/.env` from `apps/api/.env.example` without overwriting existing configuration. Supply an isolated `DATABASE_URL`, a writable `UPLOADS_DIR`, `ACCESSOPS_ALLOWED_ORIGINS=http://localhost:3400`, and `PORT=3403`. Set `API_INTERNAL_URL=http://localhost:3403` in `apps/web/.env.local`. Provider credentials are optional for deterministic investigation, and required for actual inference. Never place server secrets in `NEXT_PUBLIC_*` variables.

```sh
bun run --cwd apps/api db:migrate
bun run --cwd apps/api bootstrap < /private/path/initial-admin.json
bun run dev --web-port=3400
```

The private bootstrap JSON contains `email`, `password` (at least 14 characters), `organization`, and `workspace`. It creates a new administrator and prints IDs only. Protect and remove the input according to your secret-management policy. There is no public signup or anonymous API bypass. Sign in at http://localhost:3400/dashboard. The development launcher runs API, worker and web together. Existing installations' unowned Bumps projects are deliberately inaccessible until an administrator performs a reviewed ownership migration.

For this extracted workspace, dependencies, isolated database, local configuration and a private administrator input already exist. Start with the last command; the evidence index identifies local credentials without exposing them.

```sh
bun run test
bun run typecheck
bun run lint
bun run security
bun audit --json
ACCESSOPS_INTEGRATION=1 bun run test:integration
API_URL=http://localhost:3403 bun run demo < /private/path/admin-login.json
bun run build
```

The integration suite only accepts the isolated test Postgres endpoint `127.0.0.1:55434`, creates new tenants, and never resets a database. Run it without a competing worker for deterministic recovery assertions. See [testing](docs/testing.md), [demo](docs/demo-runbook.md), [deployment](docs/deployment.md), and [operations/recovery](docs/operations-and-recovery.md).

## Architecture and safeguards

Next.js same-origin gateway → authenticated Hono API → Postgres/Drizzle, plus a Postgres-backed worker. Pure domain checks live in `packages/accessops`. Every source retains immutable snapshots and observations; every investigation freezes its evidence. A reviewed graph, not a plan symbol or LLM, determines technical connectivity. Unknown measurements remain unknown. Source administrators import; authorized reviewers verify, reconcile and approve actions; building/project grants further restrict access within a workspace.

Text explanations default to `auto`: deliberately configured Meterless Runtime first, then NVIDIA Nemotron when Runtime cannot be used and explicit fallback/data policy permits. Set `ACCESSOPS_NVIDIA_FALLBACK=true` and list approved workspace IDs in both `ACCESSOPS_PROVIDER_WORKSPACES` and `ACCESSOPS_NVIDIA_TEXT_WORKSPACES`. Runtime endpoint/token are optional for operation, and current live NVIDIA fallback is verified. Automatic explanations are off by default; request one explicitly from a frozen investigation. Explicit `meterless`/`nvidia` modes pin one provider; `none` keeps deterministic workflows. See [Runtime diagnosis and fallback proof](docs/meterless-runtime-fallback-delivery.md). Floor-plan vision selects direct Gemini 3.6 Flash, using the preserved Bumps input/schema/review pipeline and a bounded provider adapter. It never falls back to NVIDIA or OpenRouter. Configure `GEMINI_API_KEY`, confirm an unbilled project with `GEMINI_FREE_TIER_CONFIRMED=true`, and explicitly permit nonconfidential/public/synthetic input in `ACCESSOPS_GEMINI_VISION_WORKSPACES` plus the existing global provider list. Current Gemini live/full-plan evaluation has run and failed with Google service-busy HTTP503 responses, despite successful authenticated model discovery. NVIDIA remains independently verified for text. See [vision evaluation](docs/vision-provider-evaluation.md) for original Gemini/OpenRouter history, free-tier/privacy restrictions, attempted alternatives and reproducible tests. Zetaris queries are bounded generated joins over two separately registered datasets; no arbitrary SQL is exposed. Current actual external results, missing building source mappings and Runtime access are separated in the integration reports. The real licensed Meterless World Model Engine projects immutable evidence in investigations; its eight conformance checks pass. [Architecture](docs/architecture.md) · [domain](docs/accessops-domain-model.md) · [sources](docs/data-sources.md) · [security](docs/security.md).

## Ownership and licensing

The supplied Bumps archive has no root license establishing redistribution rights. Retain its ownership notices and obtain the owner's permission before redistribution or deployment claims. New demonstration records are explicitly synthetic. The bundled Liberation Sans font has its own OFL notice in `apps/api/assets/fonts/LICENSE`. Dataset and provider terms apply independently; public availability is not a blanket license.
