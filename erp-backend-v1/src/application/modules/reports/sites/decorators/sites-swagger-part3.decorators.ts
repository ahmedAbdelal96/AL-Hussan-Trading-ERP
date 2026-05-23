/**
 * ============================================================================
 * SITES REPORTS - SWAGGER DECORATORS PART 3
 * ============================================================================
 *
 * Swagger/OpenAPI decorator for:
 * - Report 7: Site Profitability
 *
 * @module SitesSwaggerPart3
 */

import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

export function SiteProfitabilityDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Site Profitability Report',
      description:
        'Revenue (project budgets) vs total costs per site with profit margin and profitability rating (HIGH/MEDIUM/LOW/LOSS)',
    }),
    ApiQuery({ name: 'sortBy', required: false }),
    ApiQuery({ name: 'sortOrder', required: false }),
    ApiQuery({ name: 'minMargin', required: false }),
    ApiQuery({ name: 'maxMargin', required: false }),
    ApiQuery({ name: 'profitabilityRating', required: false }),
    ApiQuery({ name: 'includeProjectBreakdown', required: false }),
    ApiQuery({ name: 'status', required: false }),
    ApiQuery({ name: 'city', required: false }),
    ApiQuery({ name: 'country', required: false }),
    ApiResponse({ status: 200, description: 'Site profitability data' }),
  );
}
