import { z } from "zod";
import { normalizeOrigin } from "./http";
import { currentProviderWorkspace } from "./workspace-scope";
export type ProviderName = "meterless" | "nvidia";
export type ExplanationMode = "auto" | ProviderName | "none";
export type ProviderConfig = {
  provider: ProviderName;
  baseUrl: string;
  key: string;
  model: string;
};
export const providerPolicySchema = z.object({
  ACCESSOPS_EXPLANATION_PROVIDER: z
    .enum(["auto", "meterless", "nvidia", "none"])
    .default("auto"),
  ACCESSOPS_NVIDIA_FALLBACK: z.enum(["true", "false"]).default("false"),
  ACCESSOPS_NVIDIA_TEXT_WORKSPACES: z.string().default(""),
});
type Environment = Record<string, string | undefined>;
/** Safe diagnostics contain field names and fixed codes only. Never return credentials or URLs. */
export function inspectProvider(
  provider: ProviderName,
  env: Environment = process.env,
): { config: ProviderConfig | null; status: string; missing: string[] } {
  const runtime = provider === "meterless",
    keyName = runtime ? "METERLESS_RUNTIME_TOKEN" : "NVIDIA_API_KEY",
    modelName = runtime ? "METERLESS_MODEL" : "NVIDIA_MODEL",
    urlName = runtime ? "METERLESS_BASE_URL" : "NVIDIA_BASE_URL";
  const key = env[keyName]?.trim(),
    url = env[urlName]?.trim(),
    model = env[modelName]?.trim() || (runtime ? "meterless/auto" : "");
  const missing = [
    ...(!key ? [keyName] : []),
    ...(runtime && !url ? [urlName] : []),
    ...(!model ? [modelName] : []),
  ];
  if (missing.length)
    return { config: null, status: "MISSING_PROVIDER_CONFIGURATION", missing };
  if (runtime && key === "rt-local")
    return {
      config: null,
      status: "REAL_RUNTIME_TOKEN_REQUIRED",
      missing: [keyName],
    };
  if (
    (runtime && !/^meterless\/[a-z0-9._/-]+$/i.test(model)) ||
    model.length > 200 ||
    /\s/.test(model)
  )
    return { config: null, status: "INVALID_PROVIDER_MODEL", missing: [] };
  if (
    key!.length >= 8 &&
    [url ?? "", model].some((value) => value.includes(key!))
  )
    return {
      config: null,
      status: "PROVIDER_SECRET_IN_CONFIGURATION",
      missing: [],
    };
  try {
    return {
      config: {
        provider,
        key: key!,
        baseUrl: normalizeOrigin(
          url || (runtime ? "" : "https://integrate.api.nvidia.com/v1"),
        ),
        model,
      },
      status: "configured_not_verified",
      missing: [],
    };
  } catch {
    return { config: null, status: "INVALID_PROVIDER_ENDPOINT", missing: [] };
  }
}
export function configuredProvider(
  provider: ProviderName,
): ProviderConfig | null {
  return inspectProvider(provider).config;
}
const contains = (list: string | undefined, id: string) =>
  !!id &&
  (list ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(id);
export function explanationPolicy(
  workspaceId = currentProviderWorkspace(),
  env: Environment = process.env,
) {
  const parsed = providerPolicySchema.safeParse(env),
    workspaceConsented = contains(
      env.ACCESSOPS_PROVIDER_WORKSPACES,
      workspaceId ?? "",
    );
  return {
    valid: parsed.success,
    workspaceConsented,
    nvidiaTextAllowed:
      workspaceConsented &&
      contains(env.ACCESSOPS_NVIDIA_TEXT_WORKSPACES, workspaceId ?? ""),
    fallbackEnabled:
      parsed.success && parsed.data.ACCESSOPS_NVIDIA_FALLBACK === "true",
    mode: parsed.success
      ? parsed.data.ACCESSOPS_EXPLANATION_PROVIDER
      : ("none" as ExplanationMode),
    localOnly: (env.METERLESS_MODEL ?? "").trim() === "meterless/local",
  };
}
/** Validation/integrity failures are deliberately NOT fallback eligible. Each provider gets at most one completion. */
export function fallbackEligible(code: string) {
  return [
    "MISSING_PROVIDER_CONFIGURATION",
    "REAL_RUNTIME_TOKEN_REQUIRED",
    "INVALID_PROVIDER_ENDPOINT",
    "INVALID_PROVIDER_MODEL",
    "PROVIDER_UNAUTHORIZED",
    "PROVIDER_OFFLINE_OR_TIMEOUT",
    "PROVIDER_RATE_LIMITED",
    "PROVIDER_HTTP_502",
    "PROVIDER_HTTP_503",
    "PROVIDER_HTTP_504",
    "CONFIGURED_MODEL_NOT_AVAILABLE",
    "NOT_METERLESS_RUNTIME",
  ].includes(code);
}
