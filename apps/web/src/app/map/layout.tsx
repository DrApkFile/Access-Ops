import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { design, ui } from "@/data/accessops-ui";
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="map-brand-bar">
        <Link href="/dashboard" className="workspace-brand">
          <img src={design.logo} alt="" width="30" height="30" />
          <span>{ui.brand}</span>
        </Link>
        <Link href="/projects">
          {ui.savedPlans}
          <ArrowUpRight size={14} />
        </Link>
      </header>
      <main className="map-workbench" id="main-content">
        {children}
      </main>
    </>
  );
}
