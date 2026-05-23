import { Injectable, Logger } from '@nestjs/common';
import { CostAllocationInputDto } from '../dto/cost-allocation-input.dto';

/**
 * Cost Allocation Validator Service
 *
 * Centralized validation for cost allocation business rules
 *
 * Why separate service?
 * 1. Reusable across use cases (create, update)
 * 2. Testable in isolation
 * 3. Single source of truth for validation rules
 * 4. Easy to modify rules without affecting multiple files
 *
 * Validation Philosophy:
 * - Fail fast: Check simple rules first (count, duplicates)
 * - Clear messages: Return Arabic messages for frontend display
 * - Detailed errors: Return all validation errors, not just first one
 *
 * @class CostAllocationValidatorService
 */
@Injectable()
export class CostAllocationValidatorService {
  private readonly logger = new Logger(CostAllocationValidatorService.name);

  /**
   * Validate allocations comprehensively
   *
   * Checks all business rules:
   * 1. Minimum 2 projects
   * 2. No duplicate projects
   * 3. Valid amounts/percentages
   * 4. Sum equals 100% (if using percentages)
   * 5. Sum equals total amount (if using amounts)
   *
   * @param allocations - Allocation input data
   * @param totalAmount - Total cost amount
   * @returns Validation result with messages
   */
  validateAllocations(
    allocations: CostAllocationInputDto[],
    totalAmount: number,
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Rule 1: Minimum 2 projects
    if (!this.validateMinimumProjects(allocations)) {
      errors.push('يجب توزيع التكلفة على مشروعين على الأقل');
    }

    // Rule 2: No duplicate projects
    const duplicateCheck = this.validateNoDuplicateProjects(allocations);
    if (!duplicateCheck.isValid) {
      errors.push(`مشاريع مكررة: ${duplicateCheck.duplicates.join('، ')}`);
    }

    // Determine if using amounts or percentages
    const usingAmounts = allocations.every((a) => a.amount !== undefined);
    const usingPercentages = allocations.every(
      (a) => a.percentage !== undefined,
    );

    if (!usingAmounts && !usingPercentages) {
      errors.push(
        'يجب استخدام المبلغ أو النسبة المئوية لجميع التوزيعات (وليس مزيج)',
      );
    }

    // Rule 3: Validate sum based on input type
    if (usingPercentages) {
      const percentageCheck = this.validatePercentageSum(allocations);
      if (!percentageCheck.isValid) {
        errors.push(
          `مجموع النسب يجب أن يساوي 100% (المجموع الحالي: ${percentageCheck.actualSum.toFixed(2)}%)`,
        );
      }
    }

    if (usingAmounts) {
      const amountCheck = this.validateAmountSum(allocations, totalAmount);
      if (!amountCheck.isValid) {
        errors.push(
          `مجموع المبالغ المخصصة يجب أن يساوي إجمالي التكلفة (المتوقع: ${totalAmount.toFixed(2)}، الفعلي: ${amountCheck.actualSum.toFixed(2)})`,
        );
      }
    }

    // Rule 4: Validate positive values
    const positiveCheck = this.validatePositiveValues(allocations);
    if (!positiveCheck.isValid) {
      errors.push('جميع المبالغ والنسب يجب أن تكون أكبر من صفر');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate minimum number of projects
   *
   * Business Rule: Allocated costs must be distributed to at least 2 projects
   * Rationale: If only 1 project, use regular single-project cost instead
   *
   * @param allocations - Allocation data
   * @returns true if at least 2 projects
   */
  validateMinimumProjects(allocations: CostAllocationInputDto[]): boolean {
    return allocations.length >= 2;
  }

  /**
   * Validate no duplicate projects
   *
   * Business Rule: Each project can only appear once per cost
   * Database: Enforced by unique constraint (cost_id, project_id)
   *
   * @param allocations - Allocation data
   * @returns Validation result with list of duplicates
   */
  validateNoDuplicateProjects(allocations: CostAllocationInputDto[]): {
    isValid: boolean;
    duplicates: string[];
  } {
    const projectIds = allocations.map((a) => a.projectId);
    const uniqueIds = new Set(projectIds);
    const duplicates = projectIds.filter(
      (id, index) => projectIds.indexOf(id) !== index,
    );

    return {
      isValid: uniqueIds.size === projectIds.length,
      duplicates: Array.from(new Set(duplicates)),
    };
  }

  /**
   * Validate percentage sum equals 100%
   *
   * Business Rule: Sum of all percentages must equal exactly 100%
   * Tolerance: ±0.01% to account for floating point arithmetic
   *
   * Example:
   * - Valid: [40%, 35%, 25%] = 100%
   * - Invalid: [40%, 40%, 25%] = 105%
   *
   * @param allocations - Allocation data with percentages
   * @returns Validation result with actual sum
   */
  validatePercentageSum(allocations: CostAllocationInputDto[]): {
    isValid: boolean;
    actualSum: number;
  } {
    const sum = allocations.reduce(
      (total, allocation) => total + (allocation.percentage || 0),
      0,
    );

    // Allow small tolerance for floating point errors
    const tolerance = 0.01;
    const isValid = Math.abs(sum - 100) <= tolerance;

    return {
      isValid,
      actualSum: sum,
    };
  }

  /**
   * Validate amount sum equals total cost
   *
   * Business Rule: Sum of allocated amounts must equal parent cost amount
   * Tolerance: ±0.01 SAR to account for rounding
   *
   * Example:
   * - Total: 10,000 SAR
   * - Valid: [4,000 + 3,500 + 2,500] = 10,000 SAR
   * - Invalid: [5,000 + 5,000 + 1,000] = 11,000 SAR
   *
   * @param allocations - Allocation data with amounts
   * @param totalAmount - Parent cost total amount
   * @returns Validation result with actual sum
   */
  validateAmountSum(
    allocations: CostAllocationInputDto[],
    totalAmount: number,
  ): {
    isValid: boolean;
    actualSum: number;
  } {
    const sum = allocations.reduce(
      (total, allocation) => total + (allocation.amount || 0),
      0,
    );

    // Allow small tolerance for rounding errors
    const tolerance = 0.01;
    const isValid = Math.abs(sum - totalAmount) <= tolerance;

    return {
      isValid,
      actualSum: sum,
    };
  }

  /**
   * Validate all values are positive
   *
   * Business Rule: Amounts and percentages must be > 0
   * Rationale: Zero or negative allocations don't make business sense
   *
   * @param allocations - Allocation data
   * @returns true if all values are positive
   */
  validatePositiveValues(allocations: CostAllocationInputDto[]): {
    isValid: boolean;
  } {
    const allPositive = allocations.every((allocation) => {
      const value = allocation.amount || allocation.percentage || 0;
      return value > 0;
    });

    return {
      isValid: allPositive,
    };
  }

  /**
   * Calculate allocations from percentages
   *
   * Used when: User provides percentages, need to calculate amounts
   *
   * Rounding Strategy:
   * - Round each amount to 2 decimal places
   * - Add difference to largest allocation (ensures sum = total)
   *
   * @param allocations - Allocations with percentages
   * @param totalAmount - Total cost amount
   * @returns Allocations with calculated amounts
   */
  calculateAmountsFromPercentages(
    allocations: CostAllocationInputDto[],
    totalAmount: number,
  ): Array<{ projectId: string; amount: number; percentage: number }> {
    const result = allocations.map((allocation) => {
      const percentage = allocation.percentage!;
      const amount = (totalAmount * percentage) / 100;

      return {
        projectId: allocation.projectId,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimals
        percentage,
      };
    });

    // Fix rounding errors: adjust largest allocation
    const calculatedSum = result.reduce((sum, a) => sum + a.amount, 0);
    const difference = totalAmount - calculatedSum;

    if (Math.abs(difference) > 0.001) {
      // Find largest allocation
      const largest = result.reduce((prev, current) =>
        current.amount > prev.amount ? current : prev,
      );
      largest.amount += difference;
      largest.amount = Math.round(largest.amount * 100) / 100;
    }

    return result;
  }

  /**
   * Calculate percentages from amounts
   *
   * Used when: User provides amounts, need to calculate percentages
   *
   * @param allocations - Allocations with amounts
   * @param totalAmount - Total cost amount
   * @returns Allocations with calculated percentages
   */
  calculatePercentagesFromAmounts(
    allocations: CostAllocationInputDto[],
    totalAmount: number,
  ): Array<{ projectId: string; amount: number; percentage: number }> {
    return allocations.map((allocation) => {
      const amount = allocation.amount!;
      const percentage = (amount / totalAmount) * 100;

      return {
        projectId: allocation.projectId,
        amount,
        percentage: Math.round(percentage * 100) / 100, // Round to 2 decimals
      };
    });
  }

  /**
   * Log validation results
   *
   * Used for: Debugging, audit trail
   *
   * @param result - Validation result
   * @param context - Additional context (e.g., "Create Cost", "Update Cost")
   */
  logValidationResult(
    result: { isValid: boolean; errors: string[] },
    context: string,
  ): void {
    if (result.isValid) {
      this.logger.debug(`${context}: Validation passed`);
    } else {
      this.logger.warn(
        `${context}: Validation failed - ${result.errors.join(', ')}`,
      );
    }
  }
}
