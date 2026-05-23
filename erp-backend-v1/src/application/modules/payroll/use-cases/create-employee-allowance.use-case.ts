/**
 * Create Employee Allowance Use Case
 * Business logic for creating a new employee allowance
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import {
  EMPLOYEE_ALLOWANCE_REPOSITORY,
  ALLOWANCE_TYPE_REPOSITORY,
  type IEmployeeAllowanceRepository,
  type IAllowanceTypeRepository,
} from '../repositories';
import { AllowanceFrequency } from '@prisma/client';
import { CreateEmployeeAllowanceDto } from '../dto';
import { EmployeeAllowanceEntity } from '../entities';
import { assertEmployeeCanReceivePayroll } from './employee-payroll-status.guard';

@Injectable()
export class CreateEmployeeAllowanceUseCase {
  constructor(
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly employeeAllowanceRepository: IEmployeeAllowanceRepository,
    @Inject(ALLOWANCE_TYPE_REPOSITORY)
    private readonly allowanceTypeRepository: IAllowanceTypeRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
    private readonly prisma: PrismaService,
  ) {
    this.logger.setContext(CreateEmployeeAllowanceUseCase.name);
  }

  async execute(
    dto: CreateEmployeeAllowanceDto,
    userId: string,
  ): Promise<EmployeeAllowanceEntity> {
    this.logger.log(
      `Creating employee allowance for employee: ${dto.employeeId}`,
    );

    try {
      // Validate employee exists and is eligible for payroll transactions
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
        select: { id: true, employeeNumber: true, status: true },
      });
      if (!employee) {
        throw new NotFoundException(`Employee ${dto.employeeId} not found`);
      }
      assertEmployeeCanReceivePayroll(employee);

      // Validate allowance type exists
      const allowanceType = await this.allowanceTypeRepository.findById(
        dto.allowanceTypeId,
      );
      if (!allowanceType) {
        throw new NotFoundException(
          this.i18n.t('payroll.allowance.typeNotFound', {
            args: { id: dto.allowanceTypeId },
          }),
        );
      }

      // Validate allowance type is active
      if (!allowanceType.isActive) {
        throw new BadRequestException(
          this.i18n.t('payroll.allowance.typeNotActive', {
            args: { name: allowanceType.name },
          }),
        );
      }

      const resolvedAmount = dto.amount ?? allowanceType.defaultAmount;
      if (!resolvedAmount || resolvedAmount <= 0) {
        throw new BadRequestException(
          this.i18n.t('payroll.allowance.amountInvalid') ||
            'Allowance amount is required and must be greater than zero',
        );
      }

      // ONE_TIME allowances must be confined to a single payroll month.
      // Normalise effectiveFrom to the 1st of its month and auto-set effectiveTo
      // to the last day of that same month so the payroll query picks it up
      // exactly once (the month the admin entered) and never again.
      let finalDto = dto;
      if (dto.frequency === AllowanceFrequency.ONE_TIME && !dto.effectiveTo) {
        const from = new Date(dto.effectiveFrom);
        // 1st of that month — matches the targetDate used by findActiveByEmployeeIdAtDate
        const firstOfMonth = new Date(from.getFullYear(), from.getMonth(), 1);
        // Last day of that month (day 0 of next month = last day of this month)
        const lastOfMonth = new Date(
          from.getFullYear(),
          from.getMonth() + 1,
          0,
        );

        finalDto = {
          ...dto,
          amount: resolvedAmount,
          effectiveFrom: firstOfMonth.toISOString().split('T')[0], // 'YYYY-MM-DD'
          effectiveTo: lastOfMonth.toISOString().split('T')[0],
        };

        this.logger.log(
          `ONE_TIME allowance: effectiveFrom normalised to ${finalDto.effectiveFrom}, ` +
            `effectiveTo auto-set to ${finalDto.effectiveTo}`,
        );
      }
      if (dto.frequency !== AllowanceFrequency.ONE_TIME) {
        finalDto = {
          ...dto,
          amount: resolvedAmount,
        };
      }

      // Create employee allowance
      const employeeAllowance = await this.employeeAllowanceRepository.create(
        finalDto,
        userId,
      );

      this.logger.log(
        `Employee allowance created successfully with ID: ${employeeAllowance.id}`,
      );

      return employeeAllowance;
    } catch (error) {
      this.logger.log(`Failed to create employee allowance: ${error.message}`);
      throw error;
    }
  }
}
