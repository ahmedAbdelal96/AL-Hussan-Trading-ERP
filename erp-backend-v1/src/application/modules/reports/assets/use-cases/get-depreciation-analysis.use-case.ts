/**
 * ============================================================================
 * GET DEPRECIATION ANALYSIS USE CASE
 * ============================================================================
 *
 * Business logic for generating asset depreciation and value analysis report.
 * Provides financial metrics for asset value tracking and ROI analysis.
 *
 * @module GetDepreciationAnalysisUseCase
 * @version 1.0.0
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  DepreciationAnalysisFiltersDto,
  DepreciationAnalysisResponseDto,
  TypeDepreciationDto,
  AgeGroupBreakdownDto,
  HighValueAssetDto,
} from '../dto';

@Injectable()
export class GetDepreciationAnalysisUseCase {
  private readonly logger = new Logger(GetDepreciationAnalysisUseCase.name);

  // Default annual depreciation rate (20%)
  private readonly DEFAULT_DEPRECIATION_RATE = 20;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute depreciation analysis report
   */
  async execute(
    filters: DepreciationAnalysisFiltersDto,
  ): Promise<DepreciationAnalysisResponseDto> {
    try {
      this.logger.log('Generating depreciation analysis report...');

      // Use custom or default depreciation rate
      const depreciationRate =
        filters.depreciationRate || this.DEFAULT_DEPRECIATION_RATE;

      // Build common filters
      const whereClause = this.buildWhereClause(filters);

      // Get total metrics
      const totalMetrics = await this.getTotalMetrics(
        whereClause,
        depreciationRate,
      );

      // Get depreciation by type and age group
      const [byType, byAgeGroup, highValueAssets] = await Promise.all([
        this.getDepreciationByType(whereClause, depreciationRate),
        this.getDepreciationByAgeGroup(whereClause, depreciationRate),
        filters.includeTopAssets
          ? this.getHighValueAssets(whereClause, depreciationRate)
          : Promise.resolve(undefined),
      ]);

      const response: DepreciationAnalysisResponseDto = {
        totalPurchaseValue: totalMetrics.totalPurchaseValue,
        totalCurrentValue: totalMetrics.totalCurrentValue,
        totalDepreciation: totalMetrics.totalDepreciation,
        averageDepreciationPercentage:
          totalMetrics.averageDepreciationPercentage,
        byType,
        byAgeGroup,
        highValueAssets,
        depreciationRate,
        totalAssets: totalMetrics.totalAssets,
      };

      this.logger.log('Depreciation analysis report generated successfully');
      return response;
    } catch (error) {
      this.logger.error('Error generating depreciation analysis report', error);
      throw error;
    }
  }

  /**
   * Build WHERE clause from filters
   */
  private buildWhereClause(filters: DepreciationAnalysisFiltersDto): any {
    const where: any = {
      deletedAt: null,
      purchasePrice: { not: null, gt: 0 }, // Only include assets with purchase price
      purchaseDate: { not: null }, // Only include assets with purchase date
    };

    if (filters.startDate || filters.endDate) {
      where.purchaseDate = {
        ...(where.purchaseDate || {}),
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      };
    }

    if (filters.assetType) where.assetType = filters.assetType;
    if (filters.status) where.status = filters.status;

    if (filters.location) {
      where.currentLocation = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    if (filters.category) where.category = filters.category;
    if (filters.manufacturer) where.manufacturer = filters.manufacturer;

    // Value range filters
    if (filters.minValue !== undefined) {
      where.purchasePrice = { ...where.purchasePrice, gte: filters.minValue };
    }
    if (filters.maxValue !== undefined) {
      where.purchasePrice = { ...where.purchasePrice, lte: filters.maxValue };
    }

    return where;
  }

  /**
   * Get total metrics with depreciation
   */
  private async getTotalMetrics(whereClause: any, depreciationRate: number) {
    const assets = await this.prisma.asset.findMany({
      where: whereClause,
      select: {
        purchasePrice: true,
        purchaseDate: true,
      },
    });

    let totalPurchaseValue = 0;
    let totalCurrentValue = 0;

    assets.forEach((asset) => {
      const purchasePrice = Number(asset.purchasePrice || 0);
      const currentValue = this.calculateCurrentValue(
        purchasePrice,
        asset.purchaseDate,
        depreciationRate,
      );

      totalPurchaseValue += purchasePrice;
      totalCurrentValue += currentValue;
    });

    const totalDepreciation = totalPurchaseValue - totalCurrentValue;
    const averageDepreciationPercentage =
      totalPurchaseValue > 0
        ? (totalDepreciation / totalPurchaseValue) * 100
        : 0;

    return {
      totalAssets: assets.length,
      totalPurchaseValue: Math.round(totalPurchaseValue),
      totalCurrentValue: Math.round(totalCurrentValue),
      totalDepreciation: Math.round(totalDepreciation),
      averageDepreciationPercentage:
        Math.round(averageDepreciationPercentage * 100) / 100,
    };
  }

  /**
   * Get depreciation by asset type
   */
  private async getDepreciationByType(
    whereClause: any,
    depreciationRate: number,
  ): Promise<TypeDepreciationDto[]> {
    // Get assets grouped by type
    const assetsByType = await this.prisma.asset.findMany({
      where: whereClause,
      select: {
        assetType: true,
        purchasePrice: true,
        purchaseDate: true,
      },
    });

    // Group by type manually
    const typeMap = new Map<string, any[]>();
    assetsByType.forEach((asset) => {
      const type = asset.assetType;
      if (!typeMap.has(type)) {
        typeMap.set(type, []);
      }
      typeMap.get(type)!.push(asset);
    });

    // Calculate metrics for each type
    const breakdown: TypeDepreciationDto[] = [];
    const now = new Date();

    typeMap.forEach((assets, type) => {
      let purchaseValue = 0;
      let currentValue = 0;
      let totalAge = 0;

      assets.forEach((asset) => {
        const price = Number(asset.purchasePrice || 0);
        const current = this.calculateCurrentValue(
          price,
          asset.purchaseDate as Date | null,
          depreciationRate,
        );

        purchaseValue += price;
        currentValue += current;

        if (asset.purchaseDate) {
          const ageInYears =
            (now.getTime() - asset.purchaseDate.getTime()) /
            (1000 * 60 * 60 * 24 * 365);
          totalAge += ageInYears;
        }
      });

      const totalDepreciation = purchaseValue - currentValue;
      const depreciationPercentage =
        purchaseValue > 0 ? (totalDepreciation / purchaseValue) * 100 : 0;

      breakdown.push({
        assetType: type as any,
        assetCount: assets.length,
        purchaseValue: Math.round(purchaseValue),
        currentValue: Math.round(currentValue),
        totalDepreciation: Math.round(totalDepreciation),
        depreciationPercentage: Math.round(depreciationPercentage * 100) / 100,
        averageAge: Math.round((totalAge / assets.length) * 10) / 10,
      });
    });

    // Sort by purchase value descending
    return breakdown.sort((a, b) => b.purchaseValue - a.purchaseValue);
  }

  /**
   * Get depreciation by age group
   */
  private async getDepreciationByAgeGroup(
    whereClause: any,
    depreciationRate: number,
  ): Promise<AgeGroupBreakdownDto[]> {
    const assets = await this.prisma.asset.findMany({
      where: whereClause,
      select: {
        purchasePrice: true,
        purchaseDate: true,
      },
    });

    const now = new Date();
    const ageGroups = [
      { label: 'Less than 1 year', min: 0, max: 1 },
      { label: '1-2 years', min: 1, max: 2 },
      { label: '3-5 years', min: 3, max: 5 },
      { label: '6-10 years', min: 6, max: 10 },
      { label: 'More than 10 years', min: 10, max: Infinity },
    ];

    const breakdown: AgeGroupBreakdownDto[] = ageGroups.map((group) => {
      const groupAssets = assets.filter((asset) => {
        if (!asset.purchaseDate) return false;

        const ageInYears =
          (now.getTime() - asset.purchaseDate.getTime()) /
          (1000 * 60 * 60 * 24 * 365);

        return ageInYears >= group.min && ageInYears < group.max;
      });

      let purchaseValue = 0;
      let currentValue = 0;

      groupAssets.forEach((asset) => {
        const price = Number(asset.purchasePrice || 0);
        const current = this.calculateCurrentValue(
          price,
          asset.purchaseDate,
          depreciationRate,
        );

        purchaseValue += price;
        currentValue += current;
      });

      const totalDepreciation = purchaseValue - currentValue;
      const depreciationPercentage =
        purchaseValue > 0 ? (totalDepreciation / purchaseValue) * 100 : 0;

      return {
        ageGroup: group.label,
        assetCount: groupAssets.length,
        purchaseValue: Math.round(purchaseValue),
        currentValue: Math.round(currentValue),
        totalDepreciation: Math.round(totalDepreciation),
        depreciationPercentage: Math.round(depreciationPercentage * 100) / 100,
      };
    });

    // Filter out empty age groups
    return breakdown.filter((item) => item.assetCount > 0);
  }

  /**
   * Get high-value assets
   */
  private async getHighValueAssets(
    whereClause: any,
    depreciationRate: number,
  ): Promise<HighValueAssetDto[]> {
    const assets = await this.prisma.asset.findMany({
      where: whereClause,
      select: {
        id: true,
        assetNumber: true,
        name: true,
        assetType: true,
        purchaseDate: true,
        purchasePrice: true,
      },
      orderBy: { purchasePrice: 'desc' },
      take: 10,
    });

    const now = new Date();

    return assets.map((asset) => {
      const purchasePrice = Number(asset.purchasePrice || 0);
      const currentValue = this.calculateCurrentValue(
        purchasePrice,
        asset.purchaseDate,
        depreciationRate,
      );

      const totalDepreciation = purchasePrice - currentValue;

      const age = asset.purchaseDate
        ? (now.getTime() - asset.purchaseDate.getTime()) /
          (1000 * 60 * 60 * 24 * 365)
        : 0;

      return {
        assetId: asset.id,
        assetNumber: asset.assetNumber,
        name: asset.name,
        assetType: asset.assetType,
        purchaseDate: asset.purchaseDate!,
        purchasePrice,
        currentValue: Math.round(currentValue),
        totalDepreciation: Math.round(totalDepreciation),
        age: Math.round(age * 10) / 10,
      };
    });
  }

  /**
   * Calculate current value using straight-line depreciation
   */
  private calculateCurrentValue(
    purchasePrice: number,
    purchaseDate: Date | null,
    annualDepreciationRate: number,
  ): number {
    if (!purchaseDate || purchasePrice <= 0) return 0;

    const now = new Date();
    const ageInYears =
      (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    // Calculate depreciation
    const totalDepreciation =
      purchasePrice * (annualDepreciationRate / 100) * ageInYears;

    // Current value cannot be negative
    const currentValue = Math.max(0, purchasePrice - totalDepreciation);

    return currentValue;
  }
}
