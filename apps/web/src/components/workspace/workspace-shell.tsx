"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Building2,
  Database,
  FileSearch,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Map,
  Settings,
  ShieldCheck,
  Workflow,
  ArrowUpRight,
} from "lucide-react";
import { design, ui, workspaceLinks } from "@/data/accessops-ui";
import { shortId } from "@/lib/accessops";
import { WorkspaceProvider, useWorkspace } from "./workspace-context";
import { AuthPanel } from "./auth-panel";
import { LoadingState, ErrorState, StatusBadge } from "./shared";
const icons = {
  overview: LayoutDashboard,
  plans: Map,
  sources: Database,
  entities: Building2,
  graph: GitBranch,
  investigations: FileSearch,
  scenarios: Workflow,
  actions: ShieldCheck,
  settings: Settings,
};
export function WorkspaceChrome({ children }: { children: ReactNode }) {
  const {
      principal,
      buildings,
      buildingId,
      setBuildingId,
      logout,
      loading,
      error,
    } = useWorkspace(),
    pathname = usePathname();
  if (loading)
    return (
      <div className="workspace-boot">
        <LoadingState />
      </div>
    );
  if (!principal)
    return (
      <>
        <header className="auth-header">
          <Link href="/" className="workspace-brand">
            <img src={design.logo} alt="" width="30" height="30" />
            <span>{ui.brand}</span>
          </Link>
          <Link href="/product">
            {ui.product}
            <ArrowUpRight size={14} />
          </Link>
        </header>
        <ErrorState error={error} />
        <AuthPanel />
      </>
    );
  const selected = buildings.find((b) => b.id === buildingId);
  return (
    <div className="workspace-layout">
      <a href="#main-content" className="skip-link">
        {ui.skip}
      </a>
      <aside className="workspace-sidebar">
        <Link href="/dashboard" className="workspace-brand">
          <img src={design.logo} alt="" width="30" height="30" />
          <span>{ui.brand}</span>
        </Link>
        <p className="sidebar-subtitle">{ui.product}</p>
        <div className="workspace-switch">
          <span>{ui.workspace}</span>
          <strong title={principal.workspaceId}>
            {shortId(principal.workspaceId)}
          </strong>
          <StatusBadge state={principal.role} />
        </div>
        <nav aria-label={ui.navigation}>
          {workspaceLinks.map((link) => {
            const Icon = icons[link.icon];
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={
                  pathname === link.href || pathname.startsWith(link.href + "/")
                    ? "page"
                    : undefined
                }
              >
                <Icon size={17} strokeWidth={1.5} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/operations/advanced">
            {ui.advanced}
            <ArrowUpRight size={13} />
          </Link>
          <button type="button" onClick={() => void logout()}>
            <LogOut size={16} />
            {ui.signOut}
          </button>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-topbar">
          <div className="building-control">
            <Activity size={17} />
            <label>
              <span>{ui.building}</span>
              <select
                aria-label={ui.building}
                value={buildingId}
                onChange={(e) => setBuildingId(e.target.value)}
              >
                <option value="">{ui.chooseBuilding}</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="topbar-context">
            {selected?.category === "reference_area" && (
              <StatusBadge state={ui.reference} />
            )}
            <Link href="/">
              {ui.home}
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </header>
        <main id="main-content" className="workspace-main">
          <ErrorState error={error} />
          {children}
        </main>
        <footer className="workspace-footer">
          <span>{ui.notCertification}</span>
          <span>
            {ui.brand} / {ui.evidence}
          </span>
        </footer>
      </div>
    </div>
  );
}
export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <WorkspaceChrome>{children}</WorkspaceChrome>
    </WorkspaceProvider>
  );
}
