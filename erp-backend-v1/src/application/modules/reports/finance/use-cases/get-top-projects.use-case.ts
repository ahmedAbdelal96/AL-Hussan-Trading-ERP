/**
 * ============================================================================
 * GET TOP PROJECTS USE CASE (v2)
 * ============================================================================
 *
 * Full paginated list of ALL projects ranked by total cost.
 * Supports: pagination, search by project name, date range, cost type, payment status.
 *
 * Fixed in v2:
 *   - Removed hardcoded limit=10 (was hiding 50+ projects)
 *   - Added server-side pagination with meta
 *   - Added project name search via DB (not in-memory)
 *   - Eliminated N+1: payment status breakdown done in one groupBy + in-memory map
 *
 * @module GetTopProjectsUseCase
 * @version 2.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import { PaymentStatus } from '@prisma/client';
import {
  TopProjectsFiltersDto,
  TopProjectsResponseDto,
  ProjectCostSummaryDto,
} from '../dto';
import { DEFAULT_ACCOUNTING_COST_STATUSES } from '../../../finance/utils/cost-accounting-status.util';

@Injectable()
export class GetTopProjectsUseCase {
  constructor(
    private prisma: PrismaService,
    private baseReportService: BaseReportService,
  ) {}

  async execute(
    filters: TopProjectsFiltersDto,
  ): Promise<TopProjectsResponseDto> {
    const page = filters.page || 1;
    const limit = filters.limit || 15;
    const { skip, take } = this.baseReportService.calculatePagination(
      page,
      limit,
    );

    const costWhere: any = {};

    // Date range filter
    if (filters.startDate || filters.endDate) {
      costWhere.transactionDate = this.baseReportService.applyDateRangeFilter(
        filters.startDate,
        filters.endDate,
      );
    }
    if (filters.costType) costWhere.costType = filters.costType;
    if (filters.paymentStatus) {
      costWhere.paymentStatus = filters.paymentStatus;
    } else {
      costWhere.paymentStatus = { in: DEFAULT_ACCOUNTING_COST_STATUSES };
    }

    // ── STEP 1: Aggregate direct costs per project ──────────────────────────
    const directGrouped = await this.prisma.cost.groupBy({
      by: ['projectId'],
      where: { ...costWhere, projectId: { not: null } },
      _sum: { amount: true },
      _count: { id: true },
    });

    // ── STEP 2: Aggregate allocated costs per project ────────────────────────
    const allocatedCostWhere: any = { isAllocated: true };
    if (costWhere.transactionDate)
      allocatedCostWhere.transactionDate = costWhere.transactionDate;
    if (costWhere.costType) allocatedCostWhere.costType = costWhere.costType;
    if (costWhere.paymentStatus)
      allocatedCostWhere.paymentStatus = costWhere.paymentStatus;

    const matchingAllocatedCosts = await this.prisma.cost.findMany({
      where: allocatedCostWhere,
      select: { id: true },
    });
    const allocatedCostIds = matchingAllocatedCosts.map((c) => c.id);

    const allocatedGrouped =
      allocatedCostIds.length > 0
        ? await this.prisma.costAllocation.groupBy({
            by: ['projectId'],
            where: { costId: { in: allocatedCostIds } },
            _sum: { allocatedAmount: true },
            _count: { id: true },
          })
        : [];

    // ── STEP 3: Merge into projectCostMap ────────────────────────────────────
    const projectCostMap = new Map<
      string,
      { totalCost: number; costCount: number }
    >();

    directGrouped.forEach((item) => {
      if (item.projectId) {
        projectCostMap.set(item.projectId, {
          totalCost: Number(item._sum.amount || 0),
          costCount: item._count.id,
        });
      }
    });

    allocatedGrouped.forEach((item) => {
      const existing = projectCostMap.get(item.projectId) || {
        totalCost: 0,
        costCount: 0,
      };
      existing.totalCost += Number(item._sum.allocatedAmount || 0);
      existing.costCount += item._count.id;
      projectCostMap.set(item.projectId, existing);
    });

    if (projectCostMap.size === 0) {
      return {
        projects: [],
        totalAmount: 0,
        totalProjects: 0,
        currency: 'SAR',
        meta: this.baseReportService.calculatePaginationMeta(page, limit, 0),
        generatedAt: new Date(),
      };
    }

    // ── STEP 4: Fetch project details (with optional name search) ────────────
    const projectIds = Array.from(projectCostMap.keys());
    const projectWhere: any = { id: { in: projectIds } };
    if (filters.search?.trim()) {
      projectWhere.name = {
        contains: filters.search.trim(),
        mode: 'insensitive',
      };
    }

    const allMatchingProjects = await this.prisma.project.findMany({
      where: projectWhere,
      select: { id: true, name: true },
    });

    // ── STEP 5: Sort all matching projects by totalCost desc ─────────────────
    const allSorted = allMatchingProjects
      .map((proj) => ({
        projectId: proj.id,
        projectName: proj.name,
        ...(projectCostMap.get(proj.id) || { totalCost: 0, costCount: 0 }),
      }))
      .sort((a, b) => b.totalCost - a.totalCost);

    const totalProjects = allSorted.length;
    const grandTotalAmount = allSorted.reduce((sum, p) => sum + p.totalCost, 0);

    // ── STEP 6: Apply pagination ─────────────────────────────────────────────
    const paginated = allSorted.slice(skip, skip + take);

    // ── STEP 7: Get payment status breakdown in ONE query (no N+1) ──────────
    const paginatedIds = paginated.map((p) => p.projectId);
    const statusBreakdowns = await this.prisma.cost.groupBy({
      by: ['projectId', 'paymentStatus'],
      where: { ...costWhere, projectId: { in: paginatedIds } },
      _sum: { amount: true },
    });

    // Build a map: projectId → { paid, pending, approved }
    const statusMap = new Map<
      string,
      { paid: number; pending: number; approved: number }
    >();
    statusBreakdowns.forEach((row) => {
      if (!row.projectId) return;
      const entry = statusMap.get(row.projectId) || {
        paid: 0,
        pending: 0,
        approved: 0,
      };
      const amount = Number(row._sum.amount || 0);
      if (row.paymentStatus === PaymentStatus.PAID) entry.paid += amount;
      else if (row.paymentStatus === PaymentStatus.PENDING)
        entry.pending += amount;
      else if (row.paymentStatus === PaymentStatus.APPROVED)
        entry.approved += amount;
      statusMap.set(row.projectId, entry);
    });

    // ── STEP 8: Assemble final response ─────────────────────────────────────
    const projectsData: ProjectCostSummaryDto[] = paginated.map((item) => {
      const status = statusMap.get(item.projectId) || {
        paid: 0,
        pending: 0,
        approved: 0,
      };
      return {
        projectId: item.projectId,
        projectName: item.projectName,
        totalCost: item.totalCost,
        costCount: item.costCount,
        paidAmount: status.paid,
        pendingAmount: status.pending,
        approvedAmount: status.approved,
        percentage: this.baseReportService.calculatePercentage(
          item.totalCost,
          grandTotalAmount,
        ),
      };
    });

    return {
      projects: projectsData,
      totalAmount: grandTotalAmount,
      totalProjects,
      currency: 'SAR',
      meta: this.baseReportService.calculatePaginationMeta(
        page,
        limit,
        totalProjects,
      ),
      generatedAt: new Date(),
    };
  }
}
