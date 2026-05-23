/**
 * Salary History Entity
 *
 * Represents a record of salary change for audit trail and compliance
 *
 * Each entry captures:
 * - Before and after salary values
 * - Who made the change and when
 * - Why the change was made (reason)
 * - How the change was made (source)
 *
 * @version 1.0
 * @author Senior Developer
 */

export class SalaryHistoryEntity {
  id!: string;

  employeeId!: string;

  baseSalaryBefore!: number;
  baseSalaryAfter!: number;

  changedAt!: Date;
  changedBy!: string;

  /**
   * Human-readable reason for the salary change
   * Examples: "Annual raise", "Promotion", "Cost of living adjustment"
   */
  reason?: string;

  /**
   * Source of the salary change for traceability
   * - MANUAL: Direct salary update via dedicated endpoint
   * - EMPLOYEE_UPDATE: Changed during employee profile update
   * - BULK_UPDATE: Part of bulk salary adjustment operation
   * - MIGRATION: Initial data migration from old system
   */
  source!: string;

  /**
   * Computed field: Salary change amount
   */
  get changeAmount(): number {
    return this.baseSalaryAfter - this.baseSalaryBefore;
  }

  /**
   * Computed field: Salary change percentage
   */
  get changePercentage(): number {
    if (this.baseSalaryBefore === 0) return 0;
    return (this.changeAmount / this.baseSalaryBefore) * 100;
  }

  /**
   * Computed field: Was this a raise or reduction?
   */
  get isRaise(): boolean {
    return this.changeAmount > 0;
  }
}
