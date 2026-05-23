/**
 * ============================================================================
 * EXECUTIVE REPORTS — Filter DTOs
 * ============================================================================
 *
 * Two distinct filter shapes:
 *
 *  1. ExecutiveDashboardFiltersDto — cross-module KPI dashboard
 *     Period selection: MTD (default) | QTD | YTD | CUSTOM
 *
 *  2. CompanyPnlFiltersDto — Company-level Profit & Loss statement
 *     Supports monthly / quarterly / annual / custom windows,
 *     plus optional breakdown flags to control response size.
 *
 * Design decisions:
 * - Periods are resolved server-side so the client never needs to send
 *   explicit dates for the common cases (MTD/QTD/YTD).
 * - CUSTOM requires both startDate and endDate; validation is done in the
 *   use-case (not here) to keep the DTO lean.
 * - All booleans use @Type(() => Boolean) because query params arrive as
 *   strings from HTTP and class-transformer needs explicit coercion.
 */

import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Enums ─────────────────────────────────────────────────────────────────────

export enum DashboardPeriodEnum {
  MTD = 'MTD', // Month-to-Date  (default)
  QTD = 'QTD', // Quarter-to-Date
  YTD = 'YTD', // Year-to-Date
  CUSTOM = 'CUSTOM', // Requires startDate + endDate
}

export enum PnlPeriodEnum {
  MONTHLY = 'MONTHLY', // Single month  (default: current)
  QUARTERLY = 'QUARTERLY', // Current calendar quarter
  ANNUAL = 'ANNUAL', // Full fiscal year
  CUSTOM = 'CUSTOM', // Requires startDate + endDate
}

// ── Executive Dashboard Filters ───────────────────────────────────────────────

/**
 * Filter parameters for the cross-module Executive Dashboard.
 *
 * When period = CUSTOM both startDate and endDate are required.
 * All other periods are resolved server-side from the current date.
 */
export class ExecutiveDashboardFiltersDto {
  /**
   * Time window for cost/financial KPIs.
   * @default MTD
   */
  @IsOptional()
  @IsEnum(DashboardPeriodEnum)
  period?: DashboardPeriodEnum;

  /** ISO 8601 date string — required only when period = CUSTOM */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /** ISO 8601 date string — required only when period = CUSTOM */
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// ── Company P&L Filters ───────────────────────────────────────────────────────

/**
 * Filter parameters for the Company Profit & Loss statement.
 *
 * Priority resolution:
 *   CUSTOM  → startDate + endDate
 *   ANNUAL  → year (defaults to current year)
 *   QUARTERLY → current quarter of `year`
 *   MONTHLY → month + year (defaults to current month)
 */
export class CompanyPnlFiltersDto {
  /** Reporting window. @default MONTHLY */
  @IsOptional()
  @IsEnum(PnlPeriodEnum)
  period?: PnlPeriodEnum;

  /** Calendar month (1-12). Used with MONTHLY period. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  /** Calendar year (e.g., 2026). Used with MONTHLY, QUARTERLY, ANNUAL. */
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year?: number;

  /** ISO 8601 — required only when period = CUSTOM */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /** ISO 8601 — required only when period = CUSTOM */
  @IsOptional()
  @IsDateString()
  endDate?: string;

  /**
   * Include top 10 projects by cost in the response.
   * Adds a DB query; disable when not needed to reduce latency.
   * @default false
   */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeProjectBreakdown?: boolean;

  /**
   * Include per-CostType detailed breakdown array.
   * @default false
   */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeCostBreakdown?: boolean;

  /**
   * Include last-12-months monthly trend (revenue + costs).
   * Adds a raw SQL query; disable when not needed.
   * @default false
   */
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeMonthlyTrend?: boolean;
}
