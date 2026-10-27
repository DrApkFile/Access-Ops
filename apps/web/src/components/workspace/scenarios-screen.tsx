"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ui } from "@/data/accessops-ui";
import {
  request,
  useResource,
  type Entity,
  type Graph,
  type Reachability,
  type Evidence,
} from "@/lib/accessops";
import { useWorkspace } from "./workspace-context";
import {
  PageHeading,
  EmptyState,
  ErrorState,
  StatusBadge,
  Field,
  TextField,
  JsonRecord,
  useMutation,
  formString,
} from "./shared";
import { EvidenceCard } from "./evidence-card";
type ScenarioRow = {
  id: string;
  definition: unknown;
  evidence: Evidence[];
  result: {
    baseline: Reachability[];
    result: Reachability[];
    affected: Reachability[];
    changedEdges: string[];
    assumptions: string[];
    classification: string;
  };
};
export function ScenariosScreen({ initialId = "" }: { initialId?: string }) {
  const { buildingId } = useWorkspace(),
    entities = useResource<{ items: Entity[] }>(
      buildingId ? "/v1/buildings/" + buildingId + "/entities" : null,
    ),
    graph = useResource<{ graph: Graph }>(
      buildingId ? "/v1/buildings/" + buildingId + "/graph" : null,
    ),
    mutation = useMutation(),
    [result, setResult] = useState<ScenarioRow | null>(null),
    [kind, setKind] = useState("close"),
    [savedId, setSavedId] = useState(initialId);
  const active = result?.id ? result : null;
  return (
    <>
      <PageHeading title={ui.scenarioTitle} description={ui.scenarioIntro} />
      <ErrorState error={mutation.error ?? entities.error} />
      {!buildingId ? (
        <EmptyState description={ui.noBuilding} />
      ) : (
        <div className="section-stack">
          <div className="split-layout">
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.scenario}</h2>
                <StatusBadge state={ui.simulated} />
              </div>
              <form
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  void mutation.run(async () => {
                    const width = formString(data, "width");
                    const created = await request<{ id: string }>(
                      "/v1/scenarios",
                      "POST",
                      {
                        buildingId,
                        asOf: new Date().toISOString(),
                        profile: {
                          kind: formString(data, "profile"),
                          ...(width
                            ? { minimumDoorWidthMm: Number(width) }
                            : {}),
                        },
                        scenario: {
                          reason: formString(data, "reason"),
                          changes: [
                            kind === "relocate"
                              ? {
                                  kind,
                                  destinationId: formString(data, "entity"),
                                  toNodeId: formString(data, "node"),
                                }
                              : { kind, entityId: formString(data, "entity") },
                          ],
                        },
                      },
                    );
                    setSavedId(created.id);
                    setResult(
                      await request<ScenarioRow>("/v1/scenarios/" + created.id),
                    );
                  });
                }}
              >
                <Field label={ui.scenarioKind}>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    <option value="close">{ui.close}</option>
                    <option value="reopen">{ui.reopen}</option>
                    <option value="relocate">{ui.relocate}</option>
                  </select>
                </Field>
                <Field label={ui.affectedEntity}>
                  <select name="entity" required>
                    {entities.data?.items
                      .filter(
                        (e) =>
                          kind !== "relocate" ||
                          ["destination", "room"].includes(e.kind),
                      )
                      .map((entity) => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name} / {entity.kind}
                        </option>
                      ))}
                  </select>
                </Field>
                {kind === "relocate" && (
                  <Field label={ui.targetNode}>
                    <select name="node" required>
                      {graph.data?.graph.nodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {entities.data?.items.find((e) => e.id === n.entityId)
                            ?.name ?? n.id}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <div className="form-grid">
                  <Field label={ui.profile}>
                    <select name="profile">
                      <option value="step-free">{ui.stepFree}</option>
                      <option value="pedestrian">{ui.pedestrian}</option>
                    </select>
                  </Field>
                  <TextField
                    name="width"
                    label={ui.minimumWidth}
                    type="number"
                  />
                </div>
                <TextField label={ui.reason} name="reason" required />
                <div className="form-actions">
                  <Button type="submit" disabled={mutation.busy || !graph.data}>
                    {ui.simulate}
                  </Button>
                </div>
                {!graph.data && (
                  <p className="note">{ui.noReviewedConnectivity}</p>
                )}
              </form>
            </section>
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.history}</h2>
              </div>
              <form
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  void mutation.run(async () =>
                    setResult(
                      await request<ScenarioRow>("/v1/scenarios/" + savedId),
                    ),
                  );
                }}
              >
                <Field label={ui.scenarioId}>
                  <input
                    data-slot="input"
                    value={savedId}
                    onChange={(e) => setSavedId(e.target.value)}
                    required
                  />
                </Field>
                <Button
                  variant="outline"
                  type="submit"
                  disabled={mutation.busy}
                >
                  {ui.retrieve}
                </Button>
              </form>
              <p className="note">{ui.scenarioIntro}</p>
            </section>
          </div>
          {active && (
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.scenarioComparison}</h2>
                <StatusBadge state={ui.simulated} />
              </div>
              <div className="metrics-strip compact">
                <div className="metric-cell">
                  <strong>{active.result.affected.length}</strong>
                  <span>{ui.affected}</span>
                </div>
                <div className="metric-cell">
                  <strong>{active.result.changedEdges.length}</strong>
                  <span>{ui.changedEdges}</span>
                </div>
              </div>
              <div className="table-scroll">
                <table className="record-table">
                  <thead>
                    <tr>
                      <th>{ui.destination}</th>
                      <th>{ui.baseline}</th>
                      <th>{ui.scenario}</th>
                      <th>{ui.uncertainty}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.result.result.map((row) => (
                      <tr key={row.entityId}>
                        <td>
                          {entities.data?.items.find(
                            (e) => e.id === row.entityId,
                          )?.name ?? row.entityId}
                        </td>
                        <td>
                          <StatusBadge
                            state={
                              active.result.baseline.find(
                                (b) => b.entityId === row.entityId,
                              )?.outcome ?? "unknown"
                            }
                          />
                        </td>
                        <td>
                          <StatusBadge state={row.outcome} />
                        </td>
                        <td>{row.unknownEdges.join(", ") || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="evidence-id">{active.id}</p>
              <p className="note">{active.result.assumptions.join(" · ")}</p>
              <JsonRecord value={active.definition} label={ui.scenario} />
              <details className="technical-record">
                <summary>{ui.evidence}</summary>
                <div className="evidence-list">
                  {active.evidence.map((o) => (
                    <EvidenceCard key={o.id} evidence={o} />
                  ))}
                </div>
              </details>
            </section>
          )}
        </div>
      )}
    </>
  );
}
