import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import {
  SitesOverviewResponseDto,
  SitesByStatusResponseDto,
  SitesByLocationResponseDto,
} from '../dto';

/**
 * Swagger decorator for Sites Overview Report
 * Dashboard with KPIs, distributions, and capacity metrics
 */
export function SitesOverviewDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Sites Overview Report',
      description: `
        Comprehensive dashboard providing executive-level insights into all sites.
        
        **Business Value:**
        - Real-time KPI dashboard (total, active, inactive sites)
        - Capacity utilization metrics across all locations
        - Status distribution analysis for lifecycle management
        - Quick performance indicators for strategic decision-making
        
        **Use Cases:**
        - Executive dashboards and performance tracking
        - Resource allocation and capacity planning
        - Strategic site expansion or closure decisions
        - Facility management overview
      `,
      tags: ['Sites Reports'],
    }),
    ApiQuery({
      name: 'startDate',
      required: false,
      description: 'Report start date (ISO 8601)',
      example: '2026-01-01',
    }),
    ApiQuery({
      name: 'endDate',
      required: false,
      description: 'Report end date (ISO 8601)',
      example: '2026-01-31',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      description: 'Filter by site status',
      enum: ['ACTIVE', 'INACTIVE', 'UNDER_PREPARATION', 'CLOSED'],
    }),
    ApiQuery({
      name: 'city',
      required: false,
      description: 'Filter by city',
    }),
    ApiOkResponse({
      description: 'Sites overview report successfully generated',
      type: SitesOverviewResponseDto,
    }),
  );
}

/**
 * Swagger decorator for Sites By Status Report
 * Analyzes sites across 4 status categories with lifecycle insights
 */
export function SitesByStatusDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Sites By Status Report',
      description: `
        Detailed analysis of sites grouped by operational status.
        
        **Business Value:**
        - Identify bottlenecks in site lifecycle (UNDER_PREPARATION → ACTIVE)
        - Detect and manage abandoned or long-closed sites
        - Track time spent in each status for process optimization
        - Monitor status transitions for compliance and timing
        
        **Use Cases:**
        - Site lifecycle management and optimization
        - Capacity planning by site readiness status
        - Identifying delayed site preparations
        - Compliance and audit reporting
        - Site activation/deactivation workflows
      `,
      tags: ['Sites Reports'],
    }),
    ApiQuery({
      name: 'status',
      required: false,
      description: 'Filter by specific status',
      enum: ['ACTIVE', 'INACTIVE', 'UNDER_PREPARATION', 'CLOSED'],
    }),
    ApiQuery({
      name: 'minDaysInStatus',
      required: false,
      description: 'Minimum days in current status for filtering',
      type: Number,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      description: 'Sort results by',
      enum: ['status', 'count', 'area'],
    }),
    ApiOkResponse({
      description: 'Sites by status report successfully generated',
      type: SitesByStatusResponseDto,
    }),
  );
}

/**
 * Swagger decorator for Sites By Location Report
 * Geographic distribution and regional analysis
 */
export function SitesByLocationDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Sites By Location Report',
      description: `
        Geographic analysis of sites with regional distribution metrics.
        
        **Business Value:**
        - Understand geographic footprint and coverage
        - Identify regional expansion opportunities
        - Analyze regional capacity and utilization
        - Support location-based resource allocation
        - Optimize logistics and regional operations
        
        **Use Cases:**
        - Regional expansion planning
        - Geographic redundancy analysis
        - Regional capacity planning
        - Logistics and supply chain optimization
        - Market penetration analysis by region
      `,
      tags: ['Sites Reports'],
    }),
    ApiQuery({
      name: 'groupByLevel',
      required: false,
      description: 'Geographic grouping level',
      enum: ['country', 'state', 'city'],
    }),
    ApiQuery({
      name: 'country',
      required: false,
      description: 'Filter by country',
    }),
    ApiQuery({
      name: 'state',
      required: false,
      description: 'Filter by state/province',
    }),
    ApiQuery({
      name: 'city',
      required: false,
      description: 'Filter by city',
    }),
    ApiQuery({
      name: 'includeCoordinates',
      required: false,
      description: 'Include GPS coordinates for mapping',
      type: Boolean,
    }),
    ApiOkResponse({
      description: 'Sites by location report successfully generated',
      type: SitesByLocationResponseDto,
    }),
  );
}
