import { readFile, stat } from "node:fs/promises";
import { parseEnv } from "node:util";
import path from "node:path";
import { AppError } from "../accessops/errors";
const permitted = [
  "ZETARIS_BASE_URL",
  "ZETARIS_ORG_ID",
  "ZETARIS_API_KEY",
  "ZETARIS_USERNAME",
  "ZETARIS_PASSWORD",
  "ZETARIS_CREDENTIALS_FILE",
  "METERLESS_BASE_URL",
  "METERLESS_RUNTIME_TOKEN",
  "METERLESS_MODEL",
  "NVIDIA_API_KEY",
  "NVIDIA_BASE_URL",
  "NVIDIA_MODEL",
  "NVIDIA_VISION_MODEL",
] as const;
/** Explicit read-only configuration reference. Never copy database/client settings or log values. */
export async function loadIntegrationEnvironment(
  env: Record<string, string | undefined> = process.env,
) {
  const file = env.ACCESSOPS_INTEGRATION_ENV_FILE;
  if (!file) return { referenced: false };
  if (!path.isAbsolute(file))
    throw new AppError("INTEGRATION_CONFIG_ABSOLUTE_PATH_REQUIRED", 503);
  const info = await stat(file);
  if (info.size > 65536)
    throw new AppError("INTEGRATION_CONFIG_TOO_LARGE", 503);
  const values = parseEnv(await readFile(file, "utf8"));
  for (const name of permitted)
    if (!env[name] && values[name]) env[name] = values[name];
  if (env.ZETARIS_CREDENTIALS_FILE) {
    const credentialFile = env.ZETARIS_CREDENTIALS_FILE;
    if (
      !path.isAbsolute(credentialFile) ||
      (await stat(credentialFile)).size > 65536
    )
      throw new AppError("ZETARIS_CREDENTIAL_FILE_INVALID", 503);
    const credentials = parseEnv(await readFile(credentialFile, "utf8"));
    env.ZETARIS_USERNAME ??=
      credentials.ZETARIS_USERNAME ?? credentials.ZETARIS_ADMIN_EMAIL;
    env.ZETARIS_PASSWORD ??=
      credentials.ZETARIS_PASSWORD ?? credentials.ZETARIS_ADMIN_PASSWORD;
  }
  return { referenced: true };
}
