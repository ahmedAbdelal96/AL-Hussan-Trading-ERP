/**
 * Audit Detail Dialog — Shows full details for a single audit log entry
 *
 * Uses shadcn/ui Dialog (Radix) instead of a custom div overlay.
 * Renders contextual detail cards based on the audit action type:
 * - CREATE → green card with new entity snapshot
 * - UPDATE → side-by-side diff (old → new) for each changed field
 * - DELETE → red card with deleted entity info
 * - APPROVE/REJECT → status change card
 * - LOGIN/LOGOUT → rich session card with IP, browser, OS
 * - RESTORE → restore confirmation card
 *
 * @version 2.1 — Improved spacing, RTL layout, visual hierarchy
 */

import { format } from "date-fns";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Plus,
  Edit,
  Trash2,
  Eye,
  LogIn,
  LogOut,
  RefreshCw,
  Globe,
  Monitor,
  Clock,
  Server,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AuditAction, type AuditLogDto } from "@/types/audit.types";
import {
  getStatusBadgeClass,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";
import {
  getActionIcon,
  getStatusBadge,
  getFieldDisplayName,
  formatFieldValue,
  type AuditTranslations,
} from "./audit-helpers";

interface AuditDetailDialogProps {
  log: AuditLogDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRTL: boolean;
  t: AuditTranslations;
}

export default function AuditDetailDialog({
  log,
  open,
  onOpenChange,
  isRTL,
  t,
}: AuditDetailDialogProps) {
  if (!log) return null;
  const oldData = log.oldValues as Record<string, unknown> | null;
  const newData = log.newValues as Record<string, unknown> | null;
  const changedFields = log.changedFields || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[85vh] overflow-y-auto p-0"
        dir={isRTL ? "rtl" : "ltr"}
      >
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-md bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30 flex-shrink-0">
              {getActionIcon(log.action)}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-bold">
                {t.details}
              </DialogTitle>
              <DialogDescription className="text-sm mt-0.5">
                {format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-5">
          {/* Summary Row */}
          <SummaryCard log={log} isRTL={isRTL} t={t} />

          {/* Error Message */}
          {log.errorMessage && <ErrorCard message={log.errorMessage} t={t} />}

          {/* Resource Details — contextual based on action type */}
          <ResourceDetails
            log={log}
            oldData={oldData}
            newData={newData}
            changedFields={changedFields}
            isRTL={isRTL}
            t={t}
          />

          {/* Technical Details */}
          <TechnicalDetails log={log} t={t} isRTL={isRTL} />
        </div>

        {/* ── Footer ── */}
        <Separator />
        <DialogFooter className="px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.close}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({
  log,
  isRTL,
  t,
}: {
  log: AuditLogDto;
  isRTL: boolean;
  t: AuditTranslations;
}) {
  const items = [
    {
      label: t.userLabel,
      primary: log.userFullName || (isRTL ? "غير معروف" : "Unknown"),
      secondary: log.userEmail,
      icon: <Info className="h-4 w-4 text-primary" />,
      bg: "bg-primary/10",
    },
    {
      label: t.actionLabel,
      primary: t.actions[log.action] || log.action,
      secondary: log.resourceType,
      icon: getActionIcon(log.action),
      bg: "bg-blue-500/10",
    },
    {
      label: t.statusLabel,
      primary: null,
      badge: true,
      secondary: log.ipAddress,
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      bg: "bg-green-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-lg border bg-card"
        >
          <div
            className={`h-9 w-9 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}
          >
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              {item.label}
            </p>
            {item.badge ? (
              <div className="mt-1">{getStatusBadge(log.status, isRTL)}</div>
            ) : (
              <p className="font-semibold text-sm mt-0.5 truncate">
                {item.primary}
              </p>
            )}
          </div>
          {item.secondary && (
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
              {item.secondary}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ErrorCard({ message, t }: { message: string; t: AuditTranslations }) {
  return (
    <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-destructive text-sm">
            {t.errorMessage}
          </p>
          <p className="text-sm text-muted-foreground mt-1 break-words">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

function ResourceDetails({
  log,
  oldData,
  newData,
  changedFields,
  isRTL,
  t,
}: {
  log: AuditLogDto;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  changedFields: string[];
  isRTL: boolean;
  t: AuditTranslations;
}) {
  // UPDATE with change tracking data
  if (log.action === AuditAction.UPDATE) {
    if (oldData && newData && changedFields.length > 0) {
      return (
        <ChangeDiffCard
          oldData={oldData}
          newData={newData}
          changedFields={changedFields}
          isRTL={isRTL}
          t={t}
        />
      );
    }
    if (newData) {
      return (
        <DataFieldsCard
          data={newData}
          title={isRTL ? "البيانات المحدثة" : "Updated Data"}
          icon={<Edit className="h-4 w-4 text-blue-500" />}
          isRTL={isRTL}
        />
      );
    }
    return (
      <SimpleMessage
        icon={<Edit className="h-5 w-5 text-blue-500" />}
        borderColor="border-blue-200"
        message={
          isRTL
            ? `تم تحديث ${log.resourceType} بنجاح.`
            : `${log.resourceType} updated successfully.`
        }
      />
    );
  }

  // CREATE
  if (log.action === AuditAction.CREATE) {
    if (newData) {
      return (
        <DataFieldsCard
          data={newData}
          title={isRTL ? "تفاصيل العنصر المُنشأ" : "Created Resource Details"}
          icon={<Plus className="h-4 w-4 text-green-500" />}
          isRTL={isRTL}
        />
      );
    }
    return (
      <SimpleMessage
        icon={<CheckCircle className="h-5 w-5 text-green-500" />}
        borderColor="border-green-200"
        message={
          isRTL
            ? `تم إنشاء ${log.resourceType} بنجاح.`
            : `${log.resourceType} created successfully.`
        }
      />
    );
  }

  // DELETE
  if (log.action === AuditAction.DELETE) {
    if (newData) {
      return (
        <DataFieldsCard
          data={newData}
          title={isRTL ? "تفاصيل العنصر المحذوف" : "Deleted Resource Details"}
          icon={<Trash2 className="h-4 w-4 text-destructive" />}
          isRTL={isRTL}
        />
      );
    }
    return (
      <SimpleMessage
        icon={<Info className="h-5 w-5 text-orange-500" />}
        borderColor="border-orange-200"
        message={
          isRTL
            ? `تم حذف ${log.resourceType} بنجاح.`
            : `${log.resourceType} deleted successfully. No additional details.`
        }
      />
    );
  }

  // APPROVE / REJECT
  if (log.action === AuditAction.APPROVE || log.action === AuditAction.REJECT) {
    if (oldData && newData && changedFields.length > 0) {
      return (
        <ChangeDiffCard
          oldData={oldData}
          newData={newData}
          changedFields={changedFields}
          isRTL={isRTL}
          t={t}
        />
      );
    }
    const isApprove = log.action === AuditAction.APPROVE;
    return (
      <SimpleMessage
        icon={
          isApprove ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )
        }
        borderColor={isApprove ? "border-green-200" : "border-red-200"}
        message={
          isApprove
            ? isRTL
              ? `تمت الموافقة على ${log.resourceType} بنجاح.`
              : `${log.resourceType} approved successfully.`
            : isRTL
              ? `تم رفض ${log.resourceType}.`
              : `${log.resourceType} rejected.`
        }
      />
    );
  }

  // RESTORE
  if (log.action === AuditAction.RESTORE) {
    if (newData) {
      return (
        <DataFieldsCard
          data={newData}
          title={isRTL ? "تم استرجاع العنصر" : "Resource Restored"}
          icon={<RefreshCw className="h-4 w-4 text-blue-500" />}
          isRTL={isRTL}
        />
      );
    }
    return (
      <SimpleMessage
        icon={<RefreshCw className="h-5 w-5 text-blue-500" />}
        borderColor="border-blue-200"
        message={
          isRTL
            ? `تم استرجاع ${log.resourceType} بنجاح.`
            : `${log.resourceType} restored successfully.`
        }
      />
    );
  }

  // VIEW
  if (log.action === AuditAction.VIEW) {
    return (
      <SimpleMessage
        icon={<Eye className="h-5 w-5 text-[var(--text-tertiary)]" />}
        borderColor="border-[var(--border)]"
        message={
          isRTL ? `تم عرض ${log.resourceType}` : `Viewed ${log.resourceType}`
        }
      />
    );
  }

  // LOGIN / LOGOUT — rich session card
  if (log.action === AuditAction.LOGIN || log.action === AuditAction.LOGOUT) {
    return <AuthSessionCard log={log} newData={newData} isRTL={isRTL} t={t} />;
  }

  // Default fallback
  if (newData) {
    return (
      <DataFieldsCard
        data={newData}
        title={isRTL ? "التفاصيل" : "Details"}
        icon={<Info className="h-4 w-4 text-[var(--text-tertiary)]" />}
        isRTL={isRTL}
      />
    );
  }

  return null;
}

function ChangeDiffCard({
  oldData,
  newData,
  changedFields,
  isRTL,
  t,
}: {
  oldData: Record<string, unknown>;
  newData: Record<string, unknown>;
  changedFields: string[];
  isRTL: boolean;
  t: AuditTranslations;
}) {
  return (
    <Card className="border-blue-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-blue-50/80 dark:bg-blue-950/20 py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Edit className="h-4 w-4 text-blue-600" />
          {t.recordedChanges}
          <Badge className={getStatusBadgeClass("neutral", "ms-auto text-xs")}>
            {changedFields.length} {t.field}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {changedFields.map((field) => {
            const oldValue = oldData[field];
            const newValue = newData[field];
            const formattedOld = formatFieldValue(oldValue, field, isRTL);
            const formattedNew = formatFieldValue(newValue, field, isRTL);

            return (
              <div key={field} className="rounded-lg border overflow-hidden">
                {/* Field Name Header */}
                <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] px-3 py-2">
                  <p className="font-semibold text-xs">
                    {getFieldDisplayName(field, isRTL)}
                  </p>
                </div>

                {/* Values */}
                <div className="grid grid-cols-2 divide-x rtl:divide-x-reverse">
                  {/* Old */}
                  <div className="p-3 bg-red-50/50 dark:bg-red-950/10">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <XCircle className="h-3 w-3 text-red-500" />
                      <span className="text-[10px] font-medium text-red-600 uppercase tracking-wider">
                        {t.previousValue}
                      </span>
                    </div>
                    <p className="text-sm text-red-800 dark:text-red-300 break-words leading-relaxed">
                      {formattedOld}
                    </p>
                  </div>
                  {/* New */}
                  <div className="p-3 bg-green-50/50 dark:bg-green-950/10">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-[10px] font-medium text-green-600 uppercase tracking-wider">
                        {t.newValue}
                      </span>
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-300 break-words leading-relaxed">
                      {formattedNew}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400">
          <Info className="h-3.5 w-3.5" />
          <span>
            {t.changedOutOf(changedFields.length, Object.keys(newData).length)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function DataFieldsCard({
  data,
  title,
  icon,
  isRTL,
}: {
  data: Record<string, unknown>;
  title: string;
  icon: React.ReactNode;
  isRTL: boolean;
}) {
  const fields = Object.entries(data).filter(([key, value]) => {
    if (["id", "createdAt", "updatedAt", "latitude", "longitude"].includes(key))
      return false;
    if (value === null || value === undefined) return false;
    if (typeof value === "string" && value.trim() === "") return false;
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    )
      return false;
    if (Array.isArray(value)) return false;
    return true;
  });

  if (fields.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/30">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-0 divide-y">
          {fields.map(([key, value]) => (
            <div
              key={key}
              className="flex items-start justify-between gap-4 py-2.5"
            >
              <span className="text-xs text-muted-foreground flex-shrink-0 pt-0.5">
                {getFieldDisplayName(key, isRTL)}
              </span>
              <span className="text-sm font-medium text-end break-words max-w-[60%]">
                {typeof value === "boolean" ? (
                  <Badge
                    className={getStatusBadgeClass(
                      getStatusTone(value ? "SUCCESS" : "INACTIVE"),
                      "text-xs",
                    )}
                  >
                    {value ? (isRTL ? "نعم" : "Yes") : isRTL ? "لا" : "No"}
                  </Badge>
                ) : typeof value === "number" ? (
                  value.toLocaleString()
                ) : (
                  String(value)
                )}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SimpleMessage({
  icon,
  borderColor,
  message,
}: {
  icon: React.ReactNode;
  borderColor: string;
  message: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-lg border ${borderColor} bg-card`}
    >
      {icon}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/** Parse user-agent string into a friendly browser name */
function parseBrowser(ua: string | null, isRTL: boolean): string {
  if (!ua) return isRTL ? "غير معروف" : "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Google Chrome";
  if (ua.includes("Edg")) return "Microsoft Edge";
  if (ua.includes("Firefox")) return "Mozilla Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
  return isRTL ? "متصفح آخر" : "Other";
}

/** Parse user-agent string into a friendly OS name */
function parseOS(ua: string | null, isRTL: boolean): string {
  if (!ua) return isRTL ? "غير معروف" : "Unknown";
  if (ua.includes("Windows NT 10")) return "Windows 10/11";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
  return isRTL ? "نظام آخر" : "Other";
}

function AuthSessionCard({
  log,
  newData,
  isRTL,
  t,
}: {
  log: AuditLogDto;
  newData: Record<string, unknown> | null;
  isRTL: boolean;
  t: AuditTranslations;
}) {
  const isLogin = log.action === AuditAction.LOGIN;
  const isSuccess = log.status === "SUCCESS";
  const browser = parseBrowser(log.userAgent, isRTL);
  const os = parseOS(log.userAgent, isRTL);

  // Color theme based on action + status
  const accent = isLogin
    ? isSuccess
      ? {
          border: "border-green-200",
          headerBg: "bg-green-50 dark:bg-green-950/20",
          text: "text-green-700",
        }
      : {
          border: "border-red-200",
          headerBg: "bg-red-50 dark:bg-red-950/20",
          text: "text-red-700",
        }
    : {
        border: "border-orange-200",
        headerBg: "bg-orange-50 dark:bg-orange-950/20",
        text: "text-orange-700",
      };

  // Info items — each is a clearly separated row
  const infoItems: Array<{
    icon: React.ReactNode;
    label: string;
    value: string;
    sub?: string;
  }> = [];

  if (log.ipAddress) {
    infoItems.push({
      icon: <Globe className="h-4 w-4 text-blue-500" />,
      label: isRTL ? "عنوان IP" : "IP Address",
      value: log.ipAddress,
    });
  }

  infoItems.push({
    icon: <Monitor className="h-4 w-4 text-purple-500" />,
    label: isRTL ? "المتصفح / النظام" : "Browser / OS",
    value: browser,
    sub: os,
  });

  infoItems.push({
    icon: <Clock className="h-4 w-4 text-green-500" />,
    label: isLogin
      ? isRTL
        ? "وقت الدخول"
        : "Login Time"
      : isRTL
        ? "وقت الخروج"
        : "Logout Time",
    value: format(new Date(log.createdAt), "yyyy-MM-dd  HH:mm:ss"),
  });

  if (log.requestMethod && log.requestUrl) {
    infoItems.push({
      icon: <Server className="h-4 w-4 text-[var(--text-tertiary)]" />,
      label: isRTL ? "الطلب" : "Request",
      value: `${log.requestMethod} ${log.requestUrl}`,
    });
  }

  // Session metadata from newValues
  const sessionEntries = newData
    ? Object.entries(newData).filter(
        ([key]) => !["loginTime", "logoutTime"].includes(key),
      )
    : [];

  return (
    <Card className={`${accent.border} overflow-hidden shadow-sm`}>
      {/* Header */}
      <CardHeader className={`${accent.headerBg} py-3 px-4`}>
        <CardTitle className="text-sm flex items-center gap-2 flex-wrap">
          {isLogin ? (
            <LogIn className={`h-4 w-4 ${accent.text}`} />
          ) : (
            <LogOut className={`h-4 w-4 ${accent.text}`} />
          )}
          <span className={accent.text}>
            {isLogin
              ? isRTL
                ? "تفاصيل تسجيل الدخول"
                : "Login Session Details"
              : isRTL
                ? "تفاصيل تسجيل الخروج"
                : "Logout Session Details"}
          </span>
          <div className="ms-auto">{getStatusBadge(log.status, isRTL)}</div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Info rows — stacked vertically, clearly separated */}
        <div className="divide-y">
          {infoItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-md bg-muted/60 flex items-center justify-center">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider leading-none mb-1">
                  {item.label}
                </p>
                <p className="text-sm font-medium break-all leading-snug">
                  {item.value}
                </p>
                {item.sub && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.sub}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Session data — clean key-value list */}
        {sessionEntries.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {isLogin
                  ? isRTL
                    ? "بيانات الجلسة"
                    : "Session Data"
                  : isRTL
                    ? "بيانات الخروج"
                    : "Logout Data"}
              </p>
              <div className="rounded-lg border divide-y overflow-hidden">
                {sessionEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between px-3 py-2.5 bg-card"
                  >
                    <span className="text-xs text-muted-foreground">
                      {getFieldDisplayName(key, isRTL)}
                    </span>
                    <span className="text-sm font-medium break-words max-w-[55%] text-end">
                      {typeof value === "boolean"
                        ? value
                          ? isRTL
                            ? "نعم"
                            : "Yes"
                          : isRTL
                            ? "لا"
                            : "No"
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Failed login error */}
        {log.errorMessage && (
          <div className="px-4 pb-4">
            <div className="p-3 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/10 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-400">
                  {t.errorMessage}
                </p>
                <p className="text-sm text-red-600 mt-0.5">
                  {log.errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TechnicalDetails({
  log,
  t,
  isRTL,
}: {
  log: AuditLogDto;
  t: AuditTranslations;
  isRTL: boolean;
}) {
  const hasInfo = log.resourceId || log.requestMethod || log.userAgent;
  if (!hasInfo) return null;

  // For LOGIN/LOGOUT the AuthSessionCard already shows IP/browser/request
  const isAuthAction =
    log.action === AuditAction.LOGIN || log.action === AuditAction.LOGOUT;

  return (
    <details className="group">
      <summary className="flex items-center gap-2 cursor-pointer p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors select-none">
        <Info className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {t.technicalInfo}
        </span>
      </summary>
      <div className="mt-2 rounded-lg border divide-y text-sm overflow-hidden">
        {log.resourceId && (
          <div className="flex items-center justify-between px-3 py-2.5 bg-card">
            <span className="text-xs text-muted-foreground">
              {t.resourceId}
            </span>
            <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded max-w-[60%] truncate">
              {log.resourceId}
            </code>
          </div>
        )}
        {!isAuthAction && log.requestMethod && log.requestUrl && (
          <div className="flex items-center justify-between px-3 py-2.5 bg-card">
            <span className="text-xs text-muted-foreground">
              {isRTL ? "الطلب" : "Request"}
            </span>
            <code className="font-mono text-xs bg-muted px-2 py-0.5 rounded max-w-[60%] truncate">
              {log.requestMethod} {log.requestUrl}
            </code>
          </div>
        )}
        {!isAuthAction && log.userAgent && (
          <div className="px-3 py-2.5 bg-card">
            <p className="text-xs text-muted-foreground mb-1.5">
              {t.userAgent}
            </p>
            <code className="text-[11px] break-all block bg-muted p-2 rounded leading-relaxed">
              {log.userAgent}
            </code>
          </div>
        )}
      </div>
    </details>
  );
}
