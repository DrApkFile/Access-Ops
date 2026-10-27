# Zetaris integration

Current verification: **authenticated read queries and local AccessOps consumption PASS; building federation NOT VERIFIED**. See [live evidence](../live-integration-verification.md) and [reuse audit](../lastmile-reuse-audit.md). No external catalogs or tables were created/modified.

`apps/api/src/providers/zetaris-gateway.ts` implements the installed, actually tested UI gateway: POST `/api/auth/login` returns `idToken` and `orgId`; POST `/api/proxy/query/sql/start` sends `{select,pageLimit}`, Bearer auth, login organization in `X-Org-ID` and UUID `X-Request-ID`. Results preserve query/request/source metadata and bounded complete rows, without session/query handles. Authentication, partial results, timeouts and malformed responses fail explicitly. Internal SELECT/SHOW only, bounded to 500 rows; SQL is not supplied by the model or ordinary browser client.

`ZETARIS_QUERY_PROTOCOL=query-start` selects this path. The earlier SQL-editor distribution adapter remains in `providers/zetaris.ts` for explicit `sql-editor` use; its fixture tests do not verify that contract against the installed distribution. Registration through the current path refuses `RESOURCE_CREATION_NOT_AUTHORIZED`, rather than guessing DDL endpoints. The documented legacy registration preview remains restricted and has not been executed live.

Configure server-only `ZETARIS_BASE_URL`, credentials (`ZETARIS_USERNAME` / `ZETARIS_PASSWORD`, authorized `ZETARIS_CREDENTIALS_FILE`, or token/org pair), and `ZETARIS_WORKSPACE_ID`. Remote origins require HTTPS. Optionally reference an explicitly permitted absolute integration env file through `ACCESSOPS_INTEGRATION_ENV_FILE`; it imports provider settings only, never another application's database configuration. Nothing secret is returned to the browser.

The actual live source queries fetched three `NY_TAXI.taxi_zones` rows and five `LASTMILE_OSM.bronx_ffcc6280994e_csv` rows. Exact query receipts were bound by SHA-256 to reviewed previews and immutable local snapshots. A reference-area investigation uses both source schemas to find missing indoor measurement/status fields. It **does not** turn geographic data into indoor geometry or claim current lift status. Taxi source usage/freshness needs owner confirmation before redistribution; OSM keeps contributor/ODbL attribution.

Two taxi-zone/trip join attempts timed out after the bounded 30-second budget; no joined rows were returned. `SHOW TABLES IN NY_TAXI` was rejected by the installed parser. These failures are retained. The building directory/operational table mappings required by `/v1/zetaris/query` remain absent: configure distinct authorized views exposing `external_id,destination_id,building_id,level_id,lift_id` and `external_id,building_id,lift_id,status,observed_at`. `useZetaris:true` requires matching locally registered observations and preserves returned source lineage. A read-only connection test or geographic schema-gap finding does not complete this building federation requirement.

```sh
# Run from repository root; credentials arrive through private stdin, never arguments.
API_URL=http://127.0.0.1:3403 INTEGRATION_EVIDENCE_DIR=/absolute/private/evidence \
  bun run --cwd apps/api scripts/verify-live-integrations.ts --import-reference \
  < /absolute/private/login.json
```

This creates local AccessOps source records/investigation only; it reads existing permitted external tables. Re-running creates a separate explicit verification workspace record set, not an external catalog. Use ordinary source refresh/import idempotency for recurring imports. For a real building federation supply the missing source views, query them, import returned observations and execute the investigation with `useZetaris:true`; retain both returned record IDs and finding citations.

Distribution references: [official getting-started scripts](https://github.com/zetaris/getting-started/tree/main/scripts). Installed-instance behavior was additionally verified against LastMile's real gateway client, not inferred from README mentions.
