# AccessOps — Building Accessibility Intelligence

**Turn building information into evidence people can inspect, actions teams can track, and tactile maps people can use.**

AccessOps brings floor plans, facility directories, accessibility measurements, and operational records into one workspace. It helps facilities and accessibility teams understand a building, investigate the impact of a reported change, review the supporting evidence, and produce a 3D-printable tactile map for blind and low-vision visitors.

Built on the Bumps floor-plan and tactile-map engine, AccessOps connects two complementary workflows: **reviewing physical space** and **reasoning across building information**.

[Judge’s walkthrough](judgung.md) · [Getting started](#getting-started) · [Technology integrations](#technology-integrations) · [Changelog](changelog.md)

## What you can do

| Capability | How it helps |
|---|---|
| **Read a floor plan** | Upload a PDF or image and extract an editable model of rooms, walls, doorways, and supported building features. |
| **Review and correct geometry** | Inspect image-based critique and doorway audits, review uncertain measurements, and save explicit corrections with their provenance. |
| **Create tactile maps** | Convert reviewed geometry into raised features, braille keys, and a legend; validate the design and export map and legend STL files. |
| **Bring independent records together** | Register sources, preview CSV/JSON imports, map external identifiers, and retain immutable snapshots and observation history. |
| **Investigate accessibility questions** | Combine source evidence, identity matching, freshness checks, and reviewed connectivity to produce findings with inspectable references. |
| **Explore operational changes** | Simulate a lift outage, entrance closure, or route restriction and compare affected destinations against the baseline. |
| **Follow through on findings** | Assign an owner, review and approve an action, record resolution evidence, and run a follow-up investigation. |
| **Keep an auditable history** | Reopen saved floor-plan versions, investigations, source snapshots, and exported human-readable or JSON reports. |

## How it works

### From floor plan to tactile map

1. Open **Projects** and upload a supported floor-plan PDF, PNG, JPEG, or WebP.
2. AccessOps runs its image parser, compares the proposed geometry with the source, and audits doorways.
3. Review the canvas and **Measurements and uncertainty** panel. Correct boundaries, door locations, labels, or scale and save a review reason.
4. Reopen saved versions or rerun critique and doorway audit against the corrected model.
5. Generate the tactile design, inspect its validation and 3D preview, then download the map and legend STL files.

A tactile design is tied to its source-model version. Editing the floor plan requires regenerating the current design before a current export. Earlier versions remain available through history.

### From fragmented records to an operational decision

Consider a clinic on an upper floor. A directory identifies its destination, a reviewed graph records the lift connection, a measurement source describes relevant physical constraints, and a maintenance record reports an outage. AccessOps reconciles those records and evaluates which destinations may be affected.

The investigation keeps the exact evidence it used. A reviewer can inspect the finding, compare a hypothetical closure with the baseline, assign a verification task, and revisit the result after a verified restoration. The original investigation remains intact as historical context.

**AI proposes and explains; deterministic code checks geometry, evidence, permissions, and connectivity.** Image extraction remains reviewable, while route analysis uses a reviewed graph with explicit `reachable`, `unreachable`, and `unknown` outcomes.

## Technology integrations

Each integration has a defined role in the application.

### Zetaris — queryable data and source evidence

Zetaris connects AccessOps to externally queryable records. The server authenticates to the configured Zetaris instance, executes bounded read queries, and preserves query receipts, source identifiers, and returned records. Reviewed results can be imported into immutable AccessOps snapshots and used by investigations.

The demonstrated integration queries NYC taxi-zone and Bronx OpenStreetMap reference data and consumes the returned records in a source-coverage investigation. The live challenge walkthrough also executes one query across the two sources. This demonstrates the data-to-evidence path: **Zetaris returns data; AccessOps preserves its provenance and evaluates what that evidence supports.** Floor-plan extraction and STL generation run in their own application pipelines.

Implementation: [`zetaris-gateway.ts`](apps/api/src/providers/zetaris-gateway.ts), [`zetaris.ts`](apps/api/src/providers/zetaris.ts). [Integration guide](docs/integrations/zetaris.md).

### NVIDIA Nemotron — visual interpretation and grounded text

AccessOps uses two separate inference paths:

| Task | Service and configured model | Application role |
|---|---|---|
| **Vision** | OpenRouter: `nvidia/nemotron-3.5-super-vl:free` | Interpret plan images for the existing parser, visual critique, and doorway-review workflow. |
| **Text** | NVIDIA API: `nvidia/nemotron-3.5-lightning-30b-a3b` | Produce grounded investigation explanations and support existing text-based agent tasks. |

Both paths have recorded live execution evidence. Vision sends the source image, including whole-page/detail processing where applicable, and validates structured output before downstream review. Text explanations receive a bounded evidence packet; citation and claim validation run before the explanation is accepted. Provider/model identity is recorded for the actual execution.

The OpenRouter vision adapter checks free-account eligibility, image capability, and zero pricing, and prevents paid provider fallback. Sending plan images or text evidence requires explicit workspace consent. [Vision setup and receipts](docs/vision-provider-evaluation.md) · [NVIDIA integration](docs/integrations/nvidia.md).

### Meterless — evidence context and provider orchestration

The Meterless World Model Engine projects an investigation’s frozen observations into scoped entities, facts, and provenance. Its eight conformance checks exercise the actual local Engine implementation. PostgreSQL retains the durable source records and investigation history.

A separate optional Meterless Runtime adapter supports authenticated model discovery and text requests. In `auto` explanation mode, a deliberately configured Runtime is preferred; the existing NVIDIA text path handles permitted fallback. Missing Runtime configuration is recorded as a skip, with no repeated authentication attempts. Workspace policy controls the switch, and the saved execution identifies the provider that actually handled it.

Implementation: [`world-model-engine.ts`](apps/api/src/accessops/world-model-engine.ts), [`world-model.ts`](apps/api/src/accessops/world-model.ts), and [`selection.ts`](apps/api/src/providers/selection.ts). [Meterless guide](docs/integrations/meterless.md).

### Application stack

| Layer | Technology | Responsibility |
|---|---|---|
| Interface | Next.js, React, Tailwind CSS, shared workspace components | Projects, editor, source review, investigations, actions, and scenarios. |
| API | Bun and Hono | Authenticated operations, validated requests, uploads, provider access, and exports. |
| Persistence | PostgreSQL and Drizzle | Workspace isolation, versioned models, immutable evidence, and durable job state. |
| Background work | PostgreSQL-backed worker | Ingestion, extraction, investigation execution, leases, and recovery. |
| Spatial tooling | Shared TypeScript geometry, MuPDF, Resvg, Manifold, Three.js | PDF rendering, geometry checks, tactile conversion, mesh generation, and previews. |

## Getting started

### 1. Clone or extract the project

```sh
git clone https://github.com/DrApkFile/Access-Ops.git
cd Access-Ops
```

If you downloaded a ZIP, extract it and open the extracted directory instead. Installation and operation work without Git metadata.

### 2. Install dependencies

Use **Bun 1.3.14**, **Node.js 22+**, and **PostgreSQL 17**. Provide a running PostgreSQL database and a writable upload directory. PostgreSQL command-line tools are used by the backup/restore procedures.

```sh
bun run setup
```

Setup installs from the frozen Bun lockfile and creates the web environment file if absent. To install dependencies directly:

```sh
bun install --frozen-lockfile
```

### 3. Configure the application

Create `apps/api/.env` from [`apps/api/.env.example`](apps/api/.env.example) for a fresh installation. Preserve existing local configuration. Configure these application settings:

```dotenv
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
PORT=3403
UPLOADS_DIR=data/uploads
ACCESSOPS_AUTH_MODE=session
ACCESSOPS_ALLOWED_ORIGINS=http://localhost:3400
```

Set the API origin in `apps/web/.env.local`:

```dotenv
API_INTERNAL_URL=http://localhost:3403
```

For the selected vision and NVIDIA text paths, merge the following into the API’s private environment file. Replace placeholders with your own authorized credentials and workspace IDs:

```dotenv
MODEL_PROVIDER=nvidia
VISION_PROVIDER=openrouter
OPENROUTER_API_KEY=<your-openrouter-key>
OPENROUTER_VISION_MODEL=nvidia/nemotron-3.5-super-vl:free
OPENROUTER_VISION_MAX_OUTPUT_TOKENS=8192

NVIDIA_API_KEY=<your-nvidia-key>
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b
ACCESSOPS_EXPLANATION_PROVIDER=auto
ACCESSOPS_NVIDIA_FALLBACK=true

ACCESSOPS_PROVIDER_WORKSPACES=<approved-workspace-id>
ACCESSOPS_OPENROUTER_VISION_WORKSPACES=<approved-workspace-id>
ACCESSOPS_NVIDIA_TEXT_WORKSPACES=<approved-workspace-id>
```

The workspace ID is created during bootstrap below. Add it to the consent lists before using external inference, then restart the API and worker. Keep keys server-side; never put them in `NEXT_PUBLIC_*` variables. Use approved public or synthetic inputs with the free vision service. Configure Zetaris and optional Runtime access using their linked integration guides.

### 4. Apply migrations and create the first workspace

```sh
bun run --cwd apps/api db:migrate
bun run --cwd apps/api bootstrap < /private/path/initial-admin.json
```

The private bootstrap JSON contains `email`, `password` of at least 14 characters, `organization`, and `workspace`. Bootstrap creates an administrator, organization, and workspace and returns their identifiers. Use it once for a fresh installation, then sign in with those credentials.

### 5. Start AccessOps

```sh
bun run dev --web-port=3400
```

This starts the API, durable worker, and web app together.

- **Application:** http://localhost:3400
- **Workspace:** http://localhost:3400/dashboard
- **API readiness:** http://localhost:3403/ready
- **OpenAPI:** http://localhost:3403/v1/openapi.json

For an already configured installation, start with this command and your existing account.

## Explore the application

| Route | What to do |
|---|---|
| `/dashboard` | Select a building or reference area and inspect the workspace overview. |
| `/projects` | Upload a floor plan or reopen a saved project. |
| `/map/<projectId>` | Review geometry, save corrections, inspect history, and generate tactile exports. |
| `/sources` | Register sources, preview/import records, and inspect snapshots and freshness. |
| `/entities` | Review canonical identities and external record matches. |
| `/graph` | Inspect reviewed connectivity and supporting evidence. |
| `/investigations` | Start an investigation or reopen its saved findings and evidence. |
| `/scenarios` | Compare a hypothetical operational change with the baseline. |
| `/actions` | Review approvals, owners, progress, and resolution evidence. |
| `/settings` | Manage the workspace settings available to your role. |

## Try a reproducible workflow

For the tactile workflow, upload [`02-connected.png`](tests/fixtures/geometry-benchmark/02-connected.png). Its independent [ground truth](tests/fixtures/geometry-benchmark/02-connected.truth.json) describes two 3 × 3 m rooms, an entrance, and an internal doorway. Follow the [geometry walkthrough](docs/geometry-demo-runbook.md) to review the model, save corrections, reopen history, and inspect exported STL files.

For the operational workflow, the acceptance demo creates clearly labelled synthetic directory, measurement, topology, and outage records through the authenticated API:

```sh
API_URL=http://localhost:3403 bun run demo < /private/path/admin-login.json
```

The login JSON contains `email`, `password`, and `workspaceId`. The demo creates records in that workspace, checks a closure scenario, traces an evidence-backed finding, completes an approved action with resolution evidence, and revisits the historical result. See the [operational demo guide](docs/demo-runbook.md) and [judge’s walkthrough](judgung.md).

## Development and verification

```sh
bun run test
bun run typecheck
bun run lint
bun run security
bun audit --json
bun run build
```

Database integration checks use the isolated test database described in [testing](docs/testing.md):

```sh
ACCESSOPS_INTEGRATION=1 bun run test:integration
```

To generate the synthetic floor-plan fixtures or score saved live extraction results:

```sh
bun apps/api/scripts/geometry-benchmark/generate.ts
GEOMETRY_BENCHMARK_DIR=<directory-containing-saved-live-results> bun run benchmark:geometry --cached
```

Live extraction requires configured credentials and workspace consent. [Benchmark instructions](docs/geometry-benchmark.md) explain live versus cached runs and comparison metrics.

## Repository guide

```text
apps/web/            Next.js application, editor, workspace screens, and API gateway
apps/api/            Hono API, agents, provider adapters, worker, and database migrations
packages/floor-model/ Shared geometry, tactile conversion, validation, and STL contracts
packages/accessops/  Identity, reconciliation, evidence, findings, and graph analysis
fixtures/            Operational demonstration data
tests/               Integration checks and synthetic floor-plan fixtures
reports/             Saved benchmark results and inspectable geometry artifacts
docs/                Architecture, integration guides, deployment, and walkthroughs
scripts/             Setup, development, and security tooling
```

## Further reading

- [Judge’s walkthrough](judgung.md)
- [Architecture](docs/architecture.md) and [domain model](docs/accessops-domain-model.md)
- [Source contracts](docs/data-sources.md) and [integration execution evidence](docs/live-integration-verification.md)
- [Geometry walkthrough](docs/geometry-demo-runbook.md) and [STL verification](reports/geometry-benchmark/demo-verification.json)
- [Security](docs/security.md), [deployment](docs/deployment.md), and [operations and recovery](docs/operations-and-recovery.md)
- [Design system](docs/ui-design-system.md) and [development changelog](changelog.md)
- [Original Bumps documentation](docs/bumps-original-readme.md)

## Attribution

AccessOps builds on Bumps and preserves its floor-plan editing and tactile-map workflow. Original project notices remain in the repository. Third-party code, fonts, datasets, and provider services retain their respective licenses and usage terms; consult the original notices before redistribution. Demonstration records are labelled synthetic, and scenario changes remain separate from actual operational observations.
