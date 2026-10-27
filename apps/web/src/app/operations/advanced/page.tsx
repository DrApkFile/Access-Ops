import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { OperationsConsole } from "@/components/operations/operations-console";
export default function Page() {
  return (
    <WorkspaceShell>
      <div className="advanced-console">
        <OperationsConsole />
      </div>
    </WorkspaceShell>
  );
}
