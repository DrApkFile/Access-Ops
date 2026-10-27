"use client";
import { useState, type ReactNode } from "react";
import { AlertCircle, ArrowUpRight, LoaderCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ui } from "@/data/accessops-ui";
import { ApiFailure, type JsonValue } from "@/lib/accessops";
export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="workspace-heading">
      <div>
        <p className="eyebrow">
          {ui.brand} / {ui.product}
        </p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}
export function StatusBadge({ state }: { state: string }) {
  return (
    <span
      className={
        "status-badge state-" + state.toLowerCase().replace(/[^a-z0-9_-]/g, "-")
      }
    >
      <i aria-hidden="true" />
      {state.replaceAll("_", " ")}
    </span>
  );
}
export function ErrorState({
  error,
}: {
  error: Error | string | null | undefined;
}) {
  if (!error) return null;
  return (
    <div className="feedback error-feedback" role="alert">
      <AlertCircle size={17} />
      <div>
        <strong>
          {error instanceof ApiFailure && error.status === 403
            ? ui.permission
            : ui.error}
        </strong>
        <p>{typeof error === "string" ? error : error.message}</p>
        {error instanceof ApiFailure && error.details != null && (
          <JsonRecord value={error.details} label={ui.details} />
        )}
      </div>
    </div>
  );
}
export function EmptyState({
  title = ui.empty,
  description = ui.emptyNote,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Search size={28} strokeWidth={1} />
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function LoadingState() {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="loading-spinner" size={20} />
      {ui.loading}
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function TextField({
  label,
  name,
  defaultValue = "",
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <Field label={label}>
      <Input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
      />
    </Field>
  );
}
export function JsonRecord({
  value,
  label = ui.raw,
}: {
  value: unknown;
  label?: string;
}) {
  return (
    <details className="technical-record">
      <summary>
        {label}
        <ArrowUpRight size={14} />
      </summary>
      <pre>{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}
export function EvidenceValue({
  value,
  unit,
}: {
  value: JsonValue;
  unit?: string;
}) {
  return (
    <>
      {typeof value === "object" ? JSON.stringify(value) : String(value)}
      {unit && unit !== "none" ? " " + unit : ""}
    </>
  );
}
export function useMutation() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<Error | null>(null),
    [result, setResult] = useState<unknown>(null);
  async function run<T>(task: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError(null);
    try {
      const value = await task();
      setResult(value);
      return value;
    } catch (e) {
      setError(e instanceof Error ? e : new Error(ui.error));
      return undefined;
    } finally {
      setBusy(false);
    }
  }
  return { run, busy, error, result };
}
export function formString(data: FormData, name: string) {
  return String(data.get(name) ?? "").trim();
}
export function parseIds(text: string) {
  return [
    ...new Set(
      text
        .split(/[\n,]/)
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ];
}
