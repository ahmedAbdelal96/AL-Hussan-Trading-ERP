import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  SitesPerformanceFiltersDto,
  SitesPerformanceResponseDto,
  SitePerformanceDetailDto,
  ProjectCompletionMetricsDto,
  SiteROIMetricsDto,
} from '../dto';
import { Prisma } from '@prisma/client';

/**
 * Use Case: Sites Performance Report
 *
 * Comprehensive performance evaluation of all sites.
 * Calculates composite performance scores for strategic decision-making.
 *
 * Business Value:
 * - Identify high-performing vs underperforming sites
 * - Support data-driven site closure decisions
 * - Benchmark site performance across portfolio
 * - Guide resource allocation and investment decisions
 *
 * Performance Scoring (0-100):
 * - Project completion rate: 40% weight
 * - Capacity utilization: 30% weight
 * - ROI per square meter: 20% weight
 * - Budget efficiency: 10% weight
 */
@Injectable()
export class GetSitesPerformanceUseCase {
  private readonly logger = new Logger(GetSitesPerformanceUseCase.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: SitesPerformanceFiltersDto,
  ): Promise<SitesPerformanceResponseDto> {
    try {
      const whereClause = this.buildWhereClause(filters);

      const sites = await this.prisma.site.findMany({
        where: whereClause,
        select: {
          id: true,
          code: true,
          name: true,
          area: true,
          capacity: true,
          status: true,
          projects: {
            where: { deletedAt: null },
            select: {
              id: true,
              status: true,
              budget: true,
              completionPercentage: true,
              actualStartDate: true,
              actualEndDate: true,
              plannedEndDate: true,
            },
          },
        },
      });

      const performances = this.calculatePerformance(sites, filters);
      const highPerforming = performances.filter(
        (p) => p.performanceScore >= 70,
      ).length;
      const lowPerforming = performances.filter(
        (p) => p.performanceScore < 40,
      ).length;
      const candidatesForClosure = this.identifyCandidatesForClosure(
        performances,
        filters,
      );

      this.logger.debug(
        `Sites performance report generated: ${performances.length} sites, ${highPerforming} high performing`,
      );

      return {
        sites: performances,
        averagePerformanceScore:
          performances.length > 0
            ? Math.round(
                (performances.reduce((sum, p) => sum + p.performanceScore, 0) /
                  performances.length) *
                  10,
              ) / 10
            : 0,
        highPerformingSites: highPerforming,
        lowPerformingSites: lowPerforming,
        candidatesForClosure,
      };
    } catch (error) {
      this.logger.error(
        `Error generating sites performance report: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Build WHERE clause for filtering sites
   */
  private buildWhereClause(
    filters: SitesPerformanceFiltersDto,
  ): Prisma.SiteWhereInput {
    const where: Prisma.SiteWhereInput = {
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.city) {
      where.city = {
        contains: filters.city,
        mode: 'insensitive' as Prisma.QueryMode,
      };
    }

    return where;
  }

  /**
   * Calculate performance metrics and score for each site
   */
  private calculatePerformance(
    sites: Array<{
      id: string;
      code: string;
      name: string;
      area: Prisma.Decimal | null;
      capacity: number | null;
      status: string;
      projects: Array<{
        id: string;
        status: string;
        budget: Prisma.Decimal | null;
        completionPercentage: Prisma.Decimal;
        actualStartDate: Date | null;
        actualEndDate: Date | null;
        plannedEndDate: Date | null;
      }>;
    }>,
    filters: SitesPerformanceFiltersDto,
  ): SitePerformanceDetailDto[] {
    let performances = sites.map((site) => {
      // Project completion metrics
      const projectMetrics = this.calculateProjectMetrics(site.projects);

      // ROI metrics
      const roiMetrics = this.calculateROIMetrics(site.projects, site.area);

      // Performance score calculation
      const completionScore =
        projectMetrics.totalProjects > 0 ? projectMetrics.completionRate : 50;
      const utilizationScore =
        site.capacity && site.capacity > 0
          ? Math.min(100, ((site.projects.length * 50) / site.capacity) * 100)
          : 50;
      const roiScore =
        roiMetrics.roiPerSquareMeter > 500
          ? 100
          : roiMetrics.roiPerSquareMeter > 100
            ? 75
            : 50;
      const budgetEfficiencyScore = projectMetrics.totalProjects > 0 ? 80 : 50;

      // Composite score (weighted average)
      const performanceScore =
        completionScore * 0.4 +
        utilizationScore * 0.3 +
        roiScore * 0.2 +
        budgetEfficiencyScore * 0.1;

      // Performance rating
      const performanceRating =
        performanceScore >= 70
          ? 'HIGH'
          : performanceScore >= 40
            ? 'MEDIUM'
            : 'LOW';

      return {
        siteId: site.id,
        siteCode: site.code,
        siteName: site.name,
        projectMetrics,
        roiMetrics,
        performanceScore: Math.round(performanceScore * 10) / 10,
        performanceRating,
      };
    });

    // Apply filters
    if (filters.minProjects !== undefined) {
      performances = performances.filter(
        (p) => p.projectMetrics.totalProjects >= filters.minProjects!,
      );
    }

    // Sort by performance
    if (filters.sortBy === 'roi') {
      performances.sort((a, b) =>
        filters.sortOrder === 'desc'
          ? b.roiMetrics.roiPerSquareMeter - a.roiMetrics.roiPerSquareMeter
          : a.roiMetrics.roiPerSquareMeter - b.roiMetrics.roiPerSquareMeter,
      );
    } else if (filters.sortBy === 'projectValue') {
      performances.sort((a, b) =>
        filters.sortOrder === 'desc'
          ? b.roiMetrics.totalProjectBudget - a.roiMetrics.totalProjectBudget
          : a.roiMetrics.totalProjectBudget - b.roiMetrics.totalProjectBudget,
      );
    } else {
      // Sort by performance score
      performances.sort((a, b) =>
        filters.sortOrder === 'desc'
          ? b.performanceScore - a.performanceScore
          : a.performanceScore - b.performanceScore,
      );
    }

    return performances;
  }

  /**
   * Calculate project completion metrics
   */
  private calculateProjectMetrics(
    projects: Array<{
      status: string;
      budget: Prisma.Decimal | null;
      completionPercentage: Prisma.Decimal;
    }>,
  ): ProjectCompletionMetricsDto {
    if (projects.length === 0) {
      return {
        totalProjects: 0,
        completedProjects: 0,
        completionRate: 0,
        averageCompletionPercentage: 0,
      };
    }

    const completedProjects = projects.filter(
      (p) => p.status === 'COMPLETED',
    ).length;
    const avgCompletion =
      projects.reduce(
        (sum, p) => sum + Number(p.completionPercentage || 0),
        0,
      ) / projects.length;

    return {
      totalProjects: projects.length,
      completedProjects,
      completionRate:
        Math.round((completedProjects / projects.length) * 1000) / 10,
      averageCompletionPercentage: Math.round(avgCompletion * 10) / 10,
    };
  }

  /**
   * Calculate ROI metrics
   */
  private calculateROIMetrics(
    projects: Array<{ budget: Prisma.Decimal | null }>,
    area: Prisma.Decimal | null,
  ): SiteROIMetricsDto {
    const totalBudget = projects.reduce(
      (sum, p) => sum + Number(p.budget || 0),
      0,
    );
    const siteArea = Number(area || 0);

    return {
      totalProjectBudget: totalBudget,
      siteArea: Math.round(siteArea * 100) / 100,
      roiPerSquareMeter:
        siteArea > 0 ? Math.round((totalBudget / siteArea) * 100) / 100 : 0,
      profitabilityRating:
        totalBudget / (siteArea || 1) > 500
          ? 'HIGH'
          : totalBudget / (siteArea || 1) > 100
            ? 'MEDIUM'
            : 'LOW',
    };
  }

  /**
   * Identify sites as candidates for closure
   * Criteria: low performance score, no active projects, low utilization
   */
  private identifyCandidatesForClosure(
    performances: SitePerformanceDetailDto[],
    filters: SitesPerformanceFiltersDto,
  ): number {
    if (!filters.includeUnderutilizedSites) {
      return 0;
    }

    return performances.filter(
      (p) => p.performanceScore < 30 && p.projectMetrics.totalProjects === 0,
    ).length;
  }
}
