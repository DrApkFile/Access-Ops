import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
export default function Layout({ children }: { children: ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
