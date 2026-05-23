/**
 * ============================================================================
 * GET SITE PROFITABILITY USE CASE
 * ============================================================================
 *
 * Report 7: Per-site revenue vs costs with profit margin and rating.
 * Answers: "Which sites are profitable and which are running at a loss?"
 *
 * Formula:
 * - Revenue = sum(project.budget)
 * - Costs = sum(Cost.amount) + sum(CostAllocation.allocatedAmount) per site
 * - Profit = Revenue - Costs
 * - Margin = (Profit / Revenue) * 100  (null if Revenue = 0)
 *
 * Ratings:
 * - HIGH   : margin >= 20%
 * - MEDIUM : 0% <= margin < 20%
 * - LOW    : -20% <= margin < 0%
 * - LOSS   : margin < -20% (or null)
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  SiteProfitabilityFiltersDto,
  SiteProfitabilityResponseDto,
  SiteProfitabilityItemDto,
  SiteProjectCostDto,
  SiteProfitabilitySummaryDto,
} from '../dto';
import { getDefaultAccountingCostWhere } from '../../../finance/utils/cost-accounting-status.util';

type ProfitabilityRating = 'HIGH' | 'MEDIUM' | 'LOW' | 'LOSS';

function calcRating(margin: number | null): ProfitabilityRating {
  if (margin === null) return 'LOSS';
  if (margin >= 20) return 'HIGH';
  if (margin >= 0) return 'MEDIUM';
  if (margin >= -20) return 'LOW';
  return 'LOSS';
}

@Injectable()
export class GetSiteProfitabilityUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: SiteProfitabilityFiltersDto,
  ): Promise<SiteProfitabilityResponseDto> {
    // Build site where clause
    const where: any = { deletedAt: null };
    if (filters.status) where.status = filters.status;
    if (filters.city) where.city = filters.city;
    if (filters.country) where.country = filters.country;
    if (filters.state) where.state = filters.state;

    const sites = await this.prisma.site.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        projects: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            status: true,
            budget: true,
            costs: {
              where: getDefaultAccountingCostWhere(),
              select: { amount: true },
            },
            costAllocations: {
              where: { cost: getDefaultAccountingCostWhere() },
              select: { allocatedAmount: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Build result items
    let items: SiteProfitabilityItemDto[] = sites.map((site) => {
      let totalRevenue = 0;
      let totalDirectCosts = 0;
      let totalAllocatedCosts = 0;
      const projectDetails: SiteProjectCostDto[] = [];

      for (const project of site.projects) {
        const budget = Number(project.budget ?? 0);
        const directCost = project.costs.reduce(
          (sum, c) => sum + Number(c.amount ?? 0),
          0,
        );
        const allocatedCost = project.costAllocations.reduce(
          (sum, ca) => sum + Number(ca.allocatedAmount ?? 0),
          0,
        );
        const projectTotalCost = directCost + allocatedCost;

        totalRevenue += budget;
        totalDirectCosts += directCost;
        totalAllocatedCosts += allocatedCost;

        projectDetails.push({
          projectId: project.id,
          projectName: project.name,
          projectStatus: project.status,
          budget,
          directCost,
          allocatedCost,
          totalCost: projectTotalCost,
        });
      }

      const totalCosts = totalDirectCosts + totalAllocatedCosts;
      const profit = totalRevenue - totalCosts;
      const profitMargin =
        totalRevenue > 0
          ? Math.round((profit / totalRevenue) * 10000) / 100 // 2 decimal places
          : null;

      const item: SiteProfitabilityItemDto = {
        siteId: site.id,
        siteName: site.name,
        siteStatus: site.status,
        projectCount: site.projects.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        directCosts: Math.round(totalDirectCosts * 100) / 100,
        allocatedCosts: Math.round(totalAllocatedCosts * 100) / 100,
        totalCosts: Math.round(totalCosts * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        profitMargin,
        profitabilityRating: calcRating(profitMargin),
      };

      if (filters.includeProjectBreakdown) {
        item.projects = projectDetails;
      }

      return item;
    });

    // Apply post-aggregation filters
    if (filters.profitabilityRating) {
      items = items.filter(
        (s) => s.profitabilityRating === filters.profitabilityRating,
      );
    }
    if (filters.minMargin !== undefined) {
      items = items.filter(
        (s) => s.profitMargin !== null && s.profitMargin >= filters.minMargin!,
      );
    }
    if (filters.maxMargin !== undefined) {
      items = items.filter(
        (s) => s.profitMargin !== null && s.profitMargin <= filters.maxMargin!,
      );
    }

    // Sort
    const sortBy = filters.sortBy ?? 'profit';
    const sortOrder = filters.sortOrder ?? 'desc';
    items.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'profit') {
        cmp = a.profit - b.profit;
      } else if (sortBy === 'margin') {
        const aM = a.profitMargin ?? -Infinity;
        const bM = b.profitMargin ?? -Infinity;
        cmp = aM - bM;
      } else if (sortBy === 'revenue') {
        cmp = a.totalRevenue - b.totalRevenue;
      } else if (sortBy === 'siteName') {
        cmp = a.siteName.localeCompare(b.siteName);
      }
      return sortOrder === 'desc' ? -cmp : cmp;
    });

    // Summary
    const margins = items
      .filter((s) => s.profitMargin !== null)
      .map((s) => s.profitMargin as number);

    const summary: SiteProfitabilitySummaryDto = {
      totalSites: items.length,
      highCount: items.filter((s) => s.profitabilityRating === 'HIGH').length,
      mediumCount: items.filter((s) => s.profitabilityRating === 'MEDIUM')
        .length,
      lowCount: items.filter((s) => s.profitabilityRating === 'LOW').length,
      lossCount: items.filter((s) => s.profitabilityRating === 'LOSS').length,
      totalRevenue:
        Math.round(items.reduce((s, i) => s + i.totalRevenue, 0) * 100) / 100,
      totalCosts:
        Math.round(items.reduce((s, i) => s + i.totalCosts, 0) * 100) / 100,
      totalProfit:
        Math.round(items.reduce((s, i) => s + i.profit, 0) * 100) / 100,
      avgProfitMargin:
        margins.length > 0
          ? Math.round(
              (margins.reduce((s, m) => s + m, 0) / margins.length) * 100,
            ) / 100
          : null,
    };

    return {
      sites: items,
      summary,
      currency: 'SAR',
      generatedAt: new Date().toISOString(),
    };
  }
}
