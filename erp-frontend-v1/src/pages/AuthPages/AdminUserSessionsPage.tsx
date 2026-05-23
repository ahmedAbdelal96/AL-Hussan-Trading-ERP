import { useState } from "react";
import { Users, AlertTriangle, Info, Loader, LogOut } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { PageShell } from "@/components/common/PageShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, useActiveUsers, useForceLogoutUser } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { getStatusBadgeClass } from "@/components/common/statusBadgeStyles";

const AdminUserSessionsPage = () => {
  const { isAdmin, isSuperAdmin } = usePermissions();
  const { user } = useAuth();
  const { data: activeSessions = [], isLoading } = useActiveUsers();
  const forceLogoutMutation = useForceLogoutUser();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Role-based access control
  if (!isAdmin && !isSuperAdmin) {
    return (
      <PageShell
        size="narrow"
        density="compact"
        className="flex items-center justify-center min-h-[50vh]"
      >
        <Card className="p-8">
          <AlertTriangle className="text-red-600 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-[var(--text-secondary)]">
            This page requires ADMIN or SUPERADMIN role
          </p>
        </Card>
      </PageShell>
    );
  }

  /**
   * Handle force logout for selected user
   * Shows confirmation dialog before proceeding
   */
  const handleForceLogout = (userId: string, userEmail: string) => {
    if (
      confirm(
        `Are you sure you want to force logout "${userEmail}" from all devices?\n\n` +
          `They will need to login again on all their devices.`,
      )
    ) {
      forceLogoutMutation.mutate(userId, {
        onSuccess: () => {
          setSelectedUserId(null);
        },
      });
    }
  };

  return (
    <PageShell size="wide" density="compact" className="space-y-6">
      <PageHeader
        title="Active User Sessions"
        description="View and manage active user sessions - SUPERADMIN/ADMIN only"
        icon={<Users className="size-5" />}
      />

      {/* Current User Info Card */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
              <Info className="inline mr-2" size={18} />
              Current Session
            </h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>
                <strong>User:</strong> {user?.email}
              </p>
              <p>
                <strong>Full Name:</strong> {user?.fullName || "N/A"}
              </p>
              <p>
                <strong>Role:</strong>
                <Badge className={getStatusBadgeClass("neutral", "ml-2")}>
                  {user?.role || "USER"}
                </Badge>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Sessions Table/List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Active Sessions Across System
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin mr-2" />
            <span>Loading active sessions...</span>
          </div>
        ) : activeSessions.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-tertiary)]">
            <Users className="mx-auto mb-3 text-[var(--text-tertiary)]" size={48} />
            <p>No active sessions found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b">
              <div className="text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  Total Users
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {activeSessions.length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  Total Sessions
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {activeSessions.reduce(
                    (sum, user) => sum + user.activeSessions,
                    0,
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[var(--text-secondary)]">
                  Avg Sessions/User
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {(
                    activeSessions.reduce(
                      (sum, user) => sum + user.activeSessions,
                      0,
                    ) / activeSessions.length
                  ).toFixed(1)}
                </p>
              </div>
            </div>

            {/* Sessions List */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {activeSessions.map((session) => (
                <div
                  key={session.userId}
                  className="p-4 border rounded-lg hover:bg-[var(--surface-hover)] transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-[var(--text-primary)]">
                          {session.fullName}
                        </h4>
                        <Badge className={getStatusBadgeClass("neutral", "text-xs")}>
                          {session.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mb-2">
                        {session.email}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        Active Sessions: {session.activeSessions}
                      </p>
                      {session.lastActivity && (
                        <p className="text-xs text-[var(--text-tertiary)]">
                          Last Activity:{" "}
                          {new Date(session.lastActivity).toLocaleString()}
                        </p>
                      )}

                      {/* Device Info */}
                      {session.devices && session.devices.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {session.devices.slice(0, 2).map((device, idx) => (
                            <div
                              key={idx}
                              className="text-xs p-2 bg-[var(--surface-secondary)] rounded"
                            >
                              <p className="font-mono text-[var(--text-secondary)] truncate">
                                {device.userAgent || "Unknown Device"}
                              </p>
                              <p className="text-[var(--text-secondary)]">
                                IP: {device.ipAddress || "Unknown"}
                              </p>
                            </div>
                          ))}
                          {session.devices.length > 2 && (
                            <p className="text-xs text-[var(--text-tertiary)]">
                              +{session.devices.length - 2} more device(s)
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() =>
                        handleForceLogout(session.userId, session.email)
                      }
                      disabled={forceLogoutMutation.isPending}
                      variant="destructive"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      {forceLogoutMutation.isPending &&
                      selectedUserId === session.userId ? (
                        <>
                          <Loader className="mr-2 animate-spin" size={16} />
                          Logging out...
                        </>
                      ) : (
                        <>
                          <LogOut className="mr-2" size={16} />
                          Force Logout
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </PageShell>
  );
};

export default AdminUserSessionsPage;


