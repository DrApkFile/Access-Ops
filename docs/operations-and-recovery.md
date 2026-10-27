# Operations and recovery

`/health` reports process liveness. `/ready` checks Postgres, upload-directory write access and a worker heartbeat newer than 45 seconds. AI is explicitly optional for deterministic workflows; inspect authorized `/v1/providers` and the investigation provider metadata for actual availability. `/v1/metrics` includes request/process counters and persisted workspace job/workflow totals; `/v1/audit-events` exposes privileged history to admins. Logs are structured JSON with request IDs. Export these to the operator's monitoring system; no external monitoring backend is claimed installed.

Important jobs persist in `ao_jobs`. Workers claim with `FOR UPDATE SKIP LOCKED`, five-minute leases and 30-second lease extension. Actor membership/resource rights are rechecked. Retryable failures use bounded exponential backoff (three attempts); expired leases are reclaimed and exhausted leases fail explicitly. Source content hashes and completed-investigation checks make retry effects idempotent. Failed jobs can be explicitly retried; queued jobs can be cancelled. Running-job cancellation is deliberately rejected rather than pretending a side effect was cancelled. SIGTERM drains the current operation. Supervisor grace must cover the bounded provider cold-start window and original geometry processing; after a forced kill the lease enables recovery.

## Backup and restore

Use operator maintenance: stop new API traffic, drain and stop workers, check no running jobs, and retain a consistent database/uploads pair. Do not take an inconsistent live filesystem backup. Scripts refuse active jobs and require explicit maintenance acknowledgment. Tools: `pg_dump`, `createdb`, `pg_restore`, `tar`, `cp`. Use a separate secret store for a base64-encoded random 32-byte AES-GCM key. Do not store it alongside production backup archives.

```sh
cd apps/api
# Inject ACCESSOPS_BACKUP_KEY securely; never print it.
ACCESSOPS_BACKUP_MAINTENANCE=1 bun scripts/backup.ts /private/backups/new-backup.aobackup
bun scripts/restore.ts /private/backups/new-backup.aobackup   accessops_restore_newcheck /absolute/new-empty-parent/restored-uploads
```

The encrypted archive contains a custom Postgres dump, file hashes, row counts and upload paths. Output uses exclusive creation and private permissions. Restore authenticates/decrypts, checks safe paths and hashes, refuses an existing database or upload destination, creates only a new `accessops_restore_*` database, restores rows and verifies counts, then relocates private project/export paths. Failure retains newly created resources for diagnosis; it never resets the original DB. Point a separate API at the restored resources and verify authorized retrieval before switching traffic. Keep the old deployment intact until approval. The isolated local round-trip passed and its counts/hashes are in `.accessops-local/backup-results.json`; the test key is local and must not be mistaken for a production key-management arrangement.

## Incidents

Database interruption: readiness fails; source refreshes must not overwrite history with emptiness. Restore DB connectivity and restart supervisors if needed, inspect leased/failed jobs, retry only after resolving the cause. Provider failure: deterministic findings persist with explanation unavailable; validate credentials/model availability without logging values. Stale evidence/conflicting measurements: inspect exact sources and timestamps, obtain verification, then record a reviewer decision or new observation. Never edit historical snapshots. Stale tactile export: regenerate from the latest model or explicitly retrieve the historical design; do not bypass version checks.

Storage failure: stop uploads/exports, restore the volume and verify path permissions, space and hashes. Do not claim Postgres persistence saves missing images/STLs. Investigate request/job IDs and categorical errors without dumping private records into logs. Approve retention expiry through a reviewed maintenance migration; automatic deletion of evidence is not implemented. Rehearse restores and alerts periodically on isolated infrastructure.
