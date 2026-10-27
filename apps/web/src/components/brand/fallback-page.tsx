"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { design, ui } from "@/data/accessops-ui";
export function FallbackPage({
  missing = false,
  retry,
}: {
  missing?: boolean;
  retry?: () => void;
}) {
  return (
    <main id="main-content" className="editorial-page">
      <Link href="/dashboard" className="workspace-brand">
        <img src={design.logo} width="30" height="30" alt="" />
        {ui.brand}
      </Link>
      <p className="eyebrow" style={{ marginTop: 60 }}>
        {missing ? "404" : ui.error}
      </p>
      <h1>{missing ? ui.missingTitle : ui.errorTitle}</h1>
      <p>{missing ? ui.missingDescription : ui.errorDescription}</p>
      <div className="form-actions">
        {retry && <Button onClick={retry}>{ui.retry}</Button>}
        <Link href="/dashboard" className="intelligence-cta">
          {ui.enter}
        </Link>
      </div>
    </main>
  );
}
