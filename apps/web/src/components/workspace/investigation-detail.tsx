"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownToLine, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ui } from "@/data/accessops-ui";
import {
  request,
  useResource,
  timestamp,
  type Investigation,
  type ProviderRun,
  type JsonValue,
} from "@/lib/accessops";
import {
  PageHeading,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  JsonRecord,
  useMutation,
} from "./shared";
import { FindingCard } from "./finding-card";
import { EvidenceCard } from "./evidence-card";
export function InvestigationDetail({ id }: { id: string }) {
  const item = useResource<Investigation>("/v1/investigations/" + id, 3000),
    providers = useResource<{ items: ProviderRun[] }>(
      "/v1/investigations/" + id + "/providers",
      3000,
    ),
    [selected, setSelected] = useState(""),
    [tab, setTab] = useState("findings"),
    mutation = useMutation(),
    router = useRouter(),
    row = item.data,
    result = row?.status === "completed" ? row.result : null;
  function inspect(evidenceId: string) {
    setSelected(evidenceId);
    setTab("evidence");
  }
  const latest = providers.data?.items.find((p) => p.status === "succeeded"),
    metadata = latest?.metadata as
      | {
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
          engine?: JsonValue;
          requestId?: string;
          execution?: string;
        }
      | undefined;
  return (
    <>
      <PageHeading
        title={row?.question ?? ui.investigationTitle}
        description={
          row ? ui.asOf + " / " + timestamp(row.asOf) : ui.investigationIntro
        }
        action={row && <StatusBadge state={row.status} />}
      />
      <ErrorState error={item.error ?? mutation.error} />
      {item.loading ? (
        <LoadingState />
      ) : !row ? (
        <EmptyState />
      ) : row.status !== "completed" ? (
        <section className="panel">
          <StatusBadge state={row.status} />
          <p className="description">{row.error ?? ui.processing}</p>
          <p className="evidence-id">{row.id}</p>
          <Button variant="outline" onClick={item.refresh}>
            {ui.refresh}
          </Button>
        </section>
      ) : (
        result && (
          <>
            <div className="toolbar">
              <a
                className="subtle-link"
                href={
                  "/backend/v1/investigations/" + id + "/report?format=html"
                }
                target="_blank"
                rel="noreferrer"
              >
                <ArrowUpRight size={15} />
                {ui.humanReport}
              </a>
              <a
                className="subtle-link"
                href={"/backend/v1/investigations/" + id + "/report"}
                download={id + ".json"}
              >
                <ArrowDownToLine size={14} />
                {ui.jsonReport}
              </a>
              <Button
                variant="outline"
                disabled={mutation.busy}
                onClick={() =>
                  void mutation.run(async () => {
                    const old = (
                      result as typeof result & {
                        input?: Record<string, unknown>;
                      }
                    ).input;
                    const next = await request<{ id: string }>(
                      "/v1/investigations",
                      "POST",
                      {
                        buildingId: result.buildingId,
                        question: row.question,
                        asOf: new Date().toISOString(),
                        profile: old?.profile ?? { kind: "step-free" },
                        previousId: row.id,
                        useZetaris: false,
                      },
                    );
                    router.push("/investigations/" + next.id);
                  })
                }
              >
                {ui.revalidate}
              </Button>
              {result.demo && <StatusBadge state={ui.demonstration} />}
            </div>
            <div className="metrics-strip">
              <div className="metric-cell">
                <strong>{result.findings.length}</strong>
                <span>{ui.findings}</span>
              </div>
              <div className="metric-cell">
                <strong>{result.evidence.length}</strong>
                <span>{ui.evidence}</span>
              </div>
              <div className="metric-cell">
                <strong>{result.sourceSnapshotIds.length}</strong>
                <span>{ui.sourceSnapshots}</span>
              </div>
              <div className="metric-cell">
                <strong>
                  {
                    result.reachability.filter(
                      (r) => r.outcome === "unreachable",
                    ).length
                  }
                </strong>
                <span>{ui.affected}</span>
              </div>
            </div>
            <div className="tabs" role="tablist" aria-label={ui.details}>
              {["findings", "evidence", "trace"].map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={tab === t}
                  id={"investigation-tab-" + t}
                  aria-controls="investigation-tabpanel"
                  tabIndex={tab === t ? 0 : -1}
                  onKeyDown={(e) => {
                    const tabs = ["findings", "evidence", "trace"];
                    const next =
                      e.key === "ArrowRight"
                        ? tabs[(tabs.indexOf(t) + 1) % 3]
                        : e.key === "ArrowLeft"
                          ? tabs[(tabs.indexOf(t) + 2) % 3]
                          : e.key === "Home"
                            ? tabs[0]
                            : e.key === "End"
                              ? tabs[2]
                              : undefined;
                    if (next) {
                      e.preventDefault();
                      setTab(next);
                      document
                        .getElementById("investigation-tab-" + next)
                        ?.focus();
                    }
                  }}
                  onClick={() => setTab(t)}
                >
                  {ui[t as "findings" | "evidence" | "trace"]}
                </button>
              ))}
            </div>
            <div className="split-layout">
              <section
                className="panel"
                role="tabpanel"
                id="investigation-tabpanel"
                aria-labelledby={"investigation-tab-" + tab}
                tabIndex={0}
              >
                {tab === "findings" ? (
                  result.findings.length ? (
                    result.findings.map((f) => (
                      <FindingCard
                        key={f.id}
                        finding={f}
                        onEvidence={inspect}
                      />
                    ))
                  ) : (
                    <p className="note">{ui.noFindings}</p>
                  )
                ) : tab === "evidence" ? (
                  <>
                    <div className="panel-header">
                      <h2>{ui.evidence}</h2>
                      <Button variant="ghost" onClick={() => setSelected("")}>
                        {ui.showAll}
                      </Button>
                    </div>
                    <div className="evidence-list">
                      {result.evidence
                        .filter((o) => !selected || o.id === selected)
                        .map((o) => (
                          <EvidenceCard key={o.id} evidence={o} />
                        ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="panel-header">
                      <h2>{ui.trace}</h2>
                    </div>
                    <ol className="trace-list">
                      {result.trace.map((t, i) => (
                        <li key={i}>
                          <div>
                            <strong>{t.stage}</strong>
                            <time>{timestamp(t.at)}</time>
                            {t.metadata && <JsonRecord value={t.metadata} />}
                          </div>
                        </li>
                      ))}
                    </ol>
                    {result.engine && (
                      <JsonRecord value={result.engine} label={ui.engine} />
                    )}
                  </>
                )}
              </section>
              <div className="section-stack">
                <section className="panel">
                  <div className="panel-header">
                    <h2>{ui.assessment}</h2>
                  </div>
                  {result.reachability.length ? (
                    <div className="evidence-list">
                      {result.reachability.map((r) => (
                        <div className="evidence-item" key={r.entityId}>
                          <h3>
                            {result.evidence.find(
                              (o) => o.entityId === r.entityId,
                            )?.entityName ?? r.entityId}
                          </h3>
                          <StatusBadge state={r.outcome} />
                          {r.unknownEdges.length > 0 && (
                            <p>{r.unknownEdges.join(", ")}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="note">{ui.noReviewedConnectivity}</p>
                  )}
                  <p className="note">{ui.notCertification}</p>
                </section>
                <section className="panel">
                  <div className="panel-header">
                    <h2>{ui.provider}</h2>
                    <StatusBadge
                      state={latest ? "succeeded" : result.explanation.status}
                    />
                  </div>
                  <p className="description">{ui.providerNote}</p>
                  {latest && metadata?.explanation ? (
                    <>
                      <p className="note">
                        {latest.provider} / {latest.model}
                      </p>
                      <h3>{metadata.explanation.summary}</h3>
                      {metadata.explanation.claims.map((claim, index) => (
                        <div className="finding-item" key={index}>
                          <p>{claim.text}</p>
                          <div className="evidence-links">
                            {claim.evidenceIds.map((e, i) => (
                              <button key={e} onClick={() => inspect(e)}>
                                {ui.evidence} {i + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <p className="evidence-id">{metadata.requestId}</p>
                    </>
                  ) : result.explanation.status === "succeeded" ? (
                    <JsonRecord value={result.explanation} />
                  ) : (
                    <p className="note">{ui.providerUnavailable}</p>
                  )}
                  <Button
                    variant="outline"
                    disabled={
                      mutation.busy ||
                      providers.data?.items.some((p) => p.status === "running")
                    }
                    onClick={() =>
                      void mutation.run(async () => {
                        await request(
                          "/v1/investigations/" + id + "/explanations",
                          "POST",
                          {
                            confirmation: "explain-frozen-evidence",
                          },
                        );
                        providers.refresh();
                      })
                    }
                  >
                    {ui.explain}
                  </Button>
                  <JsonRecord
                    value={providers.data?.items ?? []}
                    label={ui.history}
                  />
                </section>
                <section className="panel">
                  <div className="panel-header">
                    <h2>{ui.assumptions}</h2>
                  </div>
                  <ul className="note">
                    {result.assumptions.map((assumption, i) => (
                      <li key={i}>{assumption}</li>
                    ))}
                  </ul>
                  <p className="evidence-id">{result.evidenceHash}</p>
                  {result.previous && (
                    <JsonRecord value={result.previous} label={ui.history} />
                  )}
                </section>
              </div>
            </div>
          </>
        )
      )}
    </>
  );
}
