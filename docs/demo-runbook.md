# Reproducible acceptance demonstration

Start the database, apply migrations, bootstrap an admin and run API+worker+web as in README. Sign in at `/operations`. Use only explicitly synthetic demonstration records or facility data you have permission to use. Do not present generated floor plans/measurements or simulated events as live records.

```sh
# Login JSON contains email/password/workspaceId and is mode 0600.
API_URL=http://localhost:3403 DEMO_EVIDENCE_PATH=/private/demo-results.json   bun run demo < /private/admin-login.json
```

The script uses authenticated public APIs, not a seeded finding or hidden business-state inserts. It generates a labelled synthetic floor-plan PNG from a manually authored geometry fixture, uploads it, saves/reviews the model with an explicit reason, links it to a building/level, and creates canonical entities. It registers separate directory, topology audit, measurement and operational sources and imports their independent records through preview/commit. This manual geometry step does not prove live AI parsing.

The workflow validates idempotent re-import; establishes reviewed measured baseline connectivity; runs an isolated lift-closure scenario and reverse scenario; imports a reported outage; creates an investigation whose impact finding requires directory+topology/measurement+operational evidence; inspects evidence; proposes, approves and starts a follow-up action; imports an attributable verified restoration; resolves the action; and runs a follow-up investigation that becomes reachable while the old outage finding remains unchanged. It then introduces stale/conflicting evidence, obtains unknown connectivity, records a reviewed conflict resolution, and exports/reopens the historical report with a stable evidence hash.

Use returned IDs to inspect sources, evidence, investigation traces, actions and scenarios in the minimal operations console. Bumps editing is `/map/{projectId}`. The integration suite additionally generates tactile designs/STL+legend, edits the model, proves current export is blocked as stale, retrieves the historical export, and regenerates a valid current export. Provider statuses remain visible even when explanations are unavailable.

To demonstrate real sponsors, configure permitted Zetaris directory/operations sources and matching local external IDs, run `useZetaris:true`, and retain an actual joined result/finding. Then explicitly consent the workspace, configure Meterless/NVIDIA and run the provider verification script against a completed investigation. These are required external proof steps; the local deterministic demo cannot substitute for them.

Restart API/web/worker without resetting the database or uploads; sign in again if needed and reopen the recorded investigation/private plan/export. Verify the same historical evidence hash. The delivery evidence records which of these restart/browser checks actually ran. UI refinement and branding are deferred.
