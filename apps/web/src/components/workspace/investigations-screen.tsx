"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ui } from "@/data/accessops-ui";
import {
  request,
  useResource,
  timestamp,
  type Investigation,
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
  useMutation,
  formString,
} from "./shared";
export function InvestigationsScreen() {
  const { buildingId } = useWorkspace(),
    history = useResource<{ items: Investigation[] }>(
      buildingId ? "/v1/investigations?buildingId=" + buildingId : null,
      5000,
    ),
    mutation = useMutation(),
    router = useRouter(),
    [asOf] = useState(() => new Date().toISOString());
  return (
    <>
      <PageHeading
        title={ui.investigationTitle}
        description={ui.investigationIntro}
      />
      <ErrorState error={history.error ?? mutation.error} />
      {!buildingId ? (
        <EmptyState description={ui.noBuilding} />
      ) : (
        <div className="section-stack">
          <section className="panel">
            <div className="panel-header">
              <h2>{ui.newInvestigation}</h2>
            </div>
            <form
              className="form-stack"
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                void mutation.run(async () => {
                  const width = formString(data, "width"),
                    slope = formString(data, "slope"),
                    threshold = formString(data, "threshold");
                  const run = await request<{ id: string }>(
                    "/v1/investigations",
                    "POST",
                    {
                      buildingId,
                      question: formString(data, "question"),
                      asOf: formString(data, "asOf"),
                      profile: {
                        kind: formString(data, "profile"),
                        ...(width ? { minimumDoorWidthMm: Number(width) } : {}),
                        ...(slope
                          ? { maximumRampSlopePercent: Number(slope) }
                          : {}),
                        ...(threshold
                          ? { maximumThresholdMm: Number(threshold) }
                          : {}),
                      },
                      ...(formString(data, "previous")
                        ? { previousId: formString(data, "previous") }
                        : {}),
                      useZetaris: data.get("zetaris") === "on",
                    },
                  );
                  router.push("/investigations/" + run.id);
                });
              }}
            >
              <Field label={ui.question}>
                <textarea
                  name="question"
                  defaultValue={ui.defaultQuestion}
                  required
                  rows={3}
                />
              </Field>
              <div className="form-grid">
                <Field label={ui.profile}>
                  <select name="profile">
                    <option value="step-free">{ui.stepFree}</option>
                    <option value="pedestrian">{ui.pedestrian}</option>
                  </select>
                </Field>
                <TextField
                  name="asOf"
                  label={ui.asOf}
                  defaultValue={asOf}
                  required
                />
                <TextField name="width" label={ui.minimumWidth} type="number" />
                <TextField name="slope" label={ui.maximumSlope} type="number" />
                <TextField
                  name="threshold"
                  label={ui.maximumThreshold}
                  type="number"
                />
                <TextField name="previous" label={ui.previous} />
              </div>
              <label className="check-field">
                <input type="checkbox" name="zetaris" />
                {ui.useZetaris}
              </label>
              <p className="note">{ui.notCertification}</p>
              <div className="form-actions">
                <Button type="submit" disabled={mutation.busy}>
                  {mutation.busy ? ui.processing : ui.runInvestigation}
                  <ArrowUpRight size={15} />
                </Button>
              </div>
            </form>
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>{ui.history}</h2>
              <Button variant="outline" onClick={history.refresh}>
                {ui.refresh}
              </Button>
            </div>
            {history.loading ? (
              <LoadingState />
            ) : history.data?.items.length ? (
              <div className="table-scroll">
                <table className="record-table">
                  <thead>
                    <tr>
                      <th>{ui.question}</th>
                      <th>{ui.status}</th>
                      <th>{ui.asOf}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {history.data.items.map((row) => (
                      <tr key={row.id}>
                        <td>
                          {row.question}
                          <small>{row.error ?? row.id}</small>
                        </td>
                        <td>
                          <StatusBadge state={row.status} />
                        </td>
                        <td>{timestamp(row.asOf)}</td>
                        <td>
                          <Link href={"/investigations/" + row.id}>
                            {ui.view}
                            <ArrowUpRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState description={ui.investigationIntro} />
            )}
          </section>
        </div>
      )}
    </>
  );
}
