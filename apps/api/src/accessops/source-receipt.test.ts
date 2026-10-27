import { test, expect } from "bun:test";
import { previewPayload } from "./imports";
import { hash } from "./errors";
test("UNIT: original source receipt is hash-checked and bound to reviewed import", () => {
  const original = JSON.stringify({
      rows: [{ source_id: "real-response-shaped-unit-fixture" }],
    }),
    body = { format: "json" as const, content: "[]", mapping: {} };
  const first = previewPayload({
      ...body,
      rawSource: { content: original, sha256: hash(original) },
    }),
    ordinary = previewPayload(body);
  expect(first.previewHash).not.toBe(ordinary.previewHash);
  expect(() =>
    previewPayload({
      ...body,
      rawSource: { content: original, sha256: "0".repeat(64) },
    }),
  ).toThrow("SOURCE_RECEIPT_HASH_MISMATCH");
  expect(() =>
    previewPayload({
      ...body,
      rawSource: { content: "invalid", sha256: hash("invalid") },
    }),
  ).toThrow("INVALID_SOURCE_RECEIPT_JSON");
});
