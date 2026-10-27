"use client";
import Link from "next/link";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ui } from "@/data/accessops-ui";
import { request, useResource, timestamp } from "@/lib/accessops";
import {
  PageHeading,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  TextField,
  Field,
  useMutation,
  formString,
} from "./shared";
type Project = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  parseError: string | null;
};
export function ProjectsScreen() {
  const projects = useResource<{ items: Project[] }>("/projects"),
    mutation = useMutation(),
    router = useRouter(),
    file = useRef<HTMLInputElement>(null);
  return (
    <>
      <PageHeading title={ui.plansTitle} description={ui.plansIntro} />
      <ErrorState error={projects.error ?? mutation.error} />
      <section className="upload-zone">
        <FileUp size={30} strokeWidth={1.3} />
        <h2>{ui.upload}</h2>
        <p>{ui.uploadHint}</p>
        <input
          ref={file}
          aria-label={ui.upload}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={(e) => {
            const selected = e.currentTarget.files?.[0];
            if (!selected) return;
            void mutation.run(async () => {
              const form = new FormData();
              form.set("file", selected);
              const project = await request<{ id: string }>(
                "/projects",
                "POST",
                form,
              );
              await request("/projects/" + project.id + "/parse", "POST");
              router.push("/map/" + project.id);
            });
          }}
          disabled={mutation.busy}
        />
        <p>{mutation.busy ? ui.processing : ui.original}</p>
      </section>
      <section className="panel" style={{ marginTop: 24 }}>
        <div className="panel-header">
          <h2>{ui.savedPlans}</h2>
          <Button variant="outline" onClick={projects.refresh}>
            {ui.refresh}
          </Button>
        </div>
        {projects.loading ? (
          <LoadingState />
        ) : projects.data?.items.length ? (
          <div className="table-scroll">
            <table className="record-table">
              <thead>
                <tr>
                  <th>{ui.name}</th>
                  <th>{ui.status}</th>
                  <th>{ui.date}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {projects.data.items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.name}
                      <small>{p.id}</small>
                    </td>
                    <td>
                      <StatusBadge state={p.status} />
                      {p.parseError && <small>{p.parseError}</small>}
                    </td>
                    <td>{timestamp(p.createdAt)}</td>
                    <td>
                      <Link href={"/map/" + p.id}>
                        {ui.openEditor}
                        <ArrowUpRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title={ui.empty} description={ui.plansIntro} />
        )}
      </section>
      <details className="panel">
        <summary className="panel-header">
          <h2>{ui.importGeometry}</h2>
        </summary>
        <p className="description">{ui.manualGeometryNote}</p>
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            void mutation.run(async () => {
              const id = formString(data, "project"),
                model = JSON.parse(formString(data, "model"));
              const result = await request<{ version: number }>(
                "/projects/" + id + "/model",
                "POST",
                model,
              );
              await request("/projects/" + id + "/model/review", "POST", {
                version: result.version,
                reason: formString(data, "reason"),
              });
              router.push("/map/" + id);
            });
          }}
        >
          <TextField name="project" label={ui.projectId} required />
          <Field label={ui.reviewedModel}>
            <textarea name="model" required spellCheck={false} />
          </Field>
          <TextField name="reason" label={ui.reason} required />
          <Button type="submit" disabled={mutation.busy}>
            {ui.review}
          </Button>
        </form>
      </details>
    </>
  );
}
