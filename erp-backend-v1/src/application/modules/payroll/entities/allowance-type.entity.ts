/**
 * Allowance Type Entity
 * Represents a catalog of allowance types that can be assigned to employees
 * This provides flexibility for the company to add new allowance types anytime
 */
export class AllowanceTypeEntity {
  id: string;
  name: string;
  description?: string;
  defaultAmount?: number;
  isActive: boolean;
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<AllowanceTypeEntity>) {
    Object.assign(this, partial);
  }

  /**
   * Check if allowance type can be assigned to employees
   */
  isUsable(): boolean {
    return this.isActive;
  }

  /**
   * Check if allowance type is disabled
   */
  isDisabled(): boolean {
    return !this.isActive;
  }
}
