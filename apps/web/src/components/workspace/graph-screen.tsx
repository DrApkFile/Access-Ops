"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ui } from "@/data/accessops-ui";
import {
  request,
  useResource,
  type Entity,
  type Level,
  type Graph,
  type Evidence,
} from "@/lib/accessops";
import { useWorkspace } from "./workspace-context";
import { GraphDiagram } from "./graph-diagram";
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
  parseIds,
} from "./shared";
type GraphRow = {
  id: string;
  version: number;
  graph: Graph;
  createdAt: string;
};
export function GraphScreen() {
  const { buildingId, principal } = useWorkspace(),
    current = useResource<GraphRow>(
      buildingId ? "/v1/buildings/" + buildingId + "/graph" : null,
    ),
    entities = useResource<{ items: Entity[] }>(
      buildingId ? "/v1/buildings/" + buildingId + "/entities" : null,
    ),
    levels = useResource<{ items: Level[] }>(
      buildingId ? "/v1/buildings/" + buildingId + "/levels" : null,
    ),
    evidence = useResource<{ items: Evidence[] }>(
      buildingId ? "/v1/observations?limit=200&buildingId=" + buildingId : null,
    ),
    plans = useResource<{
      items: {
        id: string;
        projectId: string;
        modelVersion: number;
        levelId: string;
      }[];
    }>(buildingId ? "/v1/buildings/" + buildingId + "/plans" : null),
    [draft, setDraft] = useState<{
      buildingId: string;
      nodes: Graph["nodes"];
      edges: Graph["edges"];
    }>({ buildingId: "", nodes: [], edges: [] }),
    [advanced, setAdvanced] = useState(""),
    mutation = useMutation();
  const editing =
    draft.buildingId === buildingId
      ? draft
      : { buildingId, nodes: [], edges: [] };
  const preview: Graph = {
    buildingId,
    complete: false,
    reviewed: false,
    evidenceIds: [],
    nodes: editing.nodes,
    edges: editing.edges,
  };
  function body(data: FormData): Graph {
    return {
      buildingId,
      complete: data.get("complete") === "on",
      reviewed: data.get("reviewed") === "on",
      reviewerId: principal!.userId,
      reviewReason: formString(data, "reason"),
      evidenceIds: [...new Set(editing.edges.flatMap((e) => e.evidenceIds))],
      nodes: editing.nodes,
      edges: editing.edges,
    };
  }
  return (
    <>
      <PageHeading title={ui.graphTitle} description={ui.graphIntro} />
      <ErrorState error={mutation.error ?? entities.error} />
      {!buildingId ? (
        <EmptyState description={ui.noBuilding} />
      ) : (
        <div className="section-stack">
          <section className="panel">
            <div className="panel-header">
              <h2>{ui.currentGraph}</h2>
              {current.data && (
                <StatusBadge state={ui.version + " " + current.data.version} />
              )}
            </div>
            {current.data ? (
              <>
                <GraphDiagram
                  graph={current.data.graph}
                  entities={entities.data?.items ?? []}
                />
                <div className="form-actions">
                  <StatusBadge
                    state={current.data.graph.reviewed ? "reviewed" : "unknown"}
                  />
                  <StatusBadge
                    state={
                      current.data.graph.complete ? "complete" : "incomplete"
                    }
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDraft({
                        buildingId,
                        nodes: current.data!.graph.nodes,
                        edges: current.data!.graph.edges,
                      });
                      setAdvanced(JSON.stringify(current.data!.graph, null, 2));
                    }}
                  >
                    {ui.editGraph}
                  </Button>
                </div>
                <JsonRecord value={current.data} />
              </>
            ) : (
              <p className="note">{ui.graphEmpty}</p>
            )}
          </section>
          <div className="split-layout">
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.graphNodes}</h2>
              </div>
              <form
                className="form-grid"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget),
                    entityId = formString(data, "entity"),
                    levelId = formString(data, "level"),
                    id = "n_" + entityId + "_" + levelId;
                  if (editing.nodes.some((n) => n.id === id)) return;
                  setDraft({
                    ...editing,
                    nodes: [
                      ...editing.nodes,
                      {
                        id,
                        entityId,
                        levelId,
                        entry: data.get("entry") === "on",
                        destination: data.get("destination") === "on",
                      },
                    ],
                  });
                }}
              >
                <Field label={ui.selectEntity}>
                  <select name="entity" required>
                    {entities.data?.items.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name} / {entity.kind}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={ui.level}>
                  <select name="level" required>
                    {levels.data?.items.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <label className="check-field">
                  <input name="entry" type="checkbox" />
                  {ui.entryNode}
                </label>
                <label className="check-field">
                  <input name="destination" type="checkbox" />
                  {ui.destination}
                </label>
                <Button type="submit">{ui.addNode}</Button>
              </form>
              <div className="table-scroll">
                <table className="record-table">
                  <tbody>
                    {editing.nodes.map((n) => (
                      <tr key={n.id}>
                        <td>
                          {
                            entities.data?.items.find(
                              (e) => e.id === n.entityId,
                            )?.name
                          }
                          <small>
                            {
                              levels.data?.items.find((l) => l.id === n.levelId)
                                ?.name
                            }
                          </small>
                        </td>
                        <td>
                          {n.entry
                            ? ui.entryNode
                            : n.destination
                              ? ui.destination
                              : "—"}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="text-action"
                            onClick={() =>
                              setDraft({
                                ...editing,
                                nodes: editing.nodes.filter(
                                  (x) => x.id !== n.id,
                                ),
                                edges: editing.edges.filter(
                                  (x) => x.from !== n.id && x.to !== n.id,
                                ),
                              })
                            }
                          >
                            {ui.remove}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.graphEdges}</h2>
              </div>
              <form
                className="form-grid"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  setDraft({
                    ...editing,
                    edges: [
                      ...editing.edges,
                      {
                        id: "e_" + crypto.randomUUID(),
                        from: formString(data, "from"),
                        to: formString(data, "to"),
                        entityId: formString(data, "entity"),
                        kind: formString(data, "kind"),
                        reviewed: data.get("reviewed") === "on",
                        bidirectional: data.get("bidirectional") === "on",
                        stepFree:
                          formString(data, "stepFree") === "unknown"
                            ? null
                            : formString(data, "stepFree") === "true",
                        evidenceIds: parseIds(formString(data, "evidence")),
                        measurementEvidenceIds: [],
                      },
                    ],
                  });
                }}
              >
                {["from", "to"].map((field) => (
                  <Field
                    key={field}
                    label={field === "from" ? ui.fromNode : ui.toNode}
                  >
                    <select name={field} required>
                      {editing.nodes.map((n) => (
                        <option key={n.id} value={n.id}>
                          {
                            entities.data?.items.find(
                              (e) => e.id === n.entityId,
                            )?.name
                          }{" "}
                          /{" "}
                          {
                            levels.data?.items.find((l) => l.id === n.levelId)
                              ?.name
                          }
                        </option>
                      ))}
                    </select>
                  </Field>
                ))}
                <Field label={ui.affectedEntity}>
                  <select name="entity" required>
                    {entities.data?.items.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} / {e.kind}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={ui.connectionKind}>
                  <select name="kind">
                    {["walkway", "door", "lift", "stairs", "ramp"].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={ui.stepFree}>
                  <select name="stepFree">
                    <option value="unknown">{ui.unknown}</option>
                    <option value="true">{ui.confirmedYes}</option>
                    <option value="false">{ui.confirmedNo}</option>
                  </select>
                </Field>
                <label className="check-field">
                  <input type="checkbox" name="bidirectional" defaultChecked />
                  {ui.bidirectional}
                </label>
                <label className="check-field">
                  <input type="checkbox" name="reviewed" />
                  {ui.connectionReviewed}
                </label>
                <Field label={ui.topologyIds}>
                  <textarea name="evidence" required rows={3} />
                </Field>
                <Button type="submit" disabled={!editing.nodes.length}>
                  {ui.addEdge}
                </Button>
              </form>
            </section>
          </div>
          {editing.nodes.length > 0 && (
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.reviewGraph}</h2>
              </div>
              <GraphDiagram
                graph={preview}
                entities={entities.data?.items ?? []}
              />
              <JsonRecord value={editing.edges} label={ui.graphEdges} />
              <form
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  void mutation.run(async () => {
                    await request("/v1/graphs", "POST", body(data));
                    current.refresh();
                  });
                }}
              >
                <TextField label={ui.reason} name="reason" required />
                <label className="check-field">
                  <input type="checkbox" name="complete" />
                  {ui.completeCoverage}
                </label>
                <label className="check-field">
                  <input type="checkbox" name="reviewed" required />
                  {ui.humanGraphReview}
                </label>
                <div className="form-actions">
                  <Button type="submit" disabled={mutation.busy}>
                    {ui.saveGraph}
                  </Button>
                </div>
              </form>
            </section>
          )}
          <section className="panel">
            <div className="panel-header">
              <h2>{ui.topologyEvidence}</h2>
            </div>
            <div className="table-scroll">
              <table className="record-table">
                <thead>
                  <tr>
                    <th>{ui.name}</th>
                    <th>{ui.attribute}</th>
                    <th>{ui.status}</th>
                    <th>{ui.evidence}</th>
                  </tr>
                </thead>
                <tbody>
                  {evidence.data?.items
                    .filter((o) =>
                      [
                        "topology",
                        "lift_served_floors",
                        "door_clear_width",
                        "threshold_height",
                        "ramp_slope",
                      ].includes(o.attribute),
                    )
                    .map((o) => (
                      <tr key={o.id}>
                        <td>{o.entityName}</td>
                        <td>{o.attribute}</td>
                        <td>
                          <StatusBadge state={o.verification} />
                        </td>
                        <td className="evidence-id">{o.id}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>{ui.planLink}</h2>
            </div>
            {plans.data?.items.map((p) => (
              <p key={p.id} className="note">
                <Link href={"/map/" + p.projectId}>{p.projectId}</Link> /{" "}
                {ui.version} {p.modelVersion}
              </p>
            ))}
            <form
              className="form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                void mutation.run(async () => {
                  await request(
                    "/v1/buildings/" + buildingId + "/plans",
                    "POST",
                    {
                      projectId: formString(data, "project"),
                      levelId: formString(data, "level"),
                      modelVersion: Number(data.get("version")),
                      reason: formString(data, "reason"),
                    },
                  );
                  plans.refresh();
                });
              }}
            >
              <TextField label={ui.projectId} name="project" required />
              <Field label={ui.level}>
                <select name="level" required>
                  {levels.data?.items.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </Field>
              <TextField
                label={ui.modelVersion}
                name="version"
                type="number"
                required
              />
              <TextField label={ui.planReason} name="reason" required />
              <Button type="submit" disabled={mutation.busy}>
                {ui.link}
              </Button>
            </form>
          </section>
          <details className="panel">
            <summary className="panel-header">
              <h2>{ui.graphDefinition}</h2>
            </summary>
            <Field label={ui.graphDefinition}>
              <textarea
                rows={14}
                value={advanced}
                onChange={(e) => setAdvanced(e.target.value)}
                spellCheck={false}
              />
            </Field>
            <div className="form-actions">
              <Button
                variant="outline"
                onClick={() =>
                  void mutation.run(() =>
                    request(
                      "/v1/graphs/validate",
                      "POST",
                      JSON.parse(advanced),
                    ),
                  )
                }
              >
                {ui.validate}
              </Button>
              <Button
                onClick={() =>
                  void mutation.run(async () => {
                    await request("/v1/graphs", "POST", {
                      ...JSON.parse(advanced),
                      buildingId,
                      reviewerId: principal!.userId,
                    });
                    current.refresh();
                  })
                }
              >
                {ui.saveGraph}
              </Button>
            </div>
            {mutation.result !== null && <JsonRecord value={mutation.result} />}
          </details>
        </div>
      )}
    </>
  );
}
