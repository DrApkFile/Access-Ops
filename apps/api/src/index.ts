import { loadIntegrationEnvironment } from "./providers/integration-environment";
import { app } from "./app";
import { config } from "./accessops/config";
import { db } from "./db";
import { log } from "./accessops/errors";
await loadIntegrationEnvironment();
const server = Bun.serve({
  port: config.PORT,
  idleTimeout: 60,
  fetch: (request, server) =>
    app.fetch(request, { remoteIp: server.requestIP(request)?.address }),
});
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  log("api.stopping");
  await server.stop(false);
  await db.$client.close();
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
log("api.started", { port: server.port });
