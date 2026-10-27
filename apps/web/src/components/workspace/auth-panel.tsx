"use client";
import { useState } from "react";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ui } from "@/data/accessops-ui";
import { useWorkspace } from "./workspace-context";
import { ErrorState, Field } from "./shared";
export function AuthPanel() {
  const { login } = useWorkspace(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<Error | null>(null);
  return (
    <main id="main-content" className="auth-layout">
      <section className="auth-story">
        <p className="eyebrow">
          {ui.brand} / {ui.product}
        </p>
        <h1>{ui.welcome}</h1>
        <p>{ui.loginIntro}</p>
        <div className="auth-proof">
          <LockKeyhole size={18} />
          <span>{ui.dataCaution}</span>
        </div>
      </section>
      <section className="auth-form-panel">
        <h2>{ui.signIn}</h2>
        <p>{ui.loginNote}</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const element = e.currentTarget,
              data = new FormData(element);
            setBusy(true);
            setError(null);
            try {
              await login(
                String(data.get("email")),
                String(data.get("password")),
                String(data.get("workspaceId")),
              );
              element.reset();
            } catch (error) {
              setError(error instanceof Error ? error : new Error(ui.error));
            } finally {
              setBusy(false);
            }
          }}
        >
          <Field label={ui.email}>
            <Input name="email" type="email" required autoComplete="username" />
          </Field>
          <Field label={ui.password}>
            <Input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </Field>
          <Field label={ui.workspaceId}>
            <Input name="workspaceId" required autoComplete="off" />
          </Field>
          <ErrorState error={error} />
          <Button disabled={busy} type="submit">
            {busy ? ui.processing : ui.signIn}
            <ArrowUpRight size={16} />
          </Button>
        </form>
      </section>
    </main>
  );
}
