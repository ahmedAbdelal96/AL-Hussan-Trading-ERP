/**
 * Admin Module - English Translations
 */

export const adminEn = {
  // Page Title & Meta
  pageTitle: "System Administration",
  pageDescription: "Comprehensive management of sessions and users",

  // Statistics Cards
  activeSessions: "Active Sessions",
  lockedUsers: "Locked Users",
  totalUsers: "Total Users",
  recentActivity: "Recent Activity",

  // Main Sections
  systemManagement: "System Management",
  systemManagementDesc:
    "Manage active sessions, unlock users, and monitor system activity",

  // Tabs
  activeSessionsTab: "Active Sessions",
  lockedUsersTab: "Locked Users",
  recentActivityTab: "Recent Activity",

  // Search & Actions
  searchPlaceholder: "Search by user, email, or IP...",
  searchLockedUsers: "Search locked users...",
  filter: "Filter",
  refresh: "Refresh",
  forceLogoutAll: "Force Logout All",

  // Table Headers - Active Sessions
  user: "User",
  device: "Device",
  ipAddress: "IP Address",
  lastActive: "Last Active",
  loginTime: "Login Time",
  actions: "Actions",

  // Table Headers - Locked Users
  lockedAt: "Locked At",
  reason: "Reason",
  failedAttempts: "Failed Attempts",

  // Actions
  logout: "Logout",
  unlock: "Unlock",

  // Lock Reasons
  lockReason: {
    failedAttempts: "Failed login attempts",
    suspiciousActivity: "Suspicious login attempts",
    adminLock: "Locked by admin",
    securityBreach: "Security breach",
  },

  // Time Indicators
  timeAgo: {
    justNow: "Just now",
    minutesAgo: "{{count}} minute ago",
    minutesAgo_plural: "{{count}} minutes ago",
    hoursAgo: "{{count}} hour ago",
    hoursAgo_plural: "{{count}} hours ago",
    daysAgo: "{{count}} day ago",
    daysAgo_plural: "{{count}} days ago",
  },

  // Empty States
  noActiveSessions: "No Active Sessions",
  noActiveSessionsDesc: "No users are currently connected",
  noLockedUsers: "No Locked Users",
  noLockedUsersDesc: "All user accounts are active and unlocked",

  // Activity Tab
  recentActivityLog: "Recent Activity Log",
  comingSoon: "Coming soon - System activity monitoring",

  // Audit Logs
  auditLogs: {
    title: "Activity Log",
    description: "Track all operations and activities in the system",
    action: "Action",
    user: "User",
    resource: "Resource",
    status: "Status",
    ipAddress: "IP Address",
    timestamp: "Date & Time",
    details: "Details",
    noLogs: "No Logs",
    noLogsDesc: "No activity has been logged yet",

    // Actions
    actions: {
      CREATE: "Create",
      UPDATE: "Update",
      DELETE: "Delete",
      VIEW: "View",
      EXPORT: "Export",
      IMPORT: "Import",
      LOGIN: "Login",
      LOGOUT: "Logout",
      APPROVE: "Approve",
      REJECT: "Reject",
      RESTORE: "Restore",
    },

    // Status
    statuses: {
      SUCCESS: "Success",
      FAILED: "Failed",
      UNAUTHORIZED: "Unauthorized",
      PARTIAL: "Partial",
    },

    // Filters
    filterByAction: "Filter by action",
    filterByStatus: "Filter by status",
    filterByUser: "Filter by user",
    allUsers: "All users",
    clearFilters: "Clear filters",
    filters: "Filters",
    activeFilters: "Active filters",

    // Date Filters
    startDate: "Start date",
    endDate: "End date",
    from: "From",
    to: "To",
    last24Hours: "Last 24 hours",
    last7Days: "Last 7 days",
    last30Days: "Last 30 days",
  },

  // Confirmation Messages
  confirmLogout: "Are you sure you want to logout this user?",
  confirmLogoutAll:
    "Are you sure you want to logout all users? All active sessions will be terminated.",
  confirmUnlock: "Are you sure you want to unlock this account?",

  // Success Messages
  logoutSuccess: "User logged out successfully",
  logoutAllSuccess: "All users logged out successfully",
  unlockSuccess: "Account unlocked successfully",

  // Error Messages
  logoutError: "An error occurred while logging out",
  unlockError: "An error occurred while unlocking account",
  loadSessionsError: "An error occurred while loading active sessions",
  loadLockedUsersError: "An error occurred while loading locked users",
};
