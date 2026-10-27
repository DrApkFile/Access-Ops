import { loadIntegrationEnvironment } from "./providers/integration-environment";
import { runOne } from "./accessops/jobs";
import { db } from "./db";
import { log } from "./accessops/errors";
import { workers } from "./accessops/schema";
await loadIntegrationEnvironment();
let stopping = false;
process.on("SIGTERM", () => {
  stopping = true;
});
process.on("SIGINT", () => {
  stopping = true;
});
const owner = crypto.randomUUID();
let cleanAt = 0;
async function heartbeat() {
  if (Date.now() - cleanAt > 3600000) {
    await db.$client`delete from ao_rate_limits where reset_at<now()-interval '1 day'`;
    await db.$client`delete from ao_sessions where expires_at<now()-interval '1 day'`;
    await db.$client`delete from ao_workers where heartbeat_at<now()-interval '1 day'`;
    cleanAt = Date.now();
  }
  await db
    .insert(workers)
    .values({ id: owner, heartbeatAt: new Date() })
    .onConflictDoUpdate({
      target: workers.id,
      set: { heartbeatAt: new Date() },
    });
}
// Readiness remains false until a heartbeat succeeds. Starting before Postgres finishes
// crash recovery must not terminate the worker or acknowledge any queued work.
let registered = false;
const timer = setInterval(() => {
  if (registered) void heartbeat().catch(() => {});
}, 10000);
while (!stopping) {
  try {
    if (!registered) {
      await heartbeat();
      registered = true;
      log("worker.started", { owner });
    }
    if (!(await runOne(owner))) await Bun.sleep(750);
  } catch {
    log("worker.database_unavailable");
    await Bun.sleep(2000);
  }
}
clearInterval(timer);
await db.$client.close();
log("worker.stopped");
