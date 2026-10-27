"use client";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ui } from "@/data/accessops-ui";
import {
  request,
  useResource,
  timestamp,
  type Source,
  type Entity,
  type Investigation,
  type Action,
} from "@/lib/accessops";
import { useWorkspace } from "./workspace-context";
import {
  PageHeading,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  TextField,
  useMutation,
  formString,
} from "./shared";
export function DashboardScreen() {
  const { buildingId, buildings, reload } = useWorkspace(),
    mutation = useMutation();
  const sources = useResource<{ items: Source[] }>(
      buildingId ? "/v1/sources?buildingId=" + buildingId : null,
    ),
    entities = useResource<{ items: Entity[] }>(
      buildingId ? "/v1/buildings/" + buildingId + "/entities" : null,
    ),
    history = useResource<{ items: Investigation[] }>(
      buildingId ? "/v1/investigations?buildingId=" + buildingId : null,
    ),
    actions = useResource<{ items: Action[] }>(
      buildingId ? "/v1/actions?buildingId=" + buildingId : null,
    );
  return (
    <>
      <PageHeading
        title={ui.dashboard}
        description={ui.overviewNote}
        action={
          <Link href="/investigations" className="subtle-link">
            {ui.newInvestigation}
            <ArrowUpRight size={15} />
          </Link>
        }
      />
      <ErrorState
        error={
          sources.error ??
          history.error ??
          entities.error ??
          actions.error ??
          mutation.error
        }
      />
      <details className="panel" open={!buildings.length}>
        <summary className="panel-header">
          <h2>{ui.newBuilding}</h2>
          <Plus size={17} />
        </summary>
        <form
          className="form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            void mutation.run(async () => {
              await request("/v1/buildings", "POST", {
                name: formString(data, "name"),
              });
              await reload();
            });
          }}
        >
          <TextField label={ui.buildingName} name="name" required />
          <div className="form-actions">
            <Button type="submit" disabled={mutation.busy}>
              {ui.create}
              <Plus size={14} />
            </Button>
          </div>
        </form>
      </details>
      {!buildingId ? (
        <EmptyState />
      ) : sources.loading ||
        history.loading ||
        entities.loading ||
        actions.loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="metrics-strip">
            {[
              { label: ui.sourceCount, value: sources.data?.items.length },
              { label: ui.entityCount, value: entities.data?.items.length },
              {
                label: ui.investigationCount,
                value: history.data?.items.length,
              },
              {
                label: ui.actionCount,
                value: actions.data?.items.filter(
                  (a) => !["resolved", "rejected"].includes(a.status),
                ).length,
              },
            ].map((m) => (
              <div className="metric-cell" key={m.label}>
                <strong>{m.value ?? "—"}</strong>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
          <section className="panel">
            <div className="panel-header">
              <h2>{ui.latest}</h2>
              <Link href="/investigations" className="subtle-link">
                {ui.view}
                <ArrowUpRight size={14} />
              </Link>
            </div>
            {!history.data?.items.length ? (
              <EmptyState
                title={ui.empty}
                description={ui.investigationIntro}
              />
            ) : (
              <div className="table-scroll">
                <table className="record-table">
                  <thead>
                    <tr>
                      <th>{ui.question}</th>
                      <th>{ui.status}</th>
                      <th>{ui.date}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {history.data.items.slice(0, 8).map((row) => (
                      <tr key={row.id}>
                        <td>{row.question}</td>
                        <td>
                          <StatusBadge state={row.status} />
                        </td>
                        <td>{timestamp(row.createdAt)}</td>
                        <td>
                          <Link href={"/investigations/" + row.id}>
                            {ui.view}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <div className="split-layout" style={{ marginTop: 24 }}>
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.sources}</h2>
                <Link href="/sources">
                  <ArrowUpRight size={16} />
                  <span className="sr-only">{ui.sources}</span>
                </Link>
              </div>
              {sources.data?.items.length ? (
                <div className="evidence-list">
                  {sources.data.items.slice(0, 4).map((s) => (
                    <div key={s.id} className="evidence-item">
                      <h3>{s.name}</h3>
                      <StatusBadge state={s.refreshState} />
                      <p>{s.publisher}</p>
                      {s.demo && <StatusBadge state={ui.demonstration} />}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title={ui.empty} description={ui.sourceIntro} />
              )}
            </section>
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.original}</h2>
              </div>
              <p className="description">{ui.plansIntro}</p>
              <Link className="intelligence-cta" href="/projects">
                {ui.plansTitle}
                <ArrowUpRight size={15} />
              </Link>
            </section>
          </div>
        </>
      )}
    </>
  );
}
