/**
 * ============================================================================
 * EMPLOYEES REPORTS - RESPONSE DTOs PART 3
 * ============================================================================
 *
 * Response DTOs for:
 * - Report 8: Employee Assignment (per-employee project deployment)
 * - Report 9: Contract Expiry (upcoming contract expirations)
 *
 * @module EmployeesResponsesPart3
 */

// ============================================================================
// REPORT 8: EMPLOYEE ASSIGNMENT
// ============================================================================

export class ProjectAssignmentDto {
  projectId: string;
  projectName: string;
  projectStatus: string;
  role: string | null;
  allocationPercentage: number | null; // null = overhead/non-project role
  isActive: boolean;
}

export class EmployeeAssignmentItemDto {
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  department: string;
  position: string;
  employmentType: string;
  totalAllocationPercentage: number; // sum of non-null allocationPercentage values
  allocationStatus:
    | 'OVERHEAD'
    | 'OVER_ALLOCATED'
    | 'FULLY_ALLOCATED'
    | 'UNDER_ALLOCATED';
  activeProjectCount: number;
  assignments: ProjectAssignmentDto[];
}

export class AssignmentSummaryDto {
  totalEmployees: number;
  overheadCount: number;
  overAllocatedCount: number;
  fullyAllocatedCount: number;
  underAllocatedCount: number;
  avgAllocationPercentage: number;
}

export class EmployeeAssignmentResponseDto {
  employees: EmployeeAssignmentItemDto[];
  summary: AssignmentSummaryDto;
  generatedAt: string;
}

// ============================================================================
// REPORT 9: CONTRACT EXPIRY
// ============================================================================

export class ContractExpiryItemDto {
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  department: string;
  position: string;
  employmentType: string;
  contractType: string;
  contractStartDate: string;
  contractEndDate: string | null;
  daysUntilExpiry: number | null; // null if endDate is null
  urgency: 'EXPIRED' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NO_EXPIRY';
  isRenewable: boolean;
}

export class ContractExpirySummaryDto {
  totalContracts: number;
  expiredCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export class ContractExpiryResponseDto {
  contracts: ContractExpiryItemDto[];
  summary: ContractExpirySummaryDto;
  generatedAt: string;
  daysAhead: number;
}
