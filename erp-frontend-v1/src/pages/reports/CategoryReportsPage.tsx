/**
 * ============================================================================
 * CATEGORY REPORTS PAGE - Module-Specific Reports View
 * ============================================================================
 *
 * Displays all reports for a specific module/category.
 * Supports Finance and Projects modules with dedicated custom pages.
 *
 * @page CategoryReportsPage
 * @version 3.0.0
 */

import { useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import {
  REPORT_CATEGORY_PERMISSIONS,
  REPORT_CATEGORY_ROLES,
  type ReportCategory,
} from "@/config/reports-access.constants";
import {
  Sparkles,
  BarChart3,
  DollarSign,
  Briefcase,
  MapPin,
  Package,
  Users,
  Building2,
  TrendingDown,
  TrendingUp,
  Wallet,
  CreditCard,
  Wrench,
  ShieldCheck,
  Shield,
  Key,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";
import { useLanguage } from "@/hooks/useLanguage";
import { PageShell } from "@/components/common/PageShell";

// ============================================================================
// MODULE METADATA
// ============================================================================

type ModuleName =
  | "finance"
  | "projects"
  | "employees"
  | "payroll"
  | "sites"
  | "assets"
  | "maintenance"
  | "users"
  | "executive";

const MODULE_METADATA: Record<
  ModuleName,
  {
    title: { en: string; ar: string };
    description: { en: string; ar: string };
    icon: LucideIcon;
    color: string;
  }
> = {
  finance: {
    title: { en: "Financial Reports", ar: "Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ù…Ø§Ù„ÙŠØ©" },
    description: {
      en: "Expenses, budget, cash flow analysis",
      ar: "Ø§Ù„Ù…ØµØ±ÙˆÙØ§ØªØŒ Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ©ØŒ ØªØ­Ù„ÙŠÙ„ Ø§Ù„ØªØ¯ÙÙ‚Ø§Øª Ø§Ù„Ù†Ù‚Ø¯ÙŠØ©",
    },
    icon: DollarSign,
    color: "bg-blue-500",
  },
  projects: {
    title: { en: "Projects Reports", ar: "ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹" },
    description: {
      en: "Project status, timelines, budgets",
      ar: "Ø­Ø§Ù„Ø© Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ØŒ Ø§Ù„Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„Ø²Ù…Ù†ÙŠØ©ØŒ Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ§Øª",
    },
    icon: Briefcase,
    color: "bg-purple-500",
  },
  employees: {
    title: { en: "Employees Reports", ar: "ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†" },
    description: {
      en: "Headcount, turnover, age & experience analysis",
      ar: "Ø§Ù„Ø£Ø¹Ø¯Ø§Ø¯ØŒ Ø¯ÙˆØ±Ø§Ù† Ø§Ù„Ø¹Ù…Ø§Ù„Ø©ØŒ ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø¹Ù…Ø± ÙˆØ§Ù„Ø®Ø¨Ø±Ø©",
    },
    icon: Users,
    color: "bg-teal-500",
  },
  payroll: {
    title: { en: "Payroll Reports", ar: "ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ø±ÙˆØ§ØªØ¨" },
    description: {
      en: "Net payroll, allowances, deductions, trends, comparisons",
      ar: "ØµØ§ÙÙŠ Ø§Ù„Ø±ÙˆØ§ØªØ¨ØŒ Ø§Ù„Ø¨Ø¯Ù„Ø§ØªØŒ Ø§Ù„Ø®ØµÙˆÙ…Ø§ØªØŒ Ø§Ù„Ø§ØªØ¬Ø§Ù‡Ø§ØªØŒ Ø§Ù„Ù…Ù‚Ø§Ø±Ù†Ø§Øª",
    },
    icon: Wallet,
    color: "bg-orange-500",
  },
  sites: {
    title: { en: "Sites Reports", ar: "ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹" },
    description: {
      en: "Capacity, status, location, projects, and performance",
      ar: "Ø§Ù„Ø·Ø§Ù‚Ø© Ø§Ù„Ø§Ø³ØªÙŠØ¹Ø§Ø¨ÙŠØ©ØŒ Ø§Ù„Ø­Ø§Ù„Ø©ØŒ Ø§Ù„Ù…ÙˆÙ‚Ø¹ØŒ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ØŒ ÙˆØ§Ù„Ø£Ø¯Ø§Ø¡",
    },
    icon: MapPin,
    color: "bg-sky-500",
  },
  assets: {
    title: { en: "Assets Reports", ar: "ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ø£ØµÙˆÙ„" },
    description: {
      en: "Type, status, location, depreciation, utilization",
      ar: "Ø§Ù„Ù†ÙˆØ¹ØŒ Ø§Ù„Ø­Ø§Ù„Ø©ØŒ Ø§Ù„Ù…ÙˆÙ‚Ø¹ØŒ Ø§Ù„Ø§Ø³ØªÙ‡Ù„Ø§ÙƒØŒ Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…",
    },
    icon: Package,
    color: "bg-amber-500",
  },
  maintenance: {
    title: { en: "Maintenance Reports", ar: "ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ØµÙŠØ§Ù†Ø©" },
    description: {
      en: "Overview, by type, by status, by asset, cost, performance, preventive",
      ar: "Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø©ØŒ Ø­Ø³Ø¨ Ø§Ù„Ù†ÙˆØ¹ØŒ Ø§Ù„Ø­Ø§Ù„Ø©ØŒ Ø§Ù„Ø£ØµÙ„ØŒ Ø§Ù„ØªÙƒÙ„ÙØ©ØŒ Ø§Ù„Ø£Ø¯Ø§Ø¡ØŒ Ø§Ù„ÙˆÙ‚Ø§Ø¦ÙŠØ©",
    },
    icon: Wrench,
    color: "bg-rose-500",
  },
  users: {
    title: { en: "Users Reports", ar: "ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†" },
    description: {
      en: "Overview, login activity, security, sessions, RBAC, audit logs",
      ar: "Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø©ØŒ Ù†Ø´Ø§Ø· Ø§Ù„Ø¯Ø®ÙˆÙ„ØŒ Ø§Ù„Ø£Ù…Ø§Ù†ØŒ Ø§Ù„Ø¬Ù„Ø³Ø§ØªØŒ Ø§Ù„Ø£Ø¯ÙˆØ§Ø±ØŒ Ø³Ø¬Ù„Ø§Øª Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©",
    },
    icon: Users,
    color: "bg-violet-500",
  },
  executive: {
    title: { en: "Executive Reports", ar: "Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©" },
    description: {
      en: "Cross-module KPI snapshot and Company P&L for senior management",
      ar: "Ù„Ù‚Ø·Ø© Ù…Ø¤Ø´Ø±Ø§Øª Ù…ØªÙƒØ§Ù…Ù„Ø© ÙˆØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø£Ø±Ø¨Ø§Ø­ ÙˆØ§Ù„Ø®Ø³Ø§Ø¦Ø± Ù„Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¹Ù„ÙŠØ§",
    },
    icon: BarChart3,
    color: "bg-indigo-500",
  },
};
// ============================================================================
// CATEGORY PERMISSION MAPPING
// ============================================================================

const CATEGORY_PERMISSIONS: Record<ReportCategory, string> =
  REPORT_CATEGORY_PERMISSIONS;

// ============================================================================
// REPORT METADATA
// ============================================================================

const REPORT_METADATA: Record<
  string,
  {
    type: string;
    title: { en: string; ar: string };
    description: { en: string; ar: string };
    isPremium?: boolean;
    icon: LucideIcon;
  }
> = {
  "finance-dashboard": {
    type: "dashboard",
    title: { en: "Finance Dashboard", ar: "Ù„ÙˆØ­Ø© Ø§Ù„Ù…Ø§Ù„ÙŠØ©" },
    description: {
      en: "KPIs, payment status distribution, monthly trend & cost-type breakdown",
      ar: "Ø§Ù„Ù…Ø¤Ø´Ø±Ø§ØªØŒ ØªÙˆØ²ÙŠØ¹ Ø­Ø§Ù„Ø§Øª Ø§Ù„Ø¯ÙØ¹ØŒ Ø§Ù„Ø§ØªØ¬Ø§Ù‡ Ø§Ù„Ø´Ù‡Ø±ÙŠØŒ ÙˆØªØ­Ù„ÙŠÙ„ Ø£Ù†ÙˆØ§Ø¹ Ø§Ù„ØªÙƒØ§Ù„ÙŠÙ",
    },
    icon: BarChart3,
  },
  "finance-pending-overdue": {
    type: "pending-overdue",
    title: { en: "Pending & Overdue", ar: "Ø§Ù„Ù…Ø¹Ù„Ù‘Ù‚Ø© ÙˆØ§Ù„Ù…ØªØ£Ø®Ø±Ø©" },
    description: {
      en: "Manage pending approvals and overdue payments in one place",
      ar: "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø§Øª Ø§Ù„Ù…Ø¹Ù„Ù‚Ø© ÙˆØ§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª Ø§Ù„Ù…ØªØ£Ø®Ø±Ø© ÙÙŠ Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯",
    },
    isPremium: true,
    icon: DollarSign,
  },
  "finance-by-project": {
    type: "by-project",
    title: { en: "Costs by Project", ar: "Ø§Ù„ØªÙƒØ§Ù„ÙŠÙ Ø­Ø³Ø¨ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹" },
    description: {
      en: "Project-wise cost breakdown",
      ar: "ØªÙØµÙŠÙ„ Ø§Ù„ØªÙƒØ§Ù„ÙŠÙ Ø­Ø³Ø¨ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹",
    },
    icon: Briefcase,
  },

  "finance-tax": {
    type: "tax",
    title: { en: "Tax Summary", ar: "ملخص الضريبة" },
    description: {
      en: "Pre-tax, tax, and total amounts with monthly tax breakdown",
      ar: "قيمة ما قبل الضريبة وقيمة الضريبة والإجمالي مع تحليل شهري",
    },
    icon: FileText,
  },

  "projects-dashboard": {
    type: "dashboard",
    title: { en: "Projects Dashboard", ar: "Ù„ÙˆØ­Ø© Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹" },
    description: {
      en: "KPIs, status distribution, site analysis, and full project listing",
      ar: "Ø§Ù„Ù…Ø¤Ø´Ø±Ø§ØªØŒ ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ø­Ø§Ù„Ø§ØªØŒ ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹ØŒ ÙˆÙ‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹",
    },
    icon: Briefcase,
  },
  "projects-budget-delays": {
    type: "budget-delays",
    title: { en: "Budget & Delays", ar: "Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ© ÙˆØ§Ù„ØªØ£Ø®ÙŠØ±Ø§Øª" },
    description: {
      en: "Budget utilization analysis and delayed projects tracking",
      ar: "ØªØ­Ù„ÙŠÙ„ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ© ÙˆØªØªØ¨Ø¹ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„Ù…ØªØ£Ø®Ø±Ø©",
    },
    isPremium: true,
    icon: DollarSign,
  },
  "projects-completed": {
    type: "completed",
    title: { en: "Completed Projects", ar: "Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„Ù…ÙƒØªÙ…Ù„Ø©" },
    description: {
      en: "Performance analysis of completed projects â€” on-time, budget, scoring",
      ar: "ØªØ­Ù„ÙŠÙ„ Ø£Ø¯Ø§Ø¡ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„Ù…ÙƒØªÙ…Ù„Ø© â€” Ø§Ù„ØªØ³Ù„ÙŠÙ…ØŒ Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ©ØŒ Ø§Ù„ØªÙ‚ÙŠÙŠÙ…",
    },
    icon: Briefcase,
  },
  "projects-cost-breakdown": {
    type: "cost-breakdown",
    title: { en: "Cost Breakdown", ar: "ØªÙØµÙŠÙ„ Ø§Ù„ØªÙƒØ§Ù„ÙŠÙ" },
    description: {
      en: "All costs per project broken down by cost type (salary, maintenance, materials...)",
      ar: "ØªÙØµÙŠÙ„ Ø¬Ù…ÙŠØ¹ ØªÙƒØ§Ù„ÙŠÙ ÙƒÙ„ Ù…Ø´Ø±ÙˆØ¹ Ø­Ø³Ø¨ Ù†ÙˆØ¹ Ø§Ù„ØªÙƒÙ„ÙØ© (Ø±ÙˆØ§ØªØ¨ØŒ ØµÙŠØ§Ù†Ø©ØŒ Ù…ÙˆØ§Ø¯...)",
    },
    isPremium: true,
    icon: BarChart3,
  },
  "projects-labor-cost": {
    type: "labor-cost",
    title: { en: "Labor Cost", ar: "ØªÙƒØ§Ù„ÙŠÙ Ø§Ù„Ø¹Ù…Ø§Ù„Ø©" },
    description: {
      en: "Salary and allowance costs broken down per project with employee assignment details",
      ar: "ØªÙƒØ§Ù„ÙŠÙ Ø§Ù„Ø±ÙˆØ§ØªØ¨ ÙˆØ§Ù„Ø¨Ø¯Ù„Ø§Øª Ù…ÙØµÙ‘Ù„Ø© Ù„ÙƒÙ„ Ù…Ø´Ø±ÙˆØ¹ Ù…Ø¹ ØªÙØ§ØµÙŠÙ„ ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†",
    },
    isPremium: true,
    icon: Users,
  },
  "projects-asset-utilization": {
    type: "asset-utilization",
    title: { en: "Asset Utilization", ar: "Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø£ØµÙˆÙ„" },
    description: {
      en: "Equipment deployed per project with allocated values and maintenance costs",
      ar: "Ø§Ù„Ù…Ø¹Ø¯Ø§Øª Ø§Ù„Ù…Ù†ØªØ´Ø±Ø© ÙÙŠ ÙƒÙ„ Ù…Ø´Ø±ÙˆØ¹ Ù…Ø¹ Ø§Ù„Ù‚ÙŠÙ… Ø§Ù„Ù…Ø®ØµØµØ© ÙˆØªÙƒØ§Ù„ÙŠÙ Ø§Ù„ØµÙŠØ§Ù†Ø©",
    },
    isPremium: true,
    icon: Package,
  },

  "employees-dashboard": {
    type: "dashboard",
    title: { en: "Employees Dashboard", ar: "Ù„ÙˆØ­Ø© Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†" },
    description: {
      en: "Headcount KPIs, status distribution, department & position breakdown",
      ar: "Ù…Ø¤Ø´Ø±Ø§Øª Ø§Ù„Ø£Ø¹Ø¯Ø§Ø¯ØŒ ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ø­Ø§Ù„Ø§ØªØŒ ØªÙØµÙŠÙ„ Ø§Ù„Ø£Ù‚Ø³Ø§Ù… ÙˆØ§Ù„Ù…Ù†Ø§ØµØ¨",
    },
    icon: Users,
  },
  "employees-hr-analytics": {
    type: "hr-analytics",
    title: { en: "HR Analytics", ar: "ØªØ­Ù„ÙŠÙ„Ø§Øª Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©" },
    description: {
      en: "Turnover analysis, age & experience demographics, trends",
      ar: "ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø¯ÙˆØ±Ø§Ù†ØŒ Ø§Ù„ØªØ±ÙƒÙŠØ¨Ø© Ø§Ù„Ø³ÙƒØ§Ù†ÙŠØ© Ù„Ù„Ø¹Ù…Ø± ÙˆØ§Ù„Ø®Ø¨Ø±Ø©ØŒ Ø§Ù„Ø§ØªØ¬Ø§Ù‡Ø§Øª",
    },
    isPremium: true,
    icon: TrendingUp,
  },
  "employees-assignment": {
    type: "assignment",
    title: { en: "Employee Assignment", ar: "ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†" },
    description: {
      en: "Per-employee project deployment with allocation % and status (overhead, over/under-allocated)",
      ar: "ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ù…Ø¹ Ù†Ø³Ø¨Ø© Ø§Ù„ØªØ®ØµÙŠØµ ÙˆØ§Ù„Ø­Ø§Ù„Ø© (Ø£Ø¹Ø¨Ø§Ø¡ Ø¥Ø¯Ø§Ø±ÙŠØ©ØŒ ØªØ®ØµÙŠØµ Ø²Ø§Ø¦Ø¯/Ù†Ø§Ù‚Øµ)",
    },
    isPremium: true,
    icon: Users,
  },
  "employees-contract-expiry": {
    type: "contract-expiry",
    title: { en: "Contract Expiry", ar: "Ø§Ù†ØªÙ‡Ø§Ø¡ Ø§Ù„Ø¹Ù‚ÙˆØ¯" },
    description: {
      en: "Contracts expiring soon for CONTRACT, FREELANCE, and PART_TIME employees, classified by urgency",
      ar: "Ø§Ù„Ø¹Ù‚ÙˆØ¯ Ø§Ù„Ù…Ù†ØªÙ‡ÙŠØ© Ù‚Ø±ÙŠØ¨Ø§Ù‹ Ù„Ù…ÙˆØ¸ÙÙŠ Ø§Ù„Ø¹Ù‚ÙˆØ¯ ÙˆØ§Ù„Ø¹Ù…Ù„ Ø§Ù„Ø­Ø± ÙˆØ¨Ø¯ÙˆØ§Ù… Ø¬Ø²Ø¦ÙŠØŒ Ù…ØµÙ†Ù‘ÙØ© Ø­Ø³Ø¨ Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ©",
    },
    isPremium: true,
    icon: FileText,
  },

  "maintenance-dashboard": {
    type: "dashboard",
    title: { en: "Maintenance Dashboard", ar: "Ù„ÙˆØ­Ø© Ø§Ù„ØµÙŠØ§Ù†Ø©" },
    description: {
      en: "KPIs, status/type distribution, cost analysis, overdue alerts",
      ar: "Ù…Ø¤Ø´Ø±Ø§Øª Ø§Ù„Ø£Ø¯Ø§Ø¡ØŒ ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ø­Ø§Ù„Ø©/Ø§Ù„Ù†ÙˆØ¹ØŒ ØªØ­Ù„ÙŠÙ„ Ø§Ù„ØªÙƒØ§Ù„ÙŠÙØŒ ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„ØªØ£Ø®ÙŠØ±",
    },
    icon: Wrench,
  },
  "maintenance-analytics": {
    type: "analytics",
    title: { en: "Maintenance Analytics", ar: "ØªØ­Ù„ÙŠÙ„Ø§Øª Ø§Ù„ØµÙŠØ§Ù†Ø©" },
    description: {
      en: "Performance metrics (MTTR/MTBF), preventive maintenance, asset breakdown",
      ar: "Ù…Ù‚Ø§ÙŠÙŠØ³ Ø§Ù„Ø£Ø¯Ø§Ø¡ØŒ Ø§Ù„ØµÙŠØ§Ù†Ø© Ø§Ù„ÙˆÙ‚Ø§Ø¦ÙŠØ©ØŒ ØªÙØµÙŠÙ„ Ø­Ø³Ø¨ Ø§Ù„Ø£ØµÙ„",
    },
    isPremium: true,
    icon: ShieldCheck,
  },
  "maintenance-mtbf-mttr": {
    type: "mtbf-mttr",
    title: { en: "MTBF / MTTR per Asset", ar: "MTBF / MTTR Ù„ÙƒÙ„ Ø£ØµÙ„" },
    description: {
      en: "Per-asset Mean Time Between Failures and Mean Time To Repair with reliability scores",
      ar: "Ù…ØªÙˆØ³Ø· Ø§Ù„ÙˆÙ‚Øª Ø¨ÙŠÙ† Ø§Ù„Ø£Ø¹Ø·Ø§Ù„ ÙˆÙˆÙ‚Øª Ø§Ù„Ø¥ØµÙ„Ø§Ø­ Ù„ÙƒÙ„ Ø£ØµÙ„ Ù…Ø¹ Ø¯Ø±Ø¬Ø§Øª Ø§Ù„Ù…ÙˆØ«ÙˆÙ‚ÙŠØ©",
    },
    isPremium: true,
    icon: ShieldCheck,
  },
  "maintenance-cost-per-asset": {
    type: "cost-per-asset",
    title: { en: "Cost per Asset", ar: "Ø§Ù„ØªÙƒÙ„ÙØ© Ù„ÙƒÙ„ Ø£ØµÙ„" },
    description: {
      en: "Estimated vs actual maintenance costs per asset with variance and cost-to-value ratio",
      ar: "Ù…Ù‚Ø§Ø±Ù†Ø© Ø§Ù„ØªÙƒØ§Ù„ÙŠÙ Ø§Ù„Ù…Ù‚Ø¯Ø±Ø© ÙˆØ§Ù„ÙØ¹Ù„ÙŠØ© Ù„ÙƒÙ„ Ø£ØµÙ„ Ù…Ø¹ ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø§Ù†Ø­Ø±Ø§Ù ÙˆÙ†Ø³Ø¨Ø© Ø§Ù„ØªÙƒÙ„ÙØ© Ù„Ù„Ù‚ÙŠÙ…Ø©",
    },
    isPremium: true,
    icon: DollarSign,
  },
  "maintenance-budget-vs-actual": {
    type: "budget-vs-actual",
    title: { en: "Budget vs. Actual", ar: "Ø§Ù„Ù…ÙŠØ²Ø§Ù†ÙŠØ© Ù…Ù‚Ø§Ø¨Ù„ Ø§Ù„ÙØ¹Ù„ÙŠ" },
    description: {
      en: "Maintenance budget adherence grouped by month, asset type, or maintenance type",
      ar: "Ø§Ù„Ø§Ù„ØªØ²Ø§Ù… Ø¨Ù…ÙŠØ²Ø§Ù†ÙŠØ© Ø§Ù„ØµÙŠØ§Ù†Ø© Ù…Ø¬Ù…Ù‘Ø¹Ø§Ù‹ Ø­Ø³Ø¨ Ø§Ù„Ø´Ù‡Ø± Ø£Ùˆ Ù†ÙˆØ¹ Ø§Ù„Ø£ØµÙ„ Ø£Ùˆ Ù†ÙˆØ¹ Ø§Ù„ØµÙŠØ§Ù†Ø©",
    },
    isPremium: true,
    icon: BarChart3,
  },

  "sites-dashboard": {
    type: "dashboard",
    title: { en: "Sites Dashboard", ar: "Ù„ÙˆØ­Ø© Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹" },
    description: {
      en: "KPIs, status/location distribution, capacity utilization",
      ar: "Ø§Ù„Ù…Ø¤Ø´Ø±Ø§ØªØŒ ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ø­Ø§Ù„Ø©/Ø§Ù„Ù…ÙˆÙ‚Ø¹ØŒ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø·Ø§Ù‚Ø©",
    },
    icon: MapPin,
  },
  "sites-performance": {
    type: "performance",
    title: { en: "Sites Performance", ar: "Ø£Ø¯Ø§Ø¡ Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹" },
    description: {
      en: "Project portfolio, performance scoring, ROI analysis",
      ar: "Ù…Ø­ÙØ¸Ø© Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ØŒ ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ø£Ø¯Ø§Ø¡ØŒ ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø¹Ø§Ø¦Ø¯",
    },
    isPremium: true,
    icon: TrendingUp,
  },
  "sites-profitability": {
    type: "profitability",
    title: { en: "Site Profitability", ar: "Ø±Ø¨Ø­ÙŠØ© Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹" },
    description: {
      en: "Revenue (project budgets) vs total costs per site with profit margin and rating",
      ar: "Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª (Ù…ÙŠØ²Ø§Ù†ÙŠØ§Øª Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹) Ù…Ù‚Ø§Ø¨Ù„ Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„ØªÙƒØ§Ù„ÙŠÙ Ù„ÙƒÙ„ Ù…ÙˆÙ‚Ø¹ Ù…Ø¹ Ù‡Ø§Ù…Ø´ Ø§Ù„Ø±Ø¨Ø­ ÙˆØ§Ù„ØªÙ‚ÙŠÙŠÙ…",
    },
    isPremium: true,
    icon: DollarSign,
  },

  "assets-dashboard": {
    type: "dashboard",
    title: { en: "Assets Dashboard", ar: "Ù„ÙˆØ­Ø© Ø§Ù„Ø£ØµÙˆÙ„" },
    description: {
      en: "KPIs, type/status/location distribution, warranty status",
      ar: "Ø§Ù„Ù…Ø¤Ø´Ø±Ø§ØªØŒ ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ù†ÙˆØ¹/Ø§Ù„Ø­Ø§Ù„Ø©/Ø§Ù„Ù…ÙˆÙ‚Ø¹ØŒ Ø­Ø§Ù„Ø© Ø§Ù„Ø¶Ù…Ø§Ù†",
    },
    icon: Package,
  },
  "assets-analytics": {
    type: "analytics",
    title: { en: "Assets Analytics", ar: "ØªØ­Ù„ÙŠÙ„Ø§Øª Ø§Ù„Ø£ØµÙˆÙ„" },
    description: {
      en: "Depreciation analysis, utilization rates, idle assets",
      ar: "ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø§Ø³ØªÙ‡Ù„Ø§ÙƒØŒ Ù…Ø¹Ø¯Ù„Ø§Øª Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…ØŒ Ø§Ù„Ø£ØµÙˆÙ„ Ø§Ù„Ø®Ø§Ù…Ù„Ø©",
    },
    isPremium: true,
    icon: TrendingDown,
  },

  "users-security": {
    type: "security",
    title: { en: "Security Dashboard", ar: "Ù„ÙˆØ­Ø© Ø§Ù„Ø£Ù…Ø§Ù†" },
    description: {
      en: "User KPIs, login activity, failed attempts, sessions, locked accounts",
      ar: "Ù…Ø¤Ø´Ø±Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†ØŒ Ù†Ø´Ø§Ø· Ø§Ù„Ø¯Ø®ÙˆÙ„ØŒ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ø§Ù„ÙØ§Ø´Ù„Ø©ØŒ Ø§Ù„Ø¬Ù„Ø³Ø§ØªØŒ Ø§Ù„Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„Ù…Ù‚ÙÙ„Ø©",
    },
    icon: Shield,
  },
  "users-rbac": {
    type: "rbac",
    title: { en: "RBAC & Audit", ar: "Ø§Ù„Ø£Ø¯ÙˆØ§Ø± ÙˆØ§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©" },
    description: {
      en: "Roles distribution, permissions, audit logs, grant history",
      ar: "ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ø£Ø¯ÙˆØ§Ø±ØŒ Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ§ØªØŒ Ø³Ø¬Ù„Ø§Øª Ø§Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©ØŒ Ø³Ø¬Ù„ Ø§Ù„Ù…Ù†Ø­",
    },
    isPremium: true,
    icon: Key,
  },

  "payroll-dashboard": {
    type: "dashboard",
    title: { en: "Payroll Dashboard", ar: "Ù„ÙˆØ­Ø© Ø§Ù„Ø±ÙˆØ§ØªØ¨" },
    description: {
      en: "Monthly KPIs, salary components, 12-month trend analysis",
      ar: "Ù…Ø¤Ø´Ø±Ø§Øª Ø´Ù‡Ø±ÙŠØ©ØŒ Ù…ÙƒÙˆÙ†Ø§Øª Ø§Ù„Ø±Ø§ØªØ¨ØŒ ØªØ­Ù„ÙŠÙ„ Ø§ØªØ¬Ø§Ù‡ 12 Ø´Ù‡Ø±Ø§Ù‹",
    },
    icon: Wallet,
  },
  "payroll-by-department": {
    type: "by-department",
    title: { en: "Payroll by Department", ar: "Ø§Ù„Ø±ÙˆØ§ØªØ¨ Ø­Ø³Ø¨ Ø§Ù„Ù‚Ø³Ù…" },
    description: {
      en: "Net payroll, headcount, and avg salary per department & site",
      ar: "ØµØ§ÙÙŠ Ø§Ù„Ø±Ø§ØªØ¨ ÙˆØ§Ù„Ø£Ø¹Ø¯Ø§Ø¯ ÙˆÙ…ØªÙˆØ³Ø· Ø§Ù„Ø±Ø§ØªØ¨ Ù„ÙƒÙ„ Ù‚Ø³Ù… ÙˆÙ…ÙˆÙ‚Ø¹",
    },
    icon: Building2,
  },
  "payroll-details": {
    type: "details",
    title: {
      en: "Allowances & Deductions",
      ar: "\u0627\u0644\u0628\u062f\u0644\u0627\u062a \u0648\u0627\u0644\u062e\u0635\u0648\u0645\u0627\u062a",
    },
    description: {
      en: "Allowance types, loan portfolio, and deduction analysis",
      ar: "\u062a\u062d\u0644\u064a\u0644 \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0628\u062f\u0644\u0627\u062a \u0648\u0645\u062d\u0641\u0638\u0629 \u0627\u0644\u0642\u0631\u0648\u0636 \u0648\u0627\u0644\u062e\u0635\u0648\u0645\u0627\u062a",
    },
    isPremium: true,
    icon: CreditCard,
  },
  "payroll-comparison": {
    type: "comparison",
    title: {
      en: "Payroll Comparison",
      ar: "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0631\u0648\u0627\u062a\u0628",
    },
    description: {
      en: "Month-over-month payroll variance with net pay and deduction shifts",
      ar: "\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u0631\u0648\u0627\u062a\u0628 \u0634\u0647\u0631\u064a\u0627\u064b \u0645\u0639 \u062a\u063a\u064a\u0631 \u0627\u0644\u0635\u0627\u0641\u064a \u0648\u0627\u0644\u062e\u0635\u0648\u0645\u0627\u062a",
    },
    isPremium: true,
    icon: TrendingUp,
  },

  "executive-dashboard": {
    type: "dashboard",
    title: { en: "Executive Dashboard", ar: "Ù„ÙˆØ­Ø© Ø§Ù„Ù‚ÙŠØ§Ø¯Ø© Ø§Ù„ØªÙ†ÙÙŠØ°ÙŠØ©" },
    description: {
      en: "11 cross-module KPIs: active projects, at-risk, asset utilization, headcount, labor cost, maintenance overdue, plus 6-month cost trend",
      ar: "11 Ù…Ø¤Ø´Ø±Ø§Ù‹ Ù…ØªÙƒØ§Ù…Ù„Ø§Ù‹: Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„Ù†Ø´Ø·Ø©ØŒ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„Ù…ØªØ¹Ø«Ø±Ø©ØŒ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø£ØµÙˆÙ„ØŒ Ø§Ù„Ø£Ø¹Ø¯Ø§Ø¯ØŒ ØªÙƒÙ„ÙØ© Ø§Ù„Ø¹Ù…Ø§Ù„Ø©ØŒ ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„ØµÙŠØ§Ù†Ø©ØŒ ÙˆÙ…Ø¤Ø´Ø± Ø§Ù„ØªÙƒÙ„ÙØ© Ø§Ù„Ø´Ù‡Ø±ÙŠ",
    },
    isPremium: true,
    icon: BarChart3,
  },
  "executive-pnl": {
    type: "pnl",
    title: { en: "Company P&L", ar: "Ø£Ø±Ø¨Ø§Ø­ ÙˆØ®Ø³Ø§Ø¦Ø± Ø§Ù„Ø´Ø±ÙƒØ©" },
    description: {
      en: "Company-level Profit & Loss: revenue vs cost buckets (labor, materials, equipment, field ops, admin) with gross margin and optional 12-month trend",
      ar: "ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ø£Ø±Ø¨Ø§Ø­ ÙˆØ§Ù„Ø®Ø³Ø§Ø¦Ø±: Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª Ù…Ù‚Ø§Ø¨Ù„ Ø¨Ù†ÙˆØ¯ Ø§Ù„ØªÙƒØ§Ù„ÙŠÙ (Ø¹Ù…Ø§Ù„Ø©ØŒ Ù…ÙˆØ§Ø¯ØŒ Ù…Ø¹Ø¯Ø§ØªØŒ Ø¹Ù…Ù„ÙŠØ§Øª Ù…ÙŠØ¯Ø§Ù†ÙŠØ©ØŒ Ø¥Ø¯Ø§Ø±ÙŠØ©) Ù…Ø¹ Ù‡Ø§Ù…Ø´ Ø§Ù„Ø±Ø¨Ø­ ÙˆØ§Ù„Ø§ØªØ¬Ø§Ù‡ Ø§Ù„Ø´Ù‡Ø±ÙŠ",
    },
    isPremium: true,
    icon: DollarSign,
  },
};

export default function CategoryReportsPage() {
  const navigate = useNavigate();
  const { category } = useParams<{ category: ModuleName }>();
  const { language } = useLanguage();
  const isArabic = language === "ar";
  const { can } = usePermissions();

  // ============================================================================
  // COMPUTED DATA (all hooks must be called before any early returns)
  // ============================================================================

  const moduleInfo = category ? MODULE_METADATA[category] : null;

  const moduleReports = useMemo(() => {
    if (!category) return [];

    // Get all reports for this module
    return Object.entries(REPORT_METADATA)
      .filter(([id]) => id.startsWith(`${category}-`))
      .map(([id, meta]) => ({
        id,
        ...meta,
      }));
  }, [category]);

  // ============================================================================
  // PERMISSION GUARD â€” redirect to hub if user lacks category permission
  // (placed after all hooks to comply with React Rules of Hooks)
  // ============================================================================

  if (
    category &&
    CATEGORY_PERMISSIONS[category] &&
    !can({
      roles: [...REPORT_CATEGORY_ROLES[category]],
      permissions: [CATEGORY_PERMISSIONS[category]],
    })
  ) {
    return <Navigate to="/reports" replace />;
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Handle report click
   * Routes to custom page URL format: /reports/:module/:reportType
   */
  const handleReportClick = (reportId: string) => {
    const parts = reportId.split("-");
    if (parts.length >= 2) {
      const module = parts[0];
      const reportType = parts.slice(1).join("-");
      navigate(`/reports/${module}/${reportType}`);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!moduleInfo || !category) {
    return (
      <PageShell size="wide" density="compact" className="py-8">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            {isArabic ? "Ø§Ù„ÙØ¦Ø© ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯Ø©" : "Category not found"}
          </p>
        </div>
      </PageShell>
    );
  }

  const ModuleIcon = moduleInfo.icon;
  const moduleTitle = isArabic ? moduleInfo.title.ar : moduleInfo.title.en;
  const moduleDesc = isArabic
    ? moduleInfo.description.ar
    : moduleInfo.description.en;

  return (
    <PageShell size="wide" density="compact" className="py-8">
      {/* Header */}
      <div className="space-y-4">
        {/* Title */}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-md ${moduleInfo.color} bg-opacity-10`}>
            <ModuleIcon
              className={`h-8 w-8 ${moduleInfo.color.replace("bg-", "text-")}`}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{moduleTitle}</h1>
            <p className="text-muted-foreground">{moduleDesc}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Badge className={getStatusBadgeClass("neutral", "font-semibold")}>
              {moduleReports.length}
            </Badge>
            <span className="text-muted-foreground">
              {isArabic ? "ØªÙ‚Ø±ÙŠØ± Ù…ØªØ§Ø­" : "reports available"}
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Badge className={getStatusBadgeClass("neutral", "font-semibold")}>
              {moduleReports.filter((r) => r.isPremium).length}
            </Badge>
            <span className="text-muted-foreground">
              {isArabic ? "ØªÙ‚Ø±ÙŠØ± Ù…ØªÙ‚Ø¯Ù…" : "premium reports"}
            </span>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {moduleReports.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
          <p className="text-lg text-muted-foreground">
            {isArabic ? "Ù„Ø§ ØªÙˆØ¬Ø¯ ØªÙ‚Ø§Ø±ÙŠØ± Ù…ØªØ§Ø­Ø©" : "No reports available"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {moduleReports.map((report) => {
            const ReportIcon = report.icon;
            const title = isArabic ? report.title.ar : report.title.en;
            const description = isArabic
              ? report.description.ar
              : report.description.en;

            return (
              <Card
                key={report.id}
                className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50"
                onClick={() => handleReportClick(report.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    {/* Icon */}
                    <div
                      className={`p-2 rounded-lg ${moduleInfo.color} bg-opacity-10`}
                    >
                      <ReportIcon
                        className={`h-5 w-5 ${moduleInfo.color.replace("bg-", "text-")}`}
                      />
                    </div>

                    {/* Premium Badge */}
                    {report.isPremium && (
                      <Badge className={getStatusBadgeClass("purple", "gap-1")}>
                        <Sparkles className="h-3 w-3" />
                        {isArabic ? "Ù…ØªÙ‚Ø¯Ù…" : "Premium"}
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <CardTitle className="text-lg mt-2 group-hover:text-primary transition-colors">
                    {title}
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
