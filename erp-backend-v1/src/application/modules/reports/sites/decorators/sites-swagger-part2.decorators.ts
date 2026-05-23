import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import {
  SitesCapacityResponseDto,
  SitesWithProjectsResponseDto,
  SitesPerformanceResponseDto,
} from '../dto';

/**
 * Swagger decorator for Sites Capacity & Utilization Report
 * Track capacity usage and efficiency metrics
 */
export function SitesCapacityDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Sites Capacity & Utilization Report',
      description: `
        Detailed analysis of site capacity utilization and resource efficiency.
        
        **Business Value:**
        - Identify underutilized sites (capacity < actual usage)
        - Plan capacity expansion or consolidation
        - Optimize resource allocation across locations
        - Support decisions on site closure or expansion
        - Monitor area efficiency metrics
        
        **Metrics Explained:**
        - **Utilization Rate**: % of used capacity vs total capacity
        - **Available Capacity**: Remaining capacity for new projects
        - **Area Efficiency**: Projects or workers per square meter
        
        **Use Cases:**
        - Capacity planning and expansion decisions
        - Cost optimization through utilization analysis
        - Resource reallocation strategies
        - Facility consolidation planning
        - Identifying expansion opportunities
      `,
      tags: ['Sites Reports'],
    }),
    ApiQuery({
      name: 'minCapacity',
      required: false,
      description: 'Filter sites with minimum capacity',
      type: Number,
    }),
    ApiQuery({
      name: 'maxCapacity',
      required: false,
      description: 'Filter sites with maximum capacity',
      type: Number,
    }),
    ApiQuery({
      name: 'minUtilization',
      required: false,
      description: 'Minimum utilization percentage',
      type: Number,
    }),
    ApiQuery({
      name: 'maxUtilization',
      required: false,
      description: 'Maximum utilization percentage',
      type: Number,
    }),
    ApiQuery({
      name: 'includeUnderUtilized',
      required: false,
      description: 'Include underutilized sites analysis',
      type: Boolean,
    }),
    ApiOkResponse({
      description: 'Sites capacity report successfully generated',
      type: SitesCapacityResponseDto,
    }),
  );
}

/**
 * Swagger decorator for Sites With Projects Report
 * Link sites with their associated projects
 */
export function SitesWithProjectsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Sites With Projects Report',
      description: `
        Analysis of project distribution across sites.
        
        **Business Value:**
        - Understand project concentration by site
        - Identify sites without active projects
        - Track project portfolio by location
        - Monitor project budget allocation
        - Plan site activation based on project needs
        
        **Key Insights:**
        - Sites with multiple concurrent projects
        - Underutilized sites (with capacity but no projects)
        - Project concentration risk assessment
        - Resource competition at individual sites
        
        **Use Cases:**
        - Project portfolio management by location
        - Site allocation for new projects
        - Resource conflict detection
        - Site capacity planning
        - Project portfolio rebalancing
      `,
      tags: ['Sites Reports'],
    }),
    ApiQuery({
      name: 'minProjectCount',
      required: false,
      description: 'Minimum number of projects per site',
      type: Number,
    }),
    ApiQuery({
      name: 'includeProjectDetails',
      required: false,
      description: 'Include detailed project information',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includeProjectFinancials',
      required: false,
      description: 'Include project budget and financial metrics',
      type: Boolean,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      description: 'Sort by',
      enum: ['projectCount', 'area', 'name'],
    }),
    ApiOkResponse({
      description: 'Sites with projects report successfully generated',
      type: SitesWithProjectsResponseDto,
    }),
  );
}

/**
 * Swagger decorator for Sites Performance Report
 * Evaluate site efficiency and profitability metrics
 */
export function SitesPerformanceDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Sites Performance Report',
      description: `
        Comprehensive performance evaluation of all sites.
        
        **Business Value:**
        - Identify high-performing vs underperforming sites
        - ROI analysis by location for investment decisions
        - Data-driven site closure recommendations
        - Performance benchmarking across locations
        - Strategic planning for site optimization
        
        **Performance Metrics:**
        - **Performance Score**: Composite metric (0-100)
          - Project completion rate (40%)
          - Capacity utilization (30%)
          - ROI per square meter (20%)
          - Budget efficiency (10%)
        
        - **ROI Per Square Meter**: Total project budget / site area
        - **Profitability Rating**: HIGH/MEDIUM/LOW based on ROI
        
        **Use Cases:**
        - Executive decision-making on site investments
        - Site closure or consolidation planning
        - Performance-based incentive programs
        - Strategic resource allocation
        - Identifying sites needing intervention or closure
      `,
      tags: ['Sites Reports'],
    }),
    ApiQuery({
      name: 'includeROIMetrics',
      required: false,
      description: 'Include ROI calculations',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includeProjectCompletion',
      required: false,
      description: 'Include project completion metrics',
      type: Boolean,
    }),
    ApiQuery({
      name: 'includeUnderutilizedSites',
      required: false,
      description: 'Include underutilized sites analysis',
      type: Boolean,
    }),
    ApiQuery({
      name: 'minProjects',
      required: false,
      description: 'Only sites with N+ projects',
      type: Number,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      description: 'Sort by',
      enum: ['performance', 'roi', 'projectValue'],
    }),
    ApiOkResponse({
      description: 'Sites performance report successfully generated',
      type: SitesPerformanceResponseDto,
    }),
  );
}
