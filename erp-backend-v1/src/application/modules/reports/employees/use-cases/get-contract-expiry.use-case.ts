/**
 * ============================================================================
 * GET CONTRACT EXPIRY USE CASE
 * ============================================================================
 *
 * Report 9: Employees with contracts expiring soon.
 * Only includes CONTRACT, FREELANCE, PART_TIME employment types.
 * Answers: "Which employee contracts are about to expire?"
 *
 * Urgency levels:
 * - EXPIRED   : daysUntilExpiry < 0
 * - CRITICAL  : 0–7 days
 * - HIGH      : 8–30 days
 * - MEDIUM    : 31–60 days
 * - LOW       : 61–daysAhead (default 90)
 * - NO_EXPIRY : endDate is null (excluded by default)
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  ContractExpiryFiltersDto,
  ContractExpiryResponseDto,
  ContractExpiryItemDto,
  ContractExpirySummaryDto,
} from '../dto';
import { EmploymentType } from '@prisma/client';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

type Urgency = 'EXPIRED' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NO_EXPIRY';

const URGENCY_ORDER: Record<Urgency, number> = {
  EXPIRED: 0,
  CRITICAL: 1,
  HIGH: 2,
  MEDIUM: 3,
  LOW: 4,
  NO_EXPIRY: 5,
};

function calcUrgency(
  daysUntilExpiry: number | null,
  daysAhead: number,
): Urgency {
  if (daysUntilExpiry === null) return 'NO_EXPIRY';
  if (daysUntilExpiry < 0) return 'EXPIRED';
  if (daysUntilExpiry <= 7) return 'CRITICAL';
  if (daysUntilExpiry <= 30) return 'HIGH';
  if (daysUntilExpiry <= 60) return 'MEDIUM';
  if (daysUntilExpiry <= daysAhead) return 'LOW';
  return 'NO_EXPIRY'; // beyond daysAhead window
}

@Injectable()
export class GetContractExpiryUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: ContractExpiryFiltersDto,
  ): Promise<ContractExpiryResponseDto> {
    const daysAhead = filters.daysAhead ?? 90;
    const includeExpired = filters.includeExpired !== false; // default true
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build employee where clause (only non-permanent types)
    const where: any = {
      deletedAt: null,
      employmentType: {
        in: [
          EmploymentType.CONTRACT,
          EmploymentType.FREELANCE,
          EmploymentType.PART_TIME,
        ],
      },
    };
    if (filters.department) {
      where.department = {
        nameEn: { contains: filters.department, mode: 'insensitive' },
      };
    }
    if (filters.status) where.status = filters.status;

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
        contracts: {
          orderBy: { startDate: 'desc' },
          take: 1,
          select: {
            contractType: true,
            startDate: true,
            endDate: true,
            isRenewable: true,
          },
        },
      },
    });

    // Build result items
    let contracts: ContractExpiryItemDto[] = [];

    for (const emp of employees) {
      const contract = emp.contracts[0];
      if (!contract) continue; // skip employees with no contracts

      const endDate = contract.endDate;
      const daysUntilExpiry =
        endDate !== null
          ? Math.floor((endDate.getTime() - today.getTime()) / MS_PER_DAY)
          : null;

      const urgency = calcUrgency(daysUntilExpiry, daysAhead);

      // Exclude NO_EXPIRY (endDate is null or beyond window) — always skip these
      if (urgency === 'NO_EXPIRY') continue;

      // Exclude EXPIRED if not requested
      if (!includeExpired && urgency === 'EXPIRED') continue;

      contracts.push({
        employeeId: emp.id,
        employeeNumber: emp.employeeNumber,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department?.nameEn ?? '',
        position: emp.position?.nameEn ?? '',
        employmentType: emp.employmentType,
        contractType: contract.contractType,
        contractStartDate: contract.startDate.toISOString(),
        contractEndDate: endDate ? endDate.toISOString() : null,
        daysUntilExpiry,
        urgency,
        isRenewable: contract.isRenewable,
      });
    }

    // Apply urgency filter
    if (filters.urgency) {
      contracts = contracts.filter((c) => c.urgency === filters.urgency);
    }

    // Sort
    const sortBy = filters.sortBy ?? 'expiryDate';
    const sortOrder = filters.sortOrder ?? 'asc';
    contracts.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'expiryDate') {
        const aD = a.daysUntilExpiry ?? Number.MAX_SAFE_INTEGER;
        const bD = b.daysUntilExpiry ?? Number.MAX_SAFE_INTEGER;
        cmp = aD - bD;
      } else if (sortBy === 'employeeName') {
        cmp = a.employeeName.localeCompare(b.employeeName);
      } else if (sortBy === 'urgency') {
        cmp = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    // Summary
    const summary: ContractExpirySummaryDto = {
      totalContracts: contracts.length,
      expiredCount: contracts.filter((c) => c.urgency === 'EXPIRED').length,
      criticalCount: contracts.filter((c) => c.urgency === 'CRITICAL').length,
      highCount: contracts.filter((c) => c.urgency === 'HIGH').length,
      mediumCount: contracts.filter((c) => c.urgency === 'MEDIUM').length,
      lowCount: contracts.filter((c) => c.urgency === 'LOW').length,
    };

    return {
      contracts,
      summary,
      generatedAt: new Date().toISOString(),
      daysAhead,
    };
  }
}
