/**
 * ============================================================================
 * SYSTEM PERMISSIONS - HYBRID APPROACH
 * ============================================================================
 *
 * This file contains ALL system permissions organized by module.
 * Used for:
 * - Database seeding
 * - Permission validation
 * - Documentation
 * - Frontend permission checks
 *
 * Structure:
 * - Standard Modules: 3 permissions (read, write, delete)
 * - Sensitive Modules: 4-6 permissions (+ approve, export, special)
 *
 * Total: ~36 permissions for entire system
 * ============================================================================
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface Role {
  slug: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  isActive: boolean;
}

export interface Permission {
  resource: string;
  action: string;
  description: string;
  nameAr: string; // Arabic name
  descriptionAr: string; // Arabic description
  module: string;
  isSensitive: boolean;
}

// ============================================================================
// SYSTEM ROLES (9 roles)
// ============================================================================

/**
 * All System Roles with Arabic Translations
 * جميع أدوار النظام مع الترجمات العربية
 */
export const SYSTEM_ROLES: Role[] = [
  {
    slug: 'SUPERADMIN',
    name: 'Super Administrator',
    nameAr: 'مدير النظام الأعلى',
    description:
      'System super admin with full access to all features and settings',
    descriptionAr:
      'مدير النظام الأعلى مع صلاحيات كاملة لجميع الميزات والإعدادات',
    isActive: true,
  },
  {
    slug: 'IT_ADMIN',
    name: 'IT Administrator',
    nameAr: 'مدير تقنية المعلومات',
    description:
      'IT administrator responsible for system administration and access governance',
    descriptionAr:
      'مسؤول تقنية المعلومات عن إدارة النظام والتحكم في صلاحيات الوصول',
    isActive: true,
  },
  {
    slug: 'ADMIN',
    name: 'Administrator',
    nameAr: 'مدير النظام',
    description: 'System administrator with broad access to manage the ERP',
    descriptionAr: 'مدير النظام مع صلاحيات واسعة لإدارة نظام ERP',
    isActive: true,
  },
  {
    slug: 'HR_MANAGER',
    name: 'HR Manager',
    nameAr: 'مدير الموارد البشرية',
    description: 'HR department manager with full HR and payroll access',
    descriptionAr:
      'مدير قسم الموارد البشرية مع صلاحيات كاملة للموارد البشرية والرواتب',
    isActive: true,
  },
  {
    slug: 'HR_STAFF',
    name: 'HR Staff',
    nameAr: 'موظف موارد بشرية',
    description: 'HR team member with basic HR operations access',
    descriptionAr: 'عضو فريق الموارد البشرية مع صلاحيات العمليات الأساسية',
    isActive: true,
  },
  {
    slug: 'FIN_MANAGER',
    name: 'Finance Manager',
    nameAr: 'مدير مالي',
    description: 'Finance department manager with full financial access',
    descriptionAr: 'مدير القسم المالي مع صلاحيات كاملة للعمليات المالية',
    isActive: true,
  },
  {
    slug: 'FIN_STAFF',
    name: 'Finance Staff',
    nameAr: 'موظف مالي',
    description: 'Finance team member with basic finance operations access',
    descriptionAr: 'عضو الفريق المالي مع صلاحيات العمليات المالية الأساسية',
    isActive: true,
  },
  {
    slug: 'OPS_MANAGER',
    name: 'Operations Manager',
    nameAr: 'مدير العمليات',
    description: 'Operations manager with access to sites, projects, assets',
    descriptionAr: 'مدير العمليات مع صلاحيات الوصول للمواقع والمشاريع والأصول',
    isActive: true,
  },
  {
    slug: 'OPS_STAFF',
    name: 'Operations Staff',
    nameAr: 'موظف عمليات',
    description: 'Operations team member with basic operational access',
    descriptionAr: 'عضو فريق العمليات مع صلاحيات الوصول التشغيلية الأساسية',
    isActive: true,
  },
  {
    slug: 'USER',
    name: 'User',
    nameAr: 'مستخدم',
    description: 'Basic user with minimal permissions',
    descriptionAr: 'مستخدم عادي مع صلاحيات محدودة',
    isActive: true,
  },
];

// ============================================================================
// 1. STANDARD MODULES (3 permissions each = 18 total)
// ============================================================================

/**
 * Employee Module Permissions
 * الصلاحيات: 3
 */
export const EMPLOYEE_PERMISSIONS: Permission[] = [
  {
    resource: 'employee',
    action: 'read',
    description: 'View employees list and details',
    nameAr: 'عرض الموظفين',
    descriptionAr: 'عرض قائمة الموظفين وتفاصيلهم',
    module: 'Employee',
    isSensitive: false,
  },
  {
    resource: 'employee',
    action: 'write',
    description: 'Create and update employees',
    nameAr: 'إدارة الموظفين',
    descriptionAr: 'إنشاء وتعديل بيانات الموظفين',
    module: 'Employee',
    isSensitive: false,
  },
  {
    resource: 'employee',
    action: 'delete',
    description: 'Delete employees',
    nameAr: 'حذف الموظفين',
    descriptionAr: 'حذف الموظفين من النظام',
    module: 'Employee',
    isSensitive: false,
  },
];

/**
 * Site Module Permissions
 * الصلاحيات: 3
 */
export const SITE_PERMISSIONS: Permission[] = [
  {
    resource: 'site',
    action: 'read',
    description: 'View sites list and details',
    nameAr: 'عرض المواقع',
    descriptionAr: 'عرض قائمة المواقع وتفاصيلها',
    module: 'Site',
    isSensitive: false,
  },
  {
    resource: 'site',
    action: 'write',
    description: 'Create and update sites',
    nameAr: 'إدارة المواقع',
    descriptionAr: 'إنشاء وتعديل بيانات المواقع',
    module: 'Site',
    isSensitive: false,
  },
  {
    resource: 'site',
    action: 'delete',
    description: 'Delete sites',
    nameAr: 'حذف المواقع',
    descriptionAr: 'حذف المواقع من النظام',
    module: 'Site',
    isSensitive: false,
  },
];

/**
 * Project Module Permissions
 * الصلاحيات: 3
 */
export const PROJECT_PERMISSIONS: Permission[] = [
  {
    resource: 'project',
    action: 'read',
    description: 'View projects list and details',
    nameAr: 'عرض المشاريع',
    descriptionAr: 'عرض قائمة المشاريع وتفاصيلها',
    module: 'Project',
    isSensitive: false,
  },
  {
    resource: 'project',
    action: 'write',
    description: 'Create and update projects',
    nameAr: 'إدارة المشاريع',
    descriptionAr: 'إنشاء وتعديل بيانات المشاريع',
    module: 'Project',
    isSensitive: false,
  },
  {
    resource: 'project',
    action: 'delete',
    description: 'Delete projects',
    nameAr: 'حذف المشاريع',
    descriptionAr: 'حذف المشاريع من النظام',
    module: 'Project',
    isSensitive: false,
  },
];

/**
 * Asset Module Permissions
 * الصلاحيات: 3
 */
export const ASSET_PERMISSIONS: Permission[] = [
  {
    resource: 'asset',
    action: 'read',
    description: 'View assets list and details',
    nameAr: 'عرض الأصول',
    descriptionAr: 'عرض قائمة الأصول وتفاصيلها',
    module: 'Asset',
    isSensitive: false,
  },
  {
    resource: 'asset',
    action: 'write',
    description: 'Create and update assets',
    nameAr: 'إدارة الأصول',
    descriptionAr: 'إنشاء وتعديل بيانات الأصول',
    module: 'Asset',
    isSensitive: false,
  },
  {
    resource: 'asset',
    action: 'delete',
    description: 'Delete assets',
    nameAr: 'حذف الأصول',
    descriptionAr: 'حذف الأصول من النظام',
    module: 'Asset',
    isSensitive: false,
  },
];

/**
 * Department Module Permissions
 * الصلاحيات: 3
 */
export const DEPARTMENT_PERMISSIONS: Permission[] = [
  {
    resource: 'department',
    action: 'read',
    description: 'View departments list and details',
    nameAr: 'عرض الأقسام',
    descriptionAr: 'عرض قائمة الأقسام وتفاصيلها',
    module: 'Department',
    isSensitive: false,
  },
  {
    resource: 'department',
    action: 'write',
    description: 'Create and update departments',
    nameAr: 'إدارة الأقسام',
    descriptionAr: 'إنشاء وتعديل بيانات الأقسام',
    module: 'Department',
    isSensitive: false,
  },
  {
    resource: 'department',
    action: 'delete',
    description: 'Delete departments',
    nameAr: 'حذف الأقسام',
    descriptionAr: 'حذف الأقسام من النظام',
    module: 'Department',
    isSensitive: false,
  },
];

/**
 * Position Module Permissions
 * الصلاحيات: 3
 */
export const POSITION_PERMISSIONS: Permission[] = [
  {
    resource: 'position',
    action: 'read',
    description: 'View positions list and details',
    nameAr: 'عرض المناصب',
    descriptionAr: 'عرض قائمة المناصب الوظيفية وتفاصيلها',
    module: 'Position',
    isSensitive: false,
  },
  {
    resource: 'position',
    action: 'write',
    description: 'Create and update positions',
    nameAr: 'إدارة المناصب',
    descriptionAr: 'إنشاء وتعديل بيانات المناصب الوظيفية',
    module: 'Position',
    isSensitive: false,
  },
  {
    resource: 'position',
    action: 'delete',
    description: 'Delete positions',
    nameAr: 'حذف المناصب',
    descriptionAr: 'حذف المناصب الوظيفية من النظام',
    module: 'Position',
    isSensitive: false,
  },
];

// ============================================================================
// 2. SENSITIVE MODULES (4-6 permissions each = 18 total)
// ============================================================================

/**
 * Payroll Module Permissions
 * الصلاحيات: 4 (حساسة)
 */
export const PAYROLL_PERMISSIONS: Permission[] = [
  {
    resource: 'payroll',
    action: 'read',
    description: 'View payroll data and salary information',
    nameAr: 'عرض الرواتب',
    descriptionAr: 'عرض سجلات الرواتب والمستحقات',
    module: 'Payroll',
    isSensitive: true,
  },
  {
    resource: 'payroll',
    action: 'write',
    description: 'Create and update salary structures, allowances, loans',
    nameAr: 'إدارة الرواتب',
    descriptionAr: 'إنشاء وتعديل سجلات الرواتب',
    module: 'Payroll',
    isSensitive: true,
  },
  {
    resource: 'payroll',
    action: 'process',
    description: 'Process monthly payroll calculations',
    nameAr: 'معالجة الرواتب',
    descriptionAr: 'معالجة واحتساب الرواتب الشهرية',
    module: 'Payroll',
    isSensitive: true,
  },
  {
    resource: 'payroll',
    action: 'approve',
    description: 'Approve and finalize payroll for payment',
    nameAr: 'اعتماد الرواتب',
    descriptionAr: 'اعتماد ومراجعة سجلات الرواتب',
    module: 'Payroll',
    isSensitive: true,
  },
];

/**
 * Finance Module Permissions
 * الصلاحيات: 5 (حساسة)
 */
export const FINANCE_PERMISSIONS: Permission[] = [
  {
    resource: 'finance',
    action: 'read',
    description: 'View financial data, invoices, and transactions',
    nameAr: 'عرض المالية',
    descriptionAr: 'عرض السجلات والتقارير المالية',
    module: 'Finance',
    isSensitive: true,
  },
  {
    resource: 'finance',
    action: 'write',
    description: 'Create and update invoices, payments, expenses',
    nameAr: 'إدارة المالية',
    descriptionAr: 'إنشاء وتعديل المعاملات المالية',
    module: 'Finance',
    isSensitive: true,
  },
  {
    resource: 'finance',
    action: 'delete',
    description: 'Delete financial records (restricted)',
    nameAr: 'حذف المالية',
    descriptionAr: 'حذف السجلات المالية',
    module: 'Finance',
    isSensitive: true,
  },
  {
    resource: 'finance',
    action: 'approve',
    description: 'Approve financial transactions and budgets',
    nameAr: 'اعتماد المالية',
    descriptionAr: 'اعتماد المعاملات والفواتير المالية',
    module: 'Finance',
    isSensitive: true,
  },
  {
    resource: 'finance',
    action: 'export',
    description: 'Export financial reports and tax documents',
    nameAr: 'تصدير المالية',
    descriptionAr: 'تصدير البيانات والتقارير المالية',
    module: 'Finance',
    isSensitive: true,
  },
];

/**
 * User Module Permissions
 * الصلاحيات: 5 (حساسة جداً)
 */
export const USER_PERMISSIONS: Permission[] = [
  {
    resource: 'user',
    action: 'read',
    description: 'View users list and account details',
    nameAr: 'عرض المستخدمين',
    descriptionAr: 'عرض قائمة المستخدمين وبياناتهم',
    module: 'User',
    isSensitive: true,
  },
  {
    resource: 'user',
    action: 'write',
    description: 'Create and update user accounts',
    nameAr: 'إدارة المستخدمين',
    descriptionAr: 'إنشاء وتعديل حسابات المستخدمين',
    module: 'User',
    isSensitive: true,
  },
  {
    resource: 'user',
    action: 'delete',
    description: 'Delete user accounts',
    nameAr: 'حذف المستخدمين',
    descriptionAr: 'حذف حسابات المستخدمين من النظام',
    module: 'User',
    isSensitive: true,
  },
  {
    resource: 'user',
    action: 'change_role',
    description: 'Assign and modify user roles (critical)',
    nameAr: 'تغيير الصلاحيات',
    descriptionAr: 'تغيير أدوار وصلاحيات المستخدمين',
    module: 'User',
    isSensitive: true,
  },
  {
    resource: 'user',
    action: 'reset_password',
    description: 'Reset user passwords and unlock accounts',
    nameAr: 'إعادة تعيين كلمة المرور',
    descriptionAr: 'إعادة تعيين كلمات مرور المستخدمين',
    module: 'User',
    isSensitive: true,
  },
];

/**
 * RBAC Module Permissions
 * الصلاحيات: 2 (حساسة جداً)
 */
export const RBAC_PERMISSIONS: Permission[] = [
  {
    resource: 'rbac',
    action: 'read',
    description: 'View roles, permissions, and user access configurations',
    nameAr: 'عرض الصلاحيات',
    descriptionAr: 'عرض الأدوار والصلاحيات في النظام',
    module: 'RBAC',
    isSensitive: true,
  },
  {
    resource: 'rbac',
    action: 'write',
    description: 'Manage roles, permissions, grant/revoke access (critical)',
    nameAr: 'إدارة الصلاحيات',
    descriptionAr: 'إدارة الأدوار والصلاحيات (مدير النظام فقط)',
    module: 'RBAC',
    isSensitive: true,
  },
];

/**
 * Report Module Permissions
 * الصلاحيات: 2
 */
export const REPORT_PERMISSIONS: Permission[] = [
  {
    resource: 'report',
    action: 'view',
    description: 'View system reports and analytics',
    nameAr: 'عرض التقارير',
    descriptionAr: 'عرض وقراءة التقارير المختلفة',
    module: 'Report',
    isSensitive: false,
  },
  {
    resource: 'report',
    action: 'export',
    description: 'Export reports to PDF, Excel, etc.',
    nameAr: 'تصدير التقارير',
    descriptionAr: 'تصدير التقارير إلى ملفات خارجية',
    module: 'Report',
    isSensitive: false,
  },
  // Finance Reports
  {
    resource: 'report',
    action: 'finance',
    description: 'View finance reports',
    nameAr: 'عرض التقارير المالية',
    descriptionAr: 'عرض التقارير المالية والإحصائيات',
    module: 'Report',
    isSensitive: true,
  },
  {
    resource: 'report',
    action: 'finance:export',
    description: 'Export finance reports',
    nameAr: 'تصدير التقارير المالية',
    descriptionAr: 'تصدير التقارير المالية',
    module: 'Report',
    isSensitive: true,
  },
  // Payroll Reports
  {
    resource: 'report',
    action: 'payroll',
    description: 'View payroll reports',
    nameAr: 'عرض تقارير الرواتب',
    descriptionAr: 'عرض تقارير الرواتب والمستحقات',
    module: 'Report',
    isSensitive: true,
  },
  {
    resource: 'report',
    action: 'payroll:export',
    description: 'Export payroll reports',
    nameAr: 'تصدير تقارير الرواتب',
    descriptionAr: 'تصدير تقارير الرواتب',
    module: 'Report',
    isSensitive: true,
  },
  // Projects Reports
  {
    resource: 'report',
    action: 'projects',
    description: 'View projects reports',
    nameAr: 'عرض تقارير المشاريع',
    descriptionAr: 'عرض تقارير وإحصائيات المشاريع',
    module: 'Report',
    isSensitive: false,
  },
  // Employees Reports
  {
    resource: 'report',
    action: 'employees',
    description: 'View employees reports',
    nameAr: 'عرض تقارير الموظفين',
    descriptionAr: 'عرض تقارير وإحصائيات الموظفين',
    module: 'Report',
    isSensitive: false,
  },
  // Assets Reports
  {
    resource: 'report',
    action: 'assets',
    description: 'View assets reports',
    nameAr: 'عرض تقارير الأصول',
    descriptionAr: 'عرض تقارير وإحصائيات الأصول',
    module: 'Report',
    isSensitive: false,
  },
  // Maintenance Reports
  {
    resource: 'report',
    action: 'maintenance',
    description: 'View maintenance reports',
    nameAr: 'عرض تقارير الصيانة',
    descriptionAr: 'عرض تقارير وإحصائيات الصيانة',
    module: 'Report',
    isSensitive: false,
  },
  // Users Reports
  {
    resource: 'report',
    action: 'users',
    description: 'View users reports',
    nameAr: 'عرض تقارير المستخدمين',
    descriptionAr: 'عرض تقارير وإحصائيات المستخدمين',
    module: 'Report',
    isSensitive: false,
  },
  // Sites Reports
  {
    resource: 'report',
    action: 'sites',
    description: 'View sites reports',
    nameAr: 'عرض تقارير المواقع',
    descriptionAr: 'عرض تقارير وإحصائيات المواقع',
    module: 'Report',
    isSensitive: false,
  },
  // System Reports (SUPERADMIN only)
  {
    resource: 'report',
    action: 'system',
    description: 'View system reports (audit logs, etc.)',
    nameAr: 'عرض تقارير النظام',
    descriptionAr: 'عرض تقارير النظام والتدقيق (للمشرفين فقط)',
    module: 'Report',
    isSensitive: true,
  },
];

/**
 * Maintenance Module Permissions
 * الصلاحيات: 3
 */
export const MAINTENANCE_PERMISSIONS: Permission[] = [
  {
    resource: 'maintenance',
    action: 'read',
    description: 'View maintenance requests and history',
    nameAr: 'عرض الصيانة',
    descriptionAr: 'عرض طلبات الصيانة وسجل العمليات',
    module: 'Maintenance',
    isSensitive: false,
  },
  {
    resource: 'maintenance',
    action: 'write',
    description: 'Create, update, and approve maintenance requests',
    nameAr: 'إدارة الصيانة',
    descriptionAr: 'إنشاء وتعديل واعتماد طلبات الصيانة',
    module: 'Maintenance',
    isSensitive: false,
  },
  {
    resource: 'maintenance',
    action: 'delete',
    description: 'Delete maintenance requests',
    nameAr: 'حذف الصيانة',
    descriptionAr: 'حذف طلبات الصيانة من النظام',
    module: 'Maintenance',
    isSensitive: false,
  },
];

/**
 * Dashboard Module Permissions
 * الصلاحيات: 1
 */
export const DASHBOARD_PERMISSIONS: Permission[] = [
  {
    resource: 'dashboard',
    action: 'read',
    description: 'View dashboard and summary statistics',
    nameAr: 'عرض لوحة التحكم',
    descriptionAr: 'عرض لوحة التحكم والإحصائيات',
    module: 'Dashboard',
    isSensitive: false,
  },
];

/**
 * Settings Module Permissions
 * الصلاحيات: 2
 */
export const SETTINGS_PERMISSIONS: Permission[] = [
  {
    resource: 'settings',
    action: 'read',
    description: 'View system settings',
    nameAr: 'عرض الإعدادات',
    descriptionAr: 'عرض إعدادات النظام',
    module: 'Settings',
    isSensitive: true,
  },
  {
    resource: 'settings',
    action: 'write',
    description: 'Modify system settings',
    nameAr: 'تعديل الإعدادات',
    descriptionAr: 'تعديل إعدادات النظام (للمشرفين فقط)',
    module: 'Settings',
    isSensitive: true,
  },
];

/**
 * Audit Module Permissions
 * الصلاحيات: 2
 */
export const AUDIT_PERMISSIONS: Permission[] = [
  {
    resource: 'audit',
    action: 'read',
    description: 'View audit logs and activity history',
    nameAr: 'عرض سجلات التدقيق',
    descriptionAr: 'عرض سجلات أنشطة المستخدمين والنظام',
    module: 'Audit',
    isSensitive: true,
  },
  {
    resource: 'audit',
    action: 'export',
    description: 'Export audit logs',
    nameAr: 'تصدير سجلات التدقيق',
    descriptionAr: 'تصدير سجلات أنشطة النظام',
    module: 'Audit',
    isSensitive: true,
  },
];

// ============================================================================
// CONSOLIDATED PERMISSIONS
// ============================================================================

/**
 * All Standard Module Permissions
 */
export const STANDARD_PERMISSIONS = [
  ...EMPLOYEE_PERMISSIONS,
  ...SITE_PERMISSIONS,
  ...PROJECT_PERMISSIONS,
  ...ASSET_PERMISSIONS,
  ...DEPARTMENT_PERMISSIONS,
  ...POSITION_PERMISSIONS,
  ...MAINTENANCE_PERMISSIONS,
];

/**
 * All Sensitive Module Permissions
 */
export const SENSITIVE_PERMISSIONS = [
  ...PAYROLL_PERMISSIONS,
  ...FINANCE_PERMISSIONS,
  ...USER_PERMISSIONS,
  ...RBAC_PERMISSIONS,
  ...REPORT_PERMISSIONS,
  ...DASHBOARD_PERMISSIONS,
  ...SETTINGS_PERMISSIONS,
  ...AUDIT_PERMISSIONS,
];

/**
 * ALL SYSTEM PERMISSIONS
 * Use this for database seeding
 */
export const ALL_PERMISSIONS = [
  ...STANDARD_PERMISSIONS,
  ...SENSITIVE_PERMISSIONS,
];

// ============================================================================
// ROLE-PERMISSION MAPPINGS (للـ Seeding)
// ============================================================================

/**
 * Default Role-Permission Assignments
 * يتم استخدامها في الـ Seeder لتعيين الصلاحيات للأدوار تلقائياً
 */
export const ROLE_PERMISSIONS_MAP = {
  /**
   * SUPERADMIN: All permissions (bypasses checks anyway)
   */
  SUPERADMIN: ALL_PERMISSIONS.map((p) => `${p.resource}:${p.action}`),

  /**
   * IT_ADMIN: Full system management permissions (without SUPERADMIN bypass)
   */
  IT_ADMIN: ALL_PERMISSIONS.map((p) => `${p.resource}:${p.action}`),

  /**
   * ADMIN: Most permissions except critical RBAC changes
   */
  ADMIN: [
    // All Standard (includes maintenance)
    ...STANDARD_PERMISSIONS.map((p) => `${p.resource}:${p.action}`),
    // Most Sensitive (except RBAC write and settings write)
    'payroll:read',
    'payroll:write',
    'payroll:process',
    'payroll:approve',
    'finance:read',
    'finance:write',
    'finance:delete',
    'finance:approve',
    'finance:export',
    'user:read',
    'user:write',
    'user:delete',
    'user:change_role',
    'user:reset_password',
    'rbac:read',
    // 'rbac:write' excluded - only SUPERADMIN
    'report:view',
    'report:export',
    'report:finance',
    'report:projects',
    'report:employees',
    'report:payroll',
    'report:assets',
    'report:maintenance',
    'report:sites',
    'report:users',
    'dashboard:read',
    'settings:read',
    'audit:read',
    'audit:export',
  ],

  /**
   * HR_MANAGER: HR and Employee management
   */
  HR_MANAGER: [
    'user:read',
    'employee:read',
    'employee:write',
    'employee:delete',
    'department:read',
    'department:write',
    'position:read',
    'position:write',
    'payroll:read',
    'payroll:write',
    'payroll:process',
    // 'payroll:approve' excluded - needs higher authority
    'report:view',
    'report:employees',
    'report:payroll',
    'dashboard:read',
  ],

  /**
   * HR_STAFF: Basic HR operations
   */
  HR_STAFF: [
    'employee:read',
    'employee:write',
    'department:read',
    'position:read',
    'payroll:read',
    'payroll:write',
  ],

  /**
   * FIN_MANAGER: Financial management
   */
  FIN_MANAGER: [
    'finance:read',
    'finance:write',
    'finance:approve',
    'finance:export',
    'project:read',
    'payroll:read',
    'payroll:approve',
    'report:view',
    'report:export',
    'report:finance',
    'report:payroll',
    'dashboard:read',
  ],

  /**
   * FIN_STAFF: Basic finance operations
   */
  FIN_STAFF: [
    'finance:read',
    'finance:write',
    'project:read',
  ],

  /**
   * OPS_MANAGER: Operations management
   */
  OPS_MANAGER: [
    'site:read',
    'site:write',
    'site:delete',
    'project:read',
    'project:write',
    'project:delete',
    'asset:read',
    'asset:write',
    'asset:delete',
    'maintenance:read',
    'maintenance:write',
    'maintenance:delete',
    'report:view',
    'report:projects',
    'report:assets',
    'report:maintenance',
    'report:sites',
    'dashboard:read',
  ],

  /**
   * OPS_STAFF: Basic operations
   */
  OPS_STAFF: [
    'site:read',
    'project:read',
    'project:write',
    'employee:read',
    'asset:read',
    'asset:write',
    'maintenance:read',
    'maintenance:write',
    'dashboard:read',
  ],

  /**
   * USER: Basic permissions (minimal)
   */
  USER: [],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get permission string (resource:action format)
 */
export function getPermissionString(permission: Permission): string {
  return `${permission.resource}:${permission.action}`;
}

/**
 * Get all permission strings
 */
export function getAllPermissionStrings(): string[] {
  return ALL_PERMISSIONS.map(getPermissionString);
}

/**
 * Get permissions by module
 */
export function getPermissionsByModule(module: string): Permission[] {
  return ALL_PERMISSIONS.filter((p) => p.module === module);
}

/**
 * Check if permission exists
 */
export function permissionExists(resource: string, action: string): boolean {
  return ALL_PERMISSIONS.some(
    (p) => p.resource === resource && p.action === action,
  );
}

/**
 * Get permissions count statistics
 */
export function getPermissionsStats() {
  return {
    total: ALL_PERMISSIONS.length,
    standard: STANDARD_PERMISSIONS.length,
    sensitive: SENSITIVE_PERMISSIONS.length,
    byModule: {
      Employee: EMPLOYEE_PERMISSIONS.length,
      Site: SITE_PERMISSIONS.length,
      Project: PROJECT_PERMISSIONS.length,
      Asset: ASSET_PERMISSIONS.length,
      Department: DEPARTMENT_PERMISSIONS.length,
      Position: POSITION_PERMISSIONS.length,
      Payroll: PAYROLL_PERMISSIONS.length,
      Finance: FINANCE_PERMISSIONS.length,
      User: USER_PERMISSIONS.length,
      RBAC: RBAC_PERMISSIONS.length,
      Report: REPORT_PERMISSIONS.length,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Roles
  SYSTEM_ROLES,

  // Permissions by module
  EMPLOYEE_PERMISSIONS,
  SITE_PERMISSIONS,
  PROJECT_PERMISSIONS,
  ASSET_PERMISSIONS,
  DEPARTMENT_PERMISSIONS,
  POSITION_PERMISSIONS,
  PAYROLL_PERMISSIONS,
  FINANCE_PERMISSIONS,
  USER_PERMISSIONS,
  RBAC_PERMISSIONS,
  REPORT_PERMISSIONS,

  // Consolidated
  STANDARD_PERMISSIONS,
  SENSITIVE_PERMISSIONS,
  ALL_PERMISSIONS,

  // Role mappings
  ROLE_PERMISSIONS_MAP,

  // Helpers
  getPermissionString,
  getAllPermissionStrings,
  getPermissionsByModule,
  permissionExists,
  getPermissionsStats,
};
