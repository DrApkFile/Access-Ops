# Small synthetic geometry benchmark

This benchmark measures the existing Bumps extraction pipeline; it does not substitute answers or change the configured provider. Eight deterministic, independently specified SVG/PNG floor plans live in `tests/fixtures/geometry-benchmark/`, each with a `.truth.json`. The selected provider remains OpenRouter `nvidia/nemotron-3.5-super-vl:free`; NVIDIA text inference is unchanged.

## Run it

Use Bun1.3.14 from the repository root. On this supplied machine the executable is `.accessops-local/bin/bun`; add that directory to `PATH` if necessary. Existing dependencies and configuration are already installed. A fresh copy uses `bun install --frozen-lockfile`.

```sh
bun apps/api/scripts/geometry-benchmark/generate.ts
# Makes external free-model calls. Input JSON needs only the approved workspaceId.
GEOMETRY_BENCHMARK_DIR="$PWD/.accessops-local/geometry-benchmark/live" \
  bun run benchmark:geometry --live < /private/path/approved-workspace.json
# Re-score those exact cached live outputs; no network or fabricated responses.
GEOMETRY_BENCHMARK_DIR="$PWD/.accessops-local/geometry-benchmark/live" \
  bun run benchmark:geometry --cached
```

`approved-workspace.json` contains `{"workspaceId":"your-authorized-workspace-id"}`. It is not committed. The live runner requires the existing server-side OpenRouter configuration, free-model/free-account confirmation and approved workspace lists. It uses `selectedVisionReadiness`, `withProviderWorkspace`, and the real `parsePlanImage` PNG preprocessing/model adapter. Credentials/consent missing → explicit blocked cases; network/model/schema failures → failed cases, never fabricated extraction. The separate demo exercises the ordinary upload, durable parser, critique and doorway-audit workflow too.

Do not run new calls merely to generate a green report. Use `--only=01-clean` when deliberately testing one case, with a **separate output directory** to preserve the complete run. A retry is bounded by the existing provider/parser policy. `--cached` requires a matching image hash, parser instructions, model, normalization revision and image dimensions. It labels results `CACHED_LIVE` and retains original request times/receipts. Missing or obsolete cache is a recorded failure. Live reports use `results.json/.md`; replay uses `results.cached.json/.md`. Exit0: all cases pass; exit1: at least one fails; exit2: blocked cases without scored failures.

The report's `attempted=0` on replay means zero *new* calls, not that the original images were never sent. Each extraction file is classified `LIVE_EXTERNAL` with actual request/model/image hashes and timestamps. Final delivered metrics are a replay of those real responses, not a new live benchmark and not a mock.

## Reference and comparison contracts

Coordinates, wall endpoints and door centers/widths are **source-image pixels** with origin at top left. Physical room dimensions are meters only when truth has a known scale; unknown-scale truth is pixels and meter errors are null. Door swing direction is unsupported by the existing Bumps opening schema and explicitly null in truth. The full wall is a host centerline; drawn doorway gaps are excluded from visible-wall coverage. Split/coalesced collinear model segments are tolerated; semantic missing/extra walls and raw segment counts are reported separately.

The source image is already the application's coordinate frame. We do not fit a translation, rotation or scale to conceal extraction errors. The known15° fixture rotation is used only to project room extents into its annotated axes. For an external extraction with a legitimately different frame, add an explicit documented frame transform before scoring rather than fitting against the answer. The current schema promises source-pixel coordinates.

Room matching uses normalized labels; unmatched rooms/doors remain missing/extra. Door association is distance-bounded, with host-wall and width checks. Room polygons and walls are compared using symmetric point-to-segment distances with17 samples per segment (mean,95th percentile and max); this is a small reproducible approximation, not exact Hausdorff distance. Door center/width errors are in pixels and reference meters. Percentage errors use nonzero reference room dimensions. L-shape dimensions mean oriented bounding extents; they do not describe a rectangular room or measured clear space.

Default **demo tolerances**, not manufacturing or accessibility certification: position0.15m for known-scale cases,12px for unknown scale; room extents8%; door width0.15m (12px when scale unknown). These deliberately approximate a small vision-derived tactile plan. Stricter tolerances may be warranted for another use.

```sh
GEOMETRY_BENCHMARK_TOLERANCES='{"positionMeters":0.10,"positionPixels":8,"dimensionPercent":5,"doorWidthMeters":0.10}' \
GEOMETRY_BENCHMARK_DIR="$PWD/.accessops-local/geometry-benchmark/live" \
  bun run benchmark:geometry --cached
```

All tolerance values must be positive and finite. Reference scale is for scoring only and never sent to inference. Model-read annotations, proposed scale, and derived geometry errors are separate fields. No model score is described as calibrated confidence.

## Actual results from this run

Eight real PNG extractions completed using the unchanged free model. Independent comparison found **1/8 passing geometry/uncertainty cases**, not eight accurate plans. The final scores replay those outputs offline. The complete per-room/per-door errors, percentage errors, annotation readings, wall coverage, missing/extra features, validity/review flags and receipts are in [results.cached.json](../reports/geometry-benchmark/results.cached.json); [concise table](../reports/geometry-benchmark/results.cached.md).

| Fixture | Structured output | Geometry result | First room width / height absolute error | Wall p95 px | First door position / width error px |
|---|---|---|---|---|---|
| 01-clean | live | FAIL |0.200 /0.200m|40|59.46 /20|
| 02-connected | live | FAIL |0.175 /0.200m|2|40 /0|
| 03-l-shape | live | FAIL |0 /0m|10|40 /20|
| 04-rotated | live | FAIL |0.111 /0.196m|64|11.05 /2|
| 05-low-resolution | live | FAIL |1.000 /0m|40|20 /0|
| 06-missing-dimension | live | FAIL |0 /0m|4|46 /20|
| 07-ambiguous-door | live | PASS, review required |0 /0m|5|0 /unknown|
| 08-unknown-scale | live | FAIL |0 /0px|4|4 /0|

The table shows the **first** room/door only; it cannot substitute for multi-room and missing/extra counts in JSON. Case02 misses the internal door and adds unrelated proposals. Case08 matches extents but not the full boundary. Case07's pass means the ambiguous feature is properly retained for review, **not** that its unknown width is correct or export-ready. Door leaves/arcs were repeatedly mistaken for room geometry or door centers. A successfully parsed JSON response is insufficient accuracy evidence.

All eight raw models were blocked at the review/export gate; this is recorded as `BLOCKED_REVIEW`, not a bypassed export or eight mesh failures. Raw schemas parse, but physical calibration, feature ambiguities and model-read annotations remain unreviewed. Geometry validation and invalid correction tests remain deterministic. The separately corrected demo reaches the actual STL exporter and independently validates its bytes.

### Fixture revision disclosure

The first low-resolution drawing mistakenly retained a printed80px/m reference after being resized by half. It was corrected to40px/m, SVG/PNG/truth regenerated consistently, and **only that case** was rerun live. Its old image/truth/response remain privately under `.accessops-local/geometry-benchmark/fixture-revisions/`. All other image hashes are unchanged. The current low-resolution result uses the corrected fixture hash; expected answers were never edited to match model output.

An early replay overwrote the original top-level report before separate `.cached` naming was added. Original live logs and eight timestamped raw model receipts were retained. Delivered scoring is therefore explicitly an offline replay of live responses, with the revised05 case, rather than pretending to be an untouched original live report.

## Uncertainty interpretation

Extraction provenance is an **unverified proposal**. Explicit annotations can be labeled extracted by the model, indirect calculations inferred; that classification is not independently proven by OCR. Physical scale is never automatically promoted into `pixelsPerMeter`. Missing annotations can legitimately be derived after scale review; they are not invented exact measurements. Unknown scale, ambiguous doors, invalid boundaries, model edits, and annotation-vs-geometry disagreement are surfaced with target/reason and no invented confidence percentage. See the [demo runbook](geometry-demo-runbook.md) for actual human correction, preserved history and STL validation.
