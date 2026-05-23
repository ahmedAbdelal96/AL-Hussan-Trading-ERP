/**
 * Frontend mirror of backend asset-status.guard.ts
 * Prevents UI from offering operations that the backend will reject.
 */

export const READONLY_ASSET_STATUSES = ["RETIRED"] as const;

export const ASSIGNMENT_BLOCKED_ASSET_STATUSES = [
  "RETIRED",
  "OUT_OF_SERVICE",
] as const;

/** Returns true if the asset can be edited (not retired). */
export function isAssetEditable(status: string | undefined | null): boolean {
  if (!status) return true;
  return !READONLY_ASSET_STATUSES.includes(
    status as (typeof READONLY_ASSET_STATUSES)[number],
  );
}

/** Returns true if an employee can be assigned to the asset. */
export function isAssetAssignable(status: string | undefined | null): boolean {
  if (!status) return true;
  return !ASSIGNMENT_BLOCKED_ASSET_STATUSES.includes(
    status as (typeof ASSIGNMENT_BLOCKED_ASSET_STATUSES)[number],
  );
}

/** Returns true if a maintenance request can be created for the asset. */
export function assetCanHaveMaintenance(
  status: string | undefined | null,
): boolean {
  if (!status) return true;
  return !READONLY_ASSET_STATUSES.includes(
    status as (typeof READONLY_ASSET_STATUSES)[number],
  );
}
