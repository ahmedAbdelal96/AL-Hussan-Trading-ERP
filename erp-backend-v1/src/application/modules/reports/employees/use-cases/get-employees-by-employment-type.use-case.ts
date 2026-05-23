/**
 * ============================================================================
 * GET EMPLOYEES BY EMPLOYMENT TYPE USE CASE
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  EmployeesByEmploymentTypeFiltersDto,
  EmployeesByEmploymentTypeResponseDto,
  EmploymentTypeItemDto,
  ExpiringContractDto,
} from '../dto';
import { EmploymentType } from '@prisma/client';
import { BaseReportService } from '../../services/base-report.service';

@Injectable()
export class GetEmployeesByEmploymentTypeUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: EmployeesByEmploymentTypeFiltersDto,
  ): Promise<EmployeesByEmploymentTypeResponseDto> {
    // Build where clause
    const where: any = {};

    if (filters.department) {
      where.department = filters.department;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // Date filtering
    if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);

      where.hireDate = { lte: endDate };
      where.OR = [
        { terminationDate: null },
        { terminationDate: { gte: startDate } },
      ];
    }

    // Get all employees
    const employees = await this.prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeNumber: true,
        firstName: true,
        lastName: true,
        department: { select: { nameEn: true } },
        position: { select: { nameEn: true } },
        employmentType: true,
        status: true,
        hireDate: true,
        contracts: {
          select: {
            contractType: true,
            startDate: true,
            endDate: true,
            isRenewable: true,
          },
          orderBy: {
            startDate: 'desc',
          },
          take: 1,
        },
      },
    });

    // Group by employment type
    const typeMap = new Map<
      EmploymentType,
      {
        count: number;
        activeCount: number;
        tenures: number[];
      }
    >();

    const now = new Date();

    employees.forEach((e) => {
      if (!typeMap.has(e.employmentType)) {
        typeMap.set(e.employmentType, {
          count: 0,
          activeCount: 0,
          tenures: [],
        });
      }

      const typeData = typeMap.get(e.employmentType)!;
      typeData.count++;

      if (e.status === 'ACTIVE') {
        typeData.activeCount++;
      }

      // Calculate tenure
      const hireDate = new Date(e.hireDate);
      const tenureDays = Math.floor(
        (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      typeData.tenures.push(tenureDays / 365);
    });

    const totalEmployees = employees.length;

    // Type names (localization)
    const typeNames: Record<EmploymentType, { en: string; ar: string }> = {
      PERMANENT: { en: 'Permanent', ar: 'دائم' },
      CONTRACT: { en: 'Contract', ar: 'تعاقد' },
      TEMPORARY: { en: 'Temporary', ar: 'مؤقت' },
      PART_TIME: { en: 'Part-Time', ar: 'دوام جزئي' },
      FULL_TIME: { en: 'Full-Time', ar: 'دوام كامل' },
      FREELANCE: { en: 'Freelance', ar: 'عمل حر' },
      CONSULTANT: { en: 'Consultant', ar: 'استشاري' },
      INTERN: { en: 'Intern', ar: 'متدرب' },
      TRAINEE: { en: 'Trainee', ar: 'متدرب تحت التجربة' },
      SEASONAL: { en: 'Seasonal', ar: 'موسمي' },
      ON_CALL: { en: 'On-Call', ar: 'عند الطلب' },
      PROBATION: { en: 'Probation', ar: 'تحت الاختبار' },
      REMOTE: { en: 'Remote', ar: 'عن بُعد' },
    };

    // Build employment types array
    let employmentTypes: EmploymentTypeItemDto[] = Array.from(
      typeMap.entries(),
    ).map(([employmentType, data]) => {
      const avgTenure =
        data.tenures.length > 0
          ? data.tenures.reduce((sum, t) => sum + t, 0) / data.tenures.length
          : 0;

      return {
        employmentType,
        typeName: typeNames[employmentType].en,
        typeNameAr: typeNames[employmentType].ar,
        employeeCount: data.count,
        activeCount: data.activeCount,
        percentage:
          totalEmployees > 0 ? (data.count / totalEmployees) * 100 : 0,
        avgTenure: parseFloat(avgTenure.toFixed(2)),
      };
    });

    // Sort
    const sortBy = filters.sortBy || 'employeeCount';
    const sortOrder = filters.sortOrder || 'desc';

    employmentTypes.sort((a, b) => {
      let valA: number | string;
      let valB: number | string;

      switch (sortBy) {
        case 'employeeCount':
          valA = a.employeeCount;
          valB = b.employeeCount;
          break;
        case 'percentage':
          valA = a.percentage;
          valB = b.percentage;
          break;
        case 'employmentType':
        default:
          valA = a.employmentType;
          valB = b.employmentType;
          break;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return sortOrder === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

    if (filters.search) {
      const query = filters.search.trim().toLowerCase();
      employmentTypes = employmentTypes.filter(
        (item) =>
          item.typeName.toLowerCase().includes(query) ||
          item.typeNameAr.toLowerCase().includes(query) ||
          item.employmentType.toLowerCase().includes(query),
      );
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 15;
    const totalEmploymentTypes = employmentTypes.length;
    const start = (page - 1) * limit;
    const paginatedEmploymentTypes = employmentTypes.slice(
      start,
      start + limit,
    );

    // Expiring contracts (if requested)
    let expiringContracts: ExpiringContractDto[] | undefined;
    let expiringContractsCount = 0;

    if (filters.expiringContractsDays) {
      const daysThreshold = filters.expiringContractsDays;
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

      expiringContracts = employees
        .filter((e) => {
          if (
            e.employmentType !== EmploymentType.CONTRACT &&
            e.employmentType !== EmploymentType.FREELANCE
          ) {
            return false;
          }

          if (!e.contracts || e.contracts.length === 0) {
            return false;
          }

          const latestContract = e.contracts[0];
          if (!latestContract.endDate) {
            return false;
          }

          const endDate = new Date(latestContract.endDate);
          return endDate <= thresholdDate && endDate >= now;
        })
        .map((e) => {
          const latestContract = e.contracts[0];
          const endDate = new Date(latestContract.endDate!);
          const daysUntilExpiry = Math.ceil(
            (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );

          return {
            employeeId: e.id,
            employeeNumber: e.employeeNumber,
            employeeName: `${e.firstName} ${e.lastName}`,
            department: e.department?.nameEn || 'Unknown',
            position: e.position?.nameEn || 'Unknown',
            employmentType: e.employmentType,
            contractEndDate: endDate.toISOString(),
            daysUntilExpiry,
            isRenewable: latestContract.isRenewable || false,
          };
        })
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

      expiringContractsCount = expiringContracts?.length || 0;
    }

    // Counts by type
    const permanentCount = typeMap.get(EmploymentType.PERMANENT)?.count || 0;
    const contractCount = typeMap.get(EmploymentType.CONTRACT)?.count || 0;
    const freelanceCount = typeMap.get(EmploymentType.FREELANCE)?.count || 0;
    const partTimeCount = typeMap.get(EmploymentType.PART_TIME)?.count || 0;

    return {
      employmentTypes: paginatedEmploymentTypes,
      expiringContracts,
      expiringContractsCount,
      totalEmployees,
      permanentCount,
      contractCount,
      freelanceCount,
      partTimeCount,
      meta: this.baseReportService.calculatePaginationMeta(
        page,
        limit,
        totalEmploymentTypes,
      ),
      month: filters.month || undefined,
      year: filters.year || undefined,
      generatedAt: new Date(),
    };
  }
}
