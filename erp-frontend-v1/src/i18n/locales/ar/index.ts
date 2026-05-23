import { common } from "./common";
import { sidebar } from "./sidebar";
import { auth } from "./auth";
import { dashboard } from "./dashboard";
import { profile } from "./profile";
import { usersAr } from "./users";
import { employeesAr } from "./employees";
import sitesAr from "./sites";
import projectsAr from "./projects";
import { payrollAr } from "./payroll";
import { rbacAr } from "./rbac";
import { assetsAr } from "./assets";
import { maintenanceAr } from "./maintenance";
import { financeAr } from "./finance";
import reportsAr from "./reports";
import { adminAr } from "./admin";

export const ar = {
  common,
  sidebar,
  nav: {
    reports: "التقارير",
    dashboard: "لوحة التحكم",
  },
  navigation: {
    // Core Navigation
    dashboard: "لوحة التحكم",

    // Main Modules
    projects: "المشاريع",
    sites: "المواقع",
    employees: "الموظفون",
    assets: "الأصول",
    maintenance: "الصيانة",
    finance: "المالية",
    payroll: "الرواتب",
    users: "المستخدمين",
    customers: "العملاء",
    suppliers: "الموردين",
    roles: "الأدوار",

    // Reports
    reports: "التقارير",
    financeReports: "تقارير المالية",
    projectsReports: "تقارير المشاريع",
    employeesReports: "تقارير الموظفين",
    payrollReports: "تقارير الرواتب",
    assetsReports: "تقارير الأصول",
    maintenanceReports: "تقارير الصيانة",
    sitesReports: "تقارير المواقع",
    usersReports: "تقارير المستخدمين",

    // User Management
    newUser: "مستخدم جديد",
    editUser: "تعديل مستخدم",
    userPermissions: "صلاحيات المستخدم",

    // Inventory
    inventory: "المخزون",
    warehouses: "المخازن",
    materials: "المواد",
    stockOperations: "عمليات المخزون",

    // Admin
    admin: "الإدارة",
    forceLogout: "فرض تسجيل الخروج",
    unlockUser: "إلغاء قفل المستخدم",

    pageTitles: {
      appName: "شركة الحصان - نظام ERP",
      dashboard: "لوحة التحكم",
      // Employees
      employees: "الموظفون",
      employeesDashboard: "لوحة تحكم الموظفين",
      createEmployee: "إضافة موظف",
      employeeDetails: "تفاصيل الموظف",
      editEmployee: "تعديل بيانات الموظف",
      // Assets
      assets: "الأصول",
      assetsDashboard: "لوحة تحكم الأصول",
      createAsset: "إضافة أصل",
      assetDetails: "تفاصيل الأصل",
      editAsset: "تعديل الأصل",
      // Finance
      finance: "المالية",
      financeDashboard: "لوحة تحكم المالية",
      financeCosts: "تكاليف المشاريع",
      createCost: "إضافة تكلفة",
      allocatedCosts: "التكاليف المخصصة",
      costApprovals: "طلبات الاعتماد",
      costCategories: "فئات التكاليف",
      costDetails: "تفاصيل التكلفة",
      editCost: "تعديل التكلفة",
      projectCostSummary: "ملخص تكاليف المشروع",
      // Projects
      projects: "المشاريع",
      projectsDashboard: "لوحة تحكم المشاريع",
      createProject: "إضافة مشروع",
      projectDetails: "تفاصيل المشروع",
      editProject: "تعديل المشروع",
      projectProgress: "تقدم المشروع",
      // Sites
      sites: "المواقع",
      sitesDashboard: "لوحة تحكم المواقع",
      createSite: "إضافة موقع",
      deletedSites: "المواقع المحذوفة",
      siteDetails: "تفاصيل الموقع",
      editSite: "تعديل الموقع",
      // Maintenance
      maintenance: "الصيانة",
      maintenanceDashboard: "لوحة تحكم الصيانة",
      createMaintenance: "طلب صيانة جديد",
      maintenanceDetails: "تفاصيل الصيانة",
      editMaintenance: "تعديل طلب الصيانة",
      // Payroll
      payroll: "الرواتب",
      payrollDashboard: "لوحة تحكم الرواتب",
      processPayroll: "معالجة الرواتب",
      payslips: "قسائم الرواتب",
      payslipDetails: "قسيمة الراتب",
      allowanceTypes: "أنواع البدلات",
      createAllowanceType: "إضافة نوع بدل",
      editAllowanceType: "تعديل نوع البدل",
      employeeAllowances: "بدلات الموظفين",
      employeeDeductions: "خصومات الموظفين",
      employeeLoans: "سلف الموظفين",
      // Users
      users: "المستخدمون",
      createUser: "إضافة مستخدم",
      deletedUsers: "المستخدمون المحذوفون",
      userDetails: "تفاصيل المستخدم",
      editUser: "تعديل المستخدم",
      // RBAC / Admin
      rbac: "إدارة الصلاحيات",
      profile: "الملف الشخصي",
      adminDashboard: "لوحة المشرف",
      adminSessions: "جلسات المستخدمين",
      auditLogs: "سجل العمليات",
      // Reports hub
      reports: "مركز التقارير",
      // Reports — Employees
      reportEmployeesOverview: "نظرة عامة على الموظفين",
      reportEmployeesByDepartment: "الموظفون حسب الإدارة",
      reportEmployeesByPosition: "الموظفون حسب المنصب",
      reportEmployeesByType: "الموظفون حسب نوع التوظيف",
      reportEmployeesStatus: "توزيع حالات الموظفين",
      reportEmployeesTurnover: "دوران الموظفين",
      reportEmployeesAgeExp: "العمر والخبرة",
      // Reports — Assets
      reportAssetsOverview: "نظرة عامة على الأصول",
      reportAssetsByStatus: "الأصول حسب الحالة",
      reportAssetsByType: "الأصول حسب النوع",
      reportAssetsByLocation: "الأصول حسب الموقع",
      reportAssetsDepreciation: "تقرير الاستهلاك",
      reportAssetsUtilization: "تقرير الاستخدام",
      // Reports — Finance
      reportFinanceOverview: "نظرة عامة مالية",
      reportFinanceByCategory: "التكاليف حسب الفئة",
      reportFinanceByProject: "التكاليف حسب المشروع",
      reportFinanceByCostType: "التكاليف حسب النوع",
      reportFinanceByPaymentStatus: "التكاليف حسب حالة الدفع",
      reportFinanceMonthlyTrend: "الاتجاه الشهري",
      reportFinanceOverdue: "المدفوعات المتأخرة",
      reportFinancePendingApprovals: "الموافقات المعلقة",
      // Reports — Projects
      reportProjectsOverview: "نظرة عامة على المشاريع",
      reportProjectsByStatus: "المشاريع حسب الحالة",
      reportProjectsBySite: "المشاريع حسب الموقع",
      reportProjectsBudget: "استخدام الميزانية",
      reportProjectsCompleted: "المشاريع المكتملة",
      reportProjectsDelayed: "المشاريع المتأخرة",
      reportProjectsTimeline: "الجدول الزمني للمشاريع",
      // Reports — Maintenance
      reportMaintenanceOverview: "نظرة عامة على الصيانة",
      reportMaintenanceByStatus: "الصيانة حسب الحالة",
      reportMaintenanceByType: "الصيانة حسب النوع",
      reportMaintenanceByAsset: "الصيانة حسب الأصل",
      reportMaintenanceCost: "تحليل تكاليف الصيانة",
      reportMaintenancePerformance: "أداء الصيانة",
      reportMaintenancePreventive: "الصيانة الوقائية",
      // Reports — Payroll
      reportPayrollOverview: "نظرة عامة على الرواتب",
      reportPayrollByDepartment: "الرواتب حسب الإدارة",
      reportPayrollBySite: "الرواتب حسب الموقع",
      reportPayrollComparison: "مقارنة الرواتب",
      reportPayrollTrend: "اتجاه الرواتب",
      reportPayrollAllowances: "تقرير البدلات",
      reportPayrollDeductionsLoans: "الخصومات والسلف",
      reportPayrollComponents: "مكونات الراتب",
      // Reports — Sites
      reportSitesByStatus: "المواقع حسب الحالة",
      reportSitesByLocation: "المواقع حسب الموقع",
      reportSitesCapacity: "طاقة المواقع",
      reportSitesOverview: "نظرة عامة على المواقع",
      reportSitesPerformance: "أداء المواقع",
      reportSitesWithProjects: "المواقع مع المشاريع",
      // Reports — Users
      reportUsersOverview: "نظرة عامة على المستخدمين",
      reportUsersActiveSessions: "الجلسات النشطة",
      reportUsersAuditLogs: "سجل عمليات المستخدمين",
      reportUsersFailedLogins: "محاولات تسجيل الدخول الفاشلة",
      reportUsersLockedAccounts: "الحسابات المقفلة",
      reportUsersLoginActivity: "نشاط تسجيل الدخول",
      reportUsersPermissions: "سجل منح الصلاحيات",
      reportUsersRoles: "الأدوار والصلاحيات",
    },
  },
  auth,
  dashboard,
  profile,
  users: usersAr,
  employees: employeesAr,
  sites: sitesAr,
  projects: projectsAr,
  payroll: payrollAr,
  rbac: rbacAr,
  assets: assetsAr,
  maintenance: maintenanceAr,
  finance: {
    ...financeAr,
    costs: {
      ...financeAr.costs,
      allocations:
        financeAr.costs?.allocations ??
        financeAr.dashboard?.allocations ??
        financeAr.allocations,
    },
  },
  reports: reportsAr,
  admin: adminAr,

  // Roles
  roles: {
    SUPERADMIN: "مدير النظام",
    ADMIN: "مدير",
    HR_MANAGER: "مدير الموارد البشرية",
    EMPLOYEE: "موظف",
    ACCOUNTANT: "محاسب",
  },

  // Direct Arabic keys (used by utility functions that return Arabic text)
  نشط: "نشط",
  "تحت التجهيز": "تحت التجهيز",
  "غير نشط": "غير نشط",
  مغلق: "مغلق",
};
