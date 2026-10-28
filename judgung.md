# AccessOps — Judge’s Walkthrough

A practical path through the product, its integrations, and the code behind them. Start with the application, inspect a concrete result, then follow its evidence back to the implementation.

## 1. Understand the product

Read the opening sections of [README.md](README.md), then open the application at **http://localhost:3400** and sign in to the demonstration workspace with the supplied account.

AccessOps connects two workflows:

- **Spatial review:** a floor plan becomes editable geometry and a validated tactile-map export.
- **Operational intelligence:** independent source records become an evidence-backed investigation, scenario comparison, and assignable action.

If running a fresh copy, follow the README’s clone, configuration, migration, bootstrap, and startup steps first.

## 2. Walk through a floor-plan project

Use [`tests/fixtures/geometry-benchmark/02-connected.png`](tests/fixtures/geometry-benchmark/02-connected.png), a labelled synthetic plan. Its [ground truth](tests/fixtures/geometry-benchmark/02-connected.truth.json) specifies two 3 × 3 m rooms, 80 pixels per meter, a 1 m entrance opening, and a 1 m internal doorway.

| Step | Where to go | What to inspect |
|---|---|---|
| Upload | `/projects` | Choose the PNG through the ordinary upload control and observe extraction progress. |
| Review | `/map/<projectId>` | Compare rooms, walls, and doorways with the source image. Open critique and doorway-audit history. |
| Correct | Measurements and uncertainty; existing editor controls | Save a source-backed scale or doorway correction with a review reason. Inspect extracted, inferred, and user-corrected provenance. |
| Recheck | Critique and doorway-audit controls | Run an audit on the saved geometry and inspect its recorded model version. |
| Reopen | `/projects`, then the saved project | Refresh or navigate away and confirm the geometry, correction reason, and version history persist. |
| Convert | Tactile stage | Generate the design and inspect the actual deterministic validation result. |
| Export | Export stage | View the 3D model and download both the map and braille-legend STL. |

Corrections are explicit human review against the source. Each saved version retains its history. The [complete runbook](docs/geometry-demo-runbook.md) includes exact source coordinates and controls for reproducing the known layout.

Inspect the downloaded artifacts with the existing tool:

```sh
bun apps/api/scripts/geometry-benchmark/check-stl.ts /path/to/map.stl
bun apps/api/scripts/geometry-benchmark/check-stl.ts /path/to/legend.stl
```

This checks binary structure and mesh topology rather than relying on a successful download response. The saved [map](reports/geometry-benchmark/stl/map.stl), [legend](reports/geometry-benchmark/stl/legend.stl), and [verification receipt](reports/geometry-benchmark/demo-verification.json) provide an inspectable reference.

## 3. Follow an evidence-backed operational workflow

Open the selected building or reference area in `/dashboard`. If the demonstration workspace already contains a completed investigation, begin with that record and follow its evidence links.

| Step | Screen | What to test |
|---|---|---|
| Inspect independent sources | `/sources` | Open each source’s snapshots, record identifiers, timestamps, and import history. |
| Review identity | `/entities` | Inspect canonical entities and contextual mappings across external records. |
| Inspect connectivity | `/graph` | Review the graph version, edge review state, and supporting observations. |
| Investigate | `/investigations` | Run a question against the selected scope and inspect findings, checks, evidence references, and uncertainty. |
| Trace a finding | Investigation detail | Open the source observations supporting a result and compare their effective times and verification state. |
| Simulate | `/scenarios` | Apply an isolated closure and compare baseline/scenario reachability and affected destinations. |
| Take action | `/actions` | Assign an owner, review and approve a proposal, then resolve it with attributable evidence. |
| Revisit | Investigation history and reports | Open a follow-up result, then reopen the original to see that its evidence snapshot remains intact. |

For a reproducible, labelled synthetic case, use the existing acceptance demo after setup:

```sh
API_URL=http://localhost:3403 bun run demo < /private/path/admin-login.json
```

The private JSON contains `email`, `password`, and `workspaceId`. This command creates demonstration records through authenticated APIs. It exercises directory, topology, measurement, and operational sources; a lift closure and reversal; findings and evidence; action approval and verified restoration; historical report retrieval; and stale/conflicting observation handling. Use the returned identifiers to inspect the same records in the UI. [Detailed guide](docs/demo-runbook.md).

## 4. Inspect the technology integrations

### Zetaris: query → receipt → snapshot → finding

Open the configured Zetaris instance using the demonstration operator’s access. Inspect the relevant sources and execute the permitted query, then return to the corresponding AccessOps source snapshots and investigation.

The recorded reference workflow reads `NY_TAXI.taxi_zones` and `LASTMILE_OSM.bronx_ffcc6280994e_csv`, preserves the returned records, and uses their evidence in a source-coverage finding. The challenge recording also shows the real SQL execution and returned counts across these two sources. Follow the source/query identifiers and snapshot hashes to understand the connection between external data and the application’s finding.

Read [Zetaris integration](docs/integrations/zetaris.md); inspect [`zetaris-gateway.ts`](apps/api/src/providers/zetaris-gateway.ts) and [`zetaris.ts`](apps/api/src/providers/zetaris.ts).

### NVIDIA: image understanding and grounded explanation

The floor-plan workflow uses **OpenRouter `nvidia/nemotron-3.5-super-vl:free`**. The text explanation path uses the **NVIDIA API with `nvidia/nemotron-3.5-lightning-30b-a3b`**.

Inspect a saved operation’s provider/model receipt. For an investigation explanation, follow its evidence citations back to the frozen observations. Look for actual provider identity, bounded inputs, schema validation, and preserved review boundaries.

Read [vision execution evidence](docs/vision-provider-evaluation.md); inspect [`openrouter-vision.ts`](apps/api/src/agents/openrouter-vision.ts), [`explanation.ts`](apps/api/src/providers/explanation.ts), and [`selection.ts`](apps/api/src/providers/selection.ts).

### Meterless: scoped evidence context

Inspect the investigation’s Engine projection and trace metadata. Run the actual World Model Engine conformance checks:

```sh
WORLD_MODEL_IMPL=./apps/api/src/accessops/world-model-engine.ts \
  node --experimental-transform-types apps/api/vendor/meterless-world-model/conformance/runner.ts
```

Read [Meterless integration](docs/integrations/meterless.md); inspect [`world-model-engine.ts`](apps/api/src/accessops/world-model-engine.ts) and [`world-model.ts`](apps/api/src/accessops/world-model.ts). The separate Runtime adapter and policy-controlled NVIDIA selection are described in the same guide.

## 5. Check the implementation

Use the repository’s commands from the root:

```sh
bun run test
bun run typecheck
bun run lint
bun run security
bun audit --json
bun run build
```

For the isolated PostgreSQL integration environment described in [testing](docs/testing.md):

```sh
ACCESSOPS_INTEGRATION=1 bun run test:integration
```

These checks cover identity and reconciliation, source provenance, graph analysis, scenario isolation, provider policy, workspace permissions, persistence, and the original tactile-map workflow. Automated provider mocks and real external receipts are labelled separately in the [integration evidence](docs/live-integration-verification.md).

## A useful review order

**Upload a plan → inspect and correct geometry → reopen history → validate and download STL → inspect sources → trace a finding → compare a scenario → review an action → follow the integration code.**

This path connects the user experience to the actual data, saved artifacts, and implementation without requiring a tour of every engineering document.
