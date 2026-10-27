"use client";
import { useState } from "react";
import { Plus, ArrowDownToLine, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ui } from "@/data/accessops-ui";
import { request, useResource, timestamp, type Source } from "@/lib/accessops";
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
  useMutation,
  formString,
} from "./shared";
type Preview = {
  accepted: {
    externalId: string;
    entityName: string;
    attribute: string;
    verification: string;
  }[];
  errors: unknown[];
  duplicates: number;
  previewHash: string;
  total: number;
};
type Run = {
  id: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  summary: Record<string, unknown>;
};
type Snapshot = {
  id: string;
  hash: string;
  retrievedAt: string;
  recordCount: number;
  rawFormat: string | null;
};
export function SourcesScreen() {
  const { buildingId } = useWorkspace(),
    sources = useResource<{ items: Source[] }>(
      buildingId ? "/v1/sources?buildingId=" + buildingId : null,
    ),
    [chosen, setChosen] = useState(""),
    [register, setRegister] = useState(false),
    [kind, setKind] = useState("json"),
    [format, setFormat] = useState("json"),
    [content, setContent] = useState(""),
    [mapping, setMapping] = useState("{}"),
    [partial, setPartial] = useState(false),
    [preview, setPreview] = useState<{
      sourceId: string;
      content: string;
      mapping: string;
      data: Preview;
    } | null>(null),
    mutation = useMutation(),
    [detail, setDetail] = useState<unknown>(null);
  const selected =
      sources.data?.items.find((s) => s.id === chosen) ??
      sources.data?.items[0],
    runs = useResource<{ items: Run[] }>(
      selected ? "/v1/sources/" + selected.id + "/runs" : null,
    ),
    snapshots = useResource<{ items: Snapshot[] }>(
      selected ? "/v1/sources/" + selected.id + "/snapshots" : null,
    ),
    confirmed =
      preview?.sourceId === selected?.id &&
      preview?.content === content &&
      preview?.mapping === mapping;
  async function refresh() {
    sources.refresh();
    runs.refresh();
    snapshots.refresh();
  }
  return (
    <>
      <PageHeading
        title={ui.sourceTitle}
        description={ui.sourceIntro}
        action={
          <Button variant="outline" onClick={() => setRegister((v) => !v)}>
            <Plus size={15} />
            {ui.registerSource}
          </Button>
        }
      />
      <ErrorState error={sources.error ?? mutation.error} />
      {!buildingId ? (
        <EmptyState description={ui.noBuilding} />
      ) : (
        <>
          {register && (
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.registerSource}</h2>
              </div>
              <form
                className="form-grid"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  void mutation.run(async () => {
                    const result = await request<{ id: string }>(
                      "/v1/sources",
                      "POST",
                      {
                        buildingId,
                        name: formString(data, "name"),
                        kind,
                        namespace: formString(data, "namespace"),
                        publisher: formString(data, "publisher"),
                        uri: formString(data, "uri"),
                        license: formString(data, "license"),
                        trust: Number(data.get("trust")),
                        freshnessSeconds: Number(data.get("freshness")),
                        demo: data.get("demo") === "on",
                        config:
                          kind === "mbta"
                            ? {
                                stationId: formString(data, "stationId"),
                                mode: formString(data, "mode"),
                              }
                            : {},
                      },
                    );
                    setChosen(result.id);
                    setRegister(false);
                    sources.refresh();
                  });
                }}
              >
                <TextField label={ui.sourceName} name="name" required />
                <Field label={ui.kind}>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value)}
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="mbta">MBTA V3</option>
                    <option value="zetaris">Zetaris</option>
                  </select>
                </Field>
                <TextField label={ui.namespace} name="namespace" required />
                <TextField label={ui.publisher} name="publisher" required />
                <TextField label={ui.uri} name="uri" required />
                <TextField label={ui.license} name="license" required />
                <TextField
                  label={ui.freshness}
                  name="freshness"
                  type="number"
                  defaultValue={86400}
                  required
                />
                <TextField
                  label={ui.trust}
                  name="trust"
                  type="number"
                  defaultValue={50}
                  required
                />
                {kind === "mbta" && (
                  <>
                    <TextField label={ui.stationId} name="stationId" required />
                    <Field label={ui.sourceMode}>
                      <select name="mode">
                        <option value="facilities">{ui.facilities}</option>
                        <option value="alerts">{ui.operationalAlerts}</option>
                      </select>
                    </Field>
                  </>
                )}
                <label className="check-field full-width">
                  <input type="checkbox" name="demo" />
                  {ui.demo}
                </label>
                <div className="form-actions full-width">
                  <Button type="submit" disabled={mutation.busy}>
                    {ui.registerSource}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRegister(false)}
                  >
                    {ui.cancel}
                  </Button>
                </div>
              </form>
            </section>
          )}
          {sources.loading ? (
            <LoadingState />
          ) : !sources.data?.items.length ? (
            <EmptyState description={ui.sourceIntro} />
          ) : (
            <div className="split-layout">
              <div className="section-stack">
                <section className="panel">
                  <div className="panel-header">
                    <h2>{ui.sources}</h2>
                    <Database size={17} />
                  </div>
                  <div className="table-scroll">
                    <table className="record-table">
                      <thead>
                        <tr>
                          <th>{ui.source}</th>
                          <th>{ui.sourceState}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sources.data.items.map((source) => (
                          <tr key={source.id}>
                            <td>
                              <button
                                type="button"
                                className="link-button row-select"
                                onClick={() => {
                                  setChosen(source.id);
                                  setDetail(null);
                                }}
                              >
                                {source.name}
                              </button>
                              <small>
                                {source.kind} / {source.namespace}
                              </small>
                              {source.demo && (
                                <StatusBadge state={ui.demonstration} />
                              )}
                            </td>
                            <td>
                              <StatusBadge state={source.refreshState} />
                              <small>{timestamp(source.lastSuccessAt)}</small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                {selected && (
                  <section className="panel">
                    <div className="panel-header">
                      <h2>{selected.name}</h2>
                      <StatusBadge state={selected.refreshState} />
                    </div>
                    <dl className="metadata-list">
                      <dt>{ui.publisher}</dt>
                      <dd>{selected.publisher}</dd>
                      <dt>{ui.uri}</dt>
                      <dd>{selected.uri}</dd>
                      <dt>{ui.license}</dt>
                      <dd>{selected.license}</dd>
                      <dt>{ui.freshness}</dt>
                      <dd>{selected.freshnessSeconds}</dd>
                      <dt>{ui.status}</dt>
                      <dd>{selected.lastError ?? selected.refreshState}</dd>
                    </dl>
                    <div className="form-actions">
                      <Button
                        variant="outline"
                        disabled={mutation.busy}
                        onClick={() =>
                          void mutation.run(async () =>
                            setDetail(
                              await request(
                                "/v1/sources/" + selected.id + "/test",
                                "POST",
                                {},
                              ),
                            ),
                          )
                        }
                      >
                        {ui.testConnection}
                      </Button>
                      {selected.kind === "mbta" && (
                        <Button
                          disabled={mutation.busy}
                          onClick={() =>
                            void mutation.run(async () => {
                              setDetail(
                                await request(
                                  "/v1/sources/" + selected.id + "/refresh",
                                  "POST",
                                  {},
                                ),
                              );
                              await refresh();
                            })
                          }
                        >
                          {ui.refreshSource}
                        </Button>
                      )}
                    </div>
                    <JsonRecord value={selected} />
                  </section>
                )}
                <section className="panel">
                  <div className="panel-header">
                    <h2>{ui.snapshots}</h2>
                    <Button variant="ghost" onClick={snapshots.refresh}>
                      {ui.refresh}
                    </Button>
                  </div>
                  <ErrorState error={snapshots.error} />
                  {snapshots.data?.items.length ? (
                    <div className="evidence-list">
                      {snapshots.data.items.map((snapshot) => (
                        <div className="evidence-item" key={snapshot.id}>
                          <p className="evidence-id">{snapshot.id}</p>
                          <p>
                            {timestamp(snapshot.retrievedAt)} ·{" "}
                            {snapshot.recordCount} {ui.records}
                          </p>
                          <p className="evidence-id">{snapshot.hash}</p>
                          <button
                            type="button"
                            className="text-action"
                            onClick={() =>
                              void mutation.run(async () =>
                                setDetail(
                                  await request(
                                    "/v1/sources/" +
                                      selected!.id +
                                      "/snapshots/" +
                                      snapshot.id,
                                  ),
                                ),
                              )
                            }
                          >
                            {ui.view}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="note">{ui.empty}</p>
                  )}
                </section>
              </div>
              <div className="section-stack">
                <section className="panel">
                  <div className="panel-header">
                    <h2>{ui.import}</h2>
                    <StatusBadge state={selected?.kind ?? "json"} />
                  </div>
                  <div className="form-stack">
                    <Field label={ui.format}>
                      <select
                        value={format}
                        onChange={(e) => setFormat(e.target.value)}
                      >
                        <option value="json">JSON</option>
                        <option value="csv">CSV</option>
                      </select>
                    </Field>
                    <Field label={ui.chooseFile} hint={ui.importLimit}>
                      <input
                        type="file"
                        accept=".csv,.json"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file)
                            void mutation.run(async () => {
                              if (file.size > 2 * 1024 * 1024)
                                throw new Error("IMPORT_TOO_LARGE");
                              setFormat(
                                file.name.toLowerCase().endsWith(".csv")
                                  ? "csv"
                                  : "json",
                              );
                              setContent(await file.text());
                            });
                        }}
                      />
                    </Field>
                    <Field label={ui.content}>
                      <textarea
                        spellCheck={false}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={9}
                      />
                    </Field>
                    <details>
                      <summary className="note">{ui.mapping}</summary>
                      <Field label={ui.mapping}>
                        <textarea
                          value={mapping}
                          onChange={(e) => setMapping(e.target.value)}
                          spellCheck={false}
                        />
                      </Field>
                    </details>
                    <label className="check-field">
                      <input
                        type="checkbox"
                        checked={partial}
                        onChange={(e) => setPartial(e.target.checked)}
                      />
                      {ui.partial}
                    </label>
                    <div className="form-actions">
                      <Button
                        variant="outline"
                        disabled={mutation.busy || !content || !selected}
                        onClick={() =>
                          void mutation.run(async () => {
                            const result = await request<Preview>(
                              "/v1/sources/" + selected!.id + "/preview",
                              "POST",
                              { format, content, mapping: JSON.parse(mapping) },
                            );
                            setPreview({
                              sourceId: selected!.id,
                              content,
                              mapping,
                              data: result,
                            });
                          })
                        }
                      >
                        {ui.preview}
                      </Button>
                      <Button
                        disabled={
                          mutation.busy ||
                          !confirmed ||
                          (!partial && !!preview?.data.errors.length)
                        }
                        onClick={() =>
                          void mutation.run(async () => {
                            setDetail(
                              await request(
                                "/v1/sources/" + selected!.id + "/import",
                                "POST",
                                {
                                  format,
                                  content,
                                  mapping: JSON.parse(mapping),
                                  previewHash: preview!.data.previewHash,
                                  allowPartial: partial,
                                },
                              ),
                            );
                            setPreview(null);
                            await refresh();
                          })
                        }
                      >
                        {ui.commit}
                      </Button>
                    </div>
                  </div>
                  {confirmed && preview && (
                    <div style={{ marginTop: 22 }}>
                      <div className="metrics-strip compact">
                        <div className="metric-cell">
                          <strong>{preview.data.accepted.length}</strong>
                          <span>{ui.accepted}</span>
                        </div>
                        <div className="metric-cell">
                          <strong>{preview.data.errors.length}</strong>
                          <span>{ui.rejected}</span>
                        </div>
                      </div>
                      <div className="table-scroll">
                        <table className="record-table">
                          <thead>
                            <tr>
                              <th>{ui.externalId}</th>
                              <th>{ui.attribute}</th>
                              <th>{ui.status}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {preview.data.accepted.slice(0, 8).map((row) => (
                              <tr key={row.externalId + row.attribute}>
                                <td>{row.externalId}</td>
                                <td>{row.attribute}</td>
                                <td>{row.verification}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {preview.data.errors.length > 0 && (
                        <JsonRecord
                          value={preview.data.errors}
                          label={ui.rejected}
                        />
                      )}
                    </div>
                  )}
                </section>
                <section className="panel">
                  <div className="panel-header">
                    <h2>{ui.runs}</h2>
                    <Button variant="ghost" onClick={runs.refresh}>
                      {ui.refresh}
                    </Button>
                  </div>
                  <ErrorState error={runs.error} />
                  {runs.data?.items.map((run) => (
                    <div className="evidence-item" key={run.id}>
                      <StatusBadge state={run.status} />
                      <p>{timestamp(run.createdAt)}</p>
                      <JsonRecord value={run.summary} />
                      <a
                        className="subtle-link"
                        href={
                          "/backend/v1/sources/" +
                          selected!.id +
                          "/runs/" +
                          run.id +
                          "/rejected.csv"
                        }
                      >
                        <ArrowDownToLine size={13} />
                        {ui.rejected}
                      </a>
                    </div>
                  ))}
                </section>
                {detail !== null && (
                  <section className="panel">
                    <div className="panel-header">
                      <h2>{ui.details}</h2>
                    </div>
                    <JsonRecord value={detail} />
                  </section>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
