"use client";
import { useEffect, useState } from "react";
import { API_URL, apiFetch } from "./api";
export type JsonValue =
  | null
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue };
export type Building = {
  id: string;
  name: string;
  category?: "building" | "reference_area";
  aliases: string[];
};
export type Principal = {
  userId: string;
  workspaceId: string;
  role: "viewer" | "operator" | "reviewer" | "source_admin" | "admin";
};
export type Entity = {
  id: string;
  buildingId: string;
  levelId: string | null;
  kind: string;
  name: string;
  aliases: { namespace: string; externalId: string; confirmed: boolean }[];
};
export type Level = { id: string; name: string; ordinal: number };
export type Source = {
  id: string;
  name: string;
  namespace: string;
  kind: string;
  publisher: string;
  uri: string;
  license: string;
  freshnessSeconds: number;
  trust: number;
  demo: boolean;
  lastSuccessAt: string | null;
  lastError: string | null;
  refreshState: string;
};
export type Evidence = {
  id: string;
  entityId: string | null;
  entityName: string;
  attribute: string;
  value: JsonValue;
  unit: string;
  sourceId: string;
  snapshotId: string;
  externalId: string;
  observedAt: string;
  retrievedAt: string;
  lastVerifiedAt?: string;
  verification: string;
  publisher: string;
  uri: string;
  license: string;
  locator: string;
  contentHash: string;
  demo?: boolean;
  reviewerId?: string;
  reviewReason?: string;
  freshnessSeconds: number;
  identityMatch?: { state: string; candidates: string[]; reason: string };
};
export type Finding = {
  id: string;
  title: string;
  entityId: string | null;
  severity: string;
  rationale: string;
  classification: string;
  evidenceIds: string[];
  recommendation: string;
  uncertainties: string[];
  status: string;
};
export type Reachability = {
  entityId: string;
  outcome: "reachable" | "unreachable" | "unknown";
  path: string[];
  evidenceIds: string[];
  unknownEdges: string[];
};
export type InvestigationResult = {
  question: string;
  buildingId: string;
  asOf: string;
  evidence: Evidence[];
  evidenceHash: string;
  findings: Finding[];
  reachability: Reachability[];
  trace: { stage: string; at: string; metadata?: JsonValue }[];
  sourceSnapshotIds: string[];
  assumptions: string[];
  demo: boolean;
  engine?: JsonValue;
  explanation: {
    status: string;
    provider?: string;
    model?: string;
    explanation?: {
      summary: string;
      claims: {
        findingId: string;
        text: string;
        evidenceIds: string[];
        classification: string;
      }[];
      recommendations: string[];
    };
    reason?: string;
  };
  previous?: JsonValue;
  federation?: JsonValue;
};
export type Investigation = {
  id: string;
  buildingId: string;
  question: string;
  status: string;
  asOf: string;
  createdAt: string;
  error: string | null;
  result: InvestigationResult | null;
};
export type Action = {
  id: string;
  findingId: string;
  ownerId: string | null;
  priority: string;
  status: string;
  proposal: string;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
  resolution: JsonValue;
};
export type ProviderRun = {
  id: string;
  provider: string;
  model: string | null;
  status: string;
  createdAt: string;
  metadata: JsonValue;
};
export type Graph = {
  buildingId: string;
  complete: boolean;
  reviewed: boolean;
  reviewerId?: string;
  reviewReason?: string;
  evidenceIds: string[];
  nodes: {
    id: string;
    entityId: string;
    levelId: string;
    entry: boolean;
    destination: boolean;
  }[];
  edges: {
    id: string;
    from: string;
    to: string;
    kind: string;
    entityId: string;
    reviewed: boolean;
    bidirectional: boolean;
    stepFree: boolean | null;
    evidenceIds: string[];
    measurementEvidenceIds: string[];
  }[];
};
export class ApiFailure extends Error {
  constructor(
    public status: number,
    public code: string,
    public details?: unknown,
  ) {
    super(code);
  }
}
export async function request<T = unknown>(
  path: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await apiFetch(API_URL + path, {
    method,
    headers: {
      ...(body instanceof FormData
        ? {}
        : { "content-type": "application/json" }),
      ...(!["GET", "HEAD"].includes(method)
        ? { "idempotency-key": crypto.randomUUID() }
        : {}),
    },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
    signal,
  });
  const value = await response
    .json()
    .catch(() => ({ code: "INVALID_RESPONSE" }));
  if (!response.ok)
    throw new ApiFailure(
      response.status,
      value.code ?? value.error ?? "REQUEST_FAILED",
      value.issues,
    );
  return value as T;
}
export function useResource<T>(path: string | null, poll = 0) {
  const [state, setState] = useState<{
      key: string | null;
      data?: T;
      error?: Error;
    }>({ key: null }),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    async function load() {
      try {
        const data = await request<T>(
          path!,
          "GET",
          undefined,
          controller.signal,
        );
        if (!controller.signal.aborted) setState({ key: path, data });
      } catch (error) {
        if (!controller.signal.aborted)
          setState({
            key: path,
            error: error instanceof Error ? error : new Error("REQUEST_FAILED"),
          });
      }
    }
    void load();
    const timer = poll ? setInterval(() => void load(), poll) : undefined;
    return () => {
      controller.abort();
      if (timer) clearInterval(timer);
    };
  }, [path, poll, revision]);
  const current = state.key === path ? state : undefined;
  return {
    data: current?.data,
    error: current?.error,
    loading: !!path && !current?.data && !current?.error,
    refresh: () => setRevision((v) => v + 1),
  };
}
export function timestamp(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}
export function shortId(value: string) {
  return value.length > 16 ? value.slice(0, 8) + "…" + value.slice(-4) : value;
}
