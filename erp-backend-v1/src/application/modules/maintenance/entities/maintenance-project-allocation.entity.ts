/**
 * MaintenanceProjectAllocation Entity
 *
 * Snapshot of how a maintenance request's cost is distributed across projects.
 * Created automatically at request-creation time from the asset's active
 * ProjectAsset records. Percentages are normalised to always sum to 100.
 * allocatedAmount is populated when the request reaches COMPLETED status.
 */
export class MaintenanceProjectAllocationEntity {
  id: string;
  maintenanceId: string;
  projectId: string;

  /** Normalised percentage (0-100), snapshot at request creation time */
  percentage: number;

  /** Populated once actualCost is recorded on COMPLETED transition */
  allocatedAmount?: number | null;

  /** Explains any normalization that occurred (e.g. excluded inactive projects) */
  note?: string | null;

  createdAt: Date;
  updatedAt: Date;
}
