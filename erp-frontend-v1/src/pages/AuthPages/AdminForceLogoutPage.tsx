import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/store/languageStore";
import {
  AlertCircle,
  LogOut,
  LogOutIcon,
  Users,
  Loader,
  Trash2,
  LockOpen,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { InfoCard } from "@/components/common/InfoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  useForceLogoutUser,
  useForceLogoutAllUsers,
  useActiveUsers,
  useUnlockAccount,
} from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { HelpSteps } from "@/components/common/HelpSteps";
import { DataTable, type ColumnConfig } from "@/components/common/DataTable";
import { PageShell } from "@/components/common/PageShell";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";

const AdminForceLogoutPage = () => {
  const { t } = useTranslation();
  const { isSuperAdmin, isAdmin } = usePermissions();
  const { user: currentUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: users = [], isLoading } = useActiveUsers();
  const forceLogoutMutation = useForceLogoutUser();
  const forceLogoutAllMutation = useForceLogoutAllUsers();
  const unlockMutation = useUnlockAccount();

  // Check permissions - requires ADMIN or SUPERADMIN
  const canForceLogout = isAdmin || isSuperAdmin;
  const canForceLogoutAll = isSuperAdmin;

  // Normalize and filter users based on search
  const filteredUsers = Array.isArray(users)
    ? users.filter((user) => {
        // Exclude current user from the list
        if (user.userId === currentUser?.id) {
          return false;
        }
        const email = user.email?.toLowerCase() || "";
        const fullName = user.fullName?.toLowerCase() || "";
        const query = searchQuery.toLowerCase();
        return email.includes(query) || fullName.includes(query);
      })
    : [];

  const usersColumns: ColumnConfig<(typeof filteredUsers)[number]>[] = [
    {
      key: "email",
      label: "Email",
      render: (user) => user.email,
      exportValue: (user) => user.email || "",
    },
    {
      key: "fullName",
      label: "Name",
      render: (user) => user.fullName,
      exportValue: (user) => user.fullName || "",
    },
    {
      key: "role",
      label: "Role",
      render: (user) => (
        <Badge className={getStatusBadgeClass("neutral")}>{user.role}</Badge>
      ),
      exportValue: (user) => user.role || "",
    },
    {
      key: "activeSessions",
      label: "Active Sessions",
      align: "center",
      render: (user) => user.activeSessions,
      exportValue: (user) => user.activeSessions || 0,
    },
    {
      key: "lastActivity",
      label: "Last Activity",
      render: (user) =>
        user.lastActivity ? new Date(user.lastActivity).toLocaleString() : "--",
      exportValue: (user) =>
        user.lastActivity ? new Date(user.lastActivity).toISOString() : "",
    },
  ];

  const handleForceLogoutUser = () => {
    if (!selectedUserId) {
      alert(t("common.selectUser"));
      return;
    }

    // Prevent force logout of current user
    if (selectedUserId === currentUser?.id) {
      alert("❌ لا يمكنك تسجيل خروج نفسك. استخدم تسجيل الخروج العادي.");
      return;
    }

    if (confirm("هل أنت متأكد من تسجيل خروج هذا المستخدم من جميع الأجهزة؟")) {
      forceLogoutMutation.mutate(selectedUserId);
      setSelectedUserId("");
    }
  };

  const handleForceLogoutAll = () => {
    if (
      confirm(
        "⚠️ تحذير: هذا سيسجل خروج جميع المستخدمين من النظام. هل أنت متأكد؟",
      )
    ) {
      forceLogoutAllMutation.mutate();
    }
  };

  if (!canForceLogout) {
    return (
      <PageShell
        size="narrow"
        density="compact"
        className="flex items-center justify-center min-h-[50vh]"
      >
        <Card className="p-8 max-w-md">
          <div className="flex flex-col items-center text-center">
            <AlertCircle
              className="text-red-600 dark:text-red-400 mb-4"
              size={48}
            />
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
              الوصول مرفوض
            </h2>
            <p className="text-[var(--text-secondary)]">
              هذه الصفحة متاحة فقط للمسؤولين والمسؤولين الفائقين
            </p>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell size="wide" density="compact" className="space-y-6">
      <PageHeader
        title="إدارة جلسات المستخدمين"
        subtitle="تسجيل خروج إجباري للمستخدمين - Admin Only"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Cards */}
        <InfoCard
          label="إجمالي المستخدمين"
          value={filteredUsers.length}
          icon={Users}
          variant="white"
          valueSize="2xl"
        />

        <InfoCard
          label="المستخدم الحالي"
          value={currentUser?.fullName || currentUser?.email || ""}
          subtitle={currentUser?.role}
          icon={ShieldCheck}
          variant="white"
          valueSize="lg"
        />

        <InfoCard
          label="صلاحيات"
          value={canForceLogoutAll ? "Force Logout All" : "Force Logout"}
          icon={LogOutIcon}
          variant="white"
          valueSize="md"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Force Logout Single User */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <LogOut size={20} className="text-red-600" />
            تسجيل خروج مستخدم
          </h2>

          <div className="space-y-4">
            {/* Search */}
            <div>
              <Label htmlFor="search" className="mb-2 block">
                البحث عن مستخدم
              </Label>
              <Input
                id="search"
                type="text"
                placeholder="ابحث بـ البريد أو الاسم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Users List */}
            <div className="space-y-2">
              <Label>اختر المستخدم</Label>
              <div className="border border-[var(--border)] rounded-lg max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-[var(--text-tertiary)]">
                    جاري التحميل...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-[var(--text-tertiary)]">
                    لا توجد مستخدمين
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.userId}
                      onClick={() => setSelectedUserId(user.userId)}
                      className={`w-full text-left px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition ${
                        selectedUserId === user.userId
                          ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">
                            {user.fullName}
                          </p>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {user.email}
                          </p>
                          <p className="text-xs text-[var(--text-tertiary)]">
                            جلسات نشطة: {user.activeSessions}
                          </p>
                        </div>
                        <Badge className={getStatusBadgeClass("neutral")}>
                          {user.role}
                        </Badge>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Selected User Info */}
            {selectedUserId && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  ✓ تم اختيار المستخدم:{" "}
                  <strong>
                    {filteredUsers.find((u) => u.userId === selectedUserId)
                      ?.fullName || selectedUserId}
                  </strong>
                </p>
              </Card>
            )}

            {/* Logout Button */}
            <Button
              onClick={handleForceLogoutUser}
              disabled={!selectedUserId || forceLogoutMutation.isPending}
              variant="destructive"
              className="w-full"
            >
              {forceLogoutMutation.isPending ? (
                <>
                  <Loader className="inline mr-2 animate-spin" size={18} />
                  جاري التسجيل...
                </>
              ) : (
                <>
                  <LogOut className="inline mr-2" size={18} />
                  تسجيل الخروج
                </>
              )}
            </Button>

            <p className="text-xs text-[var(--text-secondary)] text-center">
              ⚠️ سيتم تسجيل خروج المستخدم من جميع الأجهزة والمتصفحات
            </p>
          </div>
        </Card>

        {/* Force Logout All Users */}
        {canForceLogoutAll && (
          <Card className="p-6 border-2 border-red-200 dark:border-red-800">
            <h2 className="text-xl font-semibold text-red-900 dark:text-red-200 mb-4 flex items-center gap-2">
              <Trash2 size={20} className="text-red-600" />
              تسجيل خروج الكل
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-900 dark:text-red-200">
                  <strong>⚠️ تنبيه مهم:</strong>
                </p>
                <ul className="text-sm text-red-800 dark:text-red-300 mt-2 space-y-1 list-disc list-inside">
                  <li>سيتم تسجيل خروج جميع المستخدمين من النظام</li>
                  <li>هذا الإجراء لا يمكن التراجع عنه</li>
                  <li>سيتم حذف جميع الجلسات النشطة</li>
                  <li>المستخدمون سيحتاجون لتسجيل الدخول من جديد</li>
                </ul>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>ℹ️ معلومات:</strong>
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  عدد المستخدمين النشطين:{" "}
                  <strong>{filteredUsers.length}</strong>
                </p>
              </div>

              <Button
                onClick={handleForceLogoutAll}
                disabled={forceLogoutAllMutation.isPending}
                variant="destructive"
                className="w-full"
              >
                {forceLogoutAllMutation.isPending ? (
                  <>
                    <Loader className="inline mr-2 animate-spin" size={18} />
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <Trash2 className="inline mr-2" size={18} />
                    تسجيل خروج جميع المستخدمين
                  </>
                )}
              </Button>

              <p className="text-xs text-[var(--text-secondary)] text-center">
                هذا الإجراء متاح فقط للمسؤول الفائق (SUPER_ADMIN)
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Users Table */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Users size={20} />
          قائمة المستخدمين
        </h2>

        <div className="overflow-x-auto">
          <DataTable
            data={filteredUsers}
            columns={usersColumns}
            keyExtractor={(user) => user.userId}
            emptyMessage="No users found"
            enableClientSorting={true}
            actions={[
              {
                label: "Logout",
                icon: <LogOut size={16} />,
                onClick: (user) => {
                  setSelectedUserId(user.userId);
                  setTimeout(() => handleForceLogoutUser(), 100);
                },
                show: (user) => user.userId !== currentUser?.id,
                variant: "default",
              },
              {
                label: "Unlock",
                icon: unlockMutation.isPending ? (
                  <Loader className="animate-spin" size={16} />
                ) : (
                  <LockOpen size={16} />
                ),
                onClick: (user) => {
                  if (confirm(String(t("auth.unlockAccount.confirm")))) {
                    unlockMutation.mutate(user.userId);
                  }
                },
                variant: "ghost",
              },
            ]}
            className="border-0 shadow-none"
          />
        </div>
      </Card>

      <HelpSteps
        title="إرشادات إدارة الجلسات"
        collapsible
        compact
        steps={[
          "ابحث عن المستخدم المطلوب ثم اختره من القائمة.",
          "اضغط تسجيل خروج المستخدم لتسجيل خروجه من كل الأجهزة.",
          "في حالات الطوارئ فقط، استخدم تسجيل خروج جميع المستخدمين (متاح للسوبر أدمن فقط).",
          "بعد الإجراء، أبلِغ المستخدمين بإعادة تسجيل الدخول والتأكد من تحديث كلمات المرور إذا لزم الأمر.",
        ]}
      />
    </PageShell>
  );
};

export default AdminForceLogoutPage;
