import { cn } from "@/lib/utils";

export type StatusTone =
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "neutral"
  | "accent"
  | "purple";

const STATUS_TONE_CLASSES: Record<StatusTone, string> = {
  success:
    "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-700/50 dark:bg-emerald-900/35 dark:text-emerald-200",
  info: "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-700/50 dark:bg-blue-900/35 dark:text-blue-200",
  warning:
    "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/35 dark:text-amber-200",
  danger:
    "border-red-200 bg-red-100 text-red-800 dark:border-red-700/50 dark:bg-red-900/35 dark:text-red-200",
  neutral:
    "border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700/50 dark:bg-slate-800/60 dark:text-slate-200",
  accent:
    "border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-700/50 dark:bg-orange-900/35 dark:text-orange-200",
  purple:
    "border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-700/50 dark:bg-violet-900/35 dark:text-violet-200",
};

const STATUS_TONE_CHART_COLORS: Record<StatusTone, string> = {
  success: "#16a34a",
  info: "#2563eb",
  warning: "#d97706",
  danger: "#dc2626",
  neutral: "#64748b",
  accent: "#ea580c",
  purple: "#7c3aed",
};

const STATUS_TO_TONE: Record<string, StatusTone> = {
  ACTIVE: "success",
  AVAILABLE: "success",
  OPEN: "success",
  APPROVED: "success",
  COMPLETED: "success",
  PAID: "success",
  SUCCESS: "success",

  IN_USE: "info",
  IN_PROGRESS: "info",
  PLANNING: "info",
  DRAFT: "info",

  PENDING: "warning",
  UNDER_PREPARATION: "warning",
  UNDER_MAINTENANCE: "warning",
  ON_HOLD: "warning",
  ON_LEAVE: "warning",
  PARTIALLY_PAID: "warning",

  HIGH: "accent",
  UNAUTHORIZED: "accent",
  WITHIN_BUDGET: "success",
  UNDER_BUDGET: "info",

  CRITICAL: "danger",
  SUSPENDED: "danger",
  TERMINATED: "danger",
  CANCELLED: "danger",
  CLOSED: "danger",
  REJECTED: "danger",
  FAILED: "danger",
  OVERDUE: "danger",
  OUT_OF_SERVICE: "danger",
  OVER_BUDGET: "danger",
  MAJOR: "danger",
  LOCKED: "danger",
  DELETED: "danger",
  AT_RISK: "danger",

  INACTIVE: "neutral",
  RETIRED: "neutral",
  ARCHIVED: "neutral",
  LOW: "neutral",
  MEDIUM: "warning",
  PARTIAL: "warning",
  MODERATE: "warning",
  NO_BUDGET: "neutral",
  MINOR: "info",
  SAFE: "success",
};

export const getStatusTone = (
  status: string | null | undefined,
  fallback: StatusTone = "neutral",
): StatusTone => {
  if (!status) return fallback;
  const normalized = status.trim().toUpperCase().replace(/[\s-]+/g, "_");
  return STATUS_TO_TONE[normalized] ?? fallback;
};

export const getStatusBadgeClass = (
  tone: StatusTone,
  className?: string,
): string => cn(STATUS_TONE_CLASSES[tone], className);

export const getStatusChartColor = (
  status: string | null | undefined,
  fallbackTone: StatusTone = "neutral",
): string => STATUS_TONE_CHART_COLORS[getStatusTone(status, fallbackTone)];
