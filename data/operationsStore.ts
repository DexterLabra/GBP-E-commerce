export const OPERATIONS_STORAGE_KEY = "gbp-operations-state-v1";
export const OPERATIONS_VERSION_KEY = "gbp-operations-version-v1";
export const OPERATIONS_UPDATED_EVENT = "gbp-operations-state-updated";

export type OperationsSnapshot = {
  orders: unknown[];
  inventory: unknown[];
  dispatches: unknown[];
  scanHistory: unknown[];
  auditLogs: unknown[];
  recoveryHistory?: unknown[];
  notifications: unknown[];
  users: unknown[];
};

export function isOperationsSnapshot(value: unknown): value is OperationsSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Record<string, unknown>;
  return ["orders", "inventory", "dispatches", "scanHistory", "auditLogs", "notifications", "users"]
    .every((key) => Array.isArray(snapshot[key]));
}