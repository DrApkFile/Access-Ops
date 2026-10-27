"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ui } from "@/data/accessops-ui";
import {
  request,
  useResource,
  shortId,
  type Entity,
  type Level,
  type Evidence,
} from "@/lib/accessops";
import { useWorkspace } from "./workspace-context";
import {
  PageHeading,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  Field,
  TextField,
  JsonRecord,
  EvidenceValue,
  useMutation,
  formString,
  parseIds,
} from "./shared";
type Match = {
  id: string;
  externalId: string;
  name: string;
  levelId: string | null;
  identityMatch?: { state: string; candidates: string[]; reason: string };
};
type Reconciled = {
  entityId: string | null;
  attribute: string;
  state: string;
  reason: string;
  evidence: Evidence[];
  selected: Evidence | null;
};
export function EntitiesScreen() {
  const { buildingId } = useWorkspace(),
    entities = useResource<{ items: Entity[] }>(
      buildingId ? "/v1/buildings/" + buildingId + "/entities" : null,
    ),
    levels = useResource<{ items: Level[] }>(
      buildingId ? "/v1/buildings/" + buildingId + "/levels" : null,
    ),
    matches = useResource<{ items: Match[] }>(
      buildingId ? "/v1/buildings/" + buildingId + "/matches" : null,
    ),
    reconciled = useResource<{ items: Reconciled[] }>(
      buildingId ? "/v1/buildings/" + buildingId + "/reconciliation" : null,
    ),
    [match, setMatch] = useState<Match | null>(null),
    [conflict, setConflict] = useState<Reconciled | null>(null),
    mutation = useMutation();
  function refresh() {
    entities.refresh();
    levels.refresh();
    matches.refresh();
    reconciled.refresh();
  }
  return (
    <>
      <PageHeading title={ui.entityTitle} description={ui.entityIntro} />
      <ErrorState
        error={
          entities.error ??
          levels.error ??
          matches.error ??
          reconciled.error ??
          mutation.error
        }
      />
      {!buildingId ? (
        <EmptyState description={ui.noBuilding} />
      ) : (
        <>
          <div className="split-layout">
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.registerEntity}</h2>
              </div>
              <form
                className="form-grid"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  void mutation.run(async () => {
                    const namespace = formString(data, "namespace"),
                      externalId = formString(data, "externalId");
                    await request("/v1/entities", "POST", {
                      buildingId,
                      name: formString(data, "name"),
                      kind: formString(data, "kind"),
                      levelId: formString(data, "level") || null,
                      aliases:
                        namespace && externalId
                          ? [{ namespace, externalId, confirmed: true }]
                          : [],
                    });
                    refresh();
                  });
                }}
              >
                <TextField label={ui.name} name="name" required />
                <Field label={ui.entityType}>
                  <select name="kind">
                    {[
                      "room",
                      "destination",
                      "entrance",
                      "door",
                      "corridor",
                      "stairs",
                      "ramp",
                      "lift",
                      "toilet",
                      "building",
                    ].map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={ui.level}>
                  <select name="level">
                    <option value="">{ui.noLevel}</option>
                    {levels.data?.items.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <TextField label={ui.namespace} name="namespace" />
                <TextField label={ui.externalId} name="externalId" />
                <div className="form-actions">
                  <Button type="submit" disabled={mutation.busy}>
                    {ui.registerEntity}
                  </Button>
                </div>
              </form>
            </section>
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.levels}</h2>
              </div>
              <div className="table-scroll">
                <table className="record-table">
                  <tbody>
                    {levels.data?.items.map((l) => (
                      <tr key={l.id}>
                        <td>{l.name}</td>
                        <td>{l.ordinal}</td>
                        <td className="evidence-id">{shortId(l.id)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <form
                className="form-grid"
                style={{ marginTop: 20 }}
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  void mutation.run(async () => {
                    await request(
                      "/v1/buildings/" + buildingId + "/levels",
                      "POST",
                      {
                        name: formString(data, "name"),
                        ordinal: Number(data.get("ordinal")),
                      },
                    );
                    refresh();
                  });
                }}
              >
                <TextField label={ui.levelName} name="name" required />
                <TextField
                  label={ui.ordinal}
                  name="ordinal"
                  type="number"
                  required
                />
                <Button type="submit" disabled={mutation.busy}>
                  {ui.registerLevel}
                </Button>
              </form>
            </section>
          </div>
          <section className="panel" style={{ marginTop: 24 }}>
            <div className="panel-header">
              <h2>{ui.canonicalEntities}</h2>
              <Button variant="outline" onClick={refresh}>
                {ui.refresh}
              </Button>
            </div>
            {entities.loading ? (
              <LoadingState />
            ) : entities.data?.items.length ? (
              <div className="table-scroll">
                <table className="record-table">
                  <thead>
                    <tr>
                      <th>{ui.name}</th>
                      <th>{ui.entityType}</th>
                      <th>{ui.level}</th>
                      <th>{ui.externalId}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entities.data.items.map((entity) => (
                      <tr key={entity.id}>
                        <td>
                          {entity.name}
                          <small>{entity.id}</small>
                        </td>
                        <td>{entity.kind}</td>
                        <td>
                          {levels.data?.items.find(
                            (l) => l.id === entity.levelId,
                          )?.name ?? "—"}
                        </td>
                        <td>
                          {entity.aliases.map((alias) => (
                            <small key={alias.namespace + alias.externalId}>
                              {alias.namespace}: {alias.externalId}
                            </small>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState description={ui.entityIntro} />
            )}
          </section>
          <section className="panel" style={{ marginTop: 24 }}>
            <div className="panel-header">
              <h2>{ui.verificationTitle}</h2>
            </div>
            <p className="note">{ui.observationVerificationNote}</p>
            <form
              className="form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                void mutation.run(async () => {
                  await request(
                    "/v1/observations/" +
                      encodeURIComponent(formString(data, "observationId")) +
                      "/verify",
                    "POST",
                    {
                      reason: formString(data, "reason"),
                      method: formString(data, "method"),
                    },
                  );
                  refresh();
                });
              }}
            >
              <TextField
                label={ui.observationId}
                name="observationId"
                required
              />
              <TextField label={ui.verificationMethod} name="method" required />
              <TextField label={ui.reason} name="reason" required />
              <Button type="submit" disabled={mutation.busy}>
                {ui.verifyObservation}
              </Button>
            </form>
          </section>
          <div className="split-layout" style={{ marginTop: 24 }}>
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.matches}</h2>
              </div>
              {matches.data?.items.length ? (
                <div className="evidence-list">
                  {matches.data.items.map((row) => (
                    <div key={row.id} className="evidence-item">
                      <h3>{row.name}</h3>
                      <p className="evidence-id">
                        {row.externalId} / {shortId(row.levelId ?? "—")}
                      </p>
                      {row.identityMatch && (
                        <>
                          <StatusBadge state={row.identityMatch.state} />
                          <p>{row.identityMatch.reason}</p>
                        </>
                      )}
                      <Button variant="outline" onClick={() => setMatch(row)}>
                        {ui.review}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="note">{ui.noUnresolved}</p>
              )}
              {match && (
                <form
                  className="form-stack"
                  style={{ marginTop: 20 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    void mutation.run(async () => {
                      await request(
                        "/v1/matches/" + match.id + "/confirm",
                        "POST",
                        {
                          entityId: formString(data, "entity"),
                          reason: formString(data, "reason"),
                        },
                      );
                      setMatch(null);
                      refresh();
                    });
                  }}
                >
                  <p className="note">
                    {match.name} / {match.externalId}
                  </p>
                  <Field label={ui.selectEntity}>
                    <select name="entity" required>
                      <option value="">{ui.selectEntity}</option>
                      {entities.data?.items.map((entity) => (
                        <option key={entity.id} value={entity.id}>
                          {entity.name} /{" "}
                          {levels.data?.items.find(
                            (l) => l.id === entity.levelId,
                          )?.name ?? entity.kind}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <TextField label={ui.reason} name="reason" required />
                  <Button type="submit" disabled={mutation.busy}>
                    {ui.match}
                  </Button>
                </form>
              )}
            </section>
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.conflicts}</h2>
              </div>
              {reconciled.data?.items
                .filter((r) =>
                  ["conflicting", "stale", "unknown"].includes(r.state),
                )
                .map((r) => (
                  <div
                    className="evidence-item"
                    key={(r.entityId ?? "unknown") + r.attribute}
                  >
                    <h3>
                      {entities.data?.items.find((e) => e.id === r.entityId)
                        ?.name ?? ui.unknown}{" "}
                      / {r.attribute}
                    </h3>
                    <StatusBadge state={r.state} />
                    <p>{r.reason}</p>
                    {r.evidence.map((o) => (
                      <p key={o.id}>
                        <EvidenceValue value={o.value} unit={o.unit} /> ·{" "}
                        {o.publisher}
                        <br />
                        <span className="evidence-id">{o.id}</span>
                      </p>
                    ))}
                    {r.state === "conflicting" && (
                      <Button variant="outline" onClick={() => setConflict(r)}>
                        {ui.review}
                      </Button>
                    )}
                    <JsonRecord value={r.evidence} label={ui.evidence} />
                  </div>
                ))}
              {conflict && (
                <form
                  className="form-stack"
                  style={{ marginTop: 20 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    void mutation.run(async () => {
                      await request("/v1/conflicts/resolve", "POST", {
                        entityId: conflict.entityId,
                        attribute: conflict.attribute,
                        selectedEvidenceId: formString(data, "selected"),
                        evidenceIds: parseIds(formString(data, "ids")),
                        reason: formString(data, "reason"),
                      });
                      setConflict(null);
                      refresh();
                    });
                  }}
                >
                  <Field label={ui.selectedEvidence}>
                    <select name="selected" required>
                      {conflict.evidence
                        .filter((o) => o.verification === "verified")
                        .map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.publisher} / {String(o.value)} {o.unit}
                          </option>
                        ))}
                    </select>
                  </Field>
                  <Field label={ui.evidenceIds}>
                    <textarea
                      name="ids"
                      defaultValue={conflict.evidence
                        .map((o) => o.id)
                        .join("\n")}
                      required
                    />
                  </Field>
                  <TextField label={ui.reason} name="reason" required />
                  <Button type="submit" disabled={mutation.busy}>
                    {ui.resolveConflict}
                  </Button>
                </form>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
