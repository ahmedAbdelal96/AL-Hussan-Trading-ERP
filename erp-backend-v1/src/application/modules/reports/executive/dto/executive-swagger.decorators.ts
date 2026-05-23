/**
 * ============================================================================
 * EXECUTIVE REPORTS — Swagger Decorators
 * ============================================================================
 */

import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

export function ExecutiveDashboardDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Executive Dashboard',
      description:
        'Cross-module KPI snapshot: active projects, at-risk projects, ' +
        'asset utilization, headcount, labor cost, maintenance overdue, ' +
        'plus 6-month cost trend and cost-by-type breakdown.',
    }),
    ApiQuery({
      name: 'period',
      required: false,
      enum: ['MTD', 'QTD', 'YTD', 'CUSTOM'],
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: 'ISO 8601 — CUSTOM period only',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: 'ISO 8601 — CUSTOM period only',
    }),
    ApiResponse({
      status: 200,
      description: 'Executive dashboard data returned',
    }),
    ApiResponse({ status: 403, description: 'Insufficient permissions' }),
  );
}

export function CompanyPnlDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Company P&L',
      description:
        'Company-level Profit & Loss statement. ' +
        'Revenue = sum of contracted project budgets (not collected cash). ' +
        'Costs are sourced exclusively from the Cost table to avoid double-counting.',
    }),
    ApiQuery({
      name: 'period',
      required: false,
      enum: ['MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM'],
    }),
    ApiQuery({ name: 'month', required: false, description: '1-12' }),
    ApiQuery({ name: 'year', required: false, description: 'e.g. 2026' }),
    ApiQuery({ name: 'startDate', required: false }),
    ApiQuery({ name: 'endDate', required: false }),
    ApiQuery({
      name: 'includeProjectBreakdown',
      required: false,
      type: Boolean,
    }),
    ApiQuery({ name: 'includeCostBreakdown', required: false, type: Boolean }),
    ApiQuery({ name: 'includeMonthlyTrend', required: false, type: Boolean }),
    ApiResponse({ status: 200, description: 'P&L data returned' }),
    ApiResponse({ status: 403, description: 'Insufficient permissions' }),
  );
}
