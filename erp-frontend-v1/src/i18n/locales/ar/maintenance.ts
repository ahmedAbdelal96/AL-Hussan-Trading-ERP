/**
 * Arabic translations for Maintenance module
 */
export const maintenanceAr = {
  // Module Title
  title: "الصيانة",
  subtitle: "إدارة طلبات الصيانة والأعطال",

  // Details Page
  detailsPage: {
    title: "تفاصيل طلب الصيانة",
    error: "خطأ في تحميل البيانات",
    notFound: "لم يتم العثور على طلب الصيانة",
  },

  // Actions
  quickActions: {
    create: "إضافة طلب صيانة",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض التفاصيل",
    back: "رجوع",
    refresh: "تحديث",
  },

  // List Page
  list: {
    title: "طلبات الصيانة",
    description: "عرض وإدارة جميع طلبات الصيانة للأصول",
    empty: "لا توجد طلبات صيانة",
    emptyDescription: "لم يتم إنشاء أي طلبات صيانة بعد. ابدأ بإضافة طلب جديد.",
    loading: "جاري تحميل طلبات الصيانة...",
    error: "حدث خطأ أثناء تحميل طلبات الصيانة",
  },

  // Form Pages
  form: {
    createTitle: "إنشاء طلب صيانة جديد",
    editTitle: "تعديل طلب الصيانة",
    createDescription: "أدخل بيانات طلب الصيانة الجديد",
    editDescription: "تعديل بيانات طلب الصيانة",

    // Form Sections
    sections: {
      basic: "المعلومات الأساسية",
      basicDescription: "البيانات الأساسية لطلب الصيانة",
      cost: "التكاليف",
      costDescription: "التكلفة المقدرة والفعلية",
      technical: "المعلومات الفنية",
      technicalDescription: "التفاصيل الفنية والعمل المنجز",
      notes: "الملاحظات",
      notesDescription: "ملاحظات إضافية",
    },

    // Form Fields
    fields: {
      maintenanceNumber: "رقم الصيانة",
      asset: "الأصل",
      assetPlaceholder: "اختر الأصل المراد صيانته",
      project: "المشروع",
      projectPlaceholder: "اختر المشروع (اختياري)",
      projectStatusNote:
        "المشاريع المتاحة فقط: النشطة، والموقوفة مؤقتاً، والتخطيط",
      maintenanceType: "نوع الصيانة",
      maintenanceTypePlaceholder: "اختر نوع الصيانة",
      priority: "الأولوية",
      priorityPlaceholder: "اختر مستوى الأولوية",
      status: "الحالة",
      statusPlaceholder: "اختر الحالة",
      title: "العنوان",
      titlePlaceholder: "مثال: تغيير زيت المحرك",
      description: "الوصف",
      descriptionPlaceholder: "وصف تفصيلي للصيانة المطلوبة...",
      scheduledDate: "تاريخ الجدولة",
      scheduledDatePlaceholder: "اختر موعد الصيانة",
      startedAt: "تاريخ البدء",
      completedAt: "تاريخ الإنهاء",
      estimatedCost: "التكلفة المقدرة",
      estimatedCostPlaceholder: "0.00",
      actualCost: "التكلفة الفعلية",
      actualCostPlaceholder: "0.00",
      actualCostLocked: "\u0627\u0644\u062a\u0643\u0644\u0641\u0629 \u0627\u0644\u0641\u0639\u0644\u064a\u0629 \u0645\u0642\u0641\u0644\u0629 \u0644\u0623\u0646 \u0627\u0644\u062a\u0643\u0644\u0641\u0629 \u0627\u0644\u0645\u0627\u0644\u064a\u0629 \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629 \u062a\u0645 \u0627\u0639\u062a\u0645\u0627\u062f\u0647\u0627 \u0645\u0633\u0628\u0642\u064b\u0627.",
      vendor: "المورد/الورشة",
      vendorPlaceholder: "اسم المورد أو الورشة",
      vendorContact: "جهة اتصال المورد",
      vendorContactPlaceholder: "رقم الهاتف أو البريد",
      assignedTo: "المسؤول",
      assignedToPlaceholder: "اختر الفني المسؤول",
      odometerReading: "قراءة العداد",
      odometerReadingPlaceholder: "قراءة العداد بالكيلومتر",
      workPerformed: "العمل المنجز",
      workPerformedPlaceholder: "وصف العمل الذي تم إنجازه...",
      partsReplaced: "القطع المستبدلة",
      partsReplacedPlaceholder: "قائمة القطع التي تم استبدالها...",
      notes: "ملاحظات",
      notesPlaceholder: "ملاحظات إضافية...",
      approvedBy: "تمت الموافقة بواسطة",
      approvedAt: "تاريخ الموافقة",
      noAssetsAvailable: "لا توجد أصول متاحة - يجب إضافة أصول أولاً",
      noProject: "بدون مشروع",
      noUsersAvailable: "لا يوجد مستخدمون متاحون",
    },

    // Validation Messages
    validation: {
      assetRequired: "يجب اختيار الأصل",
      assetInvalidUUID: "يجب اختيار أصل صحيح من القائمة",
      projectInvalidUUID: "يجب اختيار مشروع صحيح من القائمة",
      maintenanceTypeRequired: "يجب اختيار نوع الصيانة",
      titleRequired: "العنوان مطلوب",
      titleMinLength: "العنوان يجب أن يكون 3 أحرف على الأقل",
      titleMaxLength: "العنوان يجب ألا يتجاوز 255 حرف",
      descriptionMaxLength: "الوصف يجب ألا يتجاوز 1000 حرف",
      estimatedCostInvalid: "التكلفة المقدرة يجب أن تكون رقم صحيح",
      estimatedCostMin: "التكلفة المقدرة يجب أن تكون صفر أو أكثر",
      actualCostInvalid: "التكلفة الفعلية يجب أن تكون رقم صحيح",
      actualCostMin: "التكلفة الفعلية يجب أن تكون صفر أو أكثر",
      vendorMaxLength: "اسم المورد يجب ألا يتجاوز 255 حرف",
      vendorContactMaxLength: "جهة اتصال المورد يجب ألا يتجاوز 100 حرف",
      assignedToInvalidUUID: "يجب اختيار مستخدم صحيح من القائمة",
      odometerInvalid: "قراءة العداد يجب أن تكون رقم صحيح",
      odometerInteger: "قراءة العداد يجب أن تكون رقم صحيح بدون كسور",
      odometerMin: "قراءة العداد يجب أن تكون صفر أو أكثر",
      notesMaxLength: "الملاحظات يجب ألا تتجاوز 1000 حرف",
      workPerformedMaxLength: "وصف العمل المنجز يجب ألا يتجاوز 2000 حرف",
      partsReplacedMaxLength: "قائمة القطع المستبدلة يجب ألا تتجاوز 1000 حرف",
      scheduledDateInvalid: "تاريخ غير صالح",
    },

    // Warning Messages
    warnings: {
      requireRealData:
        "⚠️ تنبيه: يجب إضافة أصول وموظفين حقيقيين في النظام أولاً قبل إنشاء طلب صيانة. القوائم المنسدلة حالياً فارغة وتحتاج إلى بيانات حقيقية.",
    },
  },

  // Status Labels
  status: {
    PENDING: "قيد الانتظار",
    IN_PROGRESS: "قيد التنفيذ",
    ON_HOLD: "معلقة",
    COMPLETED: "مكتملة",
    CANCELLED: "ملغاة",
  },

  // Type Labels
  type: {
    PREVENTIVE: "وقائية",
    CORRECTIVE: "تصحيحية",
    EMERGENCY: "طارئة",
    ROUTINE: "دورية",
    SCHEDULED: "مجدولة",
  },

  // Priority Labels
  priority: {
    LOW: "منخفضة",
    MEDIUM: "متوسطة",
    HIGH: "عالية",
    URGENT: "عاجلة",
    CRITICAL: "حرجة",
  },

  // Table
  table: {
    columns: {
      maintenanceNumber: "رقم الصيانة",
      asset: "الأصل",
      type: "النوع",
      priority: "الأولوية",
      status: "الحالة",
      financeStatus: "\u0627\u0644\u062d\u0627\u0644\u0629 \u0627\u0644\u0645\u0627\u0644\u064a\u0629",
      scheduledDate: "التاريخ المجدول",
      estimatedCost: "التكلفة المقدرة",
      actualCost: "التكلفة الفعلية",
      assignedTo: "المسؤول",
      createdAt: "تاريخ الإنشاء",
      actions: "الإجراءات",
    },
  },

  financeBadge: {
    pending: "\u0628\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0639\u062a\u0645\u0627\u062f \u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a",
    approved: "\u062a\u0645 \u0627\u0639\u062a\u0645\u0627\u062f\u0647\u0627 \u0645\u0627\u0644\u064a\u064b\u0627",
    rejected: "\u0645\u0631\u0641\u0648\u0636\u0629 \u0645\u0646 \u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a",
  },

  // Filters
  filters: {
    title: "الفلاتر",
    search: "بحث...",
    searchPlaceholder: "ابحث برقم الصيانة أو العنوان...",
    asset: "الأصل",
    project: "المشروع",
    maintenanceType: "نوع الصيانة",
    priority: "الأولوية",
    status: "الحالة",
    assignedTo: "المسؤول",
    dateRange: "فترة زمنية",
    startDate: "من تاريخ",
    endDate: "إلى تاريخ",
    clear: "مسح الفلاتر",
    apply: "تطبيق",
    allTypes: "كل الأنواع",
    allPriorities: "كل الأولويات",
    allStatuses: "كل الحالات",
    allAssets: "كل الأصول",
    allProjects: "كل المشاريع",
    allUsers: "كل المستخدمين",
  },

  // Actions
  actions: {
    create: "إنشاء صيانة جديدة",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض التفاصيل",
    viewAsset: "عرض الأصل",
    start: "بدء الصيانة",
    startWork: "بدء العمل",
    complete: "إكمال",
    cancel: "إلغاء",
    cancelMaintenance: "إلغاء الصيانة",
    approve: "الموافقة",
    approveFinanceCost: "اعتماد التكلفة من الحسابات",
    export: "تصدير",
    print: "طباعة",
    refresh: "تحديث",
    save: "حفظ",
    saving: "جاري الحفظ...",
    back: "رجوع",
    viewWorkOrder: "عرض أمر العمل",
    confirmDelete: "تأكيد الحذف",
    deleteWarning:
      "هل أنت متأكد من حذف طلب الصيانة؟ لا يمكن التراجع عن هذا الإجراء.",
  },

  // Notifications
  notifications: {
    createSuccess: "تم إنشاء طلب الصيانة {{number}} بنجاح",
    createError: "حدث خطأ أثناء إنشاء طلب الصيانة",
    updateSuccess: "تم تحديث طلب الصيانة {{number}} بنجاح",
    updateError: "حدث خطأ أثناء تحديث طلب الصيانة",
    deleteSuccess: "تم حذف طلب الصيانة بنجاح",
    deleteError: "حدث خطأ أثناء حذف طلب الصيانة",
    startSuccess: "تم بدء الصيانة {{number}} بنجاح",
    startError: "حدث خطأ أثناء بدء الصيانة",
    completeSuccess: "تم إنهاء الصيانة {{number}} بنجاح",
    completeError: "حدث خطأ أثناء إنهاء الصيانة",
    cancelSuccess: "تم إلغاء الصيانة {{number}} بنجاح",
    cancelError: "حدث خطأ أثناء إلغاء الصيانة",
    approveSuccess: "تمت الموافقة على الصيانة {{number}} بنجاح",
    approveError: "حدث خطأ أثناء الموافقة على الصيانة",
  },

  // Confirmations
  confirmations: {
    deleteTitle: "تأكيد الحذف",
    deleteMessage:
      "هل أنت متأكد من حذف طلب الصيانة {{number}}؟ لا يمكن التراجع عن هذا الإجراء.",
    startTitle: "تأكيد بدء الصيانة",
    startMessage:
      "هل أنت متأكد من بدء الصيانة {{number}}؟ سيتم تسجيل تاريخ البدء.",
    completeTitle: "تأكيد إنهاء الصيانة",
    completeMessage:
      "هل أنت متأكد من إنهاء الصيانة {{number}}؟ تأكد من إدخال كافة البيانات.",
    cancelTitle: "تأكيد إلغاء الصيانة",
    cancelMessage: "هل أنت متأكد من إلغاء الصيانة {{number}}؟",
    approveTitle: "تأكيد الموافقة",
    approveMessage: "هل أنت متأكد من الموافقة على الصيانة {{number}}؟",
  },

  // Details Page
  details: {
    title: "تفاصيل طلب الصيانة",
    loading: "جاري تحميل التفاصيل...",
    error: "خطأ في تحميل البيانات",
    notFound: "لم يتم العثور على طلب الصيانة",
    description: "الوصف",
    assetInfo: "معلومات الأصل",
    quickInfo: "معلومات سريعة",
    type: "النوع",
    scheduledDate: "تاريخ الجدولة",
    completionDate: "تاريخ الإكمال",
    project: "المشروع",
    assignedTo: "مسند إلى",
    vendor: "المورد",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تحديث",
    category: "الفئة",
    assetStatus: "حالة الأصل",
    location: "الموقع",
    assetNotFound: "لم يتم العثور على معلومات الأصل",
    costBreakdown: "التكلفة",
    financeApproval: "الاعتماد المالي",
    financeStatus: "حالة الاعتماد المالي",
    approvedByFinance: "تم الاعتماد من الحسابات",
    financeRejectedReason: "سبب الرفض",
    financePendingHelp:
      "تم تسجيل تكلفة الصيانة في الحسابات وهي بانتظار الاعتماد.",
    financeCostNotCreated: "لم يتم إنشاء تكلفة مالية مرتبطة بعد.",
    estimatedCost: "التكلفة المقدرة",
    actualCost: "التكلفة الفعلية",
    difference: "الفرق",
    allocationPct: "نسبة التخصيص",
    allocatedAmount: "المبلغ المخصص",
    notes: "ملاحظات",
    changeStatus: "تغيير الحالة",
    changeStatusDesc: "تحديث حالة طلب الصيانة",

    tabs: {
      overview: "نظرة عامة",
      timeline: "الخط الزمني",
      cost: "التكاليف",
      work: "تفاصيل العمل",
      attachments: "المرفقات",
    },

    overview: {
      basicInfo: "المعلومات الأساسية",
      assetInfo: "معلومات الأصل",
      assignmentInfo: "معلومات التعيين",
      vendorInfo: "معلومات المورد",
    },

    timeline: {
      created: "تم الإنشاء",
      scheduled: "الموعد المجدول",
      started: "تم البدء",
      completed: "تم الإنهاء",
      approved: "تمت الموافقة",
      notStarted: "لم يبدأ بعد",
      notCompleted: "لم ينتهي بعد",
      notApproved: "لم تتم الموافقة بعد",
    },

    cost: {
      estimated: "التكلفة المقدرة",
      actual: "التكلفة الفعلية",
      variance: "الفرق",
      variancePercentage: "نسبة الفرق",
      underBudget: "أقل من المقدر",
      overBudget: "أعلى من المقدر",
      onBudget: "مطابق للمقدر",
      notAvailable: "غير محدد",
    },

    work: {
      performed: "العمل المنجز",
      partsReplaced: "القطع المستبدلة",
      odometerReading: "قراءة العداد",
      notes: "الملاحظات",
      noData: "لا توجد بيانات",
    },
  },

  // Statistics
  stats: {
    total: "إجمالي الطلبات",
    allRequests: "جميع طلبات الصيانة",
    pending: "معلق",
    waitingAction: "في انتظار الإجراء",
    inProgress: "قيد التنفيذ",
    currentlyWorking: "جاري العمل عليها",
    onHold: "معلقة",
    completed: "مكتمل",
    finished: "تم الإنجاز",
    cancelled: "ملغاة",
    totalEstimatedCost: "إجمالي التكلفة المقدرة",
    totalActualCost: "إجمالي التكلفة الفعلية",
    costVariance: "فرق التكلفة",
  },

  // Help Steps
  helpSteps: {
    title: "خطوات إضافة طلب صيانة",
    step1: "الخطوة 1: اختر الأصل المراد صيانته من القائمة",
    step2: "الخطوة 2: حدد نوع الصيانة (وقائية/تصحيحية/طارئة/مجدولة)",
    step3: "الخطوة 3: اختر مستوى الأولوية حسب أهمية الصيانة",
    step4: "الخطوة 4: أدخل عنوان ووصف واضح للصيانة المطلوبة",
    step5: "الخطوة 5: حدد موعد الصيانة والتكلفة المقدرة (اختياري)",
    step6: "الخطوة 6: اختر الفني المسؤول وأضف معلومات المورد إن وجد",
    step7: "الخطوة 7: راجع جميع البيانات واضغط حفظ",
    step8: "سيتم توليد رقم تلقائي للصيانة (مثل: MNT-0001)",
  },

  // Workflow
  workflow: {
    title: "دورة عمل الصيانة",
    pending: {
      title: "قيد الانتظار",
      description: "تم إنشاء الطلب وفي انتظار البدء",
    },
    inProgress: {
      title: "قيد التنفيذ",
      description: "جاري تنفيذ الصيانة",
    },
    onHold: {
      title: "معلقة",
      description: "الصيانة معلقة مؤقتاً",
    },
    completed: {
      title: "مكتملة",
      description: "تم إنهاء الصيانة بنجاح",
    },
    cancelled: {
      title: "ملغاة",
      description: "تم إلغاء طلب الصيانة",
    },
  },

  // Dashboard
  dashboard: {
    title: "لوحة معلومات الصيانة",
    subtitle: "إحصائيات وتحليلات شاملة لطلبات الصيانة",
    lastUpdated: "آخر تحديث",
    error: "حدث خطأ أثناء تحميل الإحصائيات",
    noData: "لا توجد بيانات إحصائية متاحة",

    // KPI Cards
    totalRequests: "إجمالي الطلبات",
    pendingRequests: "الطلبات المعلقة",
    inProgressRequests: "قيد التنفيذ",
    onHoldRequests: "معلقة مؤقتاً",
    completedRequests: "الطلبات المكتملة",
    cancelledRequests: "الطلبات الملغاة",
    completionRate: "معدل الإنجاز",
    completionRateDesc: "نسبة الطلبات المكتملة",
    averageResolutionDays: "متوسط وقت الإصلاح",
    days: "أيام",
    totalCost: "إجمالي التكلفة",
    averageCostPerRequest: "متوسط التكلفة/طلب",
    highPriorityRequests: "طلبات عالية الأولوية",
    highPriorityDesc: "عالية وحرجة",
    overdueRequests: "طلبات متأخرة",
    overdueDesc: "تجاوزت الموعد المحدد",

    // Charts
    charts: {
      statusBreakdown: "التوزيع حسب الحالة",
      typeBreakdown: "التوزيع حسب النوع",
      priorityBreakdown: "التوزيع حسب الأولوية",
      assetTypeBreakdown: "التوزيع حسب نوع الأصل",
      monthlyTrend: "الاتجاه الشهري (آخر 12 شهر)",
      topAssets: "الأصول الأكثر صيانة (أعلى 10)",
      costByType: "التكلفة حسب النوع",
      resolutionTime: "متوسط وقت الإصلاح",
      newRequests: "طلبات جديدة",
      completedRequests: "طلبات مكتملة",
      activeRequests: "طلبات نشطة",
    },
  },

  // Documents
  documents: {
    title: "المستندات",
    noDocuments: "لا توجد مستندات",

    // Upload
    upload: {
      button: "رفع مستند",
      title: "رفع مستندات جديدة",
      description: "رفع المستندات المتعلقة بطلب الصيانة مثل الفواتير والصور",
      files: "الملفات",
      type: "نوع المستند",
      selectType: "اختر نوع المستند",
      name: "اسم المستند",
      namePlaceholder: "أدخل اسم المستند",
      issueDate: "تاريخ الإصدار",
      expiryDate: "تاريخ الانتهاء",
      notes: "ملاحظات",
      notesPlaceholder: "أدخل ملاحظات إضافية",
      success: "تم رفع المستندات بنجاح",
      error: "فشل رفع المستندات",
    },

    // Document Types
    types: {
      INVOICE: "فاتورة",
      PHOTO: "صورة",
      WORK_ORDER: "أمر عمل",
      REPORT: "تقرير",
      CERTIFICATE: "شهادة",
      CONTRACT: "عقد",
      WARRANTY: "ضمان",
      OTHER: "أخرى",
    },

    // Table
    table: {
      type: "النوع",
      name: "الاسم",
      issueDate: "تاريخ الإصدار",
      expiryDate: "تاريخ الانتهاء",
      status: "الحالة",
    },

    // Status
    status: {
      valid: "صالح",
      expiring: "قرب الانتهاء",
      expired: "منتهي",
      "no-expiry": "بدون تاريخ انتهاء",
    },

    // Delete
    delete: {
      title: "حذف المستند",
      description:
        "هل أنت متأكد من حذف هذا المستند؟ هذا الإجراء لا يمكن التراجع عنه.",
      success: "تم حذف المستند بنجاح",
      error: "فشل حذف المستند",
    },

    // Validation
    validation: {
      filesRequired: "يرجى اختيار ملف واحد على الأقل",
      nameRequired: "اسم المستند مطلوب",
      issueDateFuture: "تاريخ الإصدار لا يمكن أن يكون في المستقبل",
      expiryBeforeIssue: "تاريخ الانتهاء يجب أن يكون بعد تاريخ الإصدار",
    },
  },
};
