# Synthetic geometry benchmark

CACHED_LIVE_REPLAY, 2026-10-27T23:21:38.800Z. 8/8 structured extractions; 1/8 geometry/uncertainty cases passed. No manual correction is included in accuracy scores.

Ground-truth reference scale is used only for scoring; it is never fed to inference. Source-image coordinates are compared without fitted alignment or rescaling. Pixel positions are estimates; these tolerances are demonstration thresholds, not accessibility certification.

| Case | Result | Evidence | First room width/height absolute error | Wall p95 px | First door position / width error px | Export | Reason |
|---|---|---|---|---|---|---|---|
| 01-clean | FAIL | CACHED_LIVE | 0.200 / 0.200 reference m | 40.00 | 59.46 / 20.00 | BLOCKED_REVIEW | Room dimensions/boundary outside tolerance: ROOM A; Door position/width/host outside tolerance: entry; Wall coverage/position outside tolerance |
| 02-connected | FAIL | CACHED_LIVE | 0.175 / 0.200 reference m | 2.00 | 40.00 / 0.00 | BLOCKED_REVIEW | Room dimensions/boundary outside tolerance: ROOM A; Room dimensions/boundary outside tolerance: ROOM B; Door position/width/host outside tolerance: entry; Missing door connection; Extra rooms or doors |
| 03-l-shape | FAIL | CACHED_LIVE | 0.000 / 0.000 reference m | 10.00 | 40.00 / 20.00 | BLOCKED_REVIEW | Door position/width/host outside tolerance: entry |
| 04-rotated | FAIL | CACHED_LIVE | 0.111 / 0.196 reference m | 64.00 | 11.05 / 2.00 | BLOCKED_REVIEW | Room dimensions/boundary outside tolerance: ROOM A; Door position/width/host outside tolerance: entry; Wall coverage/position outside tolerance |
| 05-low-resolution | FAIL | CACHED_LIVE | 1.000 / 0.000 reference m | 40.00 | 20.00 / 0.00 | BLOCKED_REVIEW | Room dimensions/boundary outside tolerance: ROOM A; Door position/width/host outside tolerance: entry; Wall coverage/position outside tolerance |
| 06-missing-dimension | FAIL | CACHED_LIVE | 0.000 / 0.000 reference m | 4.00 | 46.00 / 20.00 | BLOCKED_REVIEW | Door position/width/host outside tolerance: entry |
| 07-ambiguous-door | PASS | CACHED_LIVE | 0.000 / 0.000 reference m | 5.00 | 0.00 / — | BLOCKED_REVIEW | within configured tolerances |
| 08-unknown-scale | FAIL | CACHED_LIVE | 0.000 / 0.000 px | 4.00 | 4.00 / 0.00 | BLOCKED_REVIEW | Room dimensions/boundary outside tolerance: ROOM A |

Full per-room/per-door errors, missing/extra counts, uncertainty, annotated versus derived dimensions and model receipts are in results.json. Export blocks are recorded rather than bypassed. The full user-visible corrected-STL demo is reported separately.
