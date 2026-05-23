/**
 * System Administration Dashboard
 * All-in-one admin dashboard for sessions and user management
 */

import { useState, useMemo } from "react";
import {
  Shield,
  Users,
  Activity,
  Lock,
  Unlock,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  Laptop,
  RefreshCw,
  Search,
  Filter,
  Loader2,
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import PageMeta from "@/components/common/PageMeta";
import { PageShell } from "@/components/common/PageShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DataTable, ColumnConfig } from "@/components/common/DataTable";
import { useLanguage } from "@/store/languageStore";
import { translations } from "@/i18n/translations";
import {
  useActiveUsers,
  useForceLogoutUser,
  useForceLogoutAllUsers,
  useUnlockAccount,
  useCurrentUser,
} from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import {
  getStatusBadgeClass,
  getStatusTone,
} from "@/components/common/statusBadgeStyles";
import type { ActiveSessionDto } from "@/services/api/auth.api";
import type { UserEntity } from "@/types/users.types";

export default function SystemAdminDashboard() {
  const { language, isRTL } = useLanguage();
  const t = translations[language].admin;
  const [activeTab, setActiveTab] = useState("sessions");
  const [searchTerm, setSearchTerm] = useState("");

  // Get current user to prevent self-logout
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id;

  // Fetch active sessions
  const {
    data: activeSessions = [],
    isLoading: sessionsLoading,
    refetch: refetchSessions,
  } = useActiveUsers();

  // Fetch all users to filter locked ones on client side
  const { data: allUsersResponse, isLoading: usersLoading } = useUsers({});
  const allUsers = allUsersResponse?.data || [];

  // Helper function to check if user is locked
  const isUserLocked = (user: {
    permanentlyLocked: boolean;
    lockedUntil?: string | null;
  }) => {
    if (user.permanentlyLocked) return true;
    if (user.lockedUntil) {
      return new Date(user.lockedUntil) > new Date();
    }
    return false;
  };

  // Filter locked users on client side
  const lockedUsers = allUsers.filter((user) => isUserLocked(user));

  // Calculate total users
  const totalUsers = allUsers.length;

  // Mutations
  const forceLogoutMutation = useForceLogoutUser();
  const forceLogoutAllMutation = useForceLogoutAllUsers();
  const unlockAccountMutation = useUnlockAccount();

  // Calculate statistics
  const stats = {
    activeSessions: activeSessions.reduce(
      (sum, user) => sum + (user.activeSessions || 0),
      0,
    ),
    lockedUsers: lockedUsers.length,
    totalUsers: totalUsers,
  };

  // Format date helper
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "yyyy-MM-dd HH:mm", {
        locale: isRTL ? ar : enUS,
      });
    } catch {
      return "N/A";
    }
  };

  // Filter sessions based on search
  const filteredSessions = useMemo(() => {
    if (!searchTerm) return activeSessions;
    const search = searchTerm.toLowerCase();
    return activeSessions.filter(
      (session) =>
        session.email?.toLowerCase().includes(search) ||
        session.fullName?.toLowerCase().includes(search),
    );
  }, [activeSessions, searchTerm]);

  // Filter locked users based on search
  const filteredLockedUsers = useMemo(() => {
    if (!searchTerm) return lockedUsers;
    const search = searchTerm.toLowerCase();
    return lockedUsers.filter(
      (user) =>
        user.email?.toLowerCase().includes(search) ||
        user.firstName?.toLowerCase().includes(search) ||
        user.lastName?.toLowerCase().includes(search),
    );
  }, [lockedUsers, searchTerm]);

  const sessionsColumns: ColumnConfig<ActiveSessionDto>[] = [
    {
      key: "user",
      label: t.user,
      align: "start",
      render: (session) => (
        <div className="space-y-1">
          <p className="font-medium">{session.fullName}</p>
          <p className="text-sm text-muted-foreground">{session.email}</p>
          <Badge className={getStatusBadgeClass("neutral", "text-xs mt-1")}>
            {session.role}
          </Badge>
        </div>
      ),
      exportValue: (session) => session.fullName || session.email || "",
    },
    {
      key: "device",
      label: t.device,
      align: "start",
      render: (session) => (
        <div className="flex items-center gap-2">
          <Laptop className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm line-clamp-2 max-w-xs">
            {session.devices?.[0]?.userAgent
              ? (() => {
                  const ua = session.devices[0].userAgent;
                  const browserMatch = ua.match(
                    /(Chrome|Firefox|Safari|Edge)\/([\d.]+)/,
                  );
                  const osMatch = ua.match(
                    /(Windows NT [\d.]+|Mac OS X|Linux|Android|iOS)/,
                  );
                  const browser = browserMatch
                    ? `${browserMatch[1]} ${browserMatch[2].split(".")[0]}`
                    : "Unknown Browser";
                  const os = osMatch
                    ? osMatch[1].replace("Windows NT 10.0", "Windows 10")
                    : "Unknown OS";
                  return `${browser} - ${os}`;
                })()
              : "Unknown Device"}
          </span>
        </div>
      ),
      exportValue: (session) =>
        session.devices?.[0]?.userAgent || "Unknown Device",
    },
    {
      key: "ipAddress",
      label: t.ipAddress,
      align: "start",
      render: (session) => (
        <div className="flex flex-col gap-1">
          <code className="text-xs bg-muted px-2 py-1 rounded inline-block">
            {session.devices?.[0]?.ipAddress === "::1"
              ? "localhost (::1)"
              : session.devices?.[0]?.ipAddress || "N/A"}
          </code>
          <Badge className={getStatusBadgeClass("neutral", "text-xs w-fit")}>
            {session.activeSessions}{" "}
            {session.activeSessions === 1
              ? isRTL
                ? "جلسة"
                : "session"
              : isRTL
                ? "جلسات"
                : "sessions"}
          </Badge>
        </div>
      ),
      exportValue: (session) => session.devices?.[0]?.ipAddress || "N/A",
    },
    {
      key: "lastActive",
      label: t.lastActive,
      align: "center",
      render: (session) => (
        <Badge
          className={getStatusBadgeClass(getStatusTone("SUCCESS"), "gap-1")}
        >
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          {session.lastActivity
            ? formatDate(session.lastActivity)
            : "N/A"}
        </Badge>
      ),
      exportValue: (session) =>
        session.lastActivity
          ? formatDate(session.lastActivity)
          : "N/A",
    },
    {
      key: "loginTime",
      label: t.loginTime,
      align: "center",
      render: (session) => (
        <span className="text-sm text-muted-foreground">
          {session.devices?.[0]?.createdAt
            ? formatDate(session.devices[0].createdAt)
            : "N/A"}
        </span>
      ),
      exportValue: (session) =>
        session.devices?.[0]?.createdAt
          ? formatDate(session.devices[0].createdAt)
          : "N/A",
    },
  ];

  const lockedUsersColumns: ColumnConfig<UserEntity>[] = [
    {
      key: "user",
      label: t.user,
      align: "start",
      render: (user) => (
        <div>
          <p className="font-medium">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      ),
      exportValue: (user) => `${user.firstName} ${user.lastName}`.trim(),
    },
    {
      key: "lockedAt",
      label: t.lockedAt,
      align: "center",
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.lockedUntil ? formatDate(user.lockedUntil) : isRTL ? "دائم" : "Permanent"}
        </span>
      ),
      exportValue: (user) =>
        user.lockedUntil ? formatDate(user.lockedUntil) : isRTL ? "دائم" : "Permanent",
    },
    {
      key: "reason",
      label: t.reason,
      align: "start",
      render: (user) => (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm">
            {user.failedLoginAttempts
              ? `${user.failedLoginAttempts} ${t.lockReason.failedAttempts}`
              : t.lockReason.adminLock}
          </span>
        </div>
      ),
      exportValue: (user) =>
        user.failedLoginAttempts
          ? `${user.failedLoginAttempts} ${t.lockReason.failedAttempts}`
          : t.lockReason.adminLock,
    },
    {
      key: "failedAttempts",
      label: t.failedAttempts,
      align: "center",
      render: (user) => (
        <Badge className={getStatusBadgeClass(getStatusTone("FAILED"))}>
          {user.failedLoginAttempts || 0}
        </Badge>
      ),
      exportValue: (user) => user.failedLoginAttempts || 0,
    },
  ];

  return (
    <>
      <PageMeta title={t.pageTitle} description={t.pageDescription} />

      <div className="min-h-screen bg-[var(--bg-app)]" dir={isRTL ? "rtl" : "ltr"}>
        <PageShell
          size="full"
          density="compact"
          className="max-w-[1600px] space-y-5"
        >
          {/* Page Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] flex items-center justify-center shadow-[var(--shadow-xs)] flex-shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                  {t.pageTitle}
                </h1>
                <p className="text-muted-foreground">{t.pageDescription}</p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Active Sessions */}
            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {t.activeSessions}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.activeSessions}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Locked Users */}
            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {t.lockedUsers}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.lockedUsers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Users */}
            <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-sm)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {t.totalUsers}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.totalUsers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Card className="border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-sm)]">
            <CardHeader className="border-b border-[var(--border-subtle)]">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5" />
                {t.systemManagement}
              </CardTitle>
              <CardDescription>{t.systemManagementDesc}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-1 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-secondary)] p-1 shadow-[var(--shadow-xs)]">
                  <TabsTrigger value="sessions" className="gap-2 rounded-[var(--radius-md)] data-[state=active]:bg-[var(--bg-surface-primary)] data-[state=active]:shadow-[var(--shadow-xs)]">
                    <Activity className="h-4 w-4" />
                    {t.activeSessionsTab}
                  </TabsTrigger>
                  <TabsTrigger value="locked" className="gap-2 rounded-[var(--radius-md)] data-[state=active]:bg-[var(--bg-surface-primary)] data-[state=active]:shadow-[var(--shadow-xs)]">
                    <Lock className="h-4 w-4" />
                    {t.lockedUsersTab}
                  </TabsTrigger>
                </TabsList>

                {/* Active Sessions Tab */}
                <TabsContent value="sessions" className="space-y-4">
                  {/* Search & Actions Bar */}
                  <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search
                        className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground`}
                      />
                      <Input
                        placeholder={t.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={isRTL ? "pr-10" : "pl-10"}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        {t.filter}
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => refetchSessions()}
                        disabled={sessionsLoading}
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${sessionsLoading ? "animate-spin" : ""}`}
                        />
                        {t.refresh}
                      </Button>
                      <Button
                        variant="destructive"
                        className="gap-2"
                        onClick={() => {
                          if (window.confirm(t.confirmLogoutAll)) {
                            forceLogoutAllMutation.mutate();
                          }
                        }}
                        disabled={forceLogoutAllMutation.isPending}
                      >
                        {forceLogoutAllMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                        {t.forceLogoutAll}
                      </Button>
                    </div>
                  </div>

                  {/* Sessions Table */}
                  <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
                    {sessionsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : filteredSessions.length === 0 ? (
                      <div className="text-center py-12">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-lg font-medium text-foreground">
                          {t.noActiveSessions}
                        </p>
                        <p className="text-muted-foreground">
                          {t.noActiveSessionsDesc}
                        </p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[500px]">
                        <DataTable
                          data={filteredSessions}
                          columns={sessionsColumns}
                          keyExtractor={(session) => session.userId}
                          actions={[
                            {
                              label: t.logout,
                              icon: forceLogoutMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <LogOut className="h-3 w-3" />
                              ),
                              onClick: (session) => {
                                if (session.userId === currentUserId) {
                                  showToast.error(
                                    isRTL
                                      ? "لا يمكنك تسجيل خروج نفسك"
                                      : "You cannot logout yourself",
                                  );
                                  return;
                                }
                                if (!forceLogoutMutation.isPending) {
                                  forceLogoutMutation.mutate(session.userId);
                                }
                              },
                              show: (session) =>
                                session.userId !== currentUserId,
                              variant: "destructive",
                            },
                          ]}
                          enableClientSorting={true}
                          enableExport={true}
                          exportFilename={`active_sessions_${new Date().toISOString().slice(0, 10)}`}
                          exportTitle={t.activeSessions}
                          emptyMessage={t.noActiveSessions}
                        />
                      </ScrollArea>
                    )}
                  </div>
                </TabsContent>

                {/* Locked Users Tab */}
                <TabsContent value="locked" className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <Search
                      className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground`}
                    />
                    <Input
                      placeholder={t.searchLockedUsers}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={isRTL ? "pr-10" : "pl-10"}
                    />
                  </div>

                  {/* Locked Users Table */}
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredLockedUsers.length > 0 ? (
                    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface-primary)] shadow-[var(--shadow-xs)]">
                      <ScrollArea className="h-[500px]">
                        <DataTable
                          data={filteredLockedUsers}
                          columns={lockedUsersColumns}
                          keyExtractor={(user) => user.id}
                          actions={[
                            {
                              label: t.unlock,
                              icon: unlockAccountMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Unlock className="h-3 w-3" />
                              ),
                              onClick: (user) => {
                                if (window.confirm(t.confirmUnlock)) {
                                  if (!unlockAccountMutation.isPending) {
                                    unlockAccountMutation.mutate(user.id);
                                  }
                                }
                              },
                              variant: "ghost",
                            },
                          ]}
                          enableClientSorting={true}
                          enableExport={true}
                          exportFilename={`locked_users_${new Date().toISOString().slice(0, 10)}`}
                          exportTitle={t.lockedUsers}
                          emptyMessage={t.noLockedUsers}
                        />
                      </ScrollArea>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">
                        {t.noLockedUsers}
                      </p>
                      <p className="text-muted-foreground">
                        {t.noLockedUsersDesc}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </PageShell>
      </div>
    </>
  );
}
