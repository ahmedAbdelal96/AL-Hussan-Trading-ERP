/**
 * Assets Module - Arabic Translations
 */

export const assetsAr = {
  // Module Title
  title: "إدارة الأصول",
  subtitle: "إدارة أصول الشركة والتعيينات والصيانة",

  // Navigation
  nav: {
    list: "قائمة الأصول",
    create: "أصل جديد",
    details: "تفاصيل الأصل",
    edit: "تعديل الأصل",
  },

  // List
  list: {
    empty: "لا توجد أصول متاحة",
  },

  // Details Page
  detailsPage: {
    title: "تفاصيل الأصل",
  },

  // Actions
  quickActions: {
    create: "إضافة أصل",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض التفاصيل",
    backToList: "العودة للقائمة",
  },

  // Asset Types
  types: {
    VEHICLE: "مركبة",
    EQUIPMENT: "معدات",
    MACHINERY: "آلات",
    TOOL: "أداة",
    COMPUTER: "حاسب آلي",
    FURNITURE: "أثاث",
    OTHER: "أخرى",
  },

  // Asset Status
  status: {
    AVAILABLE: "متاح",
    IN_USE: "قيد الاستخدام",
    UNDER_MAINTENANCE: "تحت الصيانة",
    OUT_OF_SERVICE: "خارج الخدمة",
    RETIRED: "متقاعد",
  },

  // Maintenance Status
  maintenanceStatus: {
    PENDING: "قيد الانتظار",
    IN_PROGRESS: "قيد التنفيذ",
    ON_HOLD: "متوقف مؤقتاً",
    COMPLETED: "مكتمل",
    CANCELLED: "ملغي",
  },

  // Maintenance Types
  maintenanceTypes: {
    PREVENTIVE: "وقائية",
    CORRECTIVE: "تصحيحية",
    EMERGENCY: "طارئة",
    SCHEDULED: "مجدولة",
  },

  // Maintenance Priority
  maintenancePriority: {
    LOW: "منخفضة",
    MEDIUM: "متوسطة",
    HIGH: "عالية",
    CRITICAL: "حرجة",
  },

  // Form Fields
  fields: {
    assetNumber: "رقم الأصل",
    name: "اسم الأصل",
    nameAr: "اسم إضافي",
    assetType: "نوع الأصل",
    category: "الفئة",
    manufacturer: "الشركة المصنعة",
    model: "الموديل",
    serialNumber: "الرقم التسلسلي",
    yearOfManufacture: "سنة الصنع",
    purchaseDate: "تاريخ الشراء",
    purchasePrice: "سعر الشراء",
    supplier: "المورد",
    vendor: "المورد",
    warrantyExpiry: "انتهاء الضمان",

    // Vehicle Specific
    vehicleType: "نوع المركبة",
    licensePlate: "لوحة الترخيص",
    plateNumber: "رقم اللوحة",
    chassisNumber: "رقم الشاسيه",
    engineNumber: "رقم المحرك",
    color: "اللون",
    fuelType: "نوع الوقود",
    transmissionType: "نوع ناقل الحركة",
    registrationExpiry: "انتهاء التسجيل",
    insuranceExpiry: "انتهاء التأمين",
    odometerReading: "قراءة عداد المسافة",
    lastOdometerReading: "آخر قراءة للعداد",

    // Status & Location
    status: "الحالة",
    currentStatus: "الحالة الحالية",
    currentLocation: "الموقع الحالي",
    currentOdometer: "عداد المسافة الحالي",

    // Additional
    specifications: "المواصفات الفنية",
    specificationName: "اسم المواصفة",
    specificationValue: "القيمة",
    description: "الوصف",
    descriptionAr: "الوصف بالعربية",
    notes: "ملاحظات",
    tags: "الوسوم",
  },

  // Placeholders
  placeholders: {
    searchAssets: "بحث بالاسم أو رقم الأصل أو لوحة الترخيص...",
    selectType: "اختر نوع الأصل",
    selectStatus: "اختر الحالة",
    selectCategory: "اختر الفئة",
    selectManufacturer: "اختر الشركة المصنعة",
    assetNumber: "مثال: AST-2024-001",
    name: "أدخل اسم الأصل",
    nameAr: "أدخل اسماً إضافياً (اختياري)",
    category: "مثال: معدات ثقيلة",
    manufacturer: "مثال: تويوتا",
    model: "مثال: هايلوكس 4x4",
    serialNumber: "مثال: SN123456789",
    supplier: "اسم المورد",
    licensePlate: "مثال: ABC-123",
    location: "مثال: المخزن الرئيسي",
    description: "أدخل وصف مفصل...",
    notes: "أدخل ملاحظات داخلية...",
    specifications: "أدخل المواصفات الفنية",
    specKey: "مثال: المحرك، ناقل الحركة",
    specValue: "مثال: 2.8 لتر تيربو ديزل",
  },

  // Buttons & Actions
  actions: {
    create: "إنشاء أصل",
    edit: "تعديل الأصل",
    delete: "حذف الأصل",
    confirmDelete: "تأكيد الحذف",
    save: "حفظ التغييرات",
    cancel: "إلغاء",
    back: "العودة للقائمة",
    backToList: "العودة للقائمة",
    viewDetails: "عرض التفاصيل",
    assignEmployee: "تعيين موظف",
    assignProject: "تعيين لمشروع",
    requestMaintenance: "طلب صيانة",
    addSpecification: "إضافة مواصفة",
    export: "تصدير الأصول",
    filter: "تصفية",
    clearFilters: "مسح التصفية",
    refresh: "تحديث",
    uploadDocuments: "رفع مستندات",
  },

  // Table Headers
  table: {
    assetNumber: "رقم الأصل",
    name: "الاسم",
    type: "النوع",
    status: "الحالة",
    location: "الموقع",
    category: "الفئة",
    manufacturer: "الشركة المصنعة",
    assignedTo: "معين لـ",
    assignedDate: "تاريخ التعيين",
    employee: "الموظف",
    project: "المشروع",
    scheduledDate: "التاريخ المجدول",
    cost: "التكلفة",
    priority: "الأولوية",
    title: "العنوان",
    notes: "ملاحظات",
    lastMaintenance: "آخر صيانة",
    actions: "الإجراءات",
  },

  // Filters
  filters: {
    title: "تصفية الأصول",
    search: "بحث",
    type: "نوع الأصل",
    status: "الحالة",
    category: "الفئة",
    manufacturer: "الشركة المصنعة",
    location: "الموقع",
    showDeleted: "إظهار المحذوف",
  },

  // Messages
  messages: {
    noAssets: "لا توجد أصول",
    noAssetsDesc: "ابدأ بإنشاء أول أصل",
    loadingAssets: "جاري تحميل الأصول...",
    deletedSuccessfully: "تم حذف الأصل بنجاح",
    deleteConfirmTitle: "حذف الأصل",
    deleteConfirmMessage:
      "هل أنت متأكد من حذف هذا الأصل؟ لا يمكن التراجع عن هذا الإجراء.",
    confirmDelete: "هل أنت متأكد من حذف هذا الأصل؟",
    confirmDeleteDesc: "لا يمكن التراجع عن هذا الإجراء.",
    notFound: "الأصل غير موجود",
    noEmployeeAssignments: "لا يوجد موظفين معينين",
    noProjectAssignments: "لا يوجد مشاريع معينة",
    noMaintenanceRequests: "لا توجد طلبات صيانة",
  },

  // Create/Edit Form
  form: {
    title: {
      create: "إنشاء أصل جديد",
      edit: "تعديل الأصل",
    },
    createTitle: "إنشاء أصل جديد",
    editTitle: "تعديل الأصل",
    createDescription: "إضافة أصل جديد إلى المخزون",
    editDescription: "تحديث معلومات الأصل",
    sections: {
      basicInfo: "المعلومات الأساسية",
      basic: "المعلومات الأساسية",
      manufacturer: "تفاصيل الشركة المصنعة",
      manufacturerInfo: "معلومات الشركة المصنعة",
      purchase: "معلومات الشراء",
      vehicle: "معلومات المركبة",
      vehicleInfo: "معلومات المركبة",
      status: "الحالة والموقع",
      location: "الموقع والوسوم",
      additional: "معلومات إضافية",
      additionalInfo: "الموقع والمعلومات الإضافية",
    },
    assetNumberHelp: "معرف فريد لهذا الأصل",
    assetNumberReadonly: "لا يمكن تغيير رقم الأصل",
    assetTypeReadonly: "لا يمكن تغيير نوع الأصل",
    specificationsHelp: "أضف المواصفات الفنية (اختياري)",
    tagsHelp: "وسوم مفصولة بفواصل",
    validation: {
      nameRequired: "اسم الأصل مطلوب",
      typeRequired: "نوع الأصل مطلوب",
      invalidYear: "يجب أن تكون السنة بين 1900 والسنة الحالية",
      invalidPrice: "يجب أن يكون السعر رقم موجب",
      invalidOdometer: "يجب أن يكون العداد رقم موجب",
      licensePlateRequired: "لوحة الترخيص مطلوبة للمركبات",
      bothFieldsRequired: "يرجى ملء كلا الحقلين (الاسم والقيمة)",
    },
  },

  // Create/Update Success/Error
  create: {
    success: "تم إنشاء الأصل بنجاح",
    error: "فشل إنشاء الأصل",
  },
  update: {
    success: "تم تحديث الأصل بنجاح",
    error: "فشل تحديث الأصل",
  },
  delete: {
    success: "تم حذف الأصل بنجاح",
    error: "فشل حذف الأصل",
  },

  // Details Page
  details: {
    title: "تفاصيل الأصل",
    overview: "نظرة عامة",
    specifications: "المواصفات",
    assignments: "التعيينات",
    maintenance: "سجل الصيانة",
    documents: "المستندات",
    employeeAssignments: "تعيينات الموظفين",
    employeeAssignmentsDescription: "الموظفون المعينون حالياً لهذا الأصل",
    projectAssignments: "تعيينات المشاريع",
    projectAssignmentsDescription: "المشاريع المعينة حالياً لهذا الأصل",
    maintenanceHistory: "سجل الصيانة",
    maintenanceHistoryDescription: "جميع طلبات الصيانة لهذا الأصل",

    // Tabs
    tabs: {
      overview: "نظرة عامة",
      employees: "الموظفين",
      projects: "المشاريع",
      maintenance: "الصيانة",
      documents: "المستندات",
    },

    // Info Cards
    sections: {
      basicInfo: "المعلومات الأساسية",
      location: "الموقع والوسوم",
      manufacturer: "معلومات الشركة المصنعة",
      purchase: "معلومات الشراء",
      vehicle: "معلومات المركبة",
    },
    info: {
      purchaseInfo: "معلومات الشراء",
      manufacturerInfo: "معلومات الشركة المصنعة",
      vehicleInfo: "معلومات المركبة",
      statusInfo: "الحالة الحالية",
    },

    noData: "لا توجد معلومات متاحة",
  },

  // Employee Assignment
  assign: {
    employee: {
      title: "تعيين موظف",
      subtitle: "تعيين موظف لهذا الأصل",
      selectEmployee: "اختر موظف",
      success: "تم تعيين الموظف بنجاح",
      error: "فشل تعيين الموظف",
      currentAssignments: "التعيينات الحالية",
      noAssignments: "لا يوجد موظفين معينين",
      assignedOn: "تم التعيين في",
      unassign: "إلغاء التعيين",
    },
    project: {
      title: "تعيين لمشروع",
      subtitle: "تعيين هذا الأصل لمشروع",
      selectProject: "اختر مشروع",
      success: "تم تعيين الأصل للمشروع بنجاح",
      error: "فشل تعيين الأصل للمشروع",
      currentAssignments: "التعيينات الحالية للمشاريع",
      noAssignments: "غير معين لأي مشروع",
      assignedOn: "تم التعيين في",
      unassign: "إلغاء التعيين",
    },
  },

  // Unassign
  unassign: {
    employee: {
      success: "تم إلغاء تعيين الموظف بنجاح",
      error: "فشل إلغاء تعيين الموظف",
      confirm: "إلغاء تعيين الموظف من هذا الأصل؟",
    },
    project: {
      success: "تم إلغاء تعيين الأصل من المشروع بنجاح",
      error: "فشل إلغاء تعيين الأصل من المشروع",
      confirm: "إلغاء تعيين الأصل من هذا المشروع؟",
    },
  },

  // Maintenance
  maintenance: {
    title: "إدارة الصيانة",
    create: {
      title: "إنشاء طلب صيانة",
      subtitle: "جدولة أو الإبلاغ عن صيانة لهذا الأصل",
      success: "تم إنشاء طلب الصيانة بنجاح",
      error: "فشل إنشاء طلب الصيانة",
    },
    update: {
      success: "تم تحديث طلب الصيانة بنجاح",
      error: "فشل تحديث طلب الصيانة",
    },
    delete: {
      success: "تم حذف طلب الصيانة بنجاح",
      error: "فشل حذف طلب الصيانة",
      confirm: "حذف طلب الصيانة هذا؟",
    },
    fields: {
      type: "نوع الصيانة",
      priority: "الأولوية",
      title: "العنوان",
      description: "الوصف",
      scheduledDate: "التاريخ المجدول",
      startedAt: "بدء العمل",
      completedAt: "تاريخ الإنجاز",
      estimatedCost: "التكلفة المقدرة",
      actualCost: "التكلفة الفعلية",
      vendor: "المورد/الورشة",
      vendorContact: "جهة اتصال المورد",
      assignedTo: "معين لـ",
      odometerReading: "قراءة العداد",
      workPerformed: "العمل المنجز",
      partsReplaced: "القطع المستبدلة",
      notes: "ملاحظات",
    },
    list: {
      noRequests: "لا توجد طلبات صيانة",
      noRequestsDesc: "هذا الأصل ليس لديه سجل صيانة",
    },
  },

  // Statistics (for dashboard)
  stats: {
    total: "إجمالي الأصول",
    available: "متاح",
    inUse: "قيد الاستخدام",
    maintenance: "تحت الصيانة",
    outOfService: "خارج الخدمة",
    byType: "الأصول حسب النوع",
  },

  // Export
  export: {
    title: "تصدير الأصول",
    subtitle: "تنزيل بيانات الأصول بصيغة CSV أو Excel",
    csv: "تصدير كـ CSV",
    excel: "تصدير كـ Excel",
    success: "تم تصدير الأصول بنجاح",
    error: "فشل تصدير الأصول",
  },

  // Validation Messages
  validation: {
    required: "هذا الحقل مطلوب",
    min: "القيمة الدنيا هي {{min}}",
    max: "القيمة العليا هي {{max}}",
    minLength: "الحد الأدنى {{min}} حرف",
    maxLength: "الحد الأقصى {{max}} حرف",
    email: "صيغة البريد الإلكتروني غير صحيحة",
    url: "صيغة الرابط غير صحيحة",
    date: "صيغة التاريخ غير صحيحة",
    invalidDate: "تاريخ غير صحيح",
    number: "يجب أن يكون رقم",
    positive: "يجب أن يكون رقم موجب",
    integer: "يجب أن يكون رقم صحيح",
    tooLong: "النص طويل جداً",
    nameTooLong: "الاسم طويل جداً",
    categoryTooLong: "اسم الفئة طويل جداً",
    manufacturerTooLong: "اسم الشركة المصنعة طويل جداً",
    modelTooLong: "اسم الموديل طويل جداً",
    serialNumberTooLong: "الرقم التسلسلي طويل جداً",
    plateNumberTooLong: "رقم اللوحة طويل جداً",
    chassisNumberTooLong: "رقم الشاسيه طويل جداً",
    engineNumberTooLong: "رقم المحرك طويل جداً",
    colorTooLong: "اسم اللون طويل جداً",
    fuelTypeTooLong: "نوع الوقود طويل جداً",
    transmissionTypeTooLong: "نوع ناقل الحركة طويل جداً",
    locationTooLong: "اسم الموقع طويل جداً",
    supplierTooLong: "اسم المورد طويل جداً",
    vehicleTypeTooLong: "نوع المركبة طويل جداً",
    pricePositive: "السعر يجب أن يكون رقم موجب",
    odometerPositive: "قراءة العداد يجب أن تكون رقم موجب",
    bothFieldsRequired: "يرجى ملء كلا الحقلين",
  },

  // Common
  common: {
    loading: "جاري التحميل...",
    error: "حدث خطأ",
    success: "نجح",
    confirm: "تأكيد",
    yes: "نعم",
    no: "لا",
    optional: "اختياري",
    required: "مطلوب",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "تاريخ التحديث",
    createdBy: "أنشئ بواسطة",
    updatedBy: "حدث بواسطة",
  },

  // Dashboard Statistics
  dashboard: {
    title: "لوحة معلومات الأصول",
    subtitle: "إحصائيات شاملة عن أصول الشركة",
    lastUpdated: "آخر تحديث",
    error: "خطأ في تحميل البيانات",
    noData: "لا توجد بيانات متاحة",

    // KPI Metrics
    totalAssets: "إجمالي الأصول",
    totalValue: "القيمة الإجمالية",
    availableAssets: "أصول متاحة",
    inUseAssets: "أصول قيد الاستخدام",
    underMaintenance: "تحت الصيانة",
    outOfService: "خارج الخدمة",
    utilizationRate: "معدل الاستخدام",
    utilizationDesc: "نسبة الأصول المستخدمة",
    newAssets: "أصول جديدة",
    retiredAssets: "أصول متقاعدة",
    last30Days: "آخر 30 يوماً",
    averageAge: "متوسط العمر",
    years: "سنة",
    expiredWarranties: "ضمانات منتهية",
    needsAttention: "تحتاج متابعة",
    maintenanceRequests: "طلبات الصيانة",
    totalRequests: "إجمالي الطلبات",
    averageValue: "متوسط القيمة",
    highValueAssets: "أصول عالية القيمة",
    over1M: "أكثر من 1 مليون",

    // Age Groups
    ageGroups: {
      "0-1": "أقل من سنة",
      "1-3": "1-3 سنوات",
      "3-5": "3-5 سنوات",
      "5-10": "5-10 سنوات",
      "10+": "أكثر من 10 سنوات",
    },

    // Value Ranges
    valueRanges: {
      "0-50K": "0 - 50,000",
      "50K-100K": "50,000 - 100,000",
      "100K-500K": "100,000 - 500,000",
      "500K-1M": "500,000 - 1,000,000",
      "1M+": "أكثر من 1,000,000",
    },

    // Charts
    charts: {
      byCategory: "حسب الفئة",
      byStatus: "حسب الحالة",
      valueByCategory: "القيمة حسب الفئة",
      assetType: "توزيع الأصول حسب النوع",
      statusBreakdown: "توزيع الأصول حسب الحالة",
      categoryDistribution: "توزيع الأصول حسب الفئة (أعلى 8)",
      locationDistribution: "توزيع الأصول حسب الموقع (أعلى 10)",
      ageGroupDistribution: "توزيع الأصول حسب العمر",
      valueRangeDistribution: "توزيع الأصول حسب القيمة",
      manufacturerDistribution: "توزيع الأصول حسب الجهة المصنعة (أعلى 10)",
      monthlyTrend: "اتجاه الحصول على الأصول الشهري (آخر 12 شهر)",
      acquired: "تم الحصول عليها",
      retired: "تم التقاعد",
      total: "الإجمالي",
    },

    // Categories
    uncategorized: "غير مصنف",
    unassigned: "غير معين",
    unknown: "غير معروف",
  },

  metrics: {
    totalAssets: "إجمالي الأصول",
    activeAssets: "الأصول النشطة",
    underMaintenance: "تحت الصيانة",
    totalValue: "القيمة الإجمالية",
    netBookValue: "صافي القيمة الدفترية",
    depreciation: "الإهلاك",
    depreciationRate: "معدل الإهلاك",
    utilizationRate: "معدل الاستخدام",
    maintenanceCost: "تكلفة الصيانة",
    availability: "التوافر",
  },

  documents: {
    title: "المستندات",
    count: "{{count}} مستند",
    empty: "لا توجد مستندات",
    emptyHint: "انقر على زر الرفع لإضافة مستندات",
    type: "النوع",
    name: "الاسم",
    issueDate: "تاريخ الإصدار",
    expiryDate: "تاريخ الانتهاء",
    status: "الحالة",
    notes: "ملاحظات",
    files: "الملفات",
    selectType: "اختر النوع",
    namePlaceholder: "أدخل اسم المستند",
    notesPlaceholder: "ملاحظات إضافية...",

    types: {
      CONTRACT: "عقد",
      INVOICE: "فاتورة",
      WARRANTY: "ضمان",
      INSURANCE: "تأمين",
      CERTIFICATE: "شهادة",
      OTHER: "أخرى",
    },

    statusLabels: {
      valid: "ساري",
      expiring: "ينتهي قريباً",
      expired: "منتهي",
      noExpiry: "بدون انتهاء",
    },

    upload: {
      title: "رفع المستندات",
      description: "أضف مستندات لهذا الأصل",
      success: "تم رفع المستندات بنجاح",
      error: "فشل رفع المستندات",
    },

    delete: {
      title: "حذف المستند؟",
      description: "لا يمكن التراجع عن هذا الإجراء.",
      success: "تم حذف المستند بنجاح",
      error: "فشل حذف المستند",
    },

    validation: {
      filesRequired: "الرجاء اختيار ملف واحد على الأقل",
      typeRequired: "نوع المستند مطلوب",
      nameRequired: "اسم المستند مطلوب",
      issueDateFuture: "تاريخ الإصدار لا يمكن أن يكون في المستقبل",
      expiryBeforeIssue: "تاريخ الانتهاء يجب أن يكون بعد تاريخ الإصدار",
    },
  },
};
