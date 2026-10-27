"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ui } from "@/data/accessops-ui";
import {
  request,
  useResource,
  timestamp,
  type Action,
  type Evidence,
  type Finding,
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
  EvidenceValue,
  useMutation,
  formString,
  parseIds,
} from "./shared";
const transitions: Record<string, { state: string; label: string }[]> = {
  proposed: [
    { state: "approved", label: ui.approve },
    { state: "rejected", label: ui.reject },
  ],
  approved: [
    { state: "in_progress", label: ui.start },
    { state: "rejected", label: ui.reject },
  ],
  in_progress: [
    { state: "resolved", label: ui.resolve },
    { state: "rejected", label: ui.reject },
  ],
  resolved: [],
  rejected: [],
};
export function ActionsScreen({ findingId = "" }: { findingId?: string }) {
  const { buildingId } = useWorkspace(),
    actions = useResource<{ items: Action[] }>(
      buildingId ? "/v1/actions?buildingId=" + buildingId : null,
    ),
    users = useResource<{
      items: { id: string; email: string; role: string }[];
    }>("/v1/users"),
    evidence = useResource<{ items: Evidence[] }>(
      buildingId ? "/v1/observations?limit=200&buildingId=" + buildingId : null,
    ),
    [selected, setSelected] = useState(""),
    [showNew, setShowNew] = useState(!!findingId),
    mutation = useMutation(),
    current = actions.data?.items.find((a) => a.id === selected),
    finding = useResource<{ investigationId: string; finding: Finding }>(
      current ? "/v1/findings/" + current.findingId : null,
    );
  return (
    <>
      <PageHeading
        title={ui.actionsTitle}
        description={ui.actionsIntro}
        action={
          <Button variant="outline" onClick={() => setShowNew((v) => !v)}>
            {ui.newAction}
          </Button>
        }
      />
      <ErrorState error={actions.error ?? mutation.error} />
      {!buildingId ? (
        <EmptyState description={ui.noBuilding} />
      ) : (
        <div className="section-stack">
          {showNew && (
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.propose}</h2>
              </div>
              <form
                key={findingId}
                className="form-grid"
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = new FormData(e.currentTarget);
                  void mutation.run(async () => {
                    const due = formString(data, "due");
                    const created = await request<{ id: string }>(
                      "/v1/actions",
                      "POST",
                      {
                        findingId: formString(data, "finding"),
                        ownerId: formString(data, "owner") || null,
                        priority: formString(data, "priority"),
                        proposal: formString(data, "proposal"),
                        ...(due ? { dueAt: new Date(due).toISOString() } : {}),
                      },
                    );
                    setSelected(created.id);
                    setShowNew(false);
                    actions.refresh();
                  });
                }}
              >
                <TextField
                  label={ui.findingId}
                  name="finding"
                  defaultValue={findingId}
                  required
                />
                <Field label={ui.owner}>
                  <select name="owner">
                    <option value="">{ui.unassigned}</option>
                    {users.data?.items.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email} / {user.role}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={ui.priority}>
                  <select name="priority">
                    <option value="medium">{ui.medium}</option>
                    <option value="high">{ui.high}</option>
                    <option value="low">{ui.low}</option>
                  </select>
                </Field>
                <TextField label={ui.due} name="due" type="datetime-local" />
                <Field label={ui.proposal}>
                  <textarea name="proposal" required rows={3} />
                </Field>
                <div className="form-actions">
                  <Button type="submit" disabled={mutation.busy}>
                    {ui.propose}
                  </Button>
                </div>
              </form>
            </section>
          )}
          <div className="split-layout">
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.actions}</h2>
                <Button variant="ghost" onClick={actions.refresh}>
                  {ui.refresh}
                </Button>
              </div>
              {actions.data?.items.length ? (
                <div className="evidence-list">
                  {actions.data.items.map((action) => (
                    <article className="evidence-item" key={action.id}>
                      <h3>{action.proposal}</h3>
                      <div className="form-actions">
                        <StatusBadge state={action.status} />
                        <StatusBadge state={action.priority} />
                      </div>
                      <p>
                        {ui.owner}:{" "}
                        {users.data?.items.find((u) => u.id === action.ownerId)
                          ?.email ?? ui.unassigned}
                        <br />
                        {ui.due}: {timestamp(action.dueAt)}
                      </p>
                      <button
                        type="button"
                        className="text-action"
                        onClick={() => setSelected(action.id)}
                      >
                        {ui.review}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={ui.noActions}
                  description={ui.actionsIntro}
                />
              )}
            </section>
            <div className="section-stack">
              {current ? (
                <section className="panel">
                  <div className="panel-header">
                    <h2>{ui.review}</h2>
                    <StatusBadge state={current.status} />
                  </div>
                  <p className="description">{current.proposal}</p>
                  <p className="evidence-id">{current.id}</p>
                  {finding.data && (
                    <>
                      <h3>{finding.data.finding.title}</h3>
                      <p className="note">{finding.data.finding.rationale}</p>
                      <Link
                        className="subtle-link"
                        href={"/investigations/" + finding.data.investigationId}
                      >
                        {ui.inspect}
                      </Link>
                    </>
                  )}
                  <form
                    className="form-stack"
                    style={{ marginTop: 25 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const data = new FormData(e.currentTarget),
                        submitter = (e.nativeEvent as SubmitEvent)
                          .submitter as HTMLButtonElement | null;
                      void mutation.run(async () => {
                        await request("/v1/actions/" + current.id, "PATCH", {
                          status: submitter?.value,
                          reason: formString(data, "reason"),
                          evidenceIds: parseIds(formString(data, "evidence")),
                        });
                        actions.refresh();
                      });
                    }}
                  >
                    <TextField
                      label={ui.resolutionReason}
                      name="reason"
                      required
                    />
                    <Field label={ui.evidenceIds}>
                      <textarea name="evidence" rows={3} />
                    </Field>
                    <div className="form-actions">
                      {transitions[current.status]?.map((next) => (
                        <Button
                          key={next.state}
                          variant={
                            next.state === "rejected" ? "outline" : "default"
                          }
                          type="submit"
                          name="status"
                          value={next.state}
                          disabled={mutation.busy}
                        >
                          {next.label}
                        </Button>
                      ))}
                    </div>
                  </form>
                  {current.resolution && (
                    <JsonRecord
                      value={current.resolution}
                      label={ui.resolution}
                    />
                  )}
                  <p className="note">{ui.approvalNote}</p>
                </section>
              ) : (
                <EmptyState
                  title={ui.selectAction}
                  description={ui.actionsIntro}
                />
              )}
              <section className="panel">
                <div className="panel-header">
                  <h2>{ui.verificationEvidence}</h2>
                </div>
                {evidence.data?.items
                  .filter((o) => o.verification === "verified")
                  .slice(0, 12)
                  .map((o) => (
                    <article key={o.id} className="evidence-item">
                      <h3>
                        {o.entityName} / {o.attribute}
                      </h3>
                      <p>
                        <EvidenceValue value={o.value} unit={o.unit} />
                      </p>
                      <p className="evidence-id">{o.id}</p>
                      <p className="note">
                        {ui.verifiedAt}: {timestamp(o.lastVerifiedAt)}
                      </p>
                    </article>
                  ))}
                <p className="note">{ui.verificationNote}</p>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
