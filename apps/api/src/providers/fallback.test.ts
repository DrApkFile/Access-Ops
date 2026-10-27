import { afterEach, beforeEach, expect, test, spyOn } from "bun:test";
import { explain, type Packet, inspectProvider } from "./explanation";
import { withProviderWorkspace } from "./workspace-scope";
import { providerPolicySchema } from "./selection";
import type { Transport } from "./http";
const workspace = "fallback-unit-workspace",
  runtimeModel = "meterless/auto",
  nvidiaModel = "nvidia/unit-nemotron";
const keys = [
  "ACCESSOPS_PROVIDER_WORKSPACES",
  "ACCESSOPS_NVIDIA_TEXT_WORKSPACES",
  "ACCESSOPS_NVIDIA_FALLBACK",
  "ACCESSOPS_EXPLANATION_PROVIDER",
  "ACCESSOPS_PROVIDER_EVIDENCE_DIR",
  "METERLESS_BASE_URL",
  "METERLESS_RUNTIME_TOKEN",
  "METERLESS_MODEL",
  "NVIDIA_API_KEY",
  "NVIDIA_MODEL",
  "NVIDIA_BASE_URL",
] as const;
const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
const finding = {
  id: "finding-unit",
  title: "Recorded outage",
  rationale: "The supplied record reports a lift outage.",
  classification: "reported" as const,
  evidenceIds: ["evidence-unit"],
  recommendation: "Verify the reported outage.",
};
const packet = {
  question: "What is reported?",
  asOf: "2026-10-27T00:00:00Z",
  findings: [finding],
  evidence: [{ id: "evidence-unit" }],
} as Packet;
const answer = {
  summary: finding.title,
  claims: [
    {
      findingId: finding.id,
      text: finding.rationale,
      evidenceIds: finding.evidenceIds,
      classification: finding.classification,
    },
  ],
  recommendations: [finding.recommendation],
};
const logs: string[] = [];
let logger: ReturnType<typeof spyOn>;
beforeEach(() => {
  for (const k of keys) delete process.env[k];
  Object.assign(process.env, {
    ACCESSOPS_PROVIDER_WORKSPACES: workspace,
    ACCESSOPS_NVIDIA_TEXT_WORKSPACES: workspace,
    ACCESSOPS_NVIDIA_FALLBACK: "true",
    ACCESSOPS_EXPLANATION_PROVIDER: "auto",
    NVIDIA_API_KEY: "unit-nvidia-secret-never-live",
    NVIDIA_BASE_URL: "https://nvidia.unit.invalid/v1",
    NVIDIA_MODEL: nvidiaModel,
  });
  logs.length = 0;
  logger = spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    logs.push(args.map(String).join(" "));
  });
});
afterEach(() => {
  logger.mockRestore();
  for (const k of keys) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});
function runtime() {
  Object.assign(process.env, {
    METERLESS_BASE_URL: "https://runtime.unit.invalid/v1",
    METERLESS_RUNTIME_TOKEN: "unit-runtime-secret-never-live",
    METERLESS_MODEL: runtimeModel,
  });
}
function fake(
  options: {
    runtimeStatus?: number;
    nvidiaStatus?: number;
    stage?: "models" | "chat";
    runtimeAnswer?: unknown;
    secretFailure?: boolean;
  } = {},
) {
  const calls: { provider: string; stage: string; headers: Headers }[] = [];
  const transport: Transport = async (input, init) => {
    const url = String(input),
      provider = url.includes("runtime.unit") ? "meterless" : "nvidia",
      stage = url.endsWith("/models") ? "models" : "chat";
    calls.push({ provider, stage, headers: new Headers(init?.headers) });
    if (options.secretFailure)
      throw new Error(
        "Sensitive transport error: " +
          process.env.NVIDIA_API_KEY +
          " " +
          process.env.METERLESS_RUNTIME_TOKEN,
      );
    const status =
      provider === "meterless" ? options.runtimeStatus : options.nvidiaStatus;
    if (status && (options.stage ?? "models") === stage)
      return new Response(
        "private error includes " + process.env.METERLESS_RUNTIME_TOKEN,
        { status },
      );
    const model =
      provider === "meterless"
        ? (process.env.METERLESS_MODEL ?? runtimeModel)
        : nvidiaModel;
    if (stage === "models") return Response.json({ data: [{ id: model }] });
    return Response.json({
      id: "unit-request-only",
      model,
      choices: [
        {
          finish_reason: "stop",
          message: {
            content: JSON.stringify(
              provider === "meterless" && options.runtimeAnswer
                ? options.runtimeAnswer
                : answer,
            ),
          },
        },
      ],
    });
  };
  return { calls, transport };
}
const run = (
  transport: Transport,
  mode: "auto" | "nvidia" | "meterless" | "none" = "auto",
) => withProviderWorkspace(workspace, () => explain(packet, mode, transport));
test("MOCKED_INTEGRATION: missing Runtime token skips impossible calls and records NVIDIA fallback", async () => {
  process.env.METERLESS_BASE_URL = "https://runtime.unit.invalid";
  const f = fake(),
    r = await run(f.transport);
  expect(r.status).toBe("succeeded");
  expect(r.actualProvider).toBe("nvidia");
  expect(r.fallbackReason).toBe("MISSING_PROVIDER_CONFIGURATION");
  expect(r.attempts[0]?.missing).toEqual(["METERLESS_RUNTIME_TOKEN"]);
  expect(f.calls.filter((c) => c.provider === "meterless")).toHaveLength(0);
  expect("execution" in r && r.execution).toBe("mocked");
});
test("MOCKED_INTEGRATION: missing non-secret endpoint is diagnosed independently of a present token", async () => {
  process.env.METERLESS_RUNTIME_TOKEN = "unit-runtime-secret-never-live";
  const f = fake(),
    r = await run(f.transport);
  expect(r.attempts[0]?.missing).toEqual(["METERLESS_BASE_URL"]);
  expect(r.actualProvider).toBe("nvidia");
  expect(f.calls.some((c) => c.provider === "meterless")).toBe(false);
});
test("MOCKED_INTEGRATION: deliberately configured Runtime is preferred and actual execution is recorded", async () => {
  runtime();
  const f = fake(),
    r = await run(f.transport);
  expect(r.actualProvider).toBe("meterless");
  expect(r.fallbackReason).toBeNull();
  expect(f.calls).toHaveLength(2);
  expect(f.calls.every((c) => c.provider === "meterless")).toBe(true);
  expect(f.calls[0]!.headers.get("Authorization")).toBe(
    "Bearer unit-runtime-secret-never-live",
  );
  expect(f.calls[0]!.headers.get("meterless-app")).toBe("accessops");
  expect(f.calls[1]!.headers.get("meterless-scope")).toBe("user");
  expect(logs.join("\n")).toContain('"actualProvider":"meterless"');
});
for (const status of [429, 502, 503, 504])
  test(
    "MOCKED_INTEGRATION: Runtime transient " +
      status +
      " gets one completion then bounded NVIDIA fallback",
    async () => {
      runtime();
      const f = fake({ runtimeStatus: status, stage: "chat" }),
        r = await run(f.transport);
      expect(r.actualProvider).toBe("nvidia");
      expect(
        f.calls.filter((c) => c.provider === "meterless" && c.stage === "chat"),
      ).toHaveLength(1);
      expect(
        f.calls.filter((c) => c.provider === "nvidia" && c.stage === "chat"),
      ).toHaveLength(1);
      expect(f.calls).toHaveLength(4);
      expect(r.attempts[0]?.httpStatus).toBe(status);
      expect(logs.join("\n")).toContain('"actualProvider":"nvidia"');
    },
  );
for (const status of [401, 403])
  test(
    "MOCKED_INTEGRATION: Runtime " +
      status +
      " stays unauthorized without retries and fallback is explicit",
    async () => {
      runtime();
      const f = fake({ runtimeStatus: status }),
        r = await run(f.transport);
      expect(r.actualProvider).toBe("nvidia");
      expect(r.attempts[0]?.status).toBe("PROVIDER_UNAUTHORIZED");
      expect(f.calls.filter((c) => c.provider === "meterless")).toHaveLength(1);
    },
  );
test("MOCKED_INTEGRATION: both providers fail without fabricated success or leaking transport secrets", async () => {
  runtime();
  const f = fake({ secretFailure: true }),
    r = await run(f.transport);
  expect(r.status).toBe("unavailable");
  expect(r.actualProvider).toBeNull();
  expect("code" in r && r.code).toBe("AI_EXPLANATION_UNAVAILABLE");
  expect(r.attempts).toHaveLength(2);
  expect(f.calls).toHaveLength(2);
  expect("explanation" in r).toBe(false);
  for (const key of [
    process.env.NVIDIA_API_KEY!,
    process.env.METERLESS_RUNTIME_TOKEN!,
  ])
    expect(JSON.stringify(r) + logs.join("\n")).not.toContain(key);
});
test("MOCKED_INTEGRATION: an offline Runtime completion falls back once", async () => {
  runtime();
  const f = fake();
  const transport: Transport = (url, init) =>
    String(url).includes("runtime.unit") && String(url).endsWith("/completions")
      ? Promise.reject(new Error("offline"))
      : f.transport(url, init);
  const r = await run(transport);
  expect(r.actualProvider).toBe("nvidia");
  expect(r.fallbackReason).toBe("PROVIDER_OFFLINE_OR_TIMEOUT");
});
test("UNIT: fallback disabled by operator policy never sends data to NVIDIA", async () => {
  runtime();
  process.env.ACCESSOPS_NVIDIA_FALLBACK = "false";
  const f = fake({ runtimeStatus: 401 }),
    r = await run(f.transport);
  expect(r.actualProvider).toBeNull();
  expect(r.attempts.at(-1)?.status).toBe("NVIDIA_FALLBACK_DISABLED_BY_POLICY");
  expect(f.calls.some((c) => c.provider === "nvidia")).toBe(false);
});
test("UNIT: workspace consent for Runtime alone does not authorize external NVIDIA text", async () => {
  delete process.env.ACCESSOPS_NVIDIA_TEXT_WORKSPACES;
  const f = fake(),
    r = await run(f.transport);
  expect(r.actualProvider).toBeNull();
  expect(f.calls).toHaveLength(0);
  expect(r.attempts.at(-1)?.status).toBe(
    "NVIDIA_TEXT_NOT_ALLOWED_FOR_WORKSPACE",
  );
});
test("UNIT: local-only Runtime disposition cannot escape to a cloud fallback", async () => {
  process.env.METERLESS_MODEL = "meterless/local";
  const f = fake(),
    r = await run(f.transport);
  expect(f.calls).toHaveLength(0);
  expect(r.attempts.at(-1)?.status).toBe("LOCAL_ONLY_ROUTING_POLICY");
});
test("UNIT: pinned Runtime mode does not silently switch providers", async () => {
  const f = fake(),
    r = await run(f.transport, "meterless");
  expect(r.status).toBe("unavailable");
  expect(r.actualProvider).toBeNull();
  expect(f.calls).toHaveLength(0);
});
test("MOCKED_INTEGRATION: explicitly pinned allowed NVIDIA works even when automatic fallback is off", async () => {
  process.env.ACCESSOPS_NVIDIA_FALLBACK = "false";
  const f = fake(),
    r = await run(f.transport, "nvidia");
  expect(r.actualProvider).toBe("nvidia");
  expect(r.requestedMode).toBe("nvidia");
  expect(r.fallbackReason).toBeNull();
});
test("UNIT: malformed Runtime URL cannot throw past selection and prevent a permitted fallback", async () => {
  runtime();
  process.env.METERLESS_BASE_URL = "https://user:private@example.test/private";
  const f = fake(),
    r = await run(f.transport);
  expect(r.actualProvider).toBe("nvidia");
  expect(r.attempts[0]?.status).toBe("INVALID_PROVIDER_ENDPOINT");
  expect(JSON.stringify(r)).not.toContain("private@example");
  expect(f.calls.some((c) => c.provider === "meterless")).toBe(false);
});
test("MOCKED_INTEGRATION: Runtime integrity errors do not trigger provider switching", async () => {
  runtime();
  const f = fake({
      runtimeAnswer: {
        ...answer,
        claims: [{ ...answer.claims[0], evidenceIds: ["fabricated"] }],
      },
    }),
    r = await run(f.transport);
  expect(r.status).toBe("unavailable");
  expect(r.attempts[0]?.status).toBe("INVALID_EVIDENCE_CITATION");
  expect(f.calls.some((c) => c.provider === "nvidia")).toBe(false);
});
test("MOCKED_INTEGRATION: secret echo is rejected and no secret appears in diagnostics", async () => {
  runtime();
  const f = fake({
      runtimeAnswer: {
        ...answer,
        unknownSecret: process.env.METERLESS_RUNTIME_TOKEN,
      },
    }),
    r = await run(f.transport);
  expect(r.status).toBe("unavailable");
  expect(r.attempts[0]?.status).toBe("PROVIDER_SECRET_ECHO_REJECTED");
  expect(JSON.stringify(r) + logs.join("\n")).not.toContain(
    process.env.METERLESS_RUNTIME_TOKEN!,
  );
});
test("UNIT: no-AI workflow does not require either provider and does not change evidence", async () => {
  delete process.env.NVIDIA_API_KEY;
  delete process.env.NVIDIA_MODEL;
  delete process.env.ACCESSOPS_PROVIDER_WORKSPACES;
  const before = JSON.stringify(packet),
    f = fake(),
    r = await run(f.transport, "none");
  expect(r.status).toBe("unavailable");
  expect("code" in r && r.code).toBe("AI_EXPLANATION_DISABLED");
  expect(f.calls).toHaveLength(0);
  expect(JSON.stringify(packet)).toBe(before);
});
test("UNIT: startup policy validates opt-in values while absent Runtime is optional", () => {
  expect(providerPolicySchema.parse({}).ACCESSOPS_EXPLANATION_PROVIDER).toBe(
    "auto",
  );
  expect(
    providerPolicySchema.safeParse({ ACCESSOPS_NVIDIA_FALLBACK: "yes" })
      .success,
  ).toBe(false);
  expect(inspectProvider("meterless", {}).missing).toEqual([
    "METERLESS_RUNTIME_TOKEN",
    "METERLESS_BASE_URL",
  ]);
});

test("UNIT: invalid provider policy is diagnosed and never invokes an endpoint", async () => {
  process.env.ACCESSOPS_NVIDIA_FALLBACK = "invalid";
  const f = fake(),
    r = await run(f.transport);
  expect("code" in r && r.code).toBe("PROVIDER_POLICY_INVALID");
  expect(f.calls).toHaveLength(0);
});
