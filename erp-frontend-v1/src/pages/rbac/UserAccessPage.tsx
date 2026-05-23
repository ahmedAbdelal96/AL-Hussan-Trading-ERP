import { useState, useMemo, useEffect } from "react";
import {
  UserCheck,
  ShieldPlus,
  ShieldOff,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Circle,
  Loader2,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  useUserRoles,
  useAssignRoleToUser,
  useRevokeRoleFromUser,
  useUserCustomPermissions,
  useGrantPermissionToUser,
  useRevokePermissionFromUser,
  useRemoveCustomPermission,
  useUserEffectivePermissions,
  useRoles,
  usePermissions as useSystemPermissions,
} from "@/hooks/useRbac";
import { usersApi } from "@/services/api/users.api";
import { showToast } from "@/lib/toast";
import { useTranslation } from "@/i18n/useTranslation";
import type { AssignRoleDto, RevokeRoleDto, UserEntity } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";

// ============================================================================
// PERMISSION GROUPS
// ============================================================================

interface PermGroup {
  key: string;
  labelAr: string;
  icon: string;
  perms: string[];
}

const PERMISSION_GROUPS: PermGroup[] = [
  {
    key: "employee",
    labelAr: "الموظفون",
    icon: "👤",
    perms: ["employee:read", "employee:write", "employee:delete"],
  },
  {
    key: "dept_pos",
    labelAr: "الأقسام والمناصب",
    icon: "🏢",
    perms: [
      "department:read",
      "department:write",
      "department:delete",
      "position:read",
      "position:write",
      "position:delete",
    ],
  },
  {
    key: "site",
    labelAr: "المواقع",
    icon: "📍",
    perms: ["site:read", "site:write", "site:delete"],
  },
  {
    key: "project",
    labelAr: "المشاريع",
    icon: "🏗️",
    perms: ["project:read", "project:write", "project:delete"],
  },
  {
    key: "asset",
    labelAr: "الأصول والمعدات",
    icon: "⚙️",
    perms: ["asset:read", "asset:write", "asset:delete"],
  },
  {
    key: "maintenance",
    labelAr: "الصيانة",
    icon: "🔧",
    perms: ["maintenance:read", "maintenance:write", "maintenance:delete"],
  },
  {
    key: "finance",
    labelAr: "المالية",
    icon: "💰",
    perms: [
      "finance:read",
      "finance:write",
      "finance:delete",
      "finance:approve",
      "finance:export",
    ],
  },
  {
    key: "payroll",
    labelAr: "المرتبات",
    icon: "💵",
    perms: [
      "payroll:read",
      "payroll:write",
      "payroll:process",
      "payroll:approve",
    ],
  },
  {
    key: "report",
    labelAr: "التقارير",
    icon: "📊",
    perms: [
      "report:view",
      "report:export",
      "report:finance",
      "report:finance:export",
      "report:payroll",
      "report:payroll:export",
      "report:projects",
      "report:employees",
      "report:assets",
      "report:maintenance",
      "report:sites",
      "report:users",
      "report:system",
    ],
  },
  {
    key: "user",
    labelAr: "المستخدمون",
    icon: "👥",
    perms: [
      "user:read",
      "user:write",
      "user:delete",
      "user:change_role",
      "user:reset_password",
    ],
  },
  {
    key: "rbac",
    labelAr: "إدارة الصلاحيات",
    icon: "🔐",
    perms: ["rbac:read", "rbac:write"],
  },
  {
    key: "settings",
    labelAr: "الإعدادات",
    icon: "🛠️",
    perms: ["settings:read", "settings:write"],
  },
  {
    key: "dashboard",
    labelAr: "لوحة التحكم",
    icon: "📈",
    perms: ["dashboard:read"],
  },
  {
    key: "audit",
    labelAr: "سجلات التدقيق",
    icon: "📋",
    perms: ["audit:read", "audit:export"],
  },
];

// Short labels for each permission (shown inside accordion rows)
const PERM_LABELS: Record<string, string> = {
  "employee:read": "عرض الموظفين",
  "employee:write": "إدارة الموظفين",
  "employee:delete": "حذف الموظفين",
  "department:read": "عرض الأقسام",
  "department:write": "إدارة الأقسام",
  "department:delete": "حذف الأقسام",
  "position:read": "عرض المناصب",
  "position:write": "إدارة المناصب",
  "position:delete": "حذف المناصب",
  "site:read": "عرض المواقع",
  "site:write": "إدارة المواقع",
  "site:delete": "حذف المواقع",
  "project:read": "عرض المشاريع",
  "project:write": "إدارة المشاريع",
  "project:delete": "حذف المشاريع",
  "asset:read": "عرض الأصول",
  "asset:write": "إدارة الأصول",
  "asset:delete": "حذف الأصول",
  "maintenance:read": "عرض الصيانة",
  "maintenance:write": "إدارة الصيانة",
  "maintenance:delete": "حذف طلبات الصيانة",
  "finance:read": "عرض البيانات المالية",
  "finance:write": "إدارة البيانات المالية",
  "finance:delete": "حذف السجلات المالية",
  "finance:approve": "اعتماد المعاملات المالية",
  "finance:export": "تصدير التقارير المالية",
  "payroll:read": "عرض المرتبات",
  "payroll:write": "إدارة المرتبات",
  "payroll:process": "معالجة المرتبات",
  "payroll:approve": "اعتماد المرتبات",
  "report:view": "عرض التقارير",
  "report:export": "تصدير التقارير",
  "report:finance": "تقارير المالية",
  "report:finance:export": "تصدير تقارير المالية",
  "report:payroll": "تقارير المرتبات",
  "report:payroll:export": "تصدير تقارير المرتبات",
  "report:projects": "تقارير المشاريع",
  "report:employees": "تقارير الموظفين",
  "report:assets": "تقارير الأصول",
  "report:maintenance": "تقارير الصيانة",
  "report:sites": "تقارير المواقع",
  "report:users": "تقارير المستخدمين",
  "report:system": "تقارير النظام",
  "user:read": "عرض المستخدمين",
  "user:write": "إدارة المستخدمين",
  "user:delete": "حذف المستخدمين",
  "user:change_role": "تغيير أدوار المستخدمين",
  "user:reset_password": "إعادة تعيين كلمات المرور",
  "rbac:read": "عرض الأدوار والصلاحيات",
  "rbac:write": "إدارة الأدوار والصلاحيات",
  "settings:read": "عرض الإعدادات",
  "settings:write": "تعديل الإعدادات",
  "dashboard:read": "عرض لوحة التحكم",
  "audit:read": "عرض سجلات التدقيق",
  "audit:export": "تصدير سجلات التدقيق",
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const UserAccessPageV2 = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { data: allUsersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => usersApi.getAll({ pageSize: 100 }),
  });

  const { data: rolesData } = useRoles({ limit: 100 });
  const { data: systemPermsData } = useSystemPermissions({ limit: 200 });

  const { data: userRoles } = useUserRoles(selectedUser?.id);
  const { data: customPerms } = useUserCustomPermissions(selectedUser?.id);
  const { data: effectivePermsData, isLoading: isLoadingPerms } =
    useUserEffectivePermissions(selectedUser?.id);

  const assignRole = useAssignRoleToUser();
  const revokeRole = useRevokeRoleFromUser();
  const grantPerm = useGrantPermissionToUser();
  const revokePerm = useRevokePermissionFromUser();
  const removePerm = useRemoveCustomPermission();

  const filteredUsers = useMemo(() => {
    if (!allUsersData?.data) return [];
    if (!searchQuery) return allUsersData.data;
    const q = searchQuery.toLowerCase();
    return allUsersData.data.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [allUsersData, searchQuery]);

  const availableRoles = useMemo(() => {
    if (!rolesData?.data || !userRoles?.roles) return rolesData?.data ?? [];
    const ids = new Set(userRoles.roles.map((r) => r.roleId));
    return rolesData.data.filter((r) => !ids.has(r.id));
  }, [rolesData, userRoles]);

  useEffect(() => {
    if (!effectivePermsData) return;
    const interesting = new Set([
      ...(effectivePermsData.permissions ?? []),
      ...(effectivePermsData.revokedPermissions ?? []),
    ]);
    const toExpand = new Set<string>();
    PERMISSION_GROUPS.forEach((g) => {
      if (g.perms.some((p) => interesting.has(p))) toExpand.add(g.key);
    });
    setExpandedGroups(toExpand);
  }, [effectivePermsData]);

  const getPermStatus = (perm: string) => ({
    fromRole: effectivePermsData?.rolePermissions?.includes(perm) ?? false,
    customGranted:
      effectivePermsData?.grantedPermissions?.includes(perm) ?? false,
    customRevoked:
      effectivePermsData?.revokedPermissions?.includes(perm) ?? false,
    isEffective: effectivePermsData?.permissions?.includes(perm) ?? false,
  });

  const getCustomEntry = (perm: string, type: "GRANT" | "REVOKE") =>
    customPerms?.customPermissions?.find(
      (c) => c.permission.permission === perm && c.permissionType === type,
    );

  const getPermissionId = (perm: string) =>
    systemPermsData?.data?.find((p) => p.permission === perm)?.id;

  const toggleGroup = (key: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const handleSelectUser = (user: UserEntity) => {
    setSelectedUser(user);
    setSearchQuery("");
    setIsDropdownOpen(false);
    setSelectedRoleId("");
    setExpandedGroups(new Set());
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setSearchQuery("");
    setIsDropdownOpen(false);
    setSelectedRoleId("");
    setExpandedGroups(new Set());
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRoleId) return;
    const payload: AssignRoleDto = {
      userId: selectedUser.id,
      roleId: selectedRoleId,
    };
    await assignRole.mutateAsync(payload);
    setSelectedRoleId("");
  };

  const handleRevokeRole = async (roleId: string) => {
    if (!selectedUser) return;
    if (userRoles?.roles?.length === 1) {
      showToast.error(
        "لا يمكن حذف الدور الوحيد. يجب أن يمتلك المستخدم دوراً واحداً على الأقل.",
      );
      return;
    }
    const payload: RevokeRoleDto = { userId: selectedUser.id, roleId };
    await revokeRole.mutateAsync(payload);
  };

  const handleDirectRemove = async (perm: string, type: "GRANT" | "REVOKE") => {
    const entry = getCustomEntry(perm, type);
    if (!entry || !selectedUser) return;
    await removePerm.mutateAsync({
      customPermissionId: entry.id,
      userId: selectedUser.id,
    });
  };

  const handleGrantPerm = async (permString: string) => {
    if (!selectedUser) return;
    const permId = getPermissionId(permString);
    if (!permId) return;
    await grantPerm.mutateAsync({
      userId: selectedUser.id,
      permissionId: permId,
    });
  };

  const handleRevokePerm = async (permString: string) => {
    if (!selectedUser) return;
    const permId = getPermissionId(permString);
    if (!permId) return;
    await revokePerm.mutateAsync({
      userId: selectedUser.id,
      permissionId: permId,
    });
  };

  const renderPermRow = (perm: string) => {
    const { fromRole, customGranted, customRevoked, isEffective } =
      getPermStatus(perm);
    const label = PERM_LABELS[perm] ?? perm;
    const anyMutating =
      removePerm.isPending || grantPerm.isPending || revokePerm.isPending;

    // Status icon
    const statusIcon = (() => {
      if (customRevoked)
        return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
      if (isEffective)
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
      return <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />;
    })();

    // Action button
    const actionBtn = (() => {
      if (customRevoked) {
        return (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            onClick={() => handleDirectRemove(perm, "REVOKE")}
            disabled={anyMutating}
          >
            إلغاء الحجب
          </Button>
        );
      }
      if (customGranted && fromRole) {
        return (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 text-muted-foreground"
            onClick={() => handleDirectRemove(perm, "GRANT")}
            disabled={anyMutating}
            title="هذه الصلاحية موجودة في الأدوار أصلاً — المنح اليدوي زائد"
          >
            إزالة منح زائد
          </Button>
        );
      }
      if (customGranted && !fromRole) {
        return (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
            onClick={() => handleDirectRemove(perm, "GRANT")}
            disabled={anyMutating}
          >
            إلغاء المنح
          </Button>
        );
      }
      if (fromRole) {
        return (
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7 border-destructive/50 text-destructive hover:bg-destructive/5"
            onClick={() => handleRevokePerm(perm)}
            disabled={anyMutating}
          >
            <ShieldOff className="h-3 w-3 mr-1" />
            حجب فردي
          </Button>
        );
      }
      return (
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 border-primary/50 text-primary hover:bg-primary/5"
          onClick={() => handleGrantPerm(perm)}
          disabled={anyMutating}
        >
          <ShieldPlus className="h-3 w-3 mr-1" />
          منح
        </Button>
      );
    })();

    return (
      <div
        key={perm}
        className="flex items-center gap-3 py-2 px-3 rounded-md transition-colors hover:bg-muted/30"
      >
        {statusIcon}

        <span className="flex-1 text-sm">{label}</span>

        {/* Source badges */}
        <div className="flex gap-1 shrink-0">
          {fromRole && (
            <Badge
              className={getStatusBadgeClass("info", "text-[10px] h-5 px-1.5 font-normal")}
            >
              من الأدوار
            </Badge>
          )}
          {customGranted && (
            <Badge
              className={getStatusBadgeClass("success", "text-[10px] h-5 px-1.5 font-normal")}
            >
              ممنوح
            </Badge>
          )}
          {customRevoked && (
            <Badge
              className={getStatusBadgeClass("danger", "text-[10px] h-5 px-1.5 font-normal")}
            >
              محجوب
            </Badge>
          )}
        </div>

        {actionBtn}
      </div>
    );
  };

  const renderPermGroup = (group: PermGroup) => {
    const isOpen = expandedGroups.has(group.key);
    const effectiveCount = group.perms.filter((p) =>
      effectivePermsData?.permissions?.includes(p),
    ).length;
    const revokedCount = group.perms.filter((p) =>
      effectivePermsData?.revokedPermissions?.includes(p),
    ).length;
    const hasAny = effectiveCount > 0 || revokedCount > 0;

    return (
      <div key={group.key} className="border rounded-lg overflow-hidden">
        {/* Header */}
        <button
          className="w-full flex items-center gap-2 p-3 hover:bg-muted/30 transition-colors"
          onClick={() => toggleGroup(group.key)}
        >
          <span>{group.icon}</span>
          <span className="flex-1 font-medium text-sm text-start">
            {group.labelAr}
          </span>

          {/* Stats */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-xs font-medium ${
                hasAny ? "text-emerald-600" : "text-muted-foreground"
              }`}
            >
              {effectiveCount}/{group.perms.length}
            </span>
            {revokedCount > 0 && (
              <Badge className={getStatusBadgeClass("danger", "text-[10px] h-4 px-1.5")}> 
                {revokedCount} محجوب
              </Badge>
            )}
          </div>

          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </button>

        {/* Permissions List */}
        {isOpen && (
          <div className="border-t divide-y divide-border/50 bg-background">
            {group.perms.map((perm) => renderPermRow(perm))}
          </div>
        )}
      </div>
    );
  };

  return (
    <PageShell size="wide" density="compact" className="space-y-6">
      <PageHeader
        title={t("rbac.userAccess.title")}
        subtitle={t("rbac.userAccess.subtitle")}
        icon={<UserCheck className="h-5 w-5" />}
      />

      {/* User Search */}
      <Card className="p-4">
        <div className="space-y-3">
          <p className="text-sm font-semibold">اختر المستخدم</p>

          {selectedUser ? (
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex-1">
                <p className="font-semibold">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.email}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearUser}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="pl-10"
              />
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute z-20 w-full mt-1 border rounded-lg bg-background shadow-lg max-h-72 overflow-y-auto">
                    {isLoadingUsers ? (
                      <div className="p-4 flex justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredUsers.length > 0 ? (
                      <div className="divide-y">
                        {filteredUsers.slice(0, 50).map((user) => (
                          <button
                            key={user.id}
                            onClick={() => handleSelectUser(user)}
                            className="w-full p-3 text-left transition-colors hover:bg-[var(--bg-surface-secondary)]"
                          >
                            <p className="font-medium text-sm">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </button>
                        ))}
                        {filteredUsers.length > 50 && (
                          <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30">
                            عرض أول 50 نتيجة
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        لا توجد نتائج
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Management Panel */}
      {selectedUser ? (
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* ── Roles (Left) ─────────────────────────────── */}
          <Card className="p-4 space-y-4 lg:col-span-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">الأدوار</h3>
            </div>

            {/* Assign New Role */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-medium">
                إضافة دور
              </p>
              <div className="flex gap-2">
                <select
                  className="flex-1 border border-input rounded-md px-3 py-2 text-sm bg-background"
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                >
                  <option value="">اختر دور...</option>
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={handleAssignRole}
                  disabled={!selectedRoleId || assignRole.isPending}
                >
                  {assignRole.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "إضافة"
                  )}
                </Button>
              </div>
            </div>

            {/* Current Roles */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase font-medium">
                الأدوار الحالية
              </p>
              {userRoles?.roles?.length ? (
                <div className="space-y-2">
                  {userRoles.roles.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-2.5 border rounded-lg bg-muted/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {r.role.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {r.role.slug}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 ms-2"
                        onClick={() => handleRevokeRole(r.roleId)}
                        disabled={
                          revokeRole.isPending || userRoles.roles.length === 1
                        }
                        title={
                          userRoles.roles.length === 1
                            ? "لا يمكن حذف الدور الوحيد"
                            : "إزالة الدور"
                        }
                      >
                        إزالة
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد أدوار مخصصة
                </p>
              )}
            </div>

            {/* Summary Stats */}
            {effectivePermsData && (
              <div className="pt-3 border-t space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  الصلاحيات النشطة:{" "}
                  <span className="font-semibold text-foreground">
                    {effectivePermsData.totalPermissions}
                  </span>
                </p>
                {effectivePermsData.grantedPermissionsCount > 0 && (
                  <p className="text-xs text-emerald-600">
                    ممنوحة يدوياً: {effectivePermsData.grantedPermissionsCount}
                  </p>
                )}
                {effectivePermsData.revokedPermissionsCount > 0 && (
                  <p className="text-xs text-destructive">
                    محجوبة يدوياً: {effectivePermsData.revokedPermissionsCount}
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* ── Permissions Accordion (Right) ─────────────── */}
          <div className="lg:col-span-2 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldPlus className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">الصلاحيات</h3>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  نشطة
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-destructive" />
                  محجوبة
                </span>
                <span className="flex items-center gap-1">
                  <Circle className="h-3 w-3 text-muted-foreground/30" />
                  غير متاحة
                </span>
              </div>
            </div>

            {/* Accordion */}
            {isLoadingPerms ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {PERMISSION_GROUPS.map((group) => renderPermGroup(group))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State */
        <Card className="p-10 text-center">
          <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium text-muted-foreground">
            ابحث عن مستخدم أعلاه لبدء إدارة صلاحياته
          </p>
        </Card>
      )}
    </PageShell>
  );
};

export default UserAccessPageV2;

