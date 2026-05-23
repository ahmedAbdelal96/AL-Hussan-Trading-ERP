/**
 * Audit Helpers — Shared utilities for audit log components
 *
 * Contains icon mappings, status badges, translation dictionaries,
 * and resource type configurations used across all audit sub-components.
 */

import {
  Plus,
  Edit,
  Trash2,
  Eye,
  LogIn,
  LogOut,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Ban,
  Info,
  Shield,
  ShieldOff,
  Key,
  KeyRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AuditAction, AuditStatus } from "@/types/audit.types";
import { getStatusBadgeClass, getStatusTone } from "@/components/common/statusBadgeStyles";


const ICON_CLASS = "h-4 w-4";

export function getActionIcon(action: AuditAction) {
  switch (action) {
    case AuditAction.CREATE:
      return <Plus className={ICON_CLASS} />;
    case AuditAction.UPDATE:
      return <Edit className={ICON_CLASS} />;
    case AuditAction.DELETE:
      return <Trash2 className={ICON_CLASS} />;
    case AuditAction.VIEW:
      return <Eye className={ICON_CLASS} />;
    case AuditAction.LOGIN:
      return <LogIn className={ICON_CLASS} />;
    case AuditAction.LOGOUT:
      return <LogOut className={ICON_CLASS} />;
    case AuditAction.EXPORT:
      return <Download className={ICON_CLASS} />;
    case AuditAction.IMPORT:
      return <Upload className={ICON_CLASS} />;
    case AuditAction.APPROVE:
      return <CheckCircle className={ICON_CLASS} />;
    case AuditAction.REJECT:
      return <XCircle className={ICON_CLASS} />;
    case AuditAction.RESTORE:
      return <RefreshCw className={ICON_CLASS} />;
    case AuditAction.ASSIGN_ROLE:
      return <Shield className={ICON_CLASS} />;
    case AuditAction.REVOKE_ROLE:
      return <ShieldOff className={ICON_CLASS} />;
    case AuditAction.GRANT_CUSTOM_PERMISSION:
      return <Key className={ICON_CLASS} />;
    case AuditAction.REVOKE_CUSTOM_PERMISSION:
      return <KeyRound className={ICON_CLASS} />;
    default:
      return <Info className={ICON_CLASS} />;
  }
}


export function getStatusBadge(status: AuditStatus, isRTL: boolean) {
  const statusConfig = {
    [AuditStatus.SUCCESS]: {
      icon: <CheckCircle className="h-3 w-3" />,
      label: isRTL ? "نجح" : "Success",
    },
    [AuditStatus.FAILED]: {
      icon: <XCircle className="h-3 w-3" />,
      label: isRTL ? "فشل" : "Failed",
    },
    [AuditStatus.UNAUTHORIZED]: {
      icon: <Ban className="h-3 w-3" />,
      label: isRTL ? "غير مصرح" : "Unauthorized",
    },
    [AuditStatus.PARTIAL]: {
      icon: <AlertCircle className="h-3 w-3" />,
      label: isRTL ? "جزئي" : "Partial",
    },
  };

  const config = statusConfig[status];
  if (!config) {
    return <Badge className={getStatusBadgeClass(getStatusTone(status))}>{status}</Badge>;
  }

  return (
    <Badge className={getStatusBadgeClass(getStatusTone(status), "gap-1")}>
      {config.icon}
      {config.label}
    </Badge>
  );
}


export function getAuditTranslations(isRTL: boolean) {
  return {
    title: isRTL ? "سجلات النشاط" : "Audit Logs",
    subtitle: isRTL
      ? "تتبع كافة الأنشطة والعمليات في النظام"
      : "Track all activities and operations in the system",
    filters: isRTL ? "الفلاتر" : "Filters",
    clearFilters: isRTL ? "مسح الفلاتر" : "Clear Filters",
    startDate: isRTL ? "من تاريخ" : "Start Date",
    endDate: isRTL ? "إلى تاريخ" : "End Date",
    last24Hours: isRTL ? "آخر 24 ساعة" : "Last 24 Hours",
    last7Days: isRTL ? "آخر 7 أيام" : "Last 7 Days",
    last30Days: isRTL ? "آخر 30 يوم" : "Last 30 Days",
    filterByUser: isRTL ? "تصفية حسب المستخدم" : "Filter by User",
    allUsers: isRTL ? "كل المستخدمين" : "All Users",
    filterByAction: isRTL ? "تصفية حسب الإجراء" : "Filter by Action",
    filterByStatus: isRTL ? "تصفية حسب الحالة" : "Filter by Status",
    filterByResourceType: isRTL
      ? "تصفية حسب نوع المورد"
      : "Filter by Resource Type",
    allResourceTypes: isRTL ? "كل الأنواع" : "All Types",
    allStatuses: isRTL ? "كل الحالات" : "All Statuses",
    activeFilters: isRTL ? "الفلاتر النشطة" : "Active Filters",
    user: isRTL ? "المستخدم" : "User",
    from: isRTL ? "من" : "From",
    to: isRTL ? "إلى" : "To",
    noLogs: isRTL ? "لا توجد سجلات" : "No logs found",
    details: isRTL ? "تفاصيل سجل النشاط" : "Audit Log Details",
    close: isRTL ? "إغلاق" : "Close",
    showing: isRTL ? "عرض" : "Showing",
    of: isRTL ? "من" : "of",
    records: isRTL ? "سجل" : "records",
    filtersActive: isRTL ? "فلتر نشط" : "filters active",
    // Metrics
    totalActions: isRTL ? "إجمالي العمليات" : "Total Actions",
    successRate: isRTL ? "نسبة النجاح" : "Success Rate",
    uniqueUsers: isRTL ? "المستخدمين النشطين" : "Active Users",
    failedActions: isRTL ? "العمليات الفاشلة" : "Failed Actions",
    // Detail dialog
    userLabel: isRTL ? "المستخدم" : "User",
    actionLabel: isRTL ? "الإجراء" : "Action",
    statusLabel: isRTL ? "الحالة" : "Status",
    errorMessage: isRTL ? "رسالة الخطأ" : "Error Message",
    technicalInfo: isRTL ? "المعلومات التقنية" : "Technical Information",
    resourceId: isRTL ? "معرف المورد" : "Resource ID",
    userAgent: isRTL ? "المتصفح" : "User Agent",
    previousValue: isRTL ? "القيمة السابقة" : "Previous Value",
    newValue: isRTL ? "القيمة الجديدة" : "New Value",
    recordedChanges: isRTL ? "التغييرات المسجلة" : "Recorded Changes",
    field: isRTL ? "حقل" : "field(s)",
    changedOutOf: isRTL
      ? (changed: number, total: number) =>
          `تم تغيير ${changed} حقل من أصل ${total} حقول`
      : (changed: number, total: number) =>
          `${changed} field(s) changed out of ${total} total fields`,

    actions: {
      [AuditAction.CREATE]: isRTL ? "إنشاء" : "Create",
      [AuditAction.UPDATE]: isRTL ? "تحديث" : "Update",
      [AuditAction.DELETE]: isRTL ? "حذف" : "Delete",
      [AuditAction.VIEW]: isRTL ? "عرض" : "View",
      [AuditAction.LOGIN]: isRTL ? "تسجيل دخول" : "Login",
      [AuditAction.LOGOUT]: isRTL ? "تسجيل خروج" : "Logout",
      [AuditAction.APPROVE]: isRTL ? "موافقة" : "Approve",
      [AuditAction.REJECT]: isRTL ? "رفض" : "Reject",
      [AuditAction.RESTORE]: isRTL ? "استعادة" : "Restore",
      [AuditAction.EXPORT]: isRTL ? "تصدير" : "Export",
      [AuditAction.IMPORT]: isRTL ? "استيراد" : "Import",
      [AuditAction.ASSIGN_ROLE]: isRTL ? "تعيين دور" : "Assign Role",
      [AuditAction.REVOKE_ROLE]: isRTL ? "سحب دور" : "Revoke Role",
      [AuditAction.GRANT_CUSTOM_PERMISSION]: isRTL
        ? "منح صلاحية"
        : "Grant Permission",
      [AuditAction.REVOKE_CUSTOM_PERMISSION]: isRTL
        ? "سحب صلاحية"
        : "Revoke Permission",
    } as Record<string, string>,

    statuses: {
      [AuditStatus.SUCCESS]: isRTL ? "نجح" : "Success",
      [AuditStatus.FAILED]: isRTL ? "فشل" : "Failed",
      [AuditStatus.UNAUTHORIZED]: isRTL ? "غير مصرح" : "Unauthorized",
      [AuditStatus.PARTIAL]: isRTL ? "جزئي" : "Partial",
    } as Record<string, string>,
  };
}

export type AuditTranslations = ReturnType<typeof getAuditTranslations>;


export interface ResourceTypeOption {
  value: string;
  labelAr: string;
  labelEn: string;
}

export const RESOURCE_TYPES: ResourceTypeOption[] = [
  { value: "project", labelAr: "مشاريع", labelEn: "Projects" },
  { value: "site", labelAr: "مواقع", labelEn: "Sites" },
  { value: "user", labelAr: "مستخدمين", labelEn: "Users" },
  { value: "employee", labelAr: "موظفين", labelEn: "Employees" },
  { value: "asset", labelAr: "أصول", labelEn: "Assets" },
  { value: "maintenance", labelAr: "صيانة", labelEn: "Maintenance" },
  { value: "project-cost", labelAr: "تكاليف مشاريع", labelEn: "Project Costs" },
  {
    value: "cost-category",
    labelAr: "فئات التكاليف",
    labelEn: "Cost Categories",
  },
  {
    value: "cost-allocation",
    labelAr: "توزيعات التكاليف",
    labelEn: "Cost Allocations",
  },
  {
    value: "allowance-type",
    labelAr: "أنواع البدلات",
    labelEn: "Allowance Types",
  },
  {
    value: "employee-allowance",
    labelAr: "بدلات موظفين",
    labelEn: "Employee Allowances",
  },
  { value: "employee-loan", labelAr: "قروض موظفين", labelEn: "Employee Loans" },
  {
    value: "employee-deduction",
    labelAr: "خصومات موظفين",
    labelEn: "Employee Deductions",
  },
  {
    value: "employee-salary",
    labelAr: "رواتب موظفين",
    labelEn: "Employee Salaries",
  },
  { value: "payroll", labelAr: "كشوف المرتبات", labelEn: "Payroll" },
  { value: "payslip", labelAr: "إيصالات الراتب", labelEn: "Payslips" },
  { value: "role", labelAr: "أدوار", labelEn: "Roles" },
  { value: "auth", labelAr: "المصادقة", labelEn: "Authentication" },
];


export const FILTERABLE_ACTIONS: AuditAction[] = [
  AuditAction.CREATE,
  AuditAction.UPDATE,
  AuditAction.DELETE,
  AuditAction.LOGIN,
  AuditAction.LOGOUT,
  AuditAction.APPROVE,
  AuditAction.REJECT,
  AuditAction.RESTORE,
  AuditAction.EXPORT,
  AuditAction.IMPORT,
  AuditAction.ASSIGN_ROLE,
  AuditAction.REVOKE_ROLE,
  AuditAction.GRANT_CUSTOM_PERMISSION,
  AuditAction.REVOKE_CUSTOM_PERMISSION,
];


/** Map camelCase field names to human-readable labels */
export function getFieldDisplayName(key: string, isRTL: boolean): string {
  const fieldNames: Record<string, string> = {
    name: isRTL ? "الاسم" : "Name",
    code: isRTL ? "الكود" : "Code",
    status: isRTL ? "الحالة" : "Status",
    description: isRTL ? "الوصف" : "Description",
    address: isRTL ? "العنوان" : "Address",
    email: isRTL ? "البريد الإلكتروني" : "Email",
    phone: isRTL ? "الهاتف" : "Phone",
    isActive: isRTL ? "نشط" : "Active",
    budget: isRTL ? "الميزانية" : "Budget",
    startDate: isRTL ? "تاريخ البداية" : "Start Date",
    endDate: isRTL ? "تاريخ النهاية" : "End Date",
    progress: isRTL ? "التقدم" : "Progress",
    basicSalary: isRTL ? "الراتب الأساسي" : "Basic Salary",
    allowances: isRTL ? "البدلات" : "Allowances",
    deductions: isRTL ? "الخصومات" : "Deductions",
    notes: isRTL ? "ملاحظات" : "Notes",
    amount: isRTL ? "المبلغ" : "Amount",
    type: isRTL ? "النوع" : "Type",
    priority: isRTL ? "الأولوية" : "Priority",
    location: isRTL ? "الموقع" : "Location",
    firstName: isRTL ? "الاسم الأول" : "First Name",
    lastName: isRTL ? "اسم العائلة" : "Last Name",
    fullName: isRTL ? "الاسم الكامل" : "Full Name",
    category: isRTL ? "الفئة" : "Category",
    subcategory: isRTL ? "الفئة الفرعية" : "Subcategory",
    reason: isRTL ? "السبب" : "Reason",
    approvedBy: isRTL ? "المعتمد" : "Approved By",
    rejectedBy: isRTL ? "الرافض" : "Rejected By",
    // Login/session fields
    roles: isRTL ? "الأدوار" : "Roles",
    loginMethod: isRTL ? "طريقة الدخول" : "Login Method",
    loginTime: isRTL ? "وقت الدخول" : "Login Time",
    logoutTime: isRTL ? "وقت الخروج" : "Logout Time",
    sessionDuration: isRTL ? "مدة الجلسة" : "Session Duration",
    tokenType: isRTL ? "نوع التوكن" : "Token Type",
    accountActive: isRTL ? "الحساب نشط" : "Account Active",
    sessionEnded: isRTL ? "انتهت الجلسة" : "Session Ended",
  };

  return fieldNames[key] || key.replace(/([A-Z])/g, " $1").trim();
}

/** Format a value for display in the audit detail view */
export function formatFieldValue(
  value: unknown,
  key: string,
  isRTL: boolean,
): string {
  if (value === null || value === undefined) return isRTL ? "غير محدد" : "N/A";

  if (typeof value === "boolean") {
    return value ? (isRTL ? "نعم" : "Yes") : isRTL ? "لا" : "No";
  }

  // Date fields
  if (
    key.toLowerCase().includes("date") ||
    key.toLowerCase().includes("at") ||
    (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value))
  ) {
    try {
      const date = new Date(value as string | number | Date);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString(isRTL ? "ar-EG" : "en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch {
      // Not a valid date
    }
  }

  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "object") return JSON.stringify(value, null, 2);

  return String(value);
}
