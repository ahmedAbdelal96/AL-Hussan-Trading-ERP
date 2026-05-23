/**
 * ============================================================================
 * EMPLOYEES STATISTICS TYPES
 * ============================================================================
 *
 * TypeScript interfaces for employee statistics and analytics.
 * Matches backend DTOs exactly for type safety.
 *
 * Features:
 * - Complete type definitions for all statistics
 * - Employment type, status, and demographics breakdowns
 * - Department and position distributions
 * - Monthly hiring trends
 * - Comprehensive overview metrics
 *
 * @module EmployeesStatisticsTypes
 * @version 1.0.0
 * @author ERP System - Senior Frontend Developer
 */

/**
 * ============================================================================
 * ENUMS
 * ============================================================================
 */

export enum EmploymentType {
  PERMANENT = "PERMANENT",
  CONTRACT = "CONTRACT",
  FREELANCE = "FREELANCE",
  PART_TIME = "PART_TIME",
}

export enum EmployeeStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ON_LEAVE = "ON_LEAVE",
  SUSPENDED = "SUSPENDED",
  TERMINATED = "TERMINATED",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

/**
 * ============================================================================
 * BREAKDOWN INTERFACES
 * ============================================================================
 */

/**
 * Employment type distribution
 */
export interface EmploymentTypeBreakdown {
  employmentType: EmploymentType;
  employeeCount: number;
  percentage: number;
}

/**
 * Employee status distribution
 */
export interface EmployeeStatusBreakdown {
  status: EmployeeStatus;
  employeeCount: number;
  percentage: number;
}

/**
 * Department workforce distribution
 */
export interface DepartmentBreakdown {
  department: string;
  employeeCount: number;
  percentage: number;
  activeCount: number;
}

/**
 * Gender demographics distribution
 */
export interface GenderBreakdown {
  gender: Gender;
  employeeCount: number;
  percentage: number;
}

/**
 * ============================================================================
 * MAIN STATISTICS INTERFACE
 * ============================================================================
 */

/**
 * Comprehensive employee statistics
 */
export interface EmployeesStatistics {
  // Overview metrics
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  onLeaveEmployees: number;

  // Gender metrics
  maleCount: number;
  femaleCount: number;

  // Breakdowns
  employmentTypeBreakdown: EmploymentTypeBreakdown[];
  statusBreakdown: EmployeeStatusBreakdown[];
  departmentBreakdown: DepartmentBreakdown[];
  genderBreakdown: GenderBreakdown[];

  // Metadata
  generatedAt: string;
  startDate?: string;
  endDate?: string;
}

/**
 * ============================================================================
 * QUERY PARAMETERS
 * ============================================================================
 */

/**
 * Parameters for filtering employee statistics
 */
export interface EmployeesStatisticsParams {
  startDate?: string;
  endDate?: string;
  department?: string;
  employmentType?: EmploymentType;
}

/**
 * ============================================================================
 * LABEL MAPPINGS FOR UI
 * ============================================================================
 */

/**
 * Employment type labels (bilingual)
 */
export const EMPLOYMENT_TYPE_LABELS: Record<
  EmploymentType,
  { en: string; ar: string }
> = {
  [EmploymentType.PERMANENT]: {
    en: "Permanent",
    ar: "دائم",
  },
  [EmploymentType.CONTRACT]: {
    en: "Contract",
    ar: "عقد",
  },
  [EmploymentType.FREELANCE]: {
    en: "Freelance",
    ar: "عمل حر",
  },
  [EmploymentType.PART_TIME]: {
    en: "Part-Time",
    ar: "دوام جزئي",
  },
};

/**
 * Employee status labels (bilingual)
 */
export const EMPLOYEE_STATUS_LABELS: Record<
  EmployeeStatus,
  { en: string; ar: string }
> = {
  [EmployeeStatus.ACTIVE]: {
    en: "Active",
    ar: "نشط",
  },
  [EmployeeStatus.INACTIVE]: {
    en: "Inactive",
    ar: "غير نشط",
  },
  [EmployeeStatus.ON_LEAVE]: {
    en: "On Leave",
    ar: "في إجازة",
  },
  [EmployeeStatus.SUSPENDED]: {
    en: "Suspended",
    ar: "موقوف",
  },
  [EmployeeStatus.TERMINATED]: {
    en: "Terminated",
    ar: "منتهي",
  },
};

/**
 * Gender labels (bilingual)
 */
export const GENDER_LABELS: Record<Gender, { en: string; ar: string }> = {
  [Gender.MALE]: {
    en: "Male",
    ar: "ذكر",
  },
  [Gender.FEMALE]: {
    en: "Female",
    ar: "أنثى",
  },
  [Gender.OTHER]: {
    en: "Other",
    ar: "آخر",
  },
};
