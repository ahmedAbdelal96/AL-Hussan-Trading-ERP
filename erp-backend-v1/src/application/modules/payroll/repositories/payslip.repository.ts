/**
 * Payslip Repository Interface and Implementation
 * Handles all database operations for payslips
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { Prisma } from '@prisma/client';
import {
  PayslipFiltersDto,
  PaginatedPayslipsDto,
  PayslipStatisticsDto,
  UpdatePayslipPaymentDto,
} from '../dto';

type DecimalInput = number | string | Prisma.Decimal;

interface CreatePayslipInput {
  employeeId: string;
  payPeriodMonth: number;
  payPeriodYear: number;
  payDate: Date | string;
  baseSalary: DecimalInput;
  housingAllowance?: DecimalInput;
  transportAllowance?: DecimalInput;
  foodAllowance?: DecimalInput;
  otherAllowances?: DecimalInput;
  totalAllowances: DecimalInput;
  grossSalary: DecimalInput;
  insuranceDeduction?: DecimalInput;
  taxDeduction?: DecimalInput;
  loanDeduction?: DecimalInput;
  absenceDeduction?: DecimalInput;
  otherDeductions?: DecimalInput;
  totalDeductions: DecimalInput;
  netSalary: DecimalInput;
  workingDays?: number;
  absentDays?: number;
  overtimeHours?: DecimalInput;
  overtimeAmount?: DecimalInput;
  notes?: string | null;
  paymentNotes?: string | null;
  isPaid?: boolean;
  paidAt?: Date | string | null;
  paidBy?: string | null;
  payMethod?: string | null;
}

type PayslipWithEmployee = Prisma.PayslipGetPayload<{
  include: {
    employee: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        employeeNumber: true;
        department: true;
        position: true;
      };
    };
  };
}>;

type PayslipWithEmployeeSummary = Prisma.PayslipGetPayload<{
  include: {
    employee: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        employeeNumber: true;
        department: { select: { nameEn: true; nameAr: true } };
        position: { select: { nameEn: true } };
      };
    };
  };
}>;

/**
 * Payslip Repository Interface
 */
export interface IPayslipRepository {
  create(
    data: CreatePayslipInput,
    userId: string,
  ): Promise<PayslipWithEmployee>;
  findById(id: string): Promise<PayslipWithEmployee | null>;
  findByEmployeeId(employeeId: string): Promise<PayslipWithEmployee[]>;
  findAll(filters: PayslipFiltersDto): Promise<PaginatedPayslipsDto>;
  getStatistics(filters: PayslipFiltersDto): Promise<PayslipStatisticsDto>;
  updatePaymentStatus(
    id: string,
    data: UpdatePayslipPaymentDto,
    userId: string,
  ): Promise<PayslipWithEmployee>;
}

/**
 * Payslip Repository Implementation
 */
@Injectable()
export class PayslipRepository implements IPayslipRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(PayslipRepository.name);
  }

  private buildWhere(filters: PayslipFiltersDto): Prisma.PayslipWhereInput {
    const where: Prisma.PayslipWhereInput = {};

    if (filters.employeeId) {
      where.employeeId = filters.employeeId;
    }

    if (filters.payPeriodMonth) {
      where.payPeriodMonth = filters.payPeriodMonth;
    }

    if (filters.payPeriodYear) {
      where.payPeriodYear = filters.payPeriodYear;
    }

    if (filters.isPaid !== undefined) {
      where.isPaid = filters.isPaid;
    }

    if (filters.department) {
      where.employee = {
        department: {
          is: {
            nameEn: { contains: filters.department, mode: 'insensitive' },
          },
        },
      };
    }

    return where;
  }

  /**
   * Create a new payslip
   */
  async create(
    data: CreatePayslipInput,
    userId: string,
  ): Promise<PayslipWithEmployee> {
    try {
      const createData: Prisma.PayslipCreateInput = {
        employee: { connect: { id: data.employeeId } },
        payPeriodMonth: data.payPeriodMonth,
        payPeriodYear: data.payPeriodYear,
        payDate:
          data.payDate instanceof Date ? data.payDate : new Date(data.payDate),
        baseSalary: new Prisma.Decimal(data.baseSalary),
        housingAllowance: new Prisma.Decimal(data.housingAllowance ?? 0),
        transportAllowance: new Prisma.Decimal(data.transportAllowance ?? 0),
        foodAllowance: new Prisma.Decimal(data.foodAllowance ?? 0),
        otherAllowances: new Prisma.Decimal(data.otherAllowances ?? 0),
        totalAllowances: new Prisma.Decimal(data.totalAllowances),
        grossSalary: new Prisma.Decimal(data.grossSalary),
        insuranceDeduction: new Prisma.Decimal(data.insuranceDeduction ?? 0),
        taxDeduction: new Prisma.Decimal(data.taxDeduction ?? 0),
        loanDeduction: new Prisma.Decimal(data.loanDeduction ?? 0),
        absenceDeduction: new Prisma.Decimal(data.absenceDeduction ?? 0),
        otherDeductions: new Prisma.Decimal(data.otherDeductions ?? 0),
        totalDeductions: new Prisma.Decimal(data.totalDeductions),
        netSalary: new Prisma.Decimal(data.netSalary),
        workingDays: data.workingDays ?? 0,
        absentDays: data.absentDays ?? 0,
        overtimeHours: new Prisma.Decimal(data.overtimeHours ?? 0),
        overtimeAmount: new Prisma.Decimal(data.overtimeAmount ?? 0),
        notes: data.notes ?? null,
        paymentNotes: data.paymentNotes ?? null,
        isPaid: data.isPaid ?? false,
        paidAt: data.paidAt
          ? data.paidAt instanceof Date
            ? data.paidAt
            : new Date(data.paidAt)
          : null,
        paidBy: data.paidBy ?? null,
        payMethod: data.payMethod ?? null,
        processedBy: userId,
      };

      const payslip = await this.prisma.payslip.create({
        data: createData,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
              department: true,
              position: true,
            },
          },
        },
      });

      this.logger.log(`Payslip created: ${payslip.id}`);
      return payslip;
    } catch (error) {
      this.logger.error(`Failed to create payslip: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find payslip by ID
   */
  async findById(id: string): Promise<PayslipWithEmployee | null> {
    try {
      const payslip = await this.prisma.payslip.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
              department: true,
              position: true,
            },
          },
        },
      });

      return payslip;
    } catch (error) {
      this.logger.error(`Failed to find payslip: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find all payslips for an employee
   */
  async findByEmployeeId(employeeId: string): Promise<PayslipWithEmployee[]> {
    try {
      const payslips = await this.prisma.payslip.findMany({
        where: { employeeId },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
              department: true,
              position: true,
            },
          },
        },
        orderBy: [{ payPeriodYear: 'desc' }, { payPeriodMonth: 'desc' }],
      });

      return payslips;
    } catch (error) {
      this.logger.error(`Failed to find employee payslips: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find all payslips with filters and pagination
   */
  async findAll(filters: PayslipFiltersDto): Promise<PaginatedPayslipsDto> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.PayslipWhereInput = {};

      if (filters.employeeId) {
        where.employeeId = filters.employeeId;
      }

      if (filters.payPeriodMonth) {
        where.payPeriodMonth = filters.payPeriodMonth;
      }

      if (filters.payPeriodYear) {
        where.payPeriodYear = filters.payPeriodYear;
      }

      if (filters.isPaid !== undefined) {
        this.logger.log(
          `🎯 Adding isPaid filter: ${filters.isPaid} (type: ${typeof filters.isPaid})`,
        );
        where.isPaid = filters.isPaid;
      }

      if (filters.department) {
        where.employee = {
          department: {
            is: {
              nameEn: { contains: filters.department, mode: 'insensitive' },
            },
          },
        };
      }

      this.logger.log(`📋 Final where clause: ${JSON.stringify(where)}`);

      // Build orderBy
      const orderBy: Prisma.PayslipOrderByWithRelationInput = {};
      if (filters.sortBy) {
        const sortField = filters.sortBy;
        const sortOrder = filters.sortOrder || 'desc';

        if (sortField === 'employeeNumber') {
          orderBy.employee = { employeeNumber: sortOrder };
        } else {
          orderBy[sortField] = sortOrder;
        }
      } else {
        // Default sort
        orderBy.payDate = 'desc';
      }

      // Execute queries in parallel (data + count + aggregates)
      const [data, total, paidCount, aggregates] = await Promise.all([
        this.prisma.payslip.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeNumber: true,
                department: { select: { nameEn: true, nameAr: true } },
                position: { select: { nameEn: true } },
              },
            },
          },
        }) as Promise<PayslipWithEmployeeSummary[]>,
        this.prisma.payslip.count({ where }),
        this.prisma.payslip.count({ where: { ...where, isPaid: true } }),
        this.prisma.payslip.aggregate({
          where,
          _sum: { netSalary: true },
        }),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        paidCount,
        unpaidCount: total - paidCount,
        totalNetAmount: aggregates._sum.netSalary
          ? Number(aggregates._sum.netSalary)
          : 0,
      };
    } catch (error) {
      this.logger.error(`Failed to find payslips: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get aggregate statistics for payslip list KPI cards
   * independent from pagination.
   */
  async getStatistics(
    filters: PayslipFiltersDto,
  ): Promise<PayslipStatisticsDto> {
    try {
      const where = this.buildWhere(filters);

      const [total, paidCount, aggregates] = await Promise.all([
        this.prisma.payslip.count({ where }),
        this.prisma.payslip.count({ where: { ...where, isPaid: true } }),
        this.prisma.payslip.aggregate({
          where,
          _sum: { netSalary: true },
        }),
      ]);

      return {
        total,
        paidCount,
        unpaidCount: total - paidCount,
        totalNetAmount: aggregates._sum.netSalary
          ? Number(aggregates._sum.netSalary)
          : 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get payslip statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update payslip payment status
   */
  async updatePaymentStatus(
    id: string,
    data: UpdatePayslipPaymentDto,
    userId: string,
  ): Promise<PayslipWithEmployee> {
    try {
      const updateData: Prisma.PayslipUpdateInput = {
        isPaid: data.isPaid,
      };

      if (data.isPaid) {
        updateData.paidAt = data.paidAt ? new Date(data.paidAt) : new Date();
        updateData.paidBy = userId;
        updateData.payMethod = data.paymentMethod;
      } else {
        // Unpaid - clear payment fields
        updateData.paidAt = null;
        updateData.paidBy = null;
        updateData.payMethod = null;
      }

      if (data.paymentNotes) {
        updateData.paymentNotes = data.paymentNotes;
      }

      const payslip = await this.prisma.payslip.update({
        where: { id },
        data: updateData,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
              department: true,
              position: true,
            },
          },
        },
      });

      this.logger.log(`Payslip payment status updated: ${id}`);
      return payslip;
    } catch (error) {
      this.logger.error(
        `Failed to update payslip payment status: ${error.message}`,
      );
      throw error;
    }
  }
}

// Export token for dependency injection
export const PAYSLIP_REPOSITORY = Symbol('PAYSLIP_REPOSITORY');
