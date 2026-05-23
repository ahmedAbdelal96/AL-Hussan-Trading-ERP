/**
 * ============================================================================
 * PROJECTS STATISTICS TYPES
 * ============================================================================
 *
 *
 * @module ProjectsStatisticsTypes
 * @version 1.0.0
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum ProjectStatus {
  DRAFT = "DRAFT",
  PLANNING = "PLANNING",
  ACTIVE = "ACTIVE",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  ARCHIVED = "ARCHIVED",
}

export enum TimelineStatus {
  ON_TIME = "ON_TIME",
  BEHIND_SCHEDULE = "BEHIND_SCHEDULE",
  AHEAD_OF_SCHEDULE = "AHEAD_OF_SCHEDULE",
  NOT_STARTED = "NOT_STARTED",
}

export enum BudgetStatus {
  WITHIN_BUDGET = "WITHIN_BUDGET",
  OVER_BUDGET = "OVER_BUDGET",
  UNDER_BUDGET = "UNDER_BUDGET",
  NO_BUDGET = "NO_BUDGET",
}

// ============================================================================
// BILINGUAL LABELS
// ============================================================================

export const PROJECT_STATUS_LABELS: Record<
  ProjectStatus,
  { ar: string; en: string }
> = {
  [ProjectStatus.DRAFT]: { ar: "مسودة", en: "Draft" },
  [ProjectStatus.PLANNING]: { ar: "تخطيط", en: "Planning" },
  [ProjectStatus.ACTIVE]: { ar: "نشط", en: "Active" },
  [ProjectStatus.ON_HOLD]: { ar: "معلق", en: "On Hold" },
  [ProjectStatus.COMPLETED]: { ar: "مكتمل", en: "Completed" },
  [ProjectStatus.CANCELLED]: { ar: "ملغى", en: "Cancelled" },
  [ProjectStatus.ARCHIVED]: { ar: "مؤرشف", en: "Archived" },
};

export const TIMELINE_STATUS_LABELS: Record<
  TimelineStatus,
  { ar: string; en: string }
> = {
  [TimelineStatus.ON_TIME]: { ar: "في الموعد", en: "On Time" },
  [TimelineStatus.BEHIND_SCHEDULE]: { ar: "متأخر", en: "Behind Schedule" },
  [TimelineStatus.AHEAD_OF_SCHEDULE]: { ar: "متقدم", en: "Ahead of Schedule" },
  [TimelineStatus.NOT_STARTED]: { ar: "لم يبدأ", en: "Not Started" },
};

export const BUDGET_STATUS_LABELS: Record<
  BudgetStatus,
  { ar: string; en: string }
> = {
  [BudgetStatus.WITHIN_BUDGET]: { ar: "ضمن الميزانية", en: "Within Budget" },
  [BudgetStatus.OVER_BUDGET]: { ar: "تجاوز الميزانية", en: "Over Budget" },
  [BudgetStatus.UNDER_BUDGET]: { ar: "أقل من الميزانية", en: "Under Budget" },
  [BudgetStatus.NO_BUDGET]: { ar: "بلا ميزانية", en: "No Budget" },
};

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export interface ProjectsStatisticsParams {
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
  siteId?: string;
  managerId?: string;
}

// ============================================================================
// BREAKDOWN INTERFACES
// ============================================================================

export interface StatusBreakdown {
  status: ProjectStatus;
  count: number;
  percentage: number;
  totalBudget: number;
  totalActualCost: number;
  averageCompletion: number;
}

export interface TimelineBreakdown {
  timelineStatus: TimelineStatus;
  count: number;
  percentage: number;
  averageDaysVariance: number;
}

export interface BudgetBreakdown {
  budgetStatus: BudgetStatus;
  count: number;
  percentage: number;
  totalVariance: number;
  averageVariancePercentage: number;
}

export interface MonthlyTrend {
  month: string;
  projectsStarted: number;
  projectsCompleted: number;
  projectsCancelled: number;
  totalBudget: number;
  totalActualCost: number;
  activeProjectsCount: number;
}

export interface TopProject {
  projectId: string;
  projectCode: string;
  projectName: string;
  status: ProjectStatus;
  budget: number;
  actualCost: number;
  budgetVariance: number;
  completionPercentage: number;
  durationDays: number;
}

export interface EmployeeDistribution {
  projectId: string;
  projectName: string;
  employeeCount: number;
  totalEmployeeCost: number;
}

export interface SiteDistribution {
  siteId: string;
  siteName: string;
  projectCount: number;
  totalBudget: number;
  activeProjectsCount: number;
  completedProjectsCount: number;
}

// ============================================================================
// MAIN STATISTICS INTERFACE
// ============================================================================

export interface ProjectsStatistics {
  // Overview Metrics (11 KPIs)
  totalProjects: number;
  draftProjects: number;
  planningProjects: number;
  activeProjects: number;
  onHoldProjects: number;
  completedProjects: number;
  cancelledProjects: number;
  completionRate: number;
  totalBudget: number;
  totalActualCost: number;
  budgetVariance: number;
  averageCompletion: number;

  // Breakdowns (6 Analysis)
  statusBreakdown: StatusBreakdown[];
  monthlyTrend: MonthlyTrend[];
  topProjectsByBudget: TopProject[];
  topProjectsByCost: TopProject[];
  employeeDistribution: EmployeeDistribution[];
  siteDistribution: SiteDistribution[];

  // Metadata
  generatedAt: Date;
}
