/**
 * Projects Module - Arabic Translations
 * Comprehensive translation file for all projects-related text
 */

const projectsTranslations = {
  // Page Titles
  title: "المشاريع",
  list: {
    title: "قائمة المشاريع",
    description: "إدارة جميع مشاريع المؤسسة",
    empty: "لا توجد مشاريع حالياً",
    emptyDescription: "ابدأ بإضافة مشروع جديد",
    loading: "جاري تحميل المشاريع...",
    error: "حدث خطأ أثناء تحميل المشاريع",
  },

  // Form Fields
  fields: {
    projectCode: "رمز المشروع",
    name: "اسم المشروع",
    nameAr: "اسم إضافي",
    tenderNumber: "رقم المناقصة",
    description: "وصف المشروع",
    status: "حالة المشروع",
    clientName: "اسم العميل",
    clientPhone: "هاتف العميل",
    clientEmail: "بريد العميل",
    site: "الموقع",
    siteId: "الموقع",
    googleMapsLink: "رابط خرائط جوجل",
    location: "الموقع الجغرافي",
    latitude: "خط العرض",
    longitude: "خط الطول",
    plannedStartDate: "تاريخ البدء المخطط",
    actualStartDate: "تاريخ البدء الفعلي",
    plannedEndDate: "تاريخ الانتهاء المخطط",
    actualEndDate: "تاريخ الانتهاء الفعلي",
    budget: "الميزانية",
    currency: "العملة",
    manager: "مدير المشروع",
    managerId: "مدير المشروع",
    completionPercentage: "نسبة الإنجاز",
    progressNotes: "ملاحظات التقدم",
    lastProgressUpdate: "آخر تحديث للتقدم",
    notes: "ملاحظات إضافية",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "تاريخ التحديث",
    createdBy: "أنشئ بواسطة",
    updatedBy: "حُدث بواسطة",
  },

  // Placeholders
  placeholders: {
    name: "أدخل اسم المشروع",
    nameAr: "أدخل اسماً إضافياً (اختياري)",
    tenderNumber: "مثال: TN-2024-001",
    description: "وصف تفصيلي للمشروع وأهدافه",
    clientName: "اسم العميل أو الجهة",
    clientPhone: "مثال: +201234567890",
    clientEmail: "مثال: client@example.com",
    siteId: "أدخل معرف الموقع",
    managerId: "أدخل معرف المدير",
    location: "العنوان التفصيلي للمشروع",
    latitude: "مثال: 24.7136",
    longitude: "مثال: 46.6753",
    budget: "أدخل قيمة الميزانية",
    notes: "أي ملاحظات إضافية عن المشروع",
    progressNotes: "وصف التقدم الحالي والإنجازات",
    search: "بحث عن مشروع...",
    selectSite: "اختر موقع المشروع",
    selectManager: "اختر مدير المشروع",
    selectStatus: "اختر حالة المشروع",
  },

  // Hints
  hints: {
    siteOptional: "اتركه فارغاً إذا لم يكن الموقع موجوداً بعد",
    googleMapsLink: "الصق رابط الموقع من خرائط جوجل",
    currencySAR: "العملة دائماً ريال سعودي للعمليات السعودية",
    managerFromEmployees: "اختر مدير المشروع من قائمة الموظفين النشطين",
  },

  // Project Status
  status: {
    DRAFT: "مسودة",
    PLANNING: "تخطيط",
    ACTIVE: "نشط",
    ON_HOLD: "معلق",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",
    ARCHIVED: "مؤرشف",
    // Legacy lowercase (for backward compatibility)
    draft: "مسودة",
    planning: "التخطيط",
    active: "نشط",
    on_hold: "معلق",
    completed: "مكتمل",
    cancelled: "ملغي",
    archived: "مؤرشف",
  },

  // Media Categories
  mediaCategory: {
    progress_photo: "صور التقدم",
    plan: "المخططات",
    report: "التقارير",
    invoice: "الفواتير",
    contract: "العقود",
    certificate: "الشهادات",
    other: "أخرى",
  },

  // Actions
  actions: {
    create: "إضافة مشروع",
    edit: "تعديل المشروع",
    delete: "حذف المشروع",
    view: "عرض التفاصيل",
    viewOnMap: "عرض على الخريطة",
    viewSite: "عرض الموقع",
    updateProgress: "تحديث التقدم",
    uploadMedia: "رفع ملفات",
    viewMedia: "عرض الملفات",
    uploadDocuments: "رفع مستندات",
    export: "تصدير",
    filter: "تصفية",
    clearFilters: "إزالة الفلاتر",
    refresh: "تحديث",
    back: "رجوع",
    save: "حفظ",
    saving: "جاري الحفظ...",
    cancel: "إلغاء",
    apply: "تطبيق",
    confirmDelete: "تأكيد الحذف",
    deleteWarning:
      "هل أنت متأكد من حذف المشروع؟ لا يمكن التراجع عن هذا الإجراء.",
  },

  // Tabs
  tabs: {
    overview: "نظرة عامة",
    employees: "الموظفون",
    assets: "الأصول",
    documents: "المستندات",
  },

  // Quick Actions
  quickActions: {
    changeStatus: "تغيير الحالة",
  },

  // Details Page
  details: {
    title: "تفاصيل المشروع",
    error: "خطأ في تحميل البيانات",
    notFound: "لم يتم العثور على المشروع",
    progress: "التقدم",
    completionPercentage: "نسبة الإنجاز",
    complete: "مكتمل",
    inProgress: "قيد التنفيذ",
    progressNotes: "ملاحظات التقدم",
    lastUpdate: "آخر تحديث",
    description: "الوصف",
    clientInfo: "معلومات العميل",
    clientName: "اسم العميل",
    clientPhone: "رقم الهاتف",
    clientEmail: "البريد الإلكتروني",
    budget: "الميزانية",
    totalBudget: "إجمالي الميزانية",
    totalCosts: "إجمالي المصروفات",
    costItems: "بند",
    pending: "معلق",
    notes: "ملاحظات",
    quickInfo: "معلومات سريعة",
    tenderNumber: "رقم المناقصة",
    duration: "المدة",
    days: "يوم",
    plannedStartDate: "تاريخ البدء المخطط",
    actualStartDate: "تاريخ البدء الفعلي",
    plannedEndDate: "تاريخ الانتهاء المخطط",
    actualEndDate: "تاريخ الانتهاء الفعلي",
    location: "الموقع",
    site: "الموقع",
    manager: "المدير",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تحديث",
    documents: "المستندات",
  },

  // Form Sections
  sections: {
    basicInfo: "المعلومات الأساسية",
    clientInfo: "معلومات العميل",
    dateTimeline: "الجدول الزمني",
    locationSite: "الموقع والمكان",
    budgetFinancial: "الميزانية والمالية",
    management: "الإدارة",
    additionalInfo: "معلومات إضافية",
    progressTracking: "تتبع التقدم",
  },

  // Validation Messages
  validation: {
    nameRequired: "اسم المشروع مطلوب",
    nameMax: "اسم المشروع يجب ألا يتجاوز 255 حرف",
    nameArMax: "الاسم الإضافي يجب ألا يتجاوز 255 حرف",
    tenderNumberMax: "رقم المناقصة يجب ألا يتجاوز 100 حرف",
    statusRequired: "حالة المشروع مطلوبة",
    clientEmailInvalid: "صيغة البريد الإلكتروني غير صحيحة",
    clientPhoneInvalid: "صيغة رقم الهاتف غير صحيحة (مثال: +201234567890)",
    latitudeInvalid: "خط العرض يجب أن يكون بين -90 و 90",
    longitudeInvalid: "خط الطول يجب أن يكون بين -180 و 180",
    budgetMin: "الميزانية يجب أن تكون أكبر من أو تساوي 0",
    currencyMax: "رمز العملة يجب ألا يتجاوز 3 أحرف",
    completionMin: "نسبة الإنجاز يجب أن تكون 0 على الأقل",
    completionMax: "نسبة الإنجاز يجب ألا تتجاوز 100",
    completionRequired: "نسبة الإنجاز مطلوبة",
    plannedEndBeforeStart: "تاريخ الانتهاء المخطط يجب أن يكون بعد تاريخ البدء",
    actualEndBeforeStart:
      "تاريخ الانتهاء الفعلي يجب أن يكون بعد تاريخ البدء الفعلي",
  },

  // Success/Error Messages
  create: {
    success: "تم إنشاء المشروع بنجاح",
    error: "حدث خطأ أثناء إنشاء المشروع",
  },
  update: {
    success: "تم تحديث المشروع بنجاح",
    error: "حدث خطأ أثناء تحديث المشروع",
  },
  delete: {
    success: "تم حذف المشروع بنجاح",
    error: "حدث خطأ أثناء حذف المشروع",
    confirm: "هل أنت متأكد من حذف هذا المشروع؟",
    confirmDescription:
      "لن تتمكن من التراجع عن هذا الإجراء. سيتم حذف المشروع وجميع بياناته.",
  },

  // Employee Assignment
  employees: {
    assign: {
      success: "تم إسناد الموظف للمشروع بنجاح",
      error: "حدث خطأ أثناء إسناد الموظف",
      alreadyAssigned: "هذا الموظف مُسند للمشروع بالفعل",
    },
    update: {
      success: "تم تحديث بيانات الموظف بنجاح",
      error: "حدث خطأ أثناء تحديث البيانات",
    },
    remove: {
      success: "تم إزالة الموظف من المشروع",
      error: "حدث خطأ أثناء إزالة الموظف",
    },
    ui: {
      cardTitle: "الموظفون المسندون",
      assignedCount: "موظف مسند",
      allocated: "مجموع التخصيص:",
      assignButton: "إسناد موظف",
      lockedMessage:
        "المشروع مقفول (الحالة: {{status}}) - غيّر الحالة لتتمكن من تعديل الإسناد",
      allocationWarning: "تحذير: مجموع النسب يتجاوز 100%",
      loading: "جاري التحميل...",
      empty: "لا يوجد موظفون مسندون",
      exportTitle: "الموظفون المسندون للمشروع",
      columns: {
        employee: "الموظف",
        role: "الدور",
        allocation: "نسبة التخصيص",
        assignedDate: "تاريخ الإسناد",
        department: "القسم",
      },
      overhead: "تكلفة عامة",
      editAction: "تعديل",
      removeAction: "إزالة",
      removeConfirm: "هل تريد إزالة {{name}} من المشروع؟",
      dialogTitle: "إسناد موظف للمشروع",
      dialogDescription: "اختر الموظف وحدد نسبة تخصيص الراتب على هذا المشروع",
      editDialogTitle: "تعديل بيانات الإسناد",
      labels: {
        employee: "الموظف",
        role: "الدور",
        allocationPct: "نسبة تخصيص الراتب %",
        notes: "ملاحظات",
        assignedDate: "تاريخ الإسناد",
      },
      placeholders: {
        selectEmployee: "اختر الموظف",
        search: "ابحث...",
        noEmployees: "لا يوجد موظفون متاحون",
        selectRole: "اختر الدور",
      },
      assigning: "جاري الإسناد...",
      assign: "إسناد",
      saving: "جاري الحفظ...",
      save: "حفظ",
      cancel: "إلغاء",
      roles: {
        MANAGER: "مدير",
        SUPERVISOR: "مشرف",
        ENGINEER: "مهندس",
        FOREMAN: "ريّس عمال",
        TECHNICIAN: "فني",
        WORKER: "عامل",
        SAFETY_OFFICER: "مسؤول سلامة",
        QUALITY_CONTROL: "مراقبة جودة",
        OTHER: "أخرى",
      },
    },
  },

  // Asset Assignment
  assets: {
    assign: {
      success: "تم إسناد الأصل للمشروع بنجاح",
      error: "حدث خطأ أثناء إسناد الأصل",
      alreadyAssigned: "هذا الأصل مُسند للمشروع بالفعل",
    },
    remove: {
      success: "تم إزالة الأصل من المشروع",
      error: "حدث خطأ أثناء إزالة الأصل",
    },
    ui: {
      cardTitle: "الأصول المسندة",
      assignedCount: "أصل مسند",
      assignButton: "إسناد أصل",
      lockedMessage:
        "المشروع مقفول (الحالة: {{status}}) - غيّر الحالة لتتمكن من تعديل الإسناد",
      loading: "جاري التحميل...",
      empty: "لا توجد أصول مسندة",
      exportTitle: "الأصول المسندة للمشروع",
      columns: {
        asset: "الأصل",
        type: "النوع",
        location: "الموقع",
        assignedDate: "تاريخ الإسناد",
        status: "الحالة",
      },
      activeStatus: "نشط",
      removeAction: "إزالة",
      removeConfirm: 'هل تريد إزالة "{{name}}" من المشروع؟',
      dialogTitle: "إسناد أصل للمشروع",
      dialogDescription: "اختر الأصل وحدد التاريخ والملاحظات إن لزم",
      labels: {
        asset: "الأصل",
        assignedDate: "تاريخ الإسناد",
        notes: "ملاحظات",
      },
      placeholders: {
        selectAsset: "اختر الأصل",
        search: "ابحث...",
        noAssets: "لا توجد أصول متاحة",
      },
      assigning: "جاري الإسناد...",
      assign: "إسناد",
      cancel: "إلغاء",
      assetTypes: {
        VEHICLE: "مركبة",
        EQUIPMENT: "معدة",
        MACHINERY: "آلة",
        TOOL: "أداة",
        COMPUTER: "حاسوب",
        FURNITURE: "أثاث",
        OTHER: "أخرى",
      },
    },
  },

  // Progress Tracking - Combined section
  progress: {
    // API response messages
    updateSuccess: "تم تحديث التقدم بنجاح",
    updateError: "حدث خطأ أثناء تحديث التقدم",
    // UI labels
    title: "تتبع التقدم",
    currentProgress: "التقدم الحالي",
    overallProgress: "التقدم العام",
    completion: "نسبة الإنجاز",
    teamSize: "حجم الفريق",
    tasksCompleted: "المهام المكتملة",
    timeline: "الجدول الزمني",
    lastUpdate: "آخر تحديث",
    updateProgress: "تحديث التقدم",
    updateDescription: "حدّث نسبة الإنجاز وأضف ملاحظات عن التقدم",
    notesPlaceholder: "أدخل ملاحظات عن التقدم الحالي...",
    upcomingFeatures: "ميزات قادمة",
    taskManagement: "إدارة المهام والأنشطة",
    milestoneTracking: "تتبع المراحل الرئيسية",
    budgetTracking: "تتبع الميزانية والمصروفات",
    teamActivity: "نشاط الفريق والمساهمات",
    riskAssessment: "تقييم المخاطر والتحديات",
    validation: {
      minPercentage: "يجب أن تكون النسبة 0 على الأقل",
      maxPercentage: "لا يمكن أن تتجاوز النسبة 100",
    },
    notStarted: "لم يبدأ",
    inProgress: "قيد التنفيذ",
    nearCompletion: "قرب الإنجاز",
    completed: "مكتمل",
    percentage: "٪",
  },

  // Table Headers
  table: {
    projectCode: "الرمز",
    name: "اسم المشروع",
    client: "العميل",
    status: "الحالة",
    progress: "التقدم",
    startDate: "تاريخ البدء",
    endDate: "تاريخ الانتهاء",
    budget: "الميزانية",
    manager: "المدير",
    actions: "إجراءات",
    noData: "لا توجد بيانات",
  },

  // Statistics
  stats: {
    total: "إجمالي المشاريع",
    allProjects: "جميع المشاريع",
    draft: "مسودة",
    planning: "في التخطيط",
    active: "مشاريع نشطة",
    inProgress: "قيد التنفيذ",
    onHold: "معلقة",
    paused: "متوقفة مؤقتاً",
    completed: "مكتملة",
    finished: "تم إنجازها",
    cancelled: "ملغاة",
    archived: "مؤرشفة",
    overdue: "متأخرة",
    avgProgress: "متوسط التقدم",
    totalBudget: "إجمالي الميزانية",
  },

  // Filters
  filters: {
    title: "تصفية المشاريع",
    search: "البحث",
    searchHint: "ابحث عن مشروع...",
    searchByName: "البحث بالاسم",
    advanced: "خيارات متقدمة",
    advancedHint: "إظهار/إخفاء الخيارات المتقدمة",
    status: "الحالة",
    allStatuses: "جميع الحالات",
    site: "الموقع",
    siteId: "الموقع",
    allSites: "جميع المواقع",
    manager: "المدير",
    managerId: "المدير",
    allManagers: "جميع المديرين",
    clientName: "اسم العميل",
    dateRange: "نطاق التاريخ",
    startDateFrom: "من تاريخ",
    startDateTo: "إلى تاريخ",
    completionRange: "نطاق الإنجاز",
    minCompletion: "الحد الأدنى",
    maxCompletion: "الحد الأقصى",
    activeFilters: "الفلاتر النشطة",
    showing: "عرض",
    of: "من",
    results: "نتيجة",
  },

  // Pagination
  pagination: {
    previous: "السابق",
    next: "التالي",
    page: "صفحة",
    of: "من",
    showing: "عرض",
    to: "إلى",
    results: "نتيجة",
    pageSize: "عدد الصفوف",
  },

  // Help Steps
  helpSteps: {
    title: "خطوات إضافة مشروع جديد",
    step1: {
      title: "المعلومات الأساسية",
      description:
        "ابدأ بإدخال اسم المشروع ورقم المناقصة إن وجد. رمز المشروع سيُنشأ تلقائياً.",
    },
    step2: {
      title: "معلومات العميل",
      description:
        "أدخل بيانات العميل: الاسم، رقم الهاتف، والبريد الإلكتروني. تأكد من صحة البريد والهاتف.",
    },
    step3: {
      title: "الجدول الزمني",
      description:
        "حدد تاريخ البدء والانتهاء المخططين. يمكنك تحديث التواريخ الفعلية لاحقاً عند بدء العمل.",
    },
    step4: {
      title: "الموقع والمكان",
      description:
        "اربط المشروع بموقع موجود أو أدخل موقع جديد مع الإحداثيات إن أمكن.",
    },
    step5: {
      title: "الميزانية والإدارة",
      description:
        "حدد ميزانية المشروع والعملة، واختر مدير المشروع من القائمة.",
    },
    step6: {
      title: "المراجعة والحفظ",
      description:
        'راجع جميع البيانات المدخلة وتأكد من صحتها، ثم اضغط "حفظ" لإنشاء المشروع.',
    },
  },

  // Health Status
  health: {
    title: "صحة المشروع",
    onTrack: "على المسار الصحيح",
    atRisk: "في خطر",
    delayed: "متأخر",
  },

  // Media
  media: {
    title: "ملفات المشروع",
    upload: "رفع ملفات",
    category: "التصنيف",
    allCategories: "جميع التصنيفات",
    noMedia: "لا توجد ملفات",
    uploadDescription: "اسحب الملفات هنا أو اضغط للتحميل",
    fileSize: "حجم الملف",
    uploadedBy: "رُفع بواسطة",
    uploadedAt: "تاريخ الرفع",
  },

  // Dates
  dates: {
    duration: "المدة",
    daysRemaining: "أيام متبقية",
    daysOverdue: "أيام تأخير",
    days: "يوم",
    notSet: "غير محدد",
  },

  // Form
  form: {
    createTitle: "إضافة مشروع جديد",
    editTitle: "تعديل المشروع",
    viewTitle: "تفاصيل المشروع",
    loading: "جاري التحميل...",
    unsavedChanges: "لديك تغييرات غير محفوظة",
    unsavedChangesDescription: "هل تريد المغادرة بدون حفظ التغييرات؟",
  },

  // Empty States
  empty: {
    noProjects: "لا توجد مشاريع حالياً",
    noProjectsDescription: "ابدأ بإضافة مشروع جديد لبدء تتبع مشاريعك",
    noResults: "لا توجد نتائج",
    noResultsDescription: "حاول تغيير معايير البحث أو الفلاتر",
    noMedia: "لا توجد ملفات",
    noMediaDescription: "لم يتم رفع أي ملفات لهذا المشروع بعد",
  },

  // Confirmations
  confirmations: {
    delete: "تأكيد الحذف",
    deleteMessage: 'هل أنت متأكد من حذف المشروع "{name}"؟',
    deleteDescription: "سيتم حذف المشروع وجميع بياناته المرتبطة.",
    unsavedChanges: "تغييرات غير محفوظة",
    unsavedChangesMessage: "لديك تغييرات غير محفوظة. هل تريد المغادرة؟",
  },

  // Dashboard
  dashboard: {
    title: "لوحة معلومات المشاريع",
    subtitle: "إحصائيات وتحليلات شاملة للمشاريع",
    loading: "جاري تحميل الإحصائيات...",
    error: "حدث خطأ أثناء تحميل الإحصائيات",
    noData: "لا توجد بيانات متاحة",
    noMonthlyData: "لا توجد بيانات شهرية متاحة حتى الآن",
    lastUpdated: "آخر تحديث",

    // KPIs
    totalProjects: "إجمالي المشاريع",
    draftProjects: "مسودات",
    planningProjects: "قيد التخطيط",
    activeProjects: "المشاريع النشطة",
    onHoldProjects: "المشاريع المعلقة",
    completedProjects: "المشاريع المكتملة",
    cancelledProjects: "المشاريع الملغاة",
    completionRate: "معدل الإنجاز",
    totalBudget: "إجمالي الميزانية",
    totalActualCost: "إجمالي التكلفة الفعلية",
    budgetVariance: "الفرق في الميزانية",
    budgetUtilization: "نسبة استخدام الميزانية",
    averageDuration: "متوسط المدة",
    averageCompletion: "متوسط الإنجاز",
    days: "يوم",

    // Chart Labels
    started: "مبدوء",
    completed: "مكتمل",
    active: "نشط",

    // Charts
    charts: {
      statusBreakdown: "التوزيع حسب الحالة",
      timelineBreakdown: "حالة الجدول الزمني",
      budgetBreakdown: "توزيع حالة الميزانية",
      monthlyTrend: "الاتجاه الشهري (آخر 12 شهر)",
      topByBudget: "أكبر 10 مشاريع حسب الميزانية",
      topByCost: "أكبر 10 مشاريع حسب التكلفة",
      employeeDistribution: "توزيع الموظفين",
      siteDistribution: "توزيع المشاريع حسب الموقع",
    },
  },

  metrics: {
    totalProjects: "إجمالي المشاريع",
    activeProjects: "المشاريع النشطة",
    completedProjects: "المشاريع المكتملة",
    delayedProjects: "المشاريع المتأخرة",
    completionRate: "معدل الإنجاز",
    averageProgress: "متوسط التقدم",
    budgetUtilization: "استخدام الميزانية",
    totalBudget: "إجمالي الميزانية",
    totalActualCost: "إجمالي التكلفة الفعلية",
    onTimeProjects: "في الموعد",
    atRiskProjects: "معرضة للخطر",
  },

  charts: {
    projectsByStatus: "المشاريع حسب الحالة",
    projectsBySite: "المشاريع حسب الموقع",
    budgetVsActual: "الميزانية مقابل التكلفة الفعلية",
    completionProgress: "تقدم الإنجاز",
    delayedProjects: "المشاريع المتأخرة",
    timelineProgress: "تقدم الجدول الزمني",
  },

  // Progress Page
  progressReport: {
    title: "تتبع تقدم المشروع",
    overallProgress: "التقدم الإجمالي",
    completion: "نسبة الإنجاز",
    teamSize: "حجم الفريق",
    tasksCompleted: "المهام المكتملة",
    timeline: "الجدول الزمني",
    updateProgress: "تحديث التقدم",
    updateDescription: "حدث نسبة الإنجاز وأضف ملاحظات حول التقدم",
    notesPlaceholder: "أدخل ملاحظات حول التقدم الحالي...",
    upcomingFeatures: "الميزات القادمة",
    taskManagement: "إدارة المهام والأنشطة",
    milestoneTracking: "تتبع المعالم الرئيسية",
    budgetTracking: "تتبع الميزانية والمصروفات",
    teamActivity: "نشاط الفريق والمساهمات",
    riskAssessment: "تقييم المخاطر والتحديات",
  },

  // Documents Section
  documents: {
    title: "المستندات",
    count: "مستند",
    empty: "لا توجد مستندات مرفوعة",
    emptyHint: "ابدأ برفع المستندات الخاصة بالمشروع",
    type: "النوع",
    name: "الاسم",
    issueDate: "تاريخ الإصدار",
    expiryDate: "تاريخ الانتهاء",
    status: "الحالة",
    notes: "ملاحظات",
    files: "الملفات",
    filesSelected: "ملف محدد",
    namePlaceholder: "مثال: عقد المشروع 2026",
    notesPlaceholder: "ملاحظات إضافية...",
    uploadDescription: "اختر الملفات والمعلومات المطلوبة",

    types: {
      CONTRACT: "عقد",
      PERMIT: "تصريح",
      BLUEPRINT: "مخطط",
      INSPECTION: "معاينة",
      INVOICE: "فاتورة",
      REPORT: "تقرير",
      OTHER: "أخرى",
    },

    statusLabels: {
      valid: "ساري",
      expiring: "ينتهي خلال {{days}} يوم",
      expired: "منتهي",
      noExpiry: "لا يوجد",
    },

    validation: {
      filesRequired: "يجب اختيار ملف واحد على الأقل",
      nameRequired: "اسم المستند مطلوب",
      issueDateFuture: "تاريخ الإصدار لا يمكن أن يكون في المستقبل",
      expiryNeedsIssue: "يجب تحديد تاريخ الإصدار أولاً",
      expiryBeforeIssue: "تاريخ الانتهاء يجب أن يكون بعد تاريخ الإصدار",
    },

    upload: {
      success: "تم رفع المستندات بنجاح",
      error: "حدث خطأ أثناء رفع المستندات",
    },

    delete: {
      success: "تم حذف المستند بنجاح",
      error: "حدث خطأ أثناء حذف المستند",
    },
  },
};

export default projectsTranslations;
