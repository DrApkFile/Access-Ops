import { AsyncLocalStorage } from "node:async_hooks";
import { AppError } from "../accessops/errors";
const scope = new AsyncLocalStorage<string>();
export function withProviderWorkspace<T>(
  workspaceId: string,
  task: () => T,
): T {
  return scope.run(workspaceId, task);
}
export function currentProviderWorkspace() {
  return scope.getStore();
}
export function requireProviderConsent() {
  const workspaceId = scope.getStore();
  if (
    !workspaceId ||
    !(process.env.ACCESSOPS_PROVIDER_WORKSPACES ?? "")
      .split(",")
      .includes(workspaceId)
  )
    throw new AppError("WORKSPACE_PROVIDER_CONSENT_REQUIRED", 403);
  return workspaceId;
}
