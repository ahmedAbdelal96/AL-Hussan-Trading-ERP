/**
 * Project Asset Entity
 * Domain model for Asset-Project assignment
 */

export class ProjectAssetEntity {
  id: string;
  projectId: string;
  assetId: string;

  assignedDate: Date;
  // Backward-compat alias used by some frontend pages.
  assignedAt?: Date;
  returnDate?: Date | null;
  // Backward-compat alias used by some frontend pages.
  unassignedAt?: Date | null;
  isActive: boolean;

  status: string;
  location?: string | null;

  assignedBy: string;
  notes?: string | null;

  createdAt: Date;
  updatedAt: Date;

  // Optional relation payload for UI tables/history responses.
  project?: {
    id: string;
    name: string;
    projectCode?: string;
    projectNumber?: string;
    status?: string;
  } | null;

  constructor(partial: Partial<ProjectAssetEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if asset is currently assigned to project
   */
  isCurrentlyAssigned(): boolean {
    return this.isActive && !this.returnDate;
  }

  /**
   * Calculate assignment duration in days
   */
  getAssignmentDuration(): number | null {
    if (!this.returnDate) return null;

    const start = new Date(this.assignedDate).getTime();
    const end = new Date(this.returnDate).getTime();
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  }
}
