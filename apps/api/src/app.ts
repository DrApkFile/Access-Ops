import { withProviderWorkspace } from "./providers/workspace-scope";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { ZodError } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { projects } from "./db/schema";
import { config } from "./accessops/config";
import { AppError, log } from "./accessops/errors";
import { instrumentation, csrf, rateLimit } from "./accessops/middleware";
import {
  authRoutes,
  authenticate,
  requirePermission,
  type Env,
} from "./accessops/auth";
import { resources } from "./accessops/routes-resources";
import { workflows } from "./accessops/routes-workflows";
import { adminRoutes } from "./accessops/routes-admin";
import { projectRoutes } from "./projects";
import { modelRoutes } from "./models";
import { parseRoutes } from "./parse";
import { tactileRoutes } from "./tactile";
import { exportRoutes } from "./export";
import { modelConfiguration } from "./agents/llm";
import { authorizeProject } from "./accessops/store";
import { openApiDocument } from "./accessops/openapi";
export const app = new Hono<Env>();
app.use("*", instrumentation);
app.use(
  "*",
  cors({
    origin: config.ACCESSOPS_ALLOWED_ORIGINS.split(",").map((s) => s.trim()),
    credentials: true,
    allowHeaders: [
      "content-type",
      "x-accessops-request",
      "idempotency-key",
      "if-match",
    ],
    exposeHeaders: ["x-request-id"],
  }),
);
app.use(
  "*",
  bodyLimit({
    maxSize: 12 * 1024 * 1024,
    onError: (c) =>
      c.json({ error: "REQUEST_TOO_LARGE", code: "REQUEST_TOO_LARGE" }, 413),
  }),
);
app.use("*", csrf);
app.onError((e, c) => {
  if (e instanceof AppError)
    return c.json(
      { error: e.message, code: e.code, requestId: c.get("requestId") },
      e.status,
    );
  if (e instanceof ZodError)
    return c.json(
      {
        error: "Invalid request",
        code: "VALIDATION_FAILED",
        issues: e.issues.map((x) => ({ path: x.path, message: x.message })),
        requestId: c.get("requestId"),
      },
      422,
    );
  if (e instanceof SyntaxError)
    return c.json(
      {
        error: "Malformed JSON",
        code: "INVALID_JSON",
        requestId: c.get("requestId"),
      },
      400,
    );
  log("request.error", {
    requestId: c.get("requestId"),
    code: "INTERNAL_ERROR",
  });
  return c.json(
    {
      error: "Request failed",
      code: "INTERNAL_ERROR",
      requestId: c.get("requestId"),
    },
    500,
  );
});
app.get("/", (c) =>
  c.json({ ok: true, service: "AccessOps", models: modelConfiguration() }),
);
app.get("/health", (c) => c.json({ ok: true }));
app.get("/ready", async (c) => {
  try {
    await db.$client`select 1`;
    const { mkdir, access } = await import("node:fs/promises");
    await mkdir(config.UPLOADS_DIR, { recursive: true, mode: 0o700 });
    await access(config.UPLOADS_DIR, 2);
    const workers =
      await db.$client`select id from ao_workers where heartbeat_at > now()-interval '45 seconds' limit 1`;
    if (!workers.length)
      return c.json({ ready: false, code: "WORKER_NOT_READY" }, 503);
    return c.json({
      ready: true,
      database: "reachable",
      storage: "writable",
      ai: "optional_dependency_requires_provider_check",
    });
  } catch {
    return c.json({ ready: false, code: "DEPENDENCY_NOT_READY" }, 503);
  }
});
app.use("/auth/*", rateLimit(240, "auth"));
app.use("/auth/login", rateLimit(12, "login"));
app.route("/auth", authRoutes);
app.use("/v1/*", authenticate, rateLimit(240, "protected"));
app.get("/v1/openapi.json", (c) => c.json(openApiDocument));
app.route("/v1", resources);
app.route("/v1", workflows);
app.route("/v1", adminRoutes);
app.use("/projects", authenticate, rateLimit(60, "projects"));
app.use("/projects/*", authenticate, rateLimit(120, "projects"));
app.use("/projects/*", async (c, next) => {
  const id = c.req.path.split("/")[2];
  if (id) {
    await authorizeProject(c.get("principal"), id);
  }
  if (!["GET", "HEAD"].includes(c.req.method))
    return requirePermission("operate")(c, next);
  await next();
});
app.post("/projects", requirePermission("operate"));
app.use(
  "/projects/*",
  async (c, next) =>
    await withProviderWorkspace(c.get("principal").workspaceId, next),
);
app.route("/projects", projectRoutes);
app.route("/projects", modelRoutes);
app.route("/projects", parseRoutes);
app.route("/projects", tactileRoutes);
app.route("/projects", exportRoutes);
