/**
 * Admin Module - Arabic Translations
 */

export const adminAr = {
  // Page Title & Meta
  pageTitle: "إدارة النظام",
  pageDescription: "إدارة شاملة للجلسات والمستخدمين",

  // Statistics Cards
  activeSessions: "الجلسات النشطة",
  lockedUsers: "المستخدمين المقفلين",
  totalUsers: "إجمالي المستخدمين",
  recentActivity: "النشاط الأخير",

  // Main Sections
  systemManagement: "إدارة النظام",
  systemManagementDesc:
    "إدارة الجلسات النشطة، فتح قفل المستخدمين، ومراقبة نشاط النظام",

  // Tabs
  activeSessionsTab: "الجلسات النشطة",
  lockedUsersTab: "المستخدمين المقفلين",
  recentActivityTab: "النشاط الأخير",

  // Search & Actions
  searchPlaceholder: "البحث بالاسم، البريد الإلكتروني، أو IP...",
  searchLockedUsers: "البحث عن المستخدمين المقفلين...",
  filter: "تصفية",
  refresh: "تحديث",
  forceLogoutAll: "تسجيل الخروج الإجباري للجميع",

  // Table Headers - Active Sessions
  user: "المستخدم",
  device: "الجهاز",
  ipAddress: "عنوان IP",
  lastActive: "آخر نشاط",
  loginTime: "وقت تسجيل الدخول",
  actions: "الإجراءات",

  // Table Headers - Locked Users
  lockedAt: "تاريخ القفل",
  reason: "السبب",
  failedAttempts: "المحاولات الفاشلة",

  // Actions
  logout: "تسجيل الخروج",
  unlock: "فتح القفل",

  // Lock Reasons
  lockReason: {
    failedAttempts: "محاولات دخول فاشلة",
    suspiciousActivity: "محاولات دخول مشبوهة",
    adminLock: "قفل من قبل المسؤول",
    securityBreach: "خرق أمني",
  },

  // Time Indicators
  timeAgo: {
    justNow: "الآن",
    minutesAgo: "منذ {{count}} دقيقة",
    minutesAgo_plural: "منذ {{count}} دقائق",
    hoursAgo: "منذ {{count}} ساعة",
    hoursAgo_plural: "منذ {{count}} ساعات",
    daysAgo: "منذ {{count}} يوم",
    daysAgo_plural: "منذ {{count}} أيام",
  },

  // Empty States
  noActiveSessions: "لا توجد جلسات نشطة",
  noActiveSessionsDesc: "لا يوجد مستخدمين متصلين حالياً",
  noLockedUsers: "لا يوجد مستخدمين مقفلين",
  noLockedUsersDesc: "جميع حسابات المستخدمين نشطة ومفتوحة",

  // Activity Tab
  recentActivityLog: "سجل النشاط الأخير",
  comingSoon: "قريباً - مراقبة نشاط النظام",

  // Audit Logs
  auditLogs: {
    title: "سجل النشاط",
    description: "تتبع جميع العمليات والأنشطة في النظام",
    action: "الإجراء",
    user: "المستخدم",
    resource: "المورد",
    status: "الحالة",
    ipAddress: "عنوان IP",
    timestamp: "التاريخ والوقت",
    details: "التفاصيل",
    noLogs: "لا توجد سجلات",
    noLogsDesc: "لم يتم تسجيل أي نشاط بعد",

    // Actions
    actions: {
      CREATE: "إنشاء",
      UPDATE: "تعديل",
      DELETE: "حذف",
      VIEW: "عرض",
      EXPORT: "تصدير",
      IMPORT: "استيراد",
      LOGIN: "تسجيل دخول",
      LOGOUT: "تسجيل خروج",
      APPROVE: "موافقة",
      REJECT: "رفض",
      RESTORE: "استرجاع",
    },

    // Status
    statuses: {
      SUCCESS: "نجح",
      FAILED: "فشل",
      UNAUTHORIZED: "غير مصرح",
      PARTIAL: "جزئي",
    },

    // Filters
    filterByAction: "تصفية حسب الإجراء",
    filterByStatus: "تصفية حسب الحالة",
    filterByUser: "تصفية حسب المستخدم",
    allUsers: "كل المستخدمين",
    clearFilters: "مسح الفلاتر",
    filters: "الفلاتر",
    activeFilters: "الفلاتر النشطة",

    // Date Filters
    startDate: "من تاريخ",
    endDate: "إلى تاريخ",
    from: "من",
    to: "إلى",
    last24Hours: "آخر 24 ساعة",
    last7Days: "آخر 7 أيام",
    last30Days: "آخر 30 يوم",
  },

  // Confirmation Messages
  confirmLogout: "هل أنت متأكد من تسجيل خروج هذا المستخدم؟",
  confirmLogoutAll:
    "هل أنت متأكد من تسجيل خروج جميع المستخدمين؟ سيتم قطع جميع الجلسات النشطة.",
  confirmUnlock: "هل أنت متأكد من فتح قفل هذا الحساب؟",

  // Success Messages
  logoutSuccess: "تم تسجيل الخروج بنجاح",
  logoutAllSuccess: "تم تسجيل خروج جميع المستخدمين بنجاح",
  unlockSuccess: "تم فتح قفل الحساب بنجاح",

  // Error Messages
  logoutError: "حدث خطأ أثناء تسجيل الخروج",
  unlockError: "حدث خطأ أثناء فتح قفل الحساب",
  loadSessionsError: "حدث خطأ أثناء تحميل الجلسات النشطة",
  loadLockedUsersError: "حدث خطأ أثناء تحميل المستخدمين المقفلين",
};
