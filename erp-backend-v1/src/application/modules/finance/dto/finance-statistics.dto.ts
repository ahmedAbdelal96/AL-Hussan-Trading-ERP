import { ApiProperty } from '@nestjs/swagger';
import { CostType, PaymentStatus } from '@prisma/client';

/**
 * DTO for monthly trend data point
 */
export class MonthlyTrendDto {
  @ApiProperty({ example: 'Jan 2026', description: 'Month label' })
  month: string;

  @ApiProperty({ example: 25000, description: 'Total amount for the month' })
  amount: number;

  @ApiProperty({ example: 12, description: 'Number of costs for the month' })
  count: number;
}

/**
 * DTO for status breakdown item
 */
export class StatusBreakdownDto {
  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  status: PaymentStatus;

  @ApiProperty({ example: 5, description: 'Number of costs with this status' })
  count: number;

  @ApiProperty({ example: 25000, description: 'Total amount for this status' })
  amount: number;

  @ApiProperty({ example: 16.7, description: 'Percentage of total amount' })
  percentage: number;
}

/**
 * DTO for cost type breakdown item
 */
export class CostTypeBreakdownDto {
  @ApiProperty({ enum: CostType, example: CostType.MAINTENANCE })
  type: CostType;

  @ApiProperty({ example: 30000, description: 'Total amount for this type' })
  amount: number;

  @ApiProperty({ example: 8, description: 'Number of costs of this type' })
  count: number;

  @ApiProperty({ example: 20.0, description: 'Percentage of total amount' })
  percentage: number;
}

/**
 * DTO for top project by cost
 */
export class TopProjectDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  projectId: string;

  @ApiProperty({ example: 'مشروع البنية التحتية' })
  projectName: string;

  @ApiProperty({ example: 50000, description: 'Total cost for this project' })
  totalCost: number;

  @ApiProperty({ example: 12, description: 'Number of cost entries' })
  costCount: number;

  @ApiProperty({ example: PaymentStatus.APPROVED, enum: PaymentStatus })
  dominantStatus: PaymentStatus;
}

/**
 * DTO for category breakdown item
 */
export class CategoryBreakdownDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  categoryId: string;

  @ApiProperty({ example: 'صيانة المعدات' })
  categoryName: string;

  @ApiProperty({
    example: 35000,
    description: 'Total amount for this category',
  })
  amount: number;

  @ApiProperty({ example: 10, description: 'Number of costs in this category' })
  count: number;

  @ApiProperty({ example: 23.3, description: 'Percentage of total amount' })
  percentage: number;
}

/**
 * Main DTO for Finance Statistics Response
 * Used for dashboard overview and analytics
 */
export class FinanceStatisticsDto {
  // ========== OVERVIEW NUMBERS ==========
  @ApiProperty({ example: 150000, description: 'Total of all costs' })
  totalCosts: number;

  @ApiProperty({ example: 25000, description: 'Total pending amount' })
  pendingAmount: number;

  @ApiProperty({ example: 100000, description: 'Total approved amount' })
  approvedAmount: number;

  @ApiProperty({ example: 50000, description: 'Total paid amount' })
  paidAmount: number;

  @ApiProperty({ example: 5000, description: 'Total rejected amount' })
  rejectedAmount: number;

  @ApiProperty({ example: 42, description: 'Total number of cost entries' })
  totalEntries: number;

  // ========== BREAKDOWN BY STATUS ==========
  @ApiProperty({
    type: [StatusBreakdownDto],
    description: 'Costs breakdown by payment status',
  })
  statusBreakdown: StatusBreakdownDto[];

  // ========== BREAKDOWN BY COST TYPE ==========
  @ApiProperty({
    type: [CostTypeBreakdownDto],
    description: 'Costs breakdown by type',
  })
  costTypeBreakdown: CostTypeBreakdownDto[];

  // ========== BREAKDOWN BY CATEGORY ==========
  @ApiProperty({
    type: [CategoryBreakdownDto],
    description: 'Costs breakdown by category',
  })
  categoryBreakdown: CategoryBreakdownDto[];

  // ========== MONTHLY TREND (Last 6 months) ==========
  @ApiProperty({
    type: [MonthlyTrendDto],
    description: 'Monthly cost trend for last 6 months',
  })
  monthlyTrend: MonthlyTrendDto[];

  // ========== TOP PROJECTS BY COST ==========
  @ApiProperty({
    type: [TopProjectDto],
    description: 'Top 5 projects by total cost',
  })
  topProjects: TopProjectDto[];

  // ========== RECENT ACTIVITY ==========
  @ApiProperty({
    example: 12,
    description: 'Number of costs added in last 30 days',
  })
  recentCosts: number;

  @ApiProperty({
    example: 15.5,
    description: 'Growth rate compared to previous month (%)',
  })
  growthRate: number;

  @ApiProperty({ example: 8500, description: 'Average cost per entry' })
  averageCost: number;

  // ========== METADATA ==========
  @ApiProperty({ example: 'SAR', description: 'Currency code' })
  currency: string;

  @ApiProperty({
    example: '2026-01-18T12:00:00Z',
    description: 'Statistics calculation timestamp',
  })
  calculatedAt: Date;
}
