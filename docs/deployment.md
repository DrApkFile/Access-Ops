# Deployment

No external production deployment was performed. The supplied `compose.yaml` is an isolated local/container rehearsal, explicitly in development mode. It requires an explicit database password and a private `.env.container`; it does not silently choose insecure credentials. Existing Render and original cloud documents are historical deployment references, not proof that these changes are deployed.

Install Bun 1.3.14 and Node 22+, use the committed Bun lockfile, and run migrations as a separate release step before starting traffic. `apps/api/Dockerfile` runs the Hono API; the same image runs `bun src/worker.ts`. `apps/web/Dockerfile` builds Next's standalone server. Database and uploads have separate persistent volumes in Compose. Configure `API_INTERNAL_URL=http://api:3003` only inside the private network; clients use `/backend` and never receive provider keys. Do not expose the database or API to the public Internet.

For production set `NODE_ENV=production`, `DATABASE_URL` with `sslmode=require` or preferably `verify-full` against a trusted TLS endpoint, an absolute persistent `UPLOADS_DIR`, `ACCESSOPS_PERSISTENT_STORAGE=true`, and explicit HTTPS origins. Startup rejects missing persistence/TLS declarations. The declaration does not prove that a volume is actually durable: test it on the chosen host. Mount the same uploads volume into API and worker. Provision disk quotas and encryption, set DB connection/resource budgets, inject secrets through the deployment platform, and configure HTTPS ingress, timeouts, body limits and restart policies. Local ephemeral uploads are not a production arrangement.

```sh
bun install --frozen-lockfile
bun run build
bun run --cwd apps/api db:migrate
bun run --cwd apps/api start
# Separate supervised process, same configuration/storage:
bun run --cwd apps/api worker
# Separate web process with API_INTERNAL_URL configured:
bun run --cwd apps/web start
```

Back up before migrations. Migrations are forward-only additive SQL; inspect and stage them on a copy first. A failed unique/FK constraint must be investigated without deleting records. Stop traffic and forward-fix a bad release or restore the encrypted database+uploads pair into new resources and switch traffic after verification. Do not roll back by dropping tables or resetting the existing DB. Bootstrap an initial administrator privately; unowned legacy Bumps rows require an explicit reviewed ownership assignment before access.

Smoke checks: `/health` must return 200; `/ready` must validate database, writable storage and a worker heartbeat; anonymous protected API calls must be 401; sign-in through the same-origin web gateway must succeed; reopen a historical investigation and private plan; generate/export a current tactile design; stop/restart API and worker and confirm persistence. Real provider checks are separate and can be unavailable while deterministic service readiness is healthy.

The Docker configurations are prepared but image build/release on a real hosting environment is a separate gate unless recorded as verified in delivery evidence. Pin deployment images/digests in your release process and test native geometry/font assets on the deployment architecture. No live infrastructure, catalogs or credentials from unrelated services were changed. Resolve Bumps ownership/license permission before redistribution claims.

## Text-provider policy and optional Runtime

API and worker must receive identical provider policy/secrets. In the existing Compose rehearsal these come through its shared private `env_file`; do not add server secrets to the web environment. Use `ACCESSOPS_EXPLANATION_PROVIDER=auto`, `ACCESSOPS_NVIDIA_FALLBACK=true` only after approval, and explicit approved workspace lists in both `ACCESSOPS_PROVIDER_WORKSPACES` and `ACCESSOPS_NVIDIA_TEXT_WORKSPACES`. Empty lists deny sending evidence; Runtime consent does not imply external NVIDIA permission. Keep `ACCESSOPS_AUTO_EXPLANATION=false` for explicit operator requests. Code defaults automatic fallback to false; examples show the opt-in but leave lists empty.

Runtime endpoint/token may remain absent when approved NVIDIA text is configured. To add it later, inject the actual instance origin/token, restart API and worker and follow [activation/verification](live-integration-verification.md#meterless-runtime-status-and-nvidia-nemotron-fallback). Provider configuration diagnostics do not prove live inference. Pinned modes never silently switch, local-only Runtime disposition prohibits cloud fallback, and invalid configuration/absent providers preserve deterministic workflows. Existing production release/security/backup gates still apply.
