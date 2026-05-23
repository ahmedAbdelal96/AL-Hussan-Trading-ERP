/**
 * Dashboard Statistics Types
 */

export interface AssetsModuleSummary {
  totalAssets: number;
  totalValue: number;
  availableAssets: number;
  inUseAssets: number;
  underMaintenanceAssets: number;
  utilizationRate: number;
  expiredWarrantyCount: number;
}

export interface ProjectsModuleSummary {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  cancelledProjects: number;
  totalBudget: number;
  totalActualCost: number;
  completionRate: number;
}

export interface EmployeesModuleSummary {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  onLeaveEmployees: number;
}

export interface MaintenanceModuleSummary {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  completionRate: number;
}

export interface FinanceModuleSummary {
  totalCosts: number;
  pendingAmount: number;
  approvedAmount: number;
  paidAmount: number;
  rejectedAmount: number;
  averageCost: number;
  totalEntries: number;
}

export interface CriticalAlerts {
  pendingMaintenance: number;
  expiredWarranties: number;
  onHoldProjects: number;
  pendingApprovals: number;
  inactiveEmployees: number;
  highTurnoverAlert: number;
}

export interface DashboardStatistics {
  assets: AssetsModuleSummary | null;
  projects: ProjectsModuleSummary | null;
  employees: EmployeesModuleSummary | null;
  maintenance: MaintenanceModuleSummary | null;
  finance: FinanceModuleSummary | null;
  alerts: CriticalAlerts;
  generatedAt: string;
}
