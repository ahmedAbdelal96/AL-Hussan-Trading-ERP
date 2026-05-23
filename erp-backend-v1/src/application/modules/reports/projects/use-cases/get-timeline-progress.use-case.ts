/**
 * ============================================================================
 * GET TIMELINE PROGRESS USE CASE
 * ============================================================================
 *
 * Schedule performance analysis with SPI (Schedule Performance Index)
 *
 * Features:
 * - Timeline status classification (on time/behind/ahead)
 * - Days variance calculation
 * - Schedule Performance Index (SPI)
 * - At-risk project identification
 * - Duration analysis
 *
 * @module GetTimelineProgressUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import {
  TimelineProgressFiltersDto,
  TimelineProgressResponseDto,
  ProjectTimelineItemDto,
  TimelineStatusSummaryDto,
  TimelineStatus,
} from '../dto';
import { ProjectStatus, Prisma } from '@prisma/client';

@Injectable()
export class GetTimelineProgressUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReportService: BaseReportService,
  ) {}

  /**
   * Execute the use case
   */
  async execute(
    filters: TimelineProgressFiltersDto,
  ): Promise<TimelineProgressResponseDto> {
    const now = new Date();
    const month = filters.month || now.getMonth() + 1;
    const year = filters.year || now.getFullYear();

    // Build base filter
    const baseFilter = this.buildBaseFilter(filters, month, year);

    // Get all projects
    const projects = await this.prisma.project.findMany({
      where: baseFilter,
      select: {
        id: true,
        projectCode: true,
        name: true,
        status: true,
        plannedStartDate: true,
        actualStartDate: true,
        plannedEndDate: true,
        completionPercentage: true,
      },
    });

    // Build timeline items
    const currentDate = new Date();
    const timelineItems: ProjectTimelineItemDto[] = projects
      .map((project) => {
        const completion = Number(project.completionPercentage || 0);

        // Calculate timeline metrics
        const metrics = this.calculateTimelineMetrics(
          project.plannedStartDate,
          project.actualStartDate,
          project.plannedEndDate,
          completion,
          currentDate,
        );

        const timelineStatus = this.determineTimelineStatus(
          metrics.daysVariance,
          project.actualStartDate,
        );

        return {
          projectId: project.id,
          projectCode: project.projectCode,
          projectName: project.name,
          status: project.status,
          timelineStatus,
          plannedStartDate: project.plannedStartDate
            ?.toISOString()
            .split('T')[0],
          actualStartDate: project.actualStartDate?.toISOString().split('T')[0],
          plannedEndDate: project.plannedEndDate?.toISOString().split('T')[0],
          expectedCompletionDate: metrics.expectedCompletionDate
            ?.toISOString()
            .split('T')[0],
          completionPercentage: this.baseReportService.roundNumber(completion),
          plannedDuration: metrics.plannedDuration,
          elapsedDays: metrics.elapsedDays,
          daysRemaining: metrics.daysRemaining,
          daysVariance: metrics.daysVariance,
          schedulePerformance: this.baseReportService.roundNumber(
            metrics.schedulePerformance,
          ),
          isAtRisk: metrics.isAtRisk,
        };
      })
      .filter((item) => {
        // Apply timeline status filter
        if (
          filters.timelineStatus &&
          item.timelineStatus !== filters.timelineStatus
        ) {
          return false;
        }
        // Apply completion filters
        if (
          filters.minCompletion !== undefined &&
          item.completionPercentage < filters.minCompletion
        ) {
          return false;
        }
        if (
          filters.maxCompletion !== undefined &&
          item.completionPercentage > filters.maxCompletion
        ) {
          return false;
        }
        return true;
      });

    // Sort items
    const sortedItems = this.sortItems(
      timelineItems,
      filters.sortBy || 'daysVariance',
    );

    // Calculate timeline summary
    const timelineSummary = this.calculateTimelineSummary(timelineItems);

    // Calculate totals
    const totalProjects = timelineItems.length;
    const onTimeCount = timelineItems.filter(
      (p) => p.timelineStatus === TimelineStatus.ON_TIME,
    ).length;
    const behindScheduleCount = timelineItems.filter(
      (p) => p.timelineStatus === TimelineStatus.BEHIND_SCHEDULE,
    ).length;
    const aheadOfScheduleCount = timelineItems.filter(
      (p) => p.timelineStatus === TimelineStatus.AHEAD_OF_SCHEDULE,
    ).length;
    const notStartedCount = timelineItems.filter(
      (p) => p.timelineStatus === TimelineStatus.NOT_STARTED,
    ).length;
    const atRiskCount = timelineItems.filter((p) => p.isAtRisk).length;

    const avgDaysVariance =
      totalProjects > 0
        ? timelineItems.reduce((sum, p) => sum + p.daysVariance, 0) /
          totalProjects
        : 0;

    const avgSchedulePerformance =
      totalProjects > 0
        ? timelineItems.reduce((sum, p) => sum + p.schedulePerformance, 0) /
          totalProjects
        : 0;

    const avgCompletion =
      totalProjects > 0
        ? timelineItems.reduce((sum, p) => sum + p.completionPercentage, 0) /
          totalProjects
        : 0;

    return {
      projects: sortedItems,
      timelineSummary,
      totalProjects,
      onTimeCount,
      behindScheduleCount,
      aheadOfScheduleCount,
      notStartedCount,
      atRiskCount,
      avgDaysVariance: this.baseReportService.roundNumber(avgDaysVariance),
      avgSchedulePerformance: this.baseReportService.roundNumber(
        avgSchedulePerformance,
      ),
      avgCompletion: this.baseReportService.roundNumber(avgCompletion),
      month,
      year,
      generatedAt: new Date(),
    };
  }

  /**
   * Build base filter
   */
  private buildBaseFilter(
    filters: TimelineProgressFiltersDto,
    month: number,
    year: number,
  ): Prisma.ProjectWhereInput {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      plannedEndDate: { not: null }, // Only projects with timeline
      OR: [
        { createdAt: { gte: startDate, lte: endDate } },
        { updatedAt: { gte: startDate, lte: endDate } },
        { status: { in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING] } },
      ],
    };

    if (filters.projectStatus) {
      where.status = filters.projectStatus;
    }

    if (filters.siteId) {
      where.siteId = filters.siteId;
    }

    if (filters.managerId) {
      where.managerId = filters.managerId;
    }

    return where;
  }

  /**
   * Calculate timeline metrics
   */
  private calculateTimelineMetrics(
    plannedStart: Date | null,
    actualStart: Date | null,
    plannedEnd: Date | null,
    completion: number,
    currentDate: Date,
  ) {
    // Planned duration
    const plannedDuration =
      plannedStart && plannedEnd
        ? Math.ceil(
            (plannedEnd.getTime() - plannedStart.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

    // Elapsed days
    const elapsedDays = actualStart
      ? Math.ceil(
          (currentDate.getTime() - actualStart.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    // Expected completion date
    let expectedCompletionDate: Date | undefined;
    if (actualStart && completion > 0 && completion < 100) {
      const daysToComplete = (elapsedDays / completion) * 100;
      expectedCompletionDate = new Date(
        actualStart.getTime() + daysToComplete * 24 * 60 * 60 * 1000,
      );
    } else if (plannedEnd) {
      expectedCompletionDate = plannedEnd;
    }

    // Days remaining
    const daysRemaining = plannedEnd
      ? Math.ceil(
          (plannedEnd.getTime() - currentDate.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    // Days variance (negative = behind, positive = ahead)
    let daysVariance = 0;
    if (expectedCompletionDate && plannedEnd) {
      daysVariance = Math.ceil(
        (plannedEnd.getTime() - expectedCompletionDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
    }

    // Schedule Performance Index (SPI)
    // SPI = Earned Value / Planned Value
    // Simplified: SPI = Completion% / (Elapsed days / Planned duration)
    let schedulePerformance = 1.0;
    if (plannedDuration > 0 && elapsedDays > 0) {
      const plannedProgress = (elapsedDays / plannedDuration) * 100;
      schedulePerformance =
        plannedProgress > 0 ? completion / plannedProgress : 0;
    }

    // At risk: Behind schedule by more than 7 days OR SPI < 0.8
    const isAtRisk = daysVariance < -7 || schedulePerformance < 0.8;

    return {
      plannedDuration,
      elapsedDays,
      daysRemaining,
      daysVariance,
      schedulePerformance,
      expectedCompletionDate,
      isAtRisk,
    };
  }

  /**
   * Determine timeline status
   */
  private determineTimelineStatus(
    daysVariance: number,
    actualStart: Date | null,
  ): TimelineStatus {
    if (!actualStart) {
      return TimelineStatus.NOT_STARTED;
    }

    // Within ±3 days tolerance
    if (daysVariance >= -3 && daysVariance <= 3) {
      return TimelineStatus.ON_TIME;
    }

    if (daysVariance < -3) {
      return TimelineStatus.BEHIND_SCHEDULE;
    }

    return TimelineStatus.AHEAD_OF_SCHEDULE;
  }

  /**
   * Calculate timeline summary
   */
  private calculateTimelineSummary(
    projects: ProjectTimelineItemDto[],
  ): TimelineStatusSummaryDto[] {
    const statusMap = new Map<
      TimelineStatus,
      { count: number; totalVariance: number; totalCompletion: number }
    >();

    projects.forEach((project) => {
      if (!statusMap.has(project.timelineStatus)) {
        statusMap.set(project.timelineStatus, {
          count: 0,
          totalVariance: 0,
          totalCompletion: 0,
        });
      }

      const data = statusMap.get(project.timelineStatus)!;
      data.count++;
      data.totalVariance += project.daysVariance;
      data.totalCompletion += project.completionPercentage;
    });

    const totalProjects = projects.length;

    return Array.from(statusMap.entries()).map(([status, data]) => ({
      timelineStatus: status,
      statusName: this.getStatusName(status),
      statusNameAr: this.getStatusNameAr(status),
      projectCount: data.count,
      percentage: this.baseReportService.calculatePercentage(
        data.count,
        totalProjects,
      ),
      avgDaysVariance: this.baseReportService.roundNumber(
        data.count > 0 ? data.totalVariance / data.count : 0,
      ),
      avgCompletion: this.baseReportService.roundNumber(
        data.count > 0 ? data.totalCompletion / data.count : 0,
      ),
    }));
  }

  /**
   * Sort items
   */
  private sortItems(
    items: ProjectTimelineItemDto[],
    sortBy:
      | 'daysVariance'
      | 'completion'
      | 'schedulePerformance'
      | 'daysRemaining',
  ): ProjectTimelineItemDto[] {
    return items.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'daysVariance':
          aValue = a.daysVariance;
          bValue = b.daysVariance;
          break;
        case 'completion':
          aValue = a.completionPercentage;
          bValue = b.completionPercentage;
          break;
        case 'schedulePerformance':
          aValue = a.schedulePerformance;
          bValue = b.schedulePerformance;
          break;
        case 'daysRemaining':
          aValue = a.daysRemaining;
          bValue = b.daysRemaining;
          break;
      }

      return aValue - bValue; // Ascending (most behind first)
    });
  }

  /**
   * Get timeline status name (EN)
   */
  private getStatusName(status: TimelineStatus): string {
    const names: Record<TimelineStatus, string> = {
      [TimelineStatus.ON_TIME]: 'On Time',
      [TimelineStatus.BEHIND_SCHEDULE]: 'Behind Schedule',
      [TimelineStatus.AHEAD_OF_SCHEDULE]: 'Ahead of Schedule',
      [TimelineStatus.NOT_STARTED]: 'Not Started',
    };
    return names[status];
  }

  /**
   * Get timeline status name (AR)
   */
  private getStatusNameAr(status: TimelineStatus): string {
    const names: Record<TimelineStatus, string> = {
      [TimelineStatus.ON_TIME]: 'في الموعد',
      [TimelineStatus.BEHIND_SCHEDULE]: 'متأخر عن الجدول',
      [TimelineStatus.AHEAD_OF_SCHEDULE]: 'متقدم على الجدول',
      [TimelineStatus.NOT_STARTED]: 'لم يبدأ',
    };
    return names[status];
  }
}
