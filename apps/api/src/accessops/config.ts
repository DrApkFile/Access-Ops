import path from "node:path";
import { z } from "zod";
import { providerPolicySchema } from "../providers/selection";
import { selectVision } from '../providers/vision-selection';
const schema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().min(1),
    PORT: z.coerce.number().int().min(1024).max(65535).default(3003),
    UPLOADS_DIR: z.string().default("data/uploads"),
    ACCESSOPS_ALLOWED_ORIGINS: z
      .string()
      .default("http://localhost:3000,http://localhost:3400"),
    ACCESSOPS_AUTH_MODE: z.literal("session").default("session"),
    ACCESSOPS_PERSISTENT_STORAGE: z.enum(["true", "false"]).default("false"),
  })
  .extend(providerPolicySchema.shape);
export function readConfiguration(
  env: Record<string, string | undefined> = process.env,
) {
  const c = schema.parse(env);
  selectVision(env); // Invalid capability/provider settings fail early; absent optional keys do not block deterministic work.
  if (c.NODE_ENV === "production") {
    if (
      c.ACCESSOPS_PERSISTENT_STORAGE !== "true" ||
      !path.isAbsolute(c.UPLOADS_DIR)
    )
      throw new Error(
        "Production requires an absolute persistent-volume UPLOADS_DIR and ACCESSOPS_PERSISTENT_STORAGE=true",
      );
    if (
      !c.ACCESSOPS_ALLOWED_ORIGINS.split(",").every((s) =>
        s.trim().startsWith("https://"),
      )
    )
      throw new Error("Production requires HTTPS allowed origins");
    const u = new URL(c.DATABASE_URL);
    if (
      !["require", "verify-full"].includes(u.searchParams.get("sslmode") ?? "")
    )
      throw new Error(
        "Production DATABASE_URL requires sslmode=require or verify-full",
      );
  }
  return c;
}
export const config = readConfiguration();
