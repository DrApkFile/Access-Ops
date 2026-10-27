# Tests and evidence

Run checks with Bun 1.3.14 from the repository root. The test command includes original Bumps tests unchanged plus AccessOps deterministic tests. Tests that require Postgres are separately gated; sponsor mocks never establish live execution.

```sh
bun install --frozen-lockfile
bun run test
bun run typecheck
bun run lint
bun run security
bun audit --json
bun run build
ACCESSOPS_INTEGRATION=1 bun run test:integration
```

Integration tests require the dedicated development/test Postgres endpoint `127.0.0.1:55434`, migrations applied, and the API configuration loaded from `apps/api/.env`. They create fresh tenant IDs and do not drop/reset existing data. Stop competing workers during recovery assertions. The suite runs the Hono application with a real Postgres connection and a controlled durable worker; a separate TCP demo and browser exercise validate service/gateway behavior. A test's 120-second acceptance budget covers real geometry+DB workflow work, not a weakened original unit timeout.

Coverage includes namespaced/contextual identities, unresolved names, differing floors, ambiguous aliases, timestamp/unit validation, stale/conflicting observations and reviewer invalidation; CSV/JSON errors/mapping/hash/idempotence/formula neutralization; graph evidence and canonical context, missing measurements, inter-level edges, complete/incomplete coverage, stair restrictions, lift/entrance closure, scenario isolation and reversal; strict citations/claims, provider model identity, malformed/auth/offline/timeout/rate-limited responses; tenant/building/project isolation, CSRF, role/session revocation, database integrity and immutable evidence; durable lease recovery and approved action resolution; frozen historical reports and current-versus-historical STL exports.

The original repeatable timeouts were traced to repeated geometry searches/rasterization and Resvg system-font scans. Reused immutable computations and a bundled licensed font remove that overhead; original test assertions and timeouts remain unchanged. Missing Gemini/OpenRouter credentials now block only actual vision inference, not importing the application or deterministic tests.

`apps/api/scripts/check-integrations.ts` records redacted optional live checks. `CHECK_PUBLIC_MBTA=1` exercises public facilities retrieval. Live sponsors require the separately documented secrets and valid data. No CI mocks are called live tests. Backup and restore run against separate new resources; hashes/counts are verified. Performance figures in delivery evidence are measured on this host and are not capacity guarantees. Dependency advisories and remaining production gates must be reviewed even if tests pass.

Final totals, exit codes, environment, logs and incomplete acceptance items are in [implementation-delivery.md](implementation-delivery.md) and the private `.accessops-local` evidence index. Do not publish that directory: it also contains credentials and encrypted backups.

## LastMile reuse and UI phase

Current results and reproducible commands are in [live verification](live-integration-verification.md) and [UI delivery](ui-redesign-delivery.md). Added tests cover the verified query-start contract, partial query failures, explicit config allowlisting, source-receipt hash binding, actual Engine projection, NVIDIA image formatting/consent and rejection of the observed private serving alias. The acceptance test additionally covers protected project listing, source-scoped action listing, Engine trace persistence and unconsented explanation denial. LastMile's four provider/source test files were run separately: 70 injected-transport tests pass, classified mocked integration. Their mocks are not used as external proof.

Final UI evidence includes 39 authenticated/desktop/mobile workflow checks plus 3 actual asset/small-viewport checks, all passing. The exact supplied remote MP4 played and remote Bubbledot font loaded in the browser; fallback/reduced-motion states were independently tested.
