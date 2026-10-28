# Geometry evidence — synthetic data only

`results.cached.json` and `.md` are offline scoring of eight actual, timestamped live extractions in `extractions/`. No new inference was performed during that replay. Model receipts identify OpenRouter/Nvidia and the unchanged `nvidia/nemotron-3.5-super-vl:free` model. Manual corrections are excluded from accuracy scores.

`demo-preparation.json` records the independent UI upload's original model hash/version and original errors. `demo-reviewed-operations.json` contains explicit human/operator corrections against known fixture truth, never a model answer. `demo-corrected-model.json` and `demo-live-saved-geometry-reviews.json` retain corrected provenance and actual read-only model critiques/audits. `demo-verification.json` checks immutable history, current corrected input hashes, live receipts and the actual binary STL files in `stl/`.

Browser evidence was captured in stages, resuming the SAME saved project after browser restart/timing interruptions, without repeating inference. The initial correction report retains its history-list timing failure; `browser-history-export.json` records the successful resumed history/tactile/download checks. No screen recording or video was created. Private screenshots and run logs remain in `.accessops-local/geometry-benchmark/`; no cookies, login input or environment files are included here.

See `docs/geometry-benchmark.md`, `docs/geometry-demo-runbook.md` and `docs/geometry-delivery.md` for interpretation and reproduction. These are tiny synthetic plans, not an accuracy certification or a representative real-building dataset.

`browser-post-restart.json` records eight successful browser checks after the gateway fix, including actual download headers and anonymous401. `check-results.json` deliberately retains earlier failed type/build/integration attempts as well as their passing final checks.
