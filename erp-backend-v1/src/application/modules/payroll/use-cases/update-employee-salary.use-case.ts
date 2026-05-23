/**
 * Update Employee Salary Use Case
 *
 * Handles updating employee salary with comprehensive audit trail and optimistic locking
 *
 * Business Rules:
 * 1. Salary must be positive
 * 2. Row version must match (prevents concurrent updates)
 * 3. If salary unchanged, reject update
 * 4. All changes logged in salary_history
 * 5. Transaction-based for data integrity
 *
 * Optimistic Locking Flow:
 * 1. Frontend reads employee (gets version = 5)
 * 2. User modifies salary
 * 3. Frontend sends update with version = 5
 * 4. Backend checks: if DB version != 5, reject (someone else modified it)
 * 5. If version matches, update and increment version to 6
 *
 * @version 1.0
 * @author Senior Developer
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { I18nService } from 'nestjs-i18n';
import { UpdateSalaryDto } from '../dto';
import { assertEmployeeCanReceivePayroll } from './employee-payroll-status.guard';

@Injectable()
export class UpdateEmployeeSalaryUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(UpdateEmployeeSalaryUseCase.name);
  }

  /**
   * Execute salary update with optimistic locking
   *
   * @param employeeId - Employee UUID
   * @param dto - Salary update data with version for optimistic locking
   * @param userId - ID of user making the change
   * @returns Updated employee entity
   * @throws NotFoundException if employee doesn't exist
   * @throws ConflictException if version mismatch (concurrent update detected)
   * @throws BadRequestException if salary unchanged or invalid
   */
  async execute(employeeId: string, dto: UpdateSalaryDto, userId: string) {
    const lockVersion =
      typeof dto.rowVersion === 'number'
        ? dto.rowVersion
        : typeof dto.version === 'number'
          ? dto.version
          : undefined;

    if (typeof lockVersion !== 'number') {
      throw new BadRequestException(
        'rowVersion (or version) is required for optimistic locking',
      );
    }

    this.logger.log(
      `Updating salary for employee ${employeeId} by user ${userId}`,
    );

    try {
      // Execute in transaction for atomicity
      return await this.prisma.$transaction(async (tx) => {
        // Step 1: Get current employee with row locking
        // FOR UPDATE ensures no other transaction can modify this row until we're done
        const currentEmployee = await tx.$queryRaw<
          Array<{
            id: string;
            employee_number: string;
            base_salary: number;
            version: number;
            currency: string;
            status: string;
          }>
        >`
          SELECT id, employee_number, base_salary, version, currency, status
          FROM employees 
          WHERE id = ${employeeId}::uuid
          FOR UPDATE
        `;

        if (!currentEmployee || currentEmployee.length === 0) {
          throw new NotFoundException(
            this.i18n.t('employees.errors.notFound', {
              args: { id: employeeId },
            }),
          );
        }

        const employee = currentEmployee[0];

        // Step 1b: Guard — terminated employees cannot have salary changes
        assertEmployeeCanReceivePayroll({
          id: employeeId,
          employeeNumber: employee.employee_number,
          status: employee.status as any,
        });

        // Step 2: Optimistic locking check - Version must match
        // If versions don't match, another user has modified the data
        if (employee.version !== lockVersion) {
          this.logger.warn(
            `Version mismatch for employee ${employeeId}. Expected: ${lockVersion}, Actual: ${employee.version}`,
          );
          throw new ConflictException(
            this.i18n.t('common.errors.concurrentUpdate'),
          );
        }

        // Step 3: Validate salary change
        if (dto.baseSalary <= 0) {
          throw new BadRequestException(
            this.i18n.t('payroll.salary.basicSalaryInvalid'),
          );
        }

        // Step 4: Check if salary actually changed
        // No point logging if nothing changed
        const currentSalary = Number(employee.base_salary);
        if (currentSalary === dto.baseSalary) {
          throw new BadRequestException(
            this.i18n.t('payroll.salary.unchanged'),
          );
        }

        // Step 5: Log salary change in history table
        // This creates audit trail for compliance
        await tx.salaryHistory.create({
          data: {
            employeeId,
            baseSalaryBefore: currentSalary,
            baseSalaryAfter: dto.baseSalary,
            changedBy: userId,
            reason: dto.reason || 'Salary update via dedicated endpoint',
            source: 'MANUAL',
            changedAt: new Date(),
          },
        });

        // Step 6: Update employee salary and increment version
        // Version increment ensures next update will need new version
        const updatedEmployee = await tx.employee.update({
          where: { id: employeeId },
          data: {
            baseSalary: dto.baseSalary,
            currency: dto.currency || employee.currency,
            lastSalaryUpdate: new Date(),
            lastSalaryUpdateBy: userId,
            version: { increment: 1 }, // Optimistic lock: version++
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            baseSalary: true,
            currency: true,
            lastSalaryUpdate: true,
            version: true,
          },
        });

        this.logger.log(
          `Salary updated successfully for employee ${employeeId}. New version: ${updatedEmployee.version}`,
        );

        return updatedEmployee;
      });
    } catch (error) {
      // If it's our custom error, rethrow it
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Log unexpected errors
      this.logger.error(
        `Failed to update salary for employee ${employeeId}: ${error.message}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(this.i18n.t('common.errors.unexpected'));
    }
  }
}
