import { recordSchema, type SourceRecord, stableJson } from "@accessops/domain";
import { hash, AppError } from "./errors";
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024,
  MAX_IMPORT_ROWS = 5000;
export function csvRows(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false,
    afterQuote = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') {
        field += '"';
        i++;
      } else if (!quoted && field.length === 0 && !afterQuote) quoted = true;
      else if (quoted) {
        quoted = false;
        afterQuote = true;
      } else throw new AppError("INVALID_CSV_QUOTE", 422);
    } else if (!quoted && (ch === "," || ch === "\n" || ch === "\r")) {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      afterQuote = false;
      if (ch !== ",") {
        if (row.some((x) => x !== "")) rows.push(row);
        row = [];
      }
    } else {
      if (afterQuote && !/\s/.test(ch))
        throw new AppError("INVALID_CSV_TRAILING_DATA", 422);
      if (!afterQuote) field += ch;
    }
    if (rows.length > MAX_IMPORT_ROWS + 1)
      throw new AppError("TOO_MANY_ROWS", 413);
  }
  if (quoted) throw new AppError("UNTERMINATED_CSV", 422);
  row.push(field);
  if (row.some((x) => x !== "")) rows.push(row);
  const header = rows.shift()?.map((x) => x.trim().replace(/^\uFEFF/, ""));
  if (
    !header?.length ||
    header.some((x) => !x) ||
    new Set(header).size !== header.length
  )
    throw new AppError("INVALID_CSV_HEADER", 422);
  return rows.map((r, i) => {
    if (r.length !== header.length)
      throw new AppError(
        "CSV_COLUMN_COUNT",
        422,
        "Column count differs at row " + (i + 2),
      );
    return Object.fromEntries(header.map((h, n) => [h, r[n]!]));
  });
}
export function previewImport(
  format: "csv" | "json",
  content: string,
  mapping: Record<string, string> = {},
) {
  if (Buffer.byteLength(content) > MAX_IMPORT_BYTES)
    throw new AppError("IMPORT_TOO_LARGE", 413);
  let raw: unknown;
  try {
    raw = format === "csv" ? csvRows(content) : JSON.parse(content);
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError("INVALID_IMPORT", 422);
  }
  if (!Array.isArray(raw) || raw.length > MAX_IMPORT_ROWS)
    throw new AppError("IMPORT_REQUIRES_BOUNDED_RECORD_ARRAY", 422);
  const accepted: SourceRecord[] = [],
    errors: { row: number; issues: { field: string; message: string }[] }[] =
      [],
    seen = new Set<string>();
  let duplicates = 0;
  raw.forEach((value, index) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      errors.push({
        row: index + 1,
        issues: [{ field: "", message: "Expected a record object" }],
      });
      return;
    }
    let record: Record<string, unknown> = Object.fromEntries(
      Object.entries(value).map(([k, v]) => [mapping[k] ?? k, v]),
    );
    if (format === "csv") {
      record = Object.fromEntries(
        Object.entries(record).filter(([, v]) => v !== ""),
      );
      if (typeof record.value === "string") {
        const s = record.value;
        if (["true", "false"].includes(s)) record.value = s === "true";
        else if (
          ["door_clear_width", "ramp_slope", "threshold_height"].includes(
            String(record.attribute),
          ) &&
          /^\d+(\.\d+)?$/.test(s)
        )
          record.value = Number(s);
        else if (record.attribute === "lift_served_floors") {
          try {
            record.value = JSON.parse(s);
          } catch {
            /* schema reports bad array */
          }
        }
      }
    }
    const parsed = recordSchema.safeParse(record);
    if (!parsed.success) {
      errors.push({
        row: index + 1,
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }
    const key = hash(stableJson(parsed.data));
    if (seen.has(key)) {
      duplicates++;
      return;
    }
    seen.add(key);
    accepted.push(parsed.data);
  });
  return {
    accepted,
    errors,
    summary: {
      fetched: raw.length,
      accepted: accepted.length,
      rejected: errors.length,
      duplicates,
    },
    previewHash: hash(stableJson(accepted)),
  };
}
export function safeCsvCell(value: unknown): string {
  const s = String(value ?? "");
  return (
    '"' + (/^[\s]*[=+@-]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"'
  );
}

/** Bind an original external JSON receipt to the reviewed normalized import. */
export function previewPayload(input: {
  format: "csv" | "json";
  content: string;
  mapping: Record<string, string>;
  rawSource?: { content: string; sha256: string };
}) {
  const preview = previewImport(input.format, input.content, input.mapping);
  if (!input.rawSource) return preview;
  if (Buffer.byteLength(input.rawSource.content) > MAX_IMPORT_BYTES)
    throw new AppError("SOURCE_RECEIPT_TOO_LARGE", 413);
  try {
    JSON.parse(input.rawSource.content);
  } catch {
    throw new AppError("INVALID_SOURCE_RECEIPT_JSON", 422);
  }
  if (hash(input.rawSource.content) !== input.rawSource.sha256)
    throw new AppError("SOURCE_RECEIPT_HASH_MISMATCH", 422);
  return {
    ...preview,
    previewHash: hash(preview.previewHash + ":" + input.rawSource.sha256),
    sourceReceiptHash: input.rawSource.sha256,
  };
}
