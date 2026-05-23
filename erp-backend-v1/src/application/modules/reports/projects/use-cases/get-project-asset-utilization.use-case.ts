/**
 * ============================================================================
 * GET PROJECT ASSET UTILIZATION USE CASE
 * ============================================================================
 *
 * Report 10: Assets assigned to each project with values and maintenance costs.
 * Answers: "Which equipment is deployed where, and what is it costing us?"
 *
 * Data Sources:
 *   - Project (base info + budget)
 *   - ProjectAsset (asset ↔ project assignment with allocation %)
 *   - Asset (code, name, type, status, purchasePrice)
 *   - Cost WHERE costType=MAINTENANCE AND referenceId=assetId (maintenance costs)
 *   - Site (site name)
 *
 * Asset Cost Model:
 *   allocatedAssetValue = purchasePrice × (allocationPercentage / 100)
 *   maintenanceCost     = MAINTENANCE costs where referenceId = assetId
 *                         (filtered to costs linked to this project, or all if shared)
 *   totalAssetCost      = allocatedAssetValue + maintenanceCost
 *   maintenanceIntensity= (maintenanceCost / allocatedAssetValue) × 100
 *
 * @module GetProjectAssetUtilizationUseCase
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { CostType, Prisma, ProjectStatus } from '@prisma/client';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { BaseReportService } from '../../services/base-report.service';
import { ProjectAssetUtilizationFiltersDto } from '../dto/projects-filters.dto';
import {
  AssetUtilizationSummaryDto,
  ProjectAssetDetailDto,
  ProjectAssetUtilizationItemDto,
  ProjectAssetUtilizationResponseDto,
} from '../dto/projects-responses-part3.dto';

@Injectable()
export class GetProjectAssetUtilizationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baseReport: BaseReportService,
  ) {}

  async execute(
    filters: ProjectAssetUtilizationFiltersDto,
  ): Promise<ProjectAssetUtilizationResponseDto> {
    const now = new Date();
    const month = filters.month ?? now.getMonth() + 1;
    const year = filters.year ?? now.getFullYear();
    const sortBy = filters.sortBy ?? 'totalAssetValue';
    const sortOrder = filters.sortOrder ?? 'desc';
    const includeAssetDetails = filters.includeAssetDetails ?? false;

    // ── 1. Fetch matching projects ─────────────────────────────────────────
    const projectWhere: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(filters.siteId && { siteId: filters.siteId }),
      ...(filters.managerId && { managerId: filters.managerId }),
      ...(filters.projectStatus && { status: filters.projectStatus }),
      OR: [
        {
          status: {
            in: [
              ProjectStatus.ACTIVE,
              ProjectStatus.PLANNING,
              ProjectStatus.ON_HOLD,
            ],
          },
        },
        {
          createdAt: {
            lte: new Date(year, month, 0, 23, 59, 59, 999),
          },
        },
      ],
    };

    const projects = await this.prisma.project.findMany({
      where: projectWhere,
      select: {
        id: true,
        projectCode: true,
        name: true,
        status: true,
        budget: true,
        siteId: true,
        site: { select: { name: true } },
      },
      orderBy: { projectCode: 'asc' },
    });

    if (projects.length === 0) {
      return this.buildEmptyResponse();
    }

    const projectIds = projects.map((p) => p.id);

    // ── 2. Active asset assignments per project ────────────────────────────
    const assetAssignments = await this.prisma.projectAsset.findMany({
      where: {
        projectId: { in: projectIds },
        isActive: true,
      },
      select: {
        id: true,
        projectId: true,
        assetId: true,
        percentage: true,
        assignedDate: true,
        returnDate: true,
        asset: {
          select: {
            id: true,
            assetNumber: true,
            name: true,
            assetType: true,
            status: true,
            purchasePrice: true,
          },
        },
      },
    });

    if (assetAssignments.length === 0) {
      // Projects exist but no assets assigned
      const emptyItems: ProjectAssetUtilizationItemDto[] = projects.map(
        (p) => ({
          projectId: p.id,
          projectCode: p.projectCode,
          projectName: p.name,
          status: p.status,
          siteId: p.siteId ?? undefined,
          siteName: p.site?.name ?? undefined,
          totalAssets: 0,
          totalAllocatedAssetValue: 0,
          totalMaintenanceCost: 0,
          totalAssetCost: 0,
          maintenanceIntensity: 0,
          ...(includeAssetDetails && { assets: [] }),
        }),
      );
      return {
        projects: emptyItems,
        summary: this.buildSummary(emptyItems),
        projectCount: emptyItems.length,
        currency: 'SAR',
        generatedAt: new Date().toISOString(),
      };
    }

    // ── 3. Maintenance costs per asset (linked to these projects) ─────────
    // We look for MAINTENANCE Cost records where:
    //   referenceId = assetId AND (projectId IN projectIds OR projectId IS NULL)
    // Then distribute maintenance cost proportionally if shared across projects.
    const uniqueAssetIds = [...new Set(assetAssignments.map((a) => a.assetId))];

    const maintenanceCostsRaw = await this.prisma.cost.groupBy({
      by: ['referenceId', 'projectId'],
      where: {
        costType: CostType.MAINTENANCE,
        referenceType: 'asset',
        referenceId: { in: uniqueAssetIds },
      },
      _sum: { amount: true },
    });

    // Build: Map<assetId, Map<projectId | null, amount>>
    const maintenanceByAssetProject = new Map<
      string,
      Map<string | null, number>
    >();
    for (const row of maintenanceCostsRaw) {
      if (!row.referenceId) continue;
      if (!maintenanceByAssetProject.has(row.referenceId)) {
        maintenanceByAssetProject.set(row.referenceId, new Map());
      }
      maintenanceByAssetProject
        .get(row.referenceId)!
        .set(row.projectId ?? null, Number(row._sum.amount ?? 0));
    }

    // ── 4. Group assignments by project ───────────────────────────────────
    const assignmentsByProject = new Map<string, typeof assetAssignments>();
    for (const pa of assetAssignments) {
      if (!assignmentsByProject.has(pa.projectId)) {
        assignmentsByProject.set(pa.projectId, []);
      }
      assignmentsByProject.get(pa.projectId)!.push(pa);
    }

    // ── 5. Helper: maintenance cost for (assetId, projectId) ──────────────
    // If there's a direct project-linked maintenance cost → use it
    // Else if there's an unlinked maintenance cost → distribute by allocation %
    const getMaintenanceCost = (
      assetId: string,
      projectId: string,
      allocationPct: number,
    ): number => {
      const assetMap = maintenanceByAssetProject.get(assetId);
      if (!assetMap) return 0;

      // Direct project-linked maintenance cost takes priority
      if (assetMap.has(projectId)) {
        return assetMap.get(projectId)!;
      }

      // Unlinked maintenance cost → distribute proportionally
      const unlinked = assetMap.get(null) ?? 0;
      if (unlinked > 0 && allocationPct > 0) {
        return this.baseReport.roundNumber(unlinked * (allocationPct / 100));
      }

      return 0;
    };

    // ── 6. Build per-project items ────────────────────────────────────────
    const items: ProjectAssetUtilizationItemDto[] = projects.map((p) => {
      const assignments = assignmentsByProject.get(p.id) ?? [];

      let totalAllocatedValue = 0;
      let totalMaintenanceCost = 0;
      const assetDetails: ProjectAssetDetailDto[] = [];

      for (const pa of assignments) {
        const purchasePrice = Number(pa.asset.purchasePrice ?? 0);
        const allocationPct = Number(pa.percentage ?? 100);
        const allocatedValue = purchasePrice * (allocationPct / 100);
        const maintenanceCost = getMaintenanceCost(
          pa.assetId,
          p.id,
          allocationPct,
        );
        const totalAssetCost = allocatedValue + maintenanceCost;

        totalAllocatedValue += allocatedValue;
        totalMaintenanceCost += maintenanceCost;

        if (includeAssetDetails) {
          assetDetails.push({
            assetId: pa.assetId,
            assetCode: pa.asset.assetNumber,
            assetName: pa.asset.name,
            assetType: pa.asset.assetType,
            assetStatus: pa.asset.status,
            purchasePrice: this.baseReport.roundNumber(purchasePrice),
            allocationPercentage: allocationPct,
            allocatedAssetValue: this.baseReport.roundNumber(allocatedValue),
            maintenanceCost: this.baseReport.roundNumber(maintenanceCost),
            totalAssetCost: this.baseReport.roundNumber(totalAssetCost),
            assignedDate: pa.assignedDate.toISOString().split('T')[0],
            returnDate: pa.returnDate
              ? pa.returnDate.toISOString().split('T')[0]
              : undefined,
          });
        }
      }

      const totalAssetCost = totalAllocatedValue + totalMaintenanceCost;
      const maintenanceIntensity =
        totalAllocatedValue > 0
          ? this.baseReport.roundNumber(
              (totalMaintenanceCost / totalAllocatedValue) * 100,
            )
          : 0;

      if (includeAssetDetails) {
        assetDetails.sort((a, b) => b.totalAssetCost - a.totalAssetCost);
      }

      return {
        projectId: p.id,
        projectCode: p.projectCode,
        projectName: p.name,
        status: p.status,
        siteId: p.siteId ?? undefined,
        siteName: p.site?.name ?? undefined,
        totalAssets: assignments.length,
        totalAllocatedAssetValue:
          this.baseReport.roundNumber(totalAllocatedValue),
        totalMaintenanceCost: this.baseReport.roundNumber(totalMaintenanceCost),
        totalAssetCost: this.baseReport.roundNumber(totalAssetCost),
        maintenanceIntensity,
        ...(includeAssetDetails && { assets: assetDetails }),
      };
    });

    // ── 7. Sort ───────────────────────────────────────────────────────────
    items.sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'totalAssets':
          diff = a.totalAssets - b.totalAssets;
          break;
        case 'totalAssetValue':
          diff = a.totalAllocatedAssetValue - b.totalAllocatedAssetValue;
          break;
        case 'maintenanceCost':
          diff = a.totalMaintenanceCost - b.totalMaintenanceCost;
          break;
      }
      return sortOrder === 'asc' ? diff : -diff;
    });

    return {
      projects: items,
      summary: this.buildSummary(items),
      projectCount: items.length,
      currency: 'SAR',
      generatedAt: new Date().toISOString(),
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private buildSummary(
    items: ProjectAssetUtilizationItemDto[],
  ): AssetUtilizationSummaryDto {
    const totalAssignedAssets = items.reduce((s, i) => s + i.totalAssets, 0);
    const totalAllocatedValue = items.reduce(
      (s, i) => s + i.totalAllocatedAssetValue,
      0,
    );
    const totalMaintenanceCost = items.reduce(
      (s, i) => s + i.totalMaintenanceCost,
      0,
    );
    const totalAssetCost = items.reduce((s, i) => s + i.totalAssetCost, 0);

    return {
      totalAssignedAssets,
      totalAllocatedAssetValue:
        this.baseReport.roundNumber(totalAllocatedValue),
      totalMaintenanceCost: this.baseReport.roundNumber(totalMaintenanceCost),
      totalAssetCost: this.baseReport.roundNumber(totalAssetCost),
      avgAssetsPerProject:
        items.length > 0
          ? this.baseReport.roundNumber(totalAssignedAssets / items.length)
          : 0,
      overallMaintenanceIntensity:
        totalAllocatedValue > 0
          ? this.baseReport.roundNumber(
              (totalMaintenanceCost / totalAllocatedValue) * 100,
            )
          : 0,
    };
  }

  private buildEmptyResponse(): ProjectAssetUtilizationResponseDto {
    return {
      projects: [],
      summary: {
        totalAssignedAssets: 0,
        totalAllocatedAssetValue: 0,
        totalMaintenanceCost: 0,
        totalAssetCost: 0,
        avgAssetsPerProject: 0,
        overallMaintenanceIntensity: 0,
      },
      projectCount: 0,
      currency: 'SAR',
      generatedAt: new Date().toISOString(),
    };
  }
}
