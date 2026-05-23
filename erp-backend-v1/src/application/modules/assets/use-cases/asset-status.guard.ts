import { BadRequestException } from '@nestjs/common';
import { AssetStatus } from '@prisma/client';

/**
 * Statuses that make an asset fully immutable.
 * A RETIRED asset is a historical record — no modifications, no assignments.
 */
export const READONLY_ASSET_STATUSES: AssetStatus[] = [AssetStatus.RETIRED];

/**
 * Statuses that block employee assignment.
 * RETIRED assets are gone. OUT_OF_SERVICE assets are unavailable for use.
 */
export const ASSIGNMENT_BLOCKED_ASSET_STATUSES: AssetStatus[] = [
  AssetStatus.RETIRED,
  AssetStatus.OUT_OF_SERVICE,
];

/**
 * Throws if the asset is fully retired and cannot be edited at all.
 * Call before any field update use case.
 */
export function assertAssetIsEditable(asset: {
  id: string;
  assetNumber?: string | null;
  status: AssetStatus;
}): void {
  if (READONLY_ASSET_STATUSES.includes(asset.status)) {
    const label = asset.assetNumber ?? asset.id;
    throw new BadRequestException(
      `Asset "${label}" is retired and cannot be modified. ` +
        `Retired assets are read-only historical records.`,
    );
  }
}

/**
 * Throws if the asset cannot be assigned to an employee.
 * Call before AssignEmployeeToAsset.
 */
export function assertAssetIsAssignable(asset: {
  id: string;
  assetNumber?: string | null;
  status: AssetStatus;
}): void {
  if (ASSIGNMENT_BLOCKED_ASSET_STATUSES.includes(asset.status)) {
    const label = asset.assetNumber ?? asset.id;
    throw new BadRequestException(
      `Asset "${label}" cannot be assigned — status is ${asset.status}. ` +
        `Only AVAILABLE or UNDER_MAINTENANCE assets can be assigned to employees.`,
    );
  }
}

/**
 * Throws if a new maintenance request cannot be opened for this asset.
 * Retired assets don't need maintenance — they're out of service permanently.
 */
export function assertAssetCanHaveMaintenance(asset: {
  id: string;
  assetNumber?: string | null;
  status: AssetStatus;
}): void {
  if (asset.status === AssetStatus.RETIRED) {
    const label = asset.assetNumber ?? asset.id;
    throw new BadRequestException(
      `Asset "${label}" is retired. ` +
        `Maintenance requests cannot be created for retired assets.`,
    );
  }
}
