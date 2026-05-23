/**
 * Employees Reports - TypeScript Type Definitions
 *
 * @description Type interfaces for all 7 Employees report endpoints
 * @module types/reports/employees.types
 *
 * @remarks
 * - Mirrors backend DTOs from employees-responses-part1.dto.ts & part2.dto.ts
 * - All interfaces are read-only response shapes
 *
 * @author ERP System
 * @date 2026-01-23
 */

// ============================================
// SHARED FILTER TYPE
// ============================================

/**
 * Common query parameters for Employees reports
 */
export interface EmployeesReportFilters {
  /** Month number (1-12) */
  month?: number;
  /** Year (e.g., 2026) */
  year?: number;
  /** Filter by department name */
  department?: string;
  /** Filter by employment type */
  employmentType?: string;
  /** Filter by employee status */
  status?: string;
  /** Include per-department breakdown */
  includeDepartmentBreakdown?: boolean;
  /** Include salary cost data */
  includeSalaryCosts?: boolean;
  /** Include comparison with previous period */
  includeComparison?: boolean;
  /** Minimum employee count threshold */
  minEmployees?: number;
  /** Number of months for trend analysis */
  periodMonths?: number;
  /** Include termination reasons breakdown (turnover endpoint) */
  includeReasons?: boolean;
  /** Page number for paginated table reports */
  page?: number;
  /** Page size for paginated table reports */
  limit?: number;
  /** Search term for grouped rows (department, position, employment type) */
  search?: string;
}

export interface ReportPaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ============================================
// REPORT 1 — EMPLOYEES OVERVIEW
// ============================================

/**
 * DTO for a single department summary row within the overview
 */
export interface OverviewDepartmentBreakdown {
  department: string;
  employeeCount: number;
  activeCount: number;
  percentage: number;
}

/**
 * Previous period comparison metrics
 */
export interface OverviewPreviousPeriod {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  terminations: number;
}

/**
 * Response from GET /reports/employees/overview
 */
export interface EmployeesOverviewResponse {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  onLeaveEmployees: number;
  suspendedEmployees: number;
  newHires: number;
  terminations: number;
  netChange: number;
  turnoverRate: number;
  avgTenure: number;
  employeesInProbation: number;
  maleCount: number;
  femaleCount: number;
  genderDiversityRatio: number;
  previousPeriod?: OverviewPreviousPeriod;
  growthRate?: number;
  departmentBreakdown?: OverviewDepartmentBreakdown[];
  month?: number;
  year?: number;
  generatedAt: string;
}

// ============================================
// REPORT 2 — EMPLOYEES BY DEPARTMENT
// ============================================

/**
 * A single department row
 */
export interface DepartmentItem {
  department: string;
  employeeCount: number;
  activeCount: number;
  inactiveCount: number;
  onLeaveCount: number;
  percentage: number;
  avgTenure: number;
  newHires: number;
  terminations: number;
  totalSalaryCosts?: number;
  avgSalary?: number;
}

/**
 * Response from GET /reports/employees/by-department
 */
export interface EmployeesByDepartmentResponse {
  departments: DepartmentItem[];
  totalEmployees: number;
  totalDepartments: number;
  avgEmployeesPerDepartment: number;
  totalSalaryCosts?: number;
  meta?: ReportPaginationMeta;
  month?: number;
  year?: number;
  generatedAt: string;
}

// ============================================
// REPORT 3 — EMPLOYEES BY EMPLOYMENT TYPE
// ============================================

/**
 * A single employment type row
 */
export interface EmploymentTypeItem {
  employmentType: string;
  typeName: string;
  typeNameAr: string;
  employeeCount: number;
  activeCount: number;
  percentage: number;
  avgTenure: number;
}

/**
 * An employee whose contract is expiring soon
 */
export interface ExpiringContract {
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  department: string;
  position: string;
  employmentType: string;
  contractEndDate: string;
  daysUntilExpiry: number;
  isRenewable: boolean;
}

/**
 * Response from GET /reports/employees/by-employment-type
 */
export interface EmployeesByEmploymentTypeResponse {
  employmentTypes: EmploymentTypeItem[];
  expiringContracts?: ExpiringContract[];
  totalEmployees: number;
  permanentCount: number;
  contractCount: number;
  freelanceCount: number;
  partTimeCount: number;
  expiringContractsCount?: number;
  meta?: ReportPaginationMeta;
  month?: number;
  year?: number;
  generatedAt: string;
}

// ============================================
// REPORT 4 — EMPLOYEES BY POSITION
// ============================================

/**
 * A single position row
 */
export interface PositionItem {
  position: string;
  employeeCount: number;
  activeCount: number;
  percentage: number;
  avgTenure: number;
  avgAge: number;
  newHires: number;
}

/**
 * Response from GET /reports/employees/by-position
 */
export interface EmployeesByPositionResponse {
  positions: PositionItem[];
  totalEmployees: number;
  totalPositions: number;
  avgEmployeesPerPosition: number;
  meta?: ReportPaginationMeta;
  month?: number;
  year?: number;
  generatedAt: string;
}

// ============================================
// REPORT 5 — AGE & EXPERIENCE ANALYSIS
// ============================================

/**
 * A single age group bucket
 */
export interface AgeGroupItem {
  ageRange: string;
  employeeCount: number;
  percentage: number;
  avgAge: number;
  maleCount: number;
  femaleCount: number;
}

/**
 * A single experience range bucket
 */
export interface ExperienceRangeItem {
  experienceRange: string;
  employeeCount: number;
  percentage: number;
  avgTenure: number;
  avgAge: number;
}

/**
 * Department-level age & experience summary
 */
export interface DeptAgeExperience {
  department: string;
  employeeCount: number;
  avgAge: number;
  avgTenure: number;
  minAge: number;
  maxAge: number;
}

/**
 * Response from GET /reports/employees/age-experience
 */
export interface AgeExperienceResponse {
  ageGroups: AgeGroupItem[];
  experienceRanges: ExperienceRangeItem[];
  departmentSummary: DeptAgeExperience[];
  totalEmployees: number;
  avgAge: number;
  avgTenure: number;
  medianAge: number;
  minAge: number;
  maxAge: number;
  under30Count: number;
  age30to45Count: number;
  over45Count: number;
  month?: number;
  year?: number;
  generatedAt: string;
}

// ============================================
// REPORT 6 — TURNOVER ANALYSIS
// ============================================

/**
 * Monthly turnover data point
 */
export interface MonthlyTurnover {
  month: string;
  newHires: number;
  terminations: number;
  netChange: number;
  totalEmployees: number;
  turnoverRate: number;
}

/**
 * Termination reason breakdown
 */
export interface TerminationReason {
  reason: string;
  count: number;
  percentage: number;
}

/**
 * Department-level turnover data
 */
export interface DepartmentTurnover {
  department: string;
  totalEmployees: number;
  terminations: number;
  turnoverRate: number;
  avgTenureOfLeavers: number;
}

/**
 * Response from GET /reports/employees/turnover
 */
export interface TurnoverAnalysisResponse {
  monthlyTrend: MonthlyTurnover[];
  terminationReasons?: TerminationReason[];
  departmentTurnover?: DepartmentTurnover[];
  totalNewHires: number;
  totalTerminations: number;
  netChange: number;
  avgTurnoverRate: number;
  maxTurnoverRate: number;
  minTurnoverRate: number;
  avgTenureOfTerminated: number;
  voluntaryTerminationRate: number;
  isHighRisk: boolean;
  riskLevel: "Low" | "Medium" | "High";
  periodMonths: number;
  generatedAt: string;
}

// ============================================
// REPORT 7 — STATUS DISTRIBUTION
// ============================================

/**
 * A single status bucket
 */
export interface StatusItem {
  status: string;
  statusName: string;
  statusNameAr: string;
  employeeCount: number;
  percentage: number;
  maleCount: number;
  femaleCount: number;
  avgTenure: number;
}

/**
 * Historical monthly status trend point
 */
export interface StatusTrend {
  month: string;
  activeCount: number;
  inactiveCount: number;
  onLeaveCount: number;
  suspendedCount: number;
  totalEmployees: number;
}

/**
 * Response from GET /reports/employees/status
 */
export interface StatusDistributionResponse {
  statusBreakdown: StatusItem[];
  historicalTrend?: StatusTrend[];
  totalEmployees: number;
  activePercentage: number;
  inactivePercentage: number;
  onLeavePercentage: number;
  availabilityRate: number;
  month?: number;
  year?: number;
  generatedAt: string;
}

// ============================================================================
// REPORT 8 — EMPLOYEE ASSIGNMENT
// ============================================================================

export interface EmployeeAssignmentFilters {
  allocationStatus?: "OVERHEAD" | "OVER_ALLOCATED" | "FULLY_ALLOCATED" | "UNDER_ALLOCATED";
  sortBy?: "employeeName" | "allocationPct" | "projectCount";
  sortOrder?: "asc" | "desc";
  activeOnly?: boolean;
  department?: string;
  status?: string;
  employmentType?: string;
}

export interface ProjectAssignmentItem {
  projectId: string;
  projectName: string;
  projectStatus: string;
  role: string | null;
  allocationPercentage: number | null;
  isActive: boolean;
}

export interface EmployeeAssignmentItem {
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  department: string;
  position: string;
  employmentType: string;
  totalAllocationPercentage: number;
  allocationStatus: "OVERHEAD" | "OVER_ALLOCATED" | "FULLY_ALLOCATED" | "UNDER_ALLOCATED";
  activeProjectCount: number;
  assignments: ProjectAssignmentItem[];
}

export interface AssignmentSummary {
  totalEmployees: number;
  overheadCount: number;
  overAllocatedCount: number;
  fullyAllocatedCount: number;
  underAllocatedCount: number;
  avgAllocationPercentage: number;
}

export interface EmployeeAssignmentResponse {
  employees: EmployeeAssignmentItem[];
  summary: AssignmentSummary;
  generatedAt: string;
}

// ============================================================================
// REPORT 9 — CONTRACT EXPIRY
// ============================================================================

export interface ContractExpiryFilters {
  daysAhead?: number;
  includeExpired?: boolean;
  urgency?: "EXPIRED" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  sortBy?: "expiryDate" | "employeeName" | "urgency";
  sortOrder?: "asc" | "desc";
  department?: string;
  status?: string;
}

export interface ContractExpiryItem {
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  department: string;
  position: string;
  employmentType: string;
  contractType: string;
  contractStartDate: string;
  contractEndDate: string | null;
  daysUntilExpiry: number | null;
  urgency: "EXPIRED" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NO_EXPIRY";
  isRenewable: boolean;
}

export interface ContractExpirySummary {
  totalContracts: number;
  expiredCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface ContractExpiryResponse {
  contracts: ContractExpiryItem[];
  summary: ContractExpirySummary;
  generatedAt: string;
  daysAhead: number;
}
