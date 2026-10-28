# Reproducible Bumps geometry demo

This is a walkthrough of the **actual existing application**, not a video or separate demo app. Use only the supplied synthetic plan. A live model can be wrong; manual edits below are explicitly operator corrections against independent truth, excluded from benchmark accuracy.

## Fixture and expected measurements

- Image: `tests/fixtures/geometry-benchmark/02-connected.png` (680×540).
- Truth: `tests/fixtures/geometry-benchmark/02-connected.truth.json`.
- Two rooms, each3×3m, scale80px/m. Room A corners(100,100),(340,100),(340,340),(100,340); B(340,100),(580,100),(580,340),(340,340).
- Perimeter host walls connect(100,100)→(580,100)→(580,340)→(100,340)→(100,100); partition(340,100)→(340,340).
- Entry center(220,340),width80px=1m on the bottom host; internal door(340,220),width80px=1m on the partition. These are drawing openings, not certified clear widths. Swing direction is unsupported by the stored opening schema.

## Configuration and startup

Bun1.3.14, Node22+, the existing Postgres/Drizzle setup and writable private uploads. On this machine add `.accessops-local/bin` to PATH. Preserve current `.env` files; do not overwrite them with examples. Existing installation and isolated local services already exist.

```sh
bun install --frozen-lockfile
# Fresh authorized installation only: follow README setup/migration/bootstrap instructions.
# Do not rerun setup over user configuration or start duplicate services.
bun run dev --web-port=3400
```

Required local API `PORT=3403`, web `API_INTERNAL_URL=http://127.0.0.1:3403`, existing `DATABASE_URL` and `UPLOADS_DIR`, allowed browser origin3400. Vision stays `VISION_PROVIDER=openrouter` and `OPENROUTER_VISION_MODEL=nvidia/nemotron-3.5-super-vl:free`; retain the existing server-side key/free-tier confirmations, provider and OpenRouter workspace consent. Inspect `apps/api/.env.example` for exact supported names, not a replacement configuration. The direct NVIDIA text endpoint/model/key remain separate and unchanged. Never paste credentials into source, browser code, recordings or reports.

The application currently runs at http://localhost:3400 with API3403 and a durable worker. On this machine production copies under ignored `.accessops-local/ui-web-runtime-*` run the web build; building source does not alter an already-running copy. Restart only services you own after a build. A new operator may simply use the normal development command above after the existing owned services have been stopped.

## Exact user-visible sequence

1. Open Bumps at `/projects`, sign in to an approved workspace, choose **02-connected.png** in the ordinary upload control. The current UI automatically starts its real durable extraction/critique/doorway loop. Wait for completion; do not insert a fake answer if the provider fails.
2. Open the resulting `/map/<projectId>` editor. Inspect rooms, wall endpoints, door centers/host walls and labels against the truth above. The raw live demo misplaced/missed doors and changed boundaries; record those discrepancies.
3. In **Measurements and uncertainty**, inspect scale and feature provenance and target-specific review reasons. Expand **Critique and doorway-audit history** for the actual pipeline's saved critique and receipts. Scale stays unknown until confirmed, even when the model proposes a value. After viewing critique, **Run doorway audit on saved geometry** can explicitly execute that stage before corrections. Bumps also runs its doorway stage automatically during extraction; in this verified run that initial real automatic audit preceded the manual review, and an additional explicit audit was run after corrections to prove it consumed the corrected geometry. No edited video sequence is implied.
4. Select a door in **Feature provenance**. Enter a review reason, correct its X/Y, width and host against the source, and click **Save doorway correction**. Select a room and correct its boundary coordinates or use the existing canvas editor. Changes become user-corrected only after a successful save. Confirming an unchanged feature retains extracted/inferred origin.
5. For the exact known multi-room demonstration, the existing **Exact geometry corrections (existing edit operations)** panel also accepts a complete explicit operator operation batch. Generate that batch from independent truth for this *real uploaded project* using:

```sh
GEOMETRY_DEMO_DIR="$PWD/.accessops-local/geometry-benchmark/demo-new" \
  API_URL=http://127.0.0.1:3403 bun run demo:geometry --prepare \
  --project=<actual-uploaded-project-id> < /private/path/admin-login.json
```

The private login JSON has the existing `email`, `password`, `workspaceId`. It goes through ordinary authentication, not an anonymous bypass. Preparation reads actual extracted geometry, saves its immutable reference/hash, and writes `reviewed-operations.json` plus `dimension-reviews.json`; **it does not apply edits**. Never run preparation over the existing verified demo evidence. Enter a reason, paste those operations into the existing JSON control and click **Save reviewed geometry operations**. This explicitly corrects walls/rooms/doors; it is not inference.

6. Save confirmed scale80px/m. Confirm/correct any printed room width/height proposals to3m using **Save or confirm dimension**. Inspect derived oriented bounding dimensions; they should be3×3m after correction. If no annotation was captured, enter a genuinely known dimension in the empty measurement field or derive geometry dimensions after scale review; neither operation invents a read annotation. Review any remaining flagged features. Unreviewed but otherwise valid geometry exports only as provisional; unresolved ambiguous/invalid geometry cannot be waved through.
7. Click **Run critique on saved geometry**, wait for the durable job; then **Run doorway audit on saved geometry**. Inspect their JSON history and model receipts. These use the corrected model and persist its version/hash; suggestions are **read-only**, not silently applied over human corrections. The current demo's live critic still said `needs_refinement` and proposed low scores despite no findings. That is model advice, not deterministic invalidity or verified accuracy. Inspect suggestions rather than concealing them.
8. Save/confirm changes before continuing; wait for the editor's version to update after each save. Navigate to `/projects`, reopen the same item, and refresh. Confirm **User-corrected**, original value/reason and80px/m persisted. **Saved geometry history** can reopen the original extracted version read-only without replacing current editing state.
9. Click **Next** for actual tactile conversion. Wait for deterministic mechanical repair/validation. The current corrected demo returned `valid=true` with no violations using floor-model version11. If invalid, fix the specific geometry; do not bypass validation.
10. Click **Next**, download map STL and legend STL. The API preserves stale-source protection. A later model edit requires new conversion; historical exports remain explicitly historical. Provisional exports are named/marked provisional and cannot be mistaken for current verified scale.
11. Inspect actual bytes beyond the response status:

```sh
bun apps/api/scripts/geometry-benchmark/check-stl.ts /path/to/downloaded-map.stl
bun apps/api/scripts/geometry-benchmark/check-stl.ts /path/to/downloaded-legend.stl
GEOMETRY_DEMO_DIR="$PWD/.accessops-local/geometry-benchmark/demo-new" \
  API_URL=http://127.0.0.1:3403 bun run demo:geometry \
  --project=<same-project-id> < /private/path/admin-login.json
```

The helper reopens actual persisted current/original models, compares truth, checks review status and audit input hashes/live receipts, downloads actual map/legend, and validates binary length/triangle count, finite coordinates, nondegenerate triangles, two opposite incidences per edge and positive volume. It returns nonzero on a failed check. Topological watertightness does not certify print quality, physical measurements or accessibility.

## Verified saved demo

This run's project: `01a17f95-3703-7000-885c-2d2e25b59271`, current floor version11. It can be reopened by an authorized member of its workspace; no universal/public access is implied. Original extracted version2 remains intact. Browser testing resumed the same item after a web restart and an asynchronous history-list timing failure; no extra inference was fabricated or counted.

[Machine-readable verification](../reports/geometry-benchmark/demo-verification.json): all9 history/provenance/current-input/live-receipt checks passed. Corrected geometry matches truth exactly; that is a user correction result, not live-model accuracy.

| File | Bytes | Triangles | Watertight | Non-manifold edges | Bounds mm |
|---|---|---|---|---|---|
| [map](../reports/geometry-benchmark/stl/map.stl) |122584|2450|yes|0|200×200×4|
| [legend](../reports/geometry-benchmark/stl/legend.stl) |420684|8412|yes|0|200×200×3.70000005|

Mesh heights/sizes are tactile print settings, not real building dimensions. Full volumes, bounds, source version and review status are recorded in the JSON.

## Short recording checklist (no recording created)

Show source image/truth → ordinary upload and actual waiting state → raw geometry discrepancies → critique → specific uncertainty → explicit human correction and saved provenance → corrected-model critique/doorway audit → navigate away and reopen/history → tactile validation → real download and STL inspector output. Keep credentials and private workspace records out of frame. Label the source synthetic and corrections human; do not claim an uncorrected accurate plan, certified inspection or a recorded demo that does not exist.
