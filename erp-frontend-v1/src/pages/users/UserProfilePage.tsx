import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "@/i18n/useTranslation";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useUser,
  useUpdateUser,
  useDeleteUser,
  useRestoreUser,
  useResetUserPassword,
} from "@/hooks/useUsers";
import { formatDate } from "@/lib/utils";
import {
  ROLE_PERMISSIONS_MAP,
  type SystemRole,
} from "@/config/permissions.constants";
import { useUserManagementPermissions } from "@/features/users/hooks/useUserManagementPermissions";
import { getUserFullName } from "@/types/users.types";
import {
  Shield,
  Mail,
  Phone,
  Edit,
  Trash2,
  RotateCcw,
  KeyRound,
  CheckCircle2,
  XCircle,
  Lock,
  Activity,
  Calendar,
  Clock,
  Globe,
  UserCircle,
  AlertTriangle,
  Building2,
  ShieldAlert,
  Hash,
  RefreshCw,
} from "lucide-react";
import { PersonAvatar } from "@/components/common/PersonAvatar";
import {
  getStatusBadgeClass,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";

const getStatusConfig = (t: (key: string) => string) => ({
  active: {
    label: t("users.status.active"),
    badgeClass: getStatusBadgeClass(getStatusTone("ACTIVE")),
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  inactive: {
    label: t("users.status.inactive"),
    badgeClass: getStatusBadgeClass(getStatusTone("INACTIVE")),
    icon: XCircle,
    color: "text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800/40",
  },
  locked: {
    label: t("users.status.locked"),
    badgeClass: getStatusBadgeClass(getStatusTone("LOCKED")),
    icon: Lock,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  deleted: {
    label: t("users.status.deleted"),
    badgeClass: getStatusBadgeClass(getStatusTone("DELETED")),
    icon: Trash2,
    color: "text-orange-600",
    bg: "bg-orange-100 dark:bg-orange-900/20",
  },
});

function InfoRow({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span>{label}</span>
      </div>
      <span
        className={`text-sm font-medium text-foreground ${
          mono ? "font-mono text-xs bg-muted px-2 py-0.5 rounded" : ""
        }`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div
            className={`h-11 w-11 rounded-md ${iconBg} flex items-center justify-center flex-shrink-0`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-foreground truncate">
              {value}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type ExtendedUser = {
  isLocked?: boolean;
  permanentlyLocked?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
};

export const UserProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: user, isLoading, error, refetch } = useUser(id);
  const statusConfig = getStatusConfig((key) =>
    t(key as Parameters<typeof t>[0]),
  );

  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const restoreUser = useRestoreUser();
  const resetPassword = useResetUserPassword();
  const {
    canWriteUsers,
    canResetUserPassword,
    canSoftDeleteUser,
    canRestoreDeletedUser,
  } = useUserManagementPermissions();

  const [statusDialog, setStatusDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<"active" | "inactive" | null>(
    null,
  );
  const [newPassword, setNewPassword] = useState("");

  const canEditUser = canWriteUsers;
  const canChangeStatus = canWriteUsers;
  const canResetPassword = canResetUserPassword;
  const canDeleteUser = canSoftDeleteUser;
  const canRestoreUser = canRestoreDeletedUser;

  const extUser = user as typeof user & ExtendedUser;
  const isLocked = Boolean(extUser?.isLocked);

  const status: keyof typeof statusConfig = user?.deletedAt
    ? "deleted"
    : isLocked
      ? "locked"
      : user?.isActive === false
        ? "inactive"
        : "active";

  const permissions = useMemo(() => {
    if (!user?.roles?.length) return [];
    const set = new Set<string>();
    user.roles.forEach((r) => {
      (ROLE_PERMISSIONS_MAP[r as SystemRole] || []).forEach((p) => set.add(p));
    });
    return Array.from(set);
  }, [user]);

  const handleStatusSave = async () => {
    if (!canChangeStatus) return;
    if (!newStatus || !id || !user) return;
    await updateUser.mutateAsync({
      id,
      data: { isActive: newStatus === "active", rowVersion: user.rowVersion },
    });
    setStatusDialog(false);
    refetch();
  };

  const handleDelete = async () => {
    if (!canDeleteUser) return;
    if (!id || !user) return;
    await deleteUser.mutateAsync({ id, rowVersion: user.rowVersion });
    setDeleteDialog(false);
    navigate("/users");
  };

  const handleRestore = async () => {
    if (!canRestoreUser) return;
    if (!id) return;
    await restoreUser.mutateAsync(id);
    setRestoreDialog(false);
    refetch();
  };

  const handleResetPassword = async () => {
    if (!canResetPassword) return;
    if (!id || !newPassword.trim()) return;
    await resetPassword.mutateAsync({ id, data: { newPassword } });
    setPasswordDialog(false);
    setNewPassword("");
  };

  if (isLoading) {
    return (
      <PageShell size="wide" density="compact" className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-52 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-md" />
          ))}
        </div>
      </PageShell>
    );
  }

  if (error || !user) {
    return (
      <PageShell size="wide" density="compact" className="space-y-4">
        <Breadcrumbs />
        <PageHeader
          title={t("users.profile.title", { defaultValue: "User Profile" })}
          subtitle={t("users.profile.notFoundSubtitle", {
            defaultValue: "Unable to load user details",
          })}
          icon={<UserCircle className="h-5 w-5" />}
        />
        <Card className="p-8 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-destructive font-medium">
            {t("errors.notFound", { defaultValue: "المستخدم غير موجود" })}
          </p>
          <Button asChild variant="outline">
            <Link to="/users">{t("common.back")}</Link>
          </Button>
        </Card>
      </PageShell>
    );
  }

  const fullName = user.fullName?.trim() || getUserFullName(user);
  const StatusIcon = statusConfig[status].icon;

  return (
    <PageShell size="wide" density="compact" className="space-y-6">
      <Breadcrumbs />
      <PageHeader
        title={t("users.profile.title", { defaultValue: "User Profile" })}
        subtitle={fullName}
        icon={<UserCircle className="h-5 w-5" />}
      />

      {/* ── Hero Card ──────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden border shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0 self-start">
              <PersonAvatar
                src={user.profilePicture}
                alt={fullName}
                className="h-20 w-20 rounded-2xl"
                iconClassName="h-9 w-9"
              />
              {user.isActive && !user.deletedAt && (
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-background" />
              )}
            </div>

            {/* Name / email / roles */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {fullName}
                </h1>
                <Badge
                  className={`${statusConfig[status].badgeClass} gap-1 text-xs`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig[status].label}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {user.phone}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {user.roles?.length ? (
                  user.roles.map((r) => (
                    <Badge
                      key={r}
                      className={getStatusBadgeClass("neutral", "gap-1")}
                    >
                      <Shield className="h-3 w-3" />
                      {r}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    لا يوجد دور
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {(canEditUser ||
              canChangeStatus ||
              canResetPassword ||
              canDeleteUser ||
              canRestoreUser) && (
              <div className="flex flex-col gap-2 md:items-end flex-shrink-0">
                {canEditUser && (
                  <Button asChild size="sm" className="gap-2 w-full md:w-auto">
                    <Link to={`/users/edit/${user.id}`}>
                      <Edit className="h-4 w-4" />
                      تعديل البيانات
                    </Link>
                  </Button>
                )}

                {canChangeStatus && !user.deletedAt && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 w-full md:w-auto"
                    onClick={() => {
                      setNewStatus(user.isActive ? "inactive" : "active");
                      setStatusDialog(true);
                    }}
                  >
                    <Activity className="h-4 w-4" />
                    {user.isActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                  </Button>
                )}

                {canResetPassword && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 w-full md:w-auto"
                    onClick={() => setPasswordDialog(true)}
                  >
                    <KeyRound className="h-4 w-4" />
                    إعادة تعيين كلمة المرور
                  </Button>
                )}

                {user.deletedAt
                  ? canRestoreUser && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 w-full md:w-auto text-green-600 border-green-200 hover:bg-green-50"
                        onClick={() => setRestoreDialog(true)}
                      >
                        <RotateCcw className="h-4 w-4" />
                        استعادة الحساب
                      </Button>
                    )
                  : canDeleteUser && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-2 w-full md:w-auto"
                        onClick={() => setDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف المستخدم
                      </Button>
                    )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Stats Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={CheckCircle2}
          iconBg={statusConfig[status].bg}
          iconColor={statusConfig[status].color}
          label="حالة الحساب"
          value={statusConfig[status].label}
        />
        <StatCard
          icon={Calendar}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600"
          label="تاريخ الإنشاء"
          value={formatDate(user.createdAt)}
        />
        <StatCard
          icon={Clock}
          iconBg="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600"
          label="آخر تسجيل دخول"
          value={
            user.lastLoginAt ? formatDate(user.lastLoginAt) : "لم يسجل بعد"
          }
        />
      </div>

      {/* ── Details Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserCircle className="h-4 w-4 text-primary" />
              </div>
              البيانات الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <InfoRow icon={Mail} label="البريد الإلكتروني" value={user.email} />
            <InfoRow
              icon={Phone}
              label="رقم الهاتف"
              value={user.phone || "غير مسجل"}
            />
            <InfoRow icon={Hash} label="المعرف (ID)" value={user.id} mono />
          </CardContent>
        </Card>

        {/* Security Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <ShieldAlert className="h-4 w-4 text-red-600" />
              </div>
              بيانات الأمان
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <InfoRow
              icon={Globe}
              label="آخر IP"
              value={user.lastLoginIp || "—"}
              mono
            />
            <InfoRow
              icon={AlertTriangle}
              label="محاولات فاشلة"
              value={String(extUser?.failedLoginAttempts ?? 0)}
            />
            <InfoRow
              icon={Lock}
              label="مقفل حتى"
              value={
                extUser?.lockedUntil
                  ? formatDate(extUser.lockedUntil)
                  : "غير مقفل"
              }
            />
            <InfoRow
              icon={RefreshCw}
              label="إصدار التوكن"
              value={String(user.tokenVersion ?? "—")}
            />
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-slate-600" />
              </div>
              بيانات النظام
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <InfoRow
              icon={Calendar}
              label="تاريخ الإنشاء"
              value={formatDate(user.createdAt)}
            />
            <InfoRow
              icon={Clock}
              label="آخر تعديل"
              value={formatDate(user.updatedAt)}
            />
            {user.deletedAt && (
              <InfoRow
                icon={Trash2}
                label="تاريخ الحذف"
                value={formatDate(user.deletedAt)}
              />
            )}
          </CardContent>
        </Card>

        {/* Permissions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              الصلاحيات ({permissions.length})
            </CardTitle>
            <CardDescription className="text-xs">
              مجموع صلاحيات جميع الأدوار المسندة
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {permissions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                لا توجد صلاحيات
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto">
                {permissions.map((p) => (
                  <Badge
                    key={p}
                    className={getStatusBadgeClass(
                      "neutral",
                      "text-xs font-mono",
                    )}
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ══════════════════ DIALOGS ══════════════════════════════════════════ */}

      {/* Status Change */}
      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              تغيير حالة الحساب
            </DialogTitle>
            <DialogDescription>
              سيتم {newStatus === "active" ? "تفعيل" : "تعطيل"} حساب{" "}
              <strong>{fullName}</strong>. هل أنت متأكد؟
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 my-2">
            {(["active", "inactive"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setNewStatus(s)}
                className={`flex-1 rounded-md border-2 p-3 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  newStatus === s
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border"
                }`}
              >
                {s === "active" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    نشط
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-slate-500" />
                    غير نشط
                  </>
                )}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleStatusSave} disabled={updateUser.isPending}>
              {updateUser.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password */}
      <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              إعادة تعيين كلمة المرور
            </DialogTitle>
            <DialogDescription>
              أدخل كلمة المرور الجديدة لـ <strong>{fullName}</strong>
            </DialogDescription>
          </DialogHeader>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialog(false);
                setNewPassword("");
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={newPassword.length < 8 || resetPassword.isPending}
            >
              {resetPassword.isPending ? "جاري الحفظ..." : "تعيين"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              حذف المستخدم
            </DialogTitle>
            <DialogDescription>
              سيتم حذف حساب <strong>{fullName}</strong> بشكل مؤقت. يمكن استعادته
              لاحقاً.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "جاري الحذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation */}
      <Dialog open={restoreDialog} onOpenChange={setRestoreDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <RotateCcw className="h-5 w-5" />
              استعادة الحساب
            </DialogTitle>
            <DialogDescription>
              سيتم استعادة حساب <strong>{fullName}</strong> وتفعيله مجدداً.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialog(false)}>
              إلغاء
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleRestore}
              disabled={restoreUser.isPending}
            >
              {restoreUser.isPending ? "جاري الاستعادة..." : "استعادة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default UserProfilePage;
