import { common } from "./common";
import { sidebar } from "./sidebar";
import { auth } from "./auth";
import { dashboard } from "./dashboard";
import { profile } from "./profile";
import { usersEn } from "./users";
import { employeesEn } from "./employees";
import sitesEn from "./sites";
import projectsEn from "./projects";
import { payrollEn } from "./payroll";
import { rbacEn } from "./rbac";
import { assetsEn } from "./assets";
import { maintenanceEn } from "./maintenance";
import { financeEn } from "./finance";
import reportsEn from "./reports";
import { adminEn } from "./admin";

export const en = {
  common,
  sidebar,
  nav: {
    reports: "Reports",
    dashboard: "Dashboard",
  },
  navigation: {
    // Core Navigation
    dashboard: "Dashboard",

    // Main Modules
    projects: "Projects",
    sites: "Sites",
    employees: "Employees",
    assets: "Assets",
    maintenance: "Maintenance",
    finance: "Finance",
    payroll: "Payroll",
    users: "Users",
    customers: "Customers",
    suppliers: "Suppliers",
    roles: "Roles",
    permissions: "Permissions",

    // Reports
    reports: "Reports",
    financeReports: "Finance Reports",
    projectsReports: "Projects Reports",
    employeesReports: "Employees Reports",
    payrollReports: "Payroll Reports",
    assetsReports: "Assets Reports",
    maintenanceReports: "Maintenance Reports",
    sitesReports: "Sites Reports",
    usersReports: "Users Reports",

    // User Management
    newUser: "New User",
    editUser: "Edit User",
    userPermissions: "User Permissions",
    newCustomer: "New Customer",
    editCustomer: "Edit Customer",
    searchCustomers: "Search Customers",

    // Roles & Permissions
    newRole: "New Role",
    editRole: "Edit Role",
    rolePermissions: "Role Permissions",
    newPermission: "New Permission",
    editPermission: "Edit Permission",

    // Suppliers
    newSupplier: "New Supplier",
    editSupplier: "Edit Supplier",

    // Factories
    factories: "Factories",
    factoryDetails: "Factory Details",

    // Orders
    orders: "Orders",
    newOrder: "New Order",
    editOrder: "Edit Order",

    // Inventory
    inventory: "Inventory",
    inventoryDashboard: "Inventory Dashboard",
    warehouses: "Warehouses",
    newWarehouse: "New Warehouse",
    editWarehouse: "Edit Warehouse",
    materials: "Materials",
    newMaterial: "New Material",
    editMaterial: "Edit Material",
    batches: "Batches",
    operations: "Operations",
    addStock: "Add Stock",
    removeStock: "Remove Stock",
    transferStock: "Transfer Stock",
    adjustmentStock: "Adjustment Stock",
    inventoryCount: "Inventory Count",
    newCount: "New Count",
    history: "History",
    stockLevelReport: "Stock Level Report",
    movementsReport: "Movements Report",
    valuationReport: "Valuation Report",
    consumptionReport: "Consumption Report",

    // Purchasing
    purchasing: "Purchasing",
    grn: "GRN",
    newGRN: "New GRN",

    // Admin
    admin: "Administration",
    forceLogout: "Force Logout",
    unlockUser: "Unlock User",

    pageTitles: {
      appName: "Al-Hisaan Company - ERP System",
      dashboard: "Dashboard",
      // Employees
      employees: "Employees",
      employeesDashboard: "Employees Dashboard",
      createEmployee: "Add Employee",
      employeeDetails: "Employee Details",
      editEmployee: "Edit Employee",
      // Assets
      assets: "Assets",
      assetsDashboard: "Assets Dashboard",
      createAsset: "Add Asset",
      assetDetails: "Asset Details",
      editAsset: "Edit Asset",
      // Finance
      finance: "Finance",
      financeDashboard: "Finance Dashboard",
      financeCosts: "Project Costs",
      createCost: "Add Cost",
      allocatedCosts: "Allocated Costs",
      costApprovals: "Approval Requests",
      costCategories: "Cost Categories",
      costDetails: "Cost Details",
      editCost: "Edit Cost",
      projectCostSummary: "Project Cost Summary",
      // Projects
      projects: "Projects",
      projectsDashboard: "Projects Dashboard",
      createProject: "Add Project",
      projectDetails: "Project Details",
      editProject: "Edit Project",
      projectProgress: "Project Progress",
      // Sites
      sites: "Sites",
      sitesDashboard: "Sites Dashboard",
      createSite: "Add Site",
      deletedSites: "Deleted Sites",
      siteDetails: "Site Details",
      editSite: "Edit Site",
      // Maintenance
      maintenance: "Maintenance",
      maintenanceDashboard: "Maintenance Dashboard",
      createMaintenance: "New Maintenance Request",
      maintenanceDetails: "Maintenance Details",
      editMaintenance: "Edit Maintenance Request",
      // Payroll
      payroll: "Payroll",
      payrollDashboard: "Payroll Dashboard",
      processPayroll: "Process Payroll",
      payslips: "Payslips",
      payslipDetails: "Payslip",
      allowanceTypes: "Allowance Types",
      createAllowanceType: "Add Allowance Type",
      editAllowanceType: "Edit Allowance Type",
      employeeAllowances: "Employee Allowances",
      employeeDeductions: "Employee Deductions",
      employeeLoans: "Employee Loans",
      // Users
      users: "Users",
      createUser: "Add User",
      deletedUsers: "Deleted Users",
      userDetails: "User Details",
      editUser: "Edit User",
      // RBAC / Admin
      rbac: "Access Management",
      profile: "Profile",
      adminDashboard: "Admin Dashboard",
      adminSessions: "User Sessions",
      auditLogs: "Audit Logs",
      // Reports hub
      reports: "Reports Center",
      // Reports — Employees
      reportEmployeesOverview: "Employees Overview",
      reportEmployeesByDepartment: "Employees by Department",
      reportEmployeesByPosition: "Employees by Position",
      reportEmployeesByType: "Employees by Employment Type",
      reportEmployeesStatus: "Employee Status Distribution",
      reportEmployeesTurnover: "Employee Turnover",
      reportEmployeesAgeExp: "Age and Experience",
      // Reports — Assets
      reportAssetsOverview: "Assets Overview",
      reportAssetsByStatus: "Assets by Status",
      reportAssetsByType: "Assets by Type",
      reportAssetsByLocation: "Assets by Location",
      reportAssetsDepreciation: "Depreciation Report",
      reportAssetsUtilization: "Utilization Report",
      // Reports — Finance
      reportFinanceOverview: "Finance Overview",
      reportFinanceByCategory: "Costs by Category",
      reportFinanceByProject: "Costs by Project",
      reportFinanceByCostType: "Costs by Type",
      reportFinanceByPaymentStatus: "Costs by Payment Status",
      reportFinanceMonthlyTrend: "Monthly Trend",
      reportFinanceOverdue: "Overdue Payments",
      reportFinancePendingApprovals: "Pending Approvals",
      // Reports — Projects
      reportProjectsOverview: "Projects Overview",
      reportProjectsByStatus: "Projects by Status",
      reportProjectsBySite: "Projects by Site",
      reportProjectsBudget: "Budget Utilization",
      reportProjectsCompleted: "Completed Projects",
      reportProjectsDelayed: "Delayed Projects",
      reportProjectsTimeline: "Projects Timeline",
      // Reports — Maintenance
      reportMaintenanceOverview: "Maintenance Overview",
      reportMaintenanceByStatus: "Maintenance by Status",
      reportMaintenanceByType: "Maintenance by Type",
      reportMaintenanceByAsset: "Maintenance by Asset",
      reportMaintenanceCost: "Maintenance Cost Analysis",
      reportMaintenancePerformance: "Maintenance Performance",
      reportMaintenancePreventive: "Preventive Maintenance",
      // Reports — Payroll
      reportPayrollOverview: "Payroll Overview",
      reportPayrollByDepartment: "Payroll by Department",
      reportPayrollBySite: "Payroll by Site",
      reportPayrollComparison: "Payroll Comparison",
      reportPayrollTrend: "Payroll Trend",
      reportPayrollAllowances: "Allowances Report",
      reportPayrollDeductionsLoans: "Deductions and Loans",
      reportPayrollComponents: "Salary Components",
      // Reports — Sites
      reportSitesByStatus: "Sites by Status",
      reportSitesByLocation: "Sites by Location",
      reportSitesCapacity: "Site Capacity",
      reportSitesOverview: "Sites Overview",
      reportSitesPerformance: "Sites Performance",
      reportSitesWithProjects: "Sites with Projects",
      // Reports — Users
      reportUsersOverview: "Users Overview",
      reportUsersActiveSessions: "Active Sessions",
      reportUsersAuditLogs: "User Audit Logs",
      reportUsersFailedLogins: "Failed Login Attempts",
      reportUsersLockedAccounts: "Locked Accounts",
      reportUsersLoginActivity: "Login Activity",
      reportUsersPermissions: "Permission Grant History",
      reportUsersRoles: "Roles and Permissions",
    },
  },
  auth,
  dashboard,
  profile,
  users: usersEn,
  employees: employeesEn,
  sites: sitesEn,
  projects: projectsEn,
  payroll: payrollEn,
  rbac: rbacEn,
  assets: assetsEn,
  maintenance: maintenanceEn,
  finance: financeEn,
  reports: reportsEn,
  admin: adminEn,

  // Roles
  roles: {
    SUPERADMIN: "Super Admin",
    ADMIN: "Admin",
    HR_MANAGER: "HR Manager",
    EMPLOYEE: "Employee",
    ACCOUNTANT: "Accountant",
  },
};
