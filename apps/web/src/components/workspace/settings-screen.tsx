"use client";
import { Button } from "@/components/ui/button";
import { ui } from "@/data/accessops-ui";
import { request, useResource, timestamp } from "@/lib/accessops";
import { useWorkspace } from "./workspace-context";
import {
  PageHeading,
  ErrorState,
  StatusBadge,
  Field,
  TextField,
  JsonRecord,
  useMutation,
  formString,
} from "./shared";
type User = { id: string; email: string; role: string };
export function SettingsScreen() {
  const { principal, buildingId } = useWorkspace(),
    users = useResource<{ items: User[] }>("/v1/users"),
    providers = useResource<{
      items: {
        provider: string;
        state: string;
        model?: string;
        models?: string[];
      }[];
      zetaris: string;
    }>("/v1/providers"),
    audit = useResource<{
      items: {
        id: string;
        action: string;
        targetId: string;
        actorId: string;
        createdAt: string;
        metadata: unknown;
      }[];
    }>("/v1/audit-events"),
    metrics = useResource<unknown>("/v1/metrics"),
    mutation = useMutation();
  return (
    <>
      <PageHeading title={ui.settingsTitle} description={ui.settingsIntro} />
      <ErrorState error={mutation.error} />
      <div className="split-layout">
        <div className="section-stack">
          <section className="panel">
            <div className="panel-header">
              <h2>{ui.providers}</h2>
              <Button variant="outline" onClick={providers.refresh}>
                {ui.refresh}
              </Button>
            </div>
            <p className="description">{ui.discoveryNote}</p>
            <ErrorState error={providers.error} />
            <div className="table-scroll">
              <table className="record-table">
                <thead>
                  <tr>
                    <th>{ui.provider}</th>
                    <th>{ui.status}</th>
                    <th>{ui.model}</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.data?.items.map((provider) => (
                    <tr key={provider.provider}>
                      <td>{provider.provider}</td>
                      <td>
                        <StatusBadge state={provider.state} />
                      </td>
                      <td>{provider.model ?? "—"}</td>
                    </tr>
                  ))}
                  {providers.data && (
                    <tr>
                      <td>Zetaris</td>
                      <td colSpan={2}>
                        <StatusBadge state={providers.data.zetaris} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="note">{ui.serverSecrets}</p>
            <JsonRecord value={providers.data ?? {}} />
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>{ui.users}</h2>
              <StatusBadge state={principal?.role ?? "unknown"} />
            </div>
            <ErrorState error={users.error} />
            <div className="table-scroll">
              <table className="record-table">
                <thead>
                  <tr>
                    <th>{ui.email}</th>
                    <th>{ui.userRole}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data?.items.map((user) => (
                    <tr key={user.id}>
                      <td>
                        {user.email}
                        <small>{user.id}</small>
                      </td>
                      <td>
                        <StatusBadge state={user.role} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          {principal?.role === "admin" && (
            <section className="panel">
              <div className="panel-header">
                <h2>{ui.invite}</h2>
              </div>
              <form
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget,
                    data = new FormData(form);
                  void mutation.run(async () => {
                    await request("/v1/users", "POST", {
                      email: formString(data, "email"),
                      password: String(data.get("password") ?? ""),
                      role: formString(data, "role"),
                    });
                    form.reset();
                    users.refresh();
                  });
                }}
              >
                <TextField
                  label={ui.email}
                  name="email"
                  type="email"
                  required
                />
                <TextField
                  label={ui.newPassword}
                  name="password"
                  type="password"
                  required
                />
                <Field label={ui.userRole}>
                  <select name="role">
                    {[
                      "viewer",
                      "operator",
                      "reviewer",
                      "source_admin",
                      "admin",
                    ].map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </Field>
                <Button type="submit" disabled={mutation.busy}>
                  {ui.invite}
                </Button>
              </form>
            </section>
          )}
        </div>
        <div className="section-stack">
          {principal?.role === "admin" && (
            <>
              <section className="panel">
                <div className="panel-header">
                  <h2>{ui.grant}</h2>
                </div>
                <form
                  className="form-stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    void mutation.run(() =>
                      request(
                        "/v1/" +
                          formString(data, "resource") +
                          "/" +
                          formString(data, "resourceId") +
                          "/grants",
                        "POST",
                        {
                          userId: formString(data, "user"),
                          permission: formString(data, "permission"),
                        },
                      ),
                    );
                  }}
                >
                  <Field label={ui.resourceType}>
                    <select name="resource">
                      <option value="buildings">{ui.building}</option>
                      <option value="projects">{ui.projectId}</option>
                    </select>
                  </Field>
                  <TextField
                    label={ui.resourceId}
                    name="resourceId"
                    defaultValue={buildingId}
                    required
                  />
                  <Field label={ui.userId}>
                    <select name="user" required>
                      {users.data?.items.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={ui.permissionLevel}>
                    <select name="permission">
                      {["read", "write", "review", "manage"].map(
                        (permission) => (
                          <option key={permission}>{permission}</option>
                        ),
                      )}
                    </select>
                  </Field>
                  <Button type="submit" disabled={mutation.busy}>
                    {ui.grant}
                  </Button>
                </form>
              </section>
              <section className="panel">
                <div className="panel-header">
                  <h2>{ui.changeRole}</h2>
                </div>
                <form
                  className="form-stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    void mutation.run(async () => {
                      await request(
                        "/v1/users/" + formString(data, "user"),
                        "PATCH",
                        {
                          role: formString(data, "role"),
                          revokeSessions: true,
                        },
                      );
                      users.refresh();
                    });
                  }}
                >
                  <Field label={ui.userId}>
                    <select name="user" required>
                      {users.data?.items.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={ui.userRole}>
                    <select name="role">
                      {[
                        "viewer",
                        "operator",
                        "reviewer",
                        "source_admin",
                        "admin",
                      ].map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Button type="submit" disabled={mutation.busy}>
                    {ui.changeRole}
                  </Button>
                </form>
                <p className="note">{ui.sessionRevocationNote}</p>
              </section>
            </>
          )}
          <section className="panel">
            <div className="panel-header">
              <h2>{ui.metrics}</h2>
            </div>
            <ErrorState error={metrics.error} />
            {metrics.data !== undefined && <JsonRecord value={metrics.data} />}
          </section>
          <section className="panel">
            <div className="panel-header">
              <h2>{ui.audit}</h2>
            </div>
            <ErrorState error={audit.error} />
            {audit.data?.items.slice(0, 12).map((event) => (
              <div className="evidence-item" key={event.id}>
                <h3>{event.action}</h3>
                <p className="evidence-id">{event.targetId}</p>
                <p>{timestamp(event.createdAt)}</p>
                <JsonRecord value={event} />
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
