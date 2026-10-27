import { z } from "zod";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { redact, hash, log } from "../accessops/errors";
import type { MessagePart } from "./llm";
import {
  boundedJson,
  normalizeOrigin,
  type Transport,
} from "../providers/http";
import { discover } from "../providers/explanation";
import { requireProviderConsent } from "../providers/workspace-scope";
import { AppError } from "../accessops/errors";
import { visionConfiguration } from "../providers/vision-configuration";
import { prepareVisionImage, prepareNvidiaImage } from "../lib/vision-image";
import { recordModelExecution } from "../providers/model-executions";
const responseSchema = z.object({
  id: z.string().optional(),
  model: z.string(),
  choices: z
    .array(
      z.object({
        finish_reason: z.string().optional(),
        message: z.object({ content: z.string().min(1) }),
      }),
    )
    .min(1),
});
/** NVIDIA multimodal turns use the documented image_url content contract; existing schemas still validate every result. */
export async function runNvidiaTurn(
  options: {
    agentName: string;
    instruction: string;
    model: string;
    parts: MessagePart[];
  },
  transport: Transport = fetch,
) {
  requireProviderConsent();
  const started = Date.now();
  const key = process.env.NVIDIA_API_KEY;
  if (!key) throw new AppError("NVIDIA_CREDENTIALS_REQUIRED", 503);
  const images = options.parts.filter((p) => "inlineData" in p);
  const config = images.length ? visionConfiguration() : null;
  if (config && options.model !== config.model)
    throw new AppError("NVIDIA_VISION_MODEL_REQUIRED", 503);
  if (config && images.length > config.maxImages)
    throw new AppError("NVIDIA_IMAGE_BUDGET_EXCEEDED", 413);
  let encodedBytes = 0;
  const provenance: ReturnType<typeof prepareVisionImage>[] = [];
  const parts: MessagePart[] = [];
  for (const part of options.parts) {
    if (!("inlineData" in part)) {
      parts.push(part);
      continue;
    }
    encodedBytes += part.inlineData.data.length;
    if (encodedBytes > Math.ceil(config!.maxTotalBytes / 3) * 4 + 64)
      throw new AppError("NVIDIA_IMAGE_BUDGET_EXCEEDED", 413);
    const image = await prepareNvidiaImage(
      part.inlineData.data,
      part.inlineData.mimeType,
      config!,
    );
    provenance.push(image);
    parts.push({ inlineData: { data: image.data, mimeType: image.mimeType } });
  }
  if (
    config &&
    provenance.reduce(
      (size, p) => size + Buffer.byteLength(p.data, "base64"),
      0,
    ) > config.maxTotalBytes
  )
    throw new AppError("NVIDIA_IMAGE_BUDGET_EXCEEDED", 413);
  const baseUrl =
    config?.baseUrl ??
    normalizeOrigin(
      process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
    );
  await discover(
    { provider: "nvidia", baseUrl, key, model: options.model },
    transport,
  );
  const maxTokens = Number(process.env.MODEL_MAX_OUTPUT_TOKENS ?? 8192);
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 16384)
    throw new AppError("MODEL_OUTPUT_BUDGET_INVALID", 422);
  const raw = await boundedJson(
    baseUrl + "/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: options.model,
        messages: [
          { role: "system", content: options.instruction },
          {
            role: "user",
            content: parts.map((p) =>
              "text" in p
                ? { type: "text", text: p.text }
                : {
                    type: "image_url",
                    image_url: {
                      url:
                        "data:" +
                        p.inlineData.mimeType +
                        ";base64," +
                        p.inlineData.data,
                    },
                  },
            ),
          },
        ],
        temperature: 0.1,
        max_tokens: maxTokens,
        stream: false,
        ...(config || options.model.startsWith("nvidia/nemotron-3.5-")
          ? { chat_template_kwargs: { enable_thinking: false } }
          : {}),
      }),
    },
    transport,
    120000,
    0,
  );
  const directory = process.env.ACCESSOPS_PROVIDER_EVIDENCE_DIR;
  if (directory) {
    if (!path.isAbsolute(directory))
      throw new AppError("PRIVATE_EVIDENCE_PATH_REQUIRED", 503);
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const r = raw as {
      id?: unknown;
      model?: unknown;
      choices?: { finish_reason?: unknown; message?: { content?: unknown } }[];
    };
    const visible = {
      provider: "nvidia",
      requestedModel: options.model,
      id: r.id,
      model: r.model,
      choices: r.choices?.map((c) => ({
        finish_reason: c.finish_reason,
        content: c.message?.content,
      })),
      inputSha256: hash(JSON.stringify(options.parts)),
    };
    let safeEvidence = JSON.stringify(redact(visible), null, 2);
    for (const secret of [key, process.env.METERLESS_RUNTIME_TOKEN].map((s) =>
      s?.trim(),
    ))
      if (secret && secret.length >= 8)
        safeEvidence = safeEvidence.replaceAll(secret, "[REDACTED]");
    await writeFile(
      path.join(
        directory,
        "vision-" + Date.now() + "-" + crypto.randomUUID() + ".json",
      ),
      safeEvidence,
      { mode: 0o600, flag: "wx" },
    );
  }
  const result = responseSchema.parse(raw);
  if (result.model !== options.model)
    throw new AppError("PROVIDER_MODEL_IDENTITY_MISMATCH", 502);
  if (result.choices[0]!.finish_reason === "length")
    throw new AppError("NVIDIA_OUTPUT_TRUNCATED", 502);
  if (
    [key, process.env.METERLESS_RUNTIME_TOKEN].some(
      (secret) =>
        secret && secret.length >= 8 && JSON.stringify(result).includes(secret),
    )
  )
    throw new AppError("PROVIDER_SECRET_ECHO_REJECTED", 502);
  const content = result.choices[0]!.message.content;
  if (!content.trim()) throw new AppError("NVIDIA_EMPTY_OUTPUT", 502);
  const metadata = {
    provider: "nvidia" as const,
    requestedModel: options.model,
    model: result.model,
    requestId: result.id ?? null,
    capability: images.length ? ("vision" as const) : ("text" as const),
    execution: transport === fetch ? ("live" as const) : ("mocked" as const),
    durationMs: Date.now() - started,
    inputImages: provenance.map(({ data, mimeType, ...source }) => source),
    responseTextSha256: hash(content),
    geometryReviewed: false as const,
  };
  recordModelExecution(metadata);
  log("model.execution", metadata);
  return content;
}
