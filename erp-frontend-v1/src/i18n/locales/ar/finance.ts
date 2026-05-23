/**
 * Finance Module - Arabic Translations
 */

export const financeAr = {
  // Module Title
  title: "الإدارة المالية",
  description: "إدارة التكاليف والمصروفات المالية",

  // ============================================================================
  // COST CATEGORIES
  // ============================================================================
  categories: {
    title: "فئات التكاليف",
    description: "إدارة تصنيفات التكاليف بشكل هرمي",
    empty: "لا توجد فئات تكاليف",
    emptyDescription: "ابدأ بإضافة فئة جديدة لتصنيف التكاليف",

    // List
    list: {
      empty: "لا توجد فئات",
    },

    // Tree View
    tree: {
      root: "الفئات الرئيسية",
      expand: "توسيع",
      collapse: "طي",
      addChild: "إضافة فئة فرعية",
      moveUp: "نقل لأعلى",
      moveDown: "نقل لأسفل",
    },

    // Fields
    fields: {
      name: "اسم الفئة",
      description: "الوصف",
      parent: "الفئة الأب",
      parentCategory: "الفئة الرئيسية",
      isActive: "نشط",
      status: "الحالة",
      active: "نشط",
      inactive: "غير نشط",
      noParent: "فئة رئيسية",
    },

    // Actions
    actions: {
      create: "إضافة فئة",
      createChild: "إضافة فئة فرعية",
      edit: "تعديل الفئة",
      delete: "حذف الفئة",
      activate: "تفعيل",
      deactivate: "تعطيل",
      viewChildren: "عرض الفئات الفرعية",
      selectParent: "اختر الفئة الرئيسية",
    },

    // Form
    form: {
      createTitle: "إضافة فئة تكاليف جديدة",
      createDescription: "قم بإنشاء فئة جديدة لتنظيم التكاليف بشكل أفضل",
      editTitle: "تعديل فئة التكاليف",
      editDescription: "قم بتحديث معلومات فئة التكاليف",
      namePlaceholder: "مثال: مواد, رواتب",
      descriptionPlaceholder: "وصف مختصر للفئة",
      descriptionHint: "وصف مختصر للفئة (اختياري)",
      selectParentPlaceholder: "اختر الفئة الأب (اختياري)",
      topLevelHint: "فئة رئيسية",
      parentHint: "اختر الفئة الأب لإنشاء فئة فرعية",
      activeHint: "الفئات النشطة يمكن اختيارها عند تسجيل التكاليف",
    },

    // Validation
    validation: {
      nameRequired: "اسم الفئة مطلوب",
      nameMax: "اسم الفئة يجب أن لا يتجاوز 100 حرف",
      parentInvalid: "لا يمكن اختيار الفئة نفسها كفئة أب",
    },

    // Messages
    create: {
      success: 'تم إنشاء الفئة "{{name}}" بنجاح',
      error: "حدث خطأ أثناء إنشاء الفئة",
    },
    update: {
      success: 'تم تحديث الفئة "{{name}}" بنجاح',
      error: "حدث خطأ أثناء تحديث الفئة",
    },
    delete: {
      success: "تم حذف الفئة بنجاح",
      error: "حدث خطأ أثناء حذف الفئة",
      confirm: "هل أنت متأكد من حذف هذه الفئة؟",
      confirmMessage:
        "لا يمكن التراجع عن هذا الإجراء. تأكد من عدم وجود تكاليف مرتبطة بهذه الفئة.",
      hasChildren:
        "لا يمكن حذف فئة تحتوي على فئات فرعية. قم بحذف أو نقل الفئات الفرعية أولاً.",
      hasCosts:
        "لا يمكن حذف فئة مرتبطة بتكاليف. قم بإزالة جميع التكاليف من هذه الفئة أولاً.",
    },


    // Help Steps
    helpSteps: {
      step1: "الخطوة 1: أدخل اسم الفئة بالعربي والإنجليزي",
      step2: "الخطوة 2: اختر الفئة الأب إن كانت فئة فرعية",
      step3: "الخطوة 3: أضف وصف مختصر (اختياري)",
      step4: "الخطوة 4: اضغط حفظ لإنشاء الفئة",
    },
    example: {
      title: "مثال على الهيكل الهرمي",
      subtitle: "الترتيب الصحيح للفئات من العام إلى الخاص",
      level0: "Level 0: مواد البناء",
      level0Label: "(فئة رئيسية)",
      level1: "Level 1: إسمنت",
      level2: "Level 2: إسمنت مقاوم",
      level3: "Level 3: إسمنت مقاوم 350",
      tipTitle: "نصيحة مهمة:",
      tipBody:
        "كلما كان التصنيف أبسط، كان أسهل في الاستخدام. حاول استخدام 3-4 مستويات كحد أقصى.",
    },
  },

  // ============================================================================
  // COSTS
  // ============================================================================
  costs: {
    title: "التكاليف",
    description: "تسجيل وإدارة التكاليف",
    empty: "لا توجد تكاليف مسجلة",
    emptyDescription: "ابدأ بتسجيل تكلفة جديدة",

    // Table Headers
    table: {
      title: "قائمة التكاليف",
      subtitle: "عرض وإدارة جميع التكاليف",
      date: "التاريخ",
      transactionDate: "تاريخ المعاملة",
      project: "المشروع",
      type: "نوع التكلفة",
      costType: "نوع التكلفة",
      category: "الفئة",
      description: "الوصف",
      amount: "المبلغ",
      amountBeforeTax: "المبلغ قبل الضريبة",
      taxRate: "نسبة الضريبة (%)",
      taxAmount: "قيمة الضريبة",
      totalWithTax: "الإجمالي (شامل الضريبة)",
      currency: "العملة",
      invoice: "رقم الفاتورة",
      status: "الحالة",
      paymentStatus: "حالة الدفع",
      createdBy: "المنشئ",
      actions: "الإجراءات",
    },

    // Fields
    fields: {
      project: "المشروع",
      selectProject: "اختر المشروع",
      costType: "نوع التكلفة",
      accountType: "نوع الحساب",
      selectCostType: "اختر نوع التكلفة",
      category: "فئة التكلفة",
      selectCategory: "اختر الفئة (اختياري)",
      amount: "المبلغ",
      currency: "العملة",
      transactionDate: "تاريخ المعاملة",
      description: "الوصف",
      descriptionAr: "الوصف بالعربية",
      descriptionPlaceholder: "وصف تفصيلي للتكلفة",
      invoiceNumber: "رقم الفاتورة",
      invoiceNumberPlaceholder: "INV-2026-001",

      // Payment Details
      paymentMethod: "طريقة الدفع",
      selectPaymentMethod: "اختر طريقة الدفع",
      paymentReference: "مرجع الدفع",
      paymentReferencePlaceholder: "رقم التحويل أو الشيك",
      paidDate: "تاريخ الدفع",

      // Polymorphic Reference
      referenceType: "مرتبط بـ",
      selectReferenceType: "اختر النوع (اختياري)",
      referenceId: "رقم المرجع",
      reference: "المرجع",
      selectReference: "اختر المرجع",

      notes: "ملاحظات",
      notesPlaceholder: "ملاحظات إضافية (اختياري)",

      // Approval
      approvalNotes: "ملاحظات الموافقة",
      approvalNotesPlaceholder: "ملاحظات الموافقة (اختياري)",
      rejectionReason: "سبب الرفض",
      rejectionReasonPlaceholder: "أدخل سبب رفض التكلفة",
    },

    // Cost Types
    costTypes: {
      MAINTENANCE: "صيانة",
      PURCHASE: "مشتريات",
      SALARY: "رواتب",
      ALLOWANCE: "بدلات",
      FUEL: "وقود",
      MATERIAL: "مواد",
      EQUIPMENT_RENTAL: "إيجار معدات",
      SUBCONTRACTOR: "مقاول فرعي",
      UTILITY: "مرافق",
      TRANSPORTATION: "نقل",
      INSURANCE: "تأمين",
      TAX: "ضرائب",
      OTHER: "أخرى",
      // Numeric indices (for backend compatibility)
      "0": "صيانة",
      "1": "مشتريات",
      "2": "رواتب",
      "3": "بدلات",
      "4": "وقود",
      "5": "مواد",
      "6": "إيجار معدات",
      "7": "مقاول فرعي",
      "8": "مرافق",
      "9": "نقل",
      "10": "تأمين",
      "11": "ضرائب",
      "12": "أخرى",
    },

    // Payment Status
    paymentStatus: {
      PENDING: "قيد الانتظار",
      APPROVED: "معتمدة",
      PAID: "مدفوعة",
      REJECTED: "مرفوضة",
      PARTIALLY_PAID: "مدفوعة جزئياً",
      OVERDUE: "متأخرة",
    },

    // Payment Methods
    paymentMethods: {
      CASH: "نقداً",
      BANK_TRANSFER: "تحويل بنكي",
      CHECK: "شيك",
      CARD: "بطاقة",
      WIRE_TRANSFER: "حوالة",
    },

    // Reference Types
    referenceTypes: {
      Employee: "موظف",
      Asset: "أصل",
      Vendor: "مورد",
      Site: "موقع",
    },

    // Filters
    filters: {
      title: "فلترة التكاليف",
      advanced: "فلاتر متقدمة",
      search: "بحث...",
      searchPlaceholder: "ابحث بالوصف أو رقم الفاتورة أو المبلغ",
      project: "المشروع",
      allProjects: "جميع المشاريع",
      costType: "نوع التكلفة",
      allTypes: "جميع الأنواع",
      allCostTypes: "جميع الأنواع",
      category: "الفئة",
      allCategories: "جميع الفئات",
      paymentStatus: "حالة الدفع",
      allStatuses: "جميع الحالات",
      dateRange: "نطاق التاريخ",
      dateFrom: "من تاريخ",
      fromDate: "من تاريخ",
      dateTo: "إلى تاريخ",
      toDate: "إلى تاريخ",
      amountRange: "نطاق المبلغ",
      minAmount: "أقل مبلغ",
      maxAmount: "أعلى مبلغ",
      sortBy: "ترتيب حسب",
      sortByDate: "التاريخ",
      sortByAmount: "المبلغ",
      sortByCreated: "تاريخ الإنشاء",
      sortOrder: "نوع الترتيب",
      sortAsc: "تصاعدي",
      sortDesc: "تنازلي",
      reset: "إعادة تعيين",
      apply: "تطبيق",
      activeFilters: "الفلاتر النشطة",
    },

    // Actions
    actions: {
      create: "تسجيل تكلفة",
      edit: "تعديل التكلفة",
      delete: "حذف التكلفة",
      view: "عرض التفاصيل",
      approve: "موافقة",
      reject: "رفض",
      markAsPaid: "تعليم كمدفوع",
      export: "تصدير",
      exportExcel: "تصدير Excel",
      exportPDF: "تصدير PDF",
      reviewApprovals: "مراجعة الموافقات",
      approvalPipeline: "مسار الموافقات",
    },

    approval: {
      title: "الموافقة على التكلفة",
      description: "راجع تفاصيل التكلفة بعناية قبل الموافقة",
      notesLabel: "ملاحظات الموافقة (اختياري)",
      notesPlaceholder: "أضف أي ملاحظات حول هذه الموافقة...",
      confirm: "تأكيد الموافقة",
      success: "تم الموافقة على التكلفة بنجاح",
      error: "فشل في الموافقة على التكلفة",
      onlyPendingError: "يمكن الموافقة على التكاليف في انتظار الموافقة فقط",
    },

    rejection: {
      title: "رفض التكلفة",
      description: "يرجى تقديم سبب واضح لرفض هذه التكلفة",
      reasonLabel: "سبب الرفض",
      reasonPlaceholder: "اشرح سبب رفض هذه التكلفة (10 أحرف كحد أدنى)...",
      confirm: "تأكيد الرفض",
      warning: "سيتم تعليم هذه التكلفة كمرفوضة ولن يمكن دفعها.",
      success: "تم رفض التكلفة بنجاح",
      error: "فشل في رفض التكلفة",
      onlyPendingError: "يمكن رفض التكاليف في انتظار الموافقة فقط",
    },

    // Stats
    stats: {
      totalCosts: "إجمالي التكاليف",
      pendingApproval: "التكاليف المعلقة",
      approvedCosts: "التكاليف المعتمدة",
      paidCosts: "التكاليف المدفوعة",
      items: "عنصر",
      transactions: "معاملة",
      count: "عدد",
      vsLastMonth: "مقارنة بالشهر الماضي",
      stable: "مستقر",
    },

    // Export
    export: {
      export: "تصدير",
      exporting: "جاري التصدير...",
      selectFormat: "اختر صيغة التصدير",
      excel: "ملف Excel",
      pdf: "ملف PDF",
      csv: "ملف CSV",
      successExcel: "تم تصدير البيانات إلى Excel بنجاح",
      successPdf: "تم تصدير البيانات إلى PDF بنجاح",
      successCsv: "تم تصدير البيانات إلى CSV بنجاح",
      error: "حدث خطأ أثناء التصدير",
      sheetName: "تكاليف المشروع",
      pdfTitle: "تقرير تكاليف المشروع",
      exportDate: "تاريخ التصدير",
      page: "صفحة",
      of: "من",
    },

    // Form
    form: {
      createTitle: "تسجيل تكلفة جديدة",
      createDescription: "إضافة تكلفة جديدة بكافة التفاصيل",
      editTitle: "تعديل التكلفة",
      editDescription: "تحديث معلومات التكلفة",

      costTypeTitle: "نوع التكلفة",
      costTypeDescription: "اختر كيف سيتم تصنيف هذه التكلفة",
      singleProject: "تكلفة مشروع واحد",
      singleProjectDesc: "تكلفة مخصصة لمشروع واحد",
      allocatedCost: "تكلفة موزعة",
      allocatedCostDesc: "توزيع على مشاريع متعددة",
      generalExpense: "مصروفات عامة",
      generalExpenseDesc: "غير مرتبطة بأي مشروع محدد",
      switchTypeWarning:
        "تغيير نوع التكلفة سيمسح البيانات الحالية. هل تريد المتابعة؟",
      cannotChangeType: "لا يمكن تغيير نوع التكلفة بعد الإنشاء",

      projectSelection: "اختيار المشروع",
      selectProject: "اختر المشروع",
      searchProject: "البحث عن مشروع...",
      noProjects: "لا توجد مشاريع",
      generalExpenseInfo: "هذه المصروفات لن تكون مرتبطة بأي مشروع محدد",

      allocationTitle: "توزيع المشاريع",
      allocationDescription: "توزيع التكلفة على مشاريع متعددة (حد أدنى 2)",
      allocationMode: "طريقة التوزيع",
      byPercentage: "بالنسبة المئوية (%)",
      byAmount: "بالمبلغ",
      percentageHelp: "يجب أن يساوي المجموع 100%",
      allocationAmountHelp: "مجموع المبالغ سيساوي التكلفة الإجمالية",
      projectAllocations: "توزيعات المشاريع",
      totalPercentage: "إجمالي النسبة المئوية",
      totalAllocated: "المبلغ الموزع",
      totalCost: "التكلفة الإجمالية",
      percentageAllocated: "الموزع",
      remaining: "المتبقي",
      excess: "الزيادة",
      totalAmountHelp: "هذا هو المبلغ الإجمالي المراد توزيعه",
      addProjectsToStart: "أضف على الأقل مشروعين للمتابعة",
      addProject: "إضافة مشروع",
      notes: "ملاحظات",

      costDetails: "تفاصيل التكلفة",
      selectCostType: "اختر نوع التكلفة",
      selectAccountType: "اختر نوع الحساب",
      searchAccountType: "ابحث في أنواع الحساب...",
      accountTypeHelp: "اختر البند المحاسبي المناسب من شجرة الفئات",
      selectCategory: "اختر الفئة الفرعية",
      selectCostTypeFirst: "اختر نوع التكلفة أولاً",
      noSubCategories: "لا توجد فئات فرعية",
      costTypeFromCategories: "اختر التصنيف الرئيسي للتكلفة",
      usingRootCategory: "يتم استخدام الفئة الرئيسية مباشرة",
      noCategory: "بدون فئة",
      categoryOptional: "اختياري - لتتبع أكثر تفصيلاً",
      descriptionPlaceholder: "وصف تفصيلي للتكلفة...",
      descriptionHelp: "قدم تفاصيل واضحة للرجوع إليها مستقبلاً",
      amountHelp: "أدخل مبلغ التكلفة بالريال السعودي",
      taxRateHelp: "اختياري. أدخل نسبة الضريبة المضمنة في هذا الإجمالي.",

      additionalDetails: "تفاصيل إضافية",
      additionalDetailsDesc: "معلومات الدفع والمرجع الاختيارية",
      selectPaymentMethod: "اختر طريقة الدفع",
      paymentReferencePlaceholder: "رقم المعاملة أو الشيك",
      selectReferenceType: "اختر نوع المرجع",
      referenceTypeHelp: "اربط هذه التكلفة بموظف أو أصل أو مورد",
      referenceIdPlaceholder: "UUID",
      referenceIdHelp: "اختر نوع المرجع أولاً",

      selectType: "اختر نوع التكلفة",
      selectTypeFirst: "اختر نوع التكلفة أولاً",
      noSubcategories: "لا توجد فئات فرعية لهذا النوع",
      selectRefType: "اختر نوع الربط",

      categoryHelp: "يمكن تحديد فئة فرعية لتصنيف أفضل (اختياري)",
      paymentRefPlaceholder: "رقم المرجع أو التحويل",
      paymentRefHelp: "رقم الشيك، التحويل، أو المرجع",
      refTypeHelp: "ربط التكلفة بموظف، أصل، أو مورد",
      refIdPlaceholder: "معرف الكيان المرتبط",
      descriptionArPlaceholder: "الوصف بالعربية",
      notesPlaceholder: "ملاحظات إضافية",
      notesHelp: "أي ملاحظات أو معلومات إضافية",

      sections: {
        basic: "معلومات أساسية",
        transaction: "تفاصيل المعاملة",
        payment: "معلومات الدفع",
        reference: "الربط بكيان آخر",
        additional: "معلومات إضافية",
      },
    },

    // Validation
    validation: {
      projectRequired: "المشروع مطلوب",
      costTypeRequired: "نوع التكلفة مطلوب",
      amountRequired: "المبلغ مطلوب",
      amountMin: "المبلغ يجب أن يكون أكبر من أو يساوي 0",
      amountInvalid: "المبلغ غير صالح",
      currencyMax: "رمز العملة يجب أن لا يتجاوز 3 أحرف",
      transactionDateRequired: "تاريخ المعاملة مطلوب",
      descriptionRequired: "الوصف مطلوب",
      invoiceNumberMax: "رقم الفاتورة يجب أن لا يتجاوز 100 حرف",
      paymentMethodMax: "طريقة الدفع يجب أن لا تتجاوز 50 حرف",
      rejectionReasonRequired: "سبب الرفض مطلوب",
      referenceTypeRequired: "نوع المرجع مطلوب عند تحديد مرجع",
      referenceRequired: "المرجع مطلوب عند تحديد نوع المرجع",
    },

    // Messages
    create: {
      success: "تم تسجيل التكلفة بنجاح",
      error: "حدث خطأ أثناء تسجيل التكلفة",
    },
    update: {
      success: "تم تحديث التكلفة بنجاح",
      error: "حدث خطأ أثناء تحديث التكلفة",
      cannotEdit: "لا يمكن تعديل تكلفة معتمدة أو مدفوعة",
    },
    delete: {
      title: "حذف التكلفة",
      description:
        "هل أنت متأكد من حذف هذه التكلفة؟ لا يمكن التراجع عن هذا الإجراء.",
      success: "تم حذف التكلفة بنجاح",
      error: "حدث خطأ أثناء حذف التكلفة",
      confirm: "هل أنت متأكد من حذف هذه التكلفة؟",
      confirmMessage: "لا يمكن التراجع عن هذا الإجراء.",
      cannotDelete: "لا يمكن حذف تكلفة مدفوعة",
    },
    approve: {
      success: "تم اعتماد التكلفة بنجاح",
      error: "حدث خطأ أثناء اعتماد التكلفة",
      confirm: "هل أنت متأكد من اعتماد هذه التكلفة؟",
      cannotApprove: "هذه التكلفة معتمدة بالفعل أو مرفوضة",
    },
    reject: {
      success: "تم رفض التكلفة",
      error: "حدث خطأ أثناء رفض التكلفة",
      confirm: "هل أنت متأكد من رفض هذه التكلفة؟",
    },

    // Details Page
    details: {
      title: "تفاصيل التكلفة",
      error: "حدث خطأ في تحميل التفاصيل",
      notFound: "التكلفة غير موجودة",

      sections: {
        costInfo: "معلومات التكلفة",
        transactionDetails: "تفاصيل المعاملة",
        paymentInfo: "معلومات الدفع",
        approvalWorkflow: "سير العمل",
        linkedReference: "الربط",
        notes: "ملاحظات",
        audit: "سجل التغييرات",
      },

      labels: {
        project: "المشروع",
        costType: "نوع التكلفة",
        category: "الفئة",
        noCategory: "بدون فئة",
        amount: "المبلغ",
        transactionDate: "تاريخ المعاملة",
        description: "الوصف",
        invoiceNumber: "رقم الفاتورة",
        noInvoice: "بدون فاتورة",
        paymentStatus: "حالة الدفع",
        paymentMethod: "طريقة الدفع",
        paymentReference: "مرجع الدفع",
        paidDate: "تاريخ الدفع",
        notPaidYet: "لم يتم الدفع بعد",
        approvedBy: "معتمد بواسطة",
        approvedAt: "تاريخ الاعتماد",
        notApprovedYet: "قيد انتظار الموافقة",
        rejectedReason: "سبب الرفض",
        referenceType: "نوع المرجع",
        reference: "المرجع",
        noReference: "بدون ربط",
        notes: "ملاحظات",
        noNotes: "لا توجد ملاحظات",
        createdBy: "المنشئ",
        createdAt: "تاريخ الإنشاء",
        updatedAt: "آخر تحديث",
      },
    },


    allocations: {
      title: "توزيع التكلفة",
      description: "توزيع التكلفة على مشاريع متعددة",
      empty: "لا توجد توزيعات",
      allocated: "موزعة",
      notAllocated: "غير موزعة",

      fields: {
        project: "المشروع",
        amount: "المبلغ",
        percentage: "النسبة المئوية",
        notes: "ملاحظات",
        totalAmount: "المبلغ الإجمالي",
        remainingAmount: "المبلغ المتبقي",
        allocatedAmount: "المبلغ الموزع",
      },

      mode: {
        label: "طريقة التوزيع",
        amountSar: "مبلغ (ر.س)",
        percentagePct: "نسبة مئوية (%)",
        switchToAmount: "تبديل إلى مبلغ",
        switchToPercentage: "تبديل إلى نسبة",
      },

      actions: {
        convert: "تحويل إلى موزعة",
        addAllocation: "إضافة توزيع",
        editAllocation: "تعديل توزيع",
        deleteAllocation: "حذف توزيع",
        viewAllocations: "عرض التوزيعات",
        autoFill: "تعبئة تلقائية",
        saveAllocations: "حفظ التوزيعات",
      },

      create: {
        title: "إضافة توزيع",
        success: "تم إنشاء التوزيع بنجاح",
        error: "فشل في إنشاء التوزيع",
      },

      update: {
        title: "تحديث التوزيع",
        success: "تم تحديث التوزيع بنجاح",
        error: "فشل في تحديث التوزيع",
      },

      delete: {
        title: "حذف التوزيع",
        confirmation: "هل أنت متأكد من حذف هذا التوزيع؟",
        success: "تم حذف التوزيع بنجاح",
        error: "فشل في حذف التوزيع",
      },

      convert: {
        title: "تحويل إلى تكلفة موزعة",
        description: "توزيع هذه التكلفة على مشاريع متعددة",
        success: "تم تحويل التكلفة إلى موزعة بنجاح",
        error: "فشل في تحويل التكلفة",
        warning: "لا يمكن التراجع عن هذا الإجراء",
      },

      validation: {
        totalMismatch: "يجب أن يساوي مجموع التوزيعات مبلغ التكلفة",
        invalidAmount: "يجب أن يكون المبلغ أكبر من 0",
        duplicateProject: "المشروع موزع بالفعل",
        noAllocations: "يجب إضافة توزيع واحد على الأقل",
        minProjects: "الحد الأدنى لعدد المشاريع هو 2",
        duplicateDetected: "لا يمكن تكرار نفس المشروع",
        unselectedProject: "يجب اختيار مشروع لكل صف",
        nonPositiveValue: "جميع القيم يجب أن تكون أكبر من صفر",
        sumPercentage: "مجموع النسب يجب أن يساوي 100% (الحالي: {{current}}%)",
        sumAmount:
          "مجموع المبالغ يجب أن يساوي {{expected}} {{currency}} (الحالي: {{current}})",
      },
    },

    // Help Steps
    helpSteps: {
      step1: "الخطوة 1: اختر المشروع المراد تسجيل التكلفة له",
      step2: "الخطوة 2: حدد نوع التكلفة والفئة",
      step3: "الخطوة 3: أدخل المبلغ وتاريخ المعاملة",
      step4: "الخطوة 4: أضف وصف تفصيلي ورقم الفاتورة",
      step5: "الخطوة 5: (اختياري) أضف تفاصيل الدفع إذا تم الدفع",
      step6: "الخطوة 6: (اختياري) اربط التكلفة بموظف أو أصل",
      step7: "الخطوة 7: راجع البيانات واضغط حفظ",
    },
  },

  // ============================================================================
  // PROJECT COST SUMMARY
  // ============================================================================
  summary: {
    title: "ملخص تكاليف المشروع",
    description: "إحصائيات وتحليلات تكاليف المشروع",
    loading: "جاري تحميل الإحصائيات...",
    error: "حدث خطأ في تحميل الملخص",
    exportReport: "تصدير التقرير",

    // Stats Cards
    stats: {
      total: "إجمالي التكاليف",
      transactions: "معاملة",
      pending: "قيد الانتظار",
      approved: "معتمدة",
      paid: "مدفوعة",
      rejected: "مرفوضة",
      partiallyPaid: "مدفوعة جزئياً",
      overdue: "متأخرة",
      count: "عدد",
    },

    // Tabs
    tabs: {
      overview: "نظرة عامة",
      trends: "الاتجاهات",
      categories: "التصنيفات",
    },

    // Charts
    charts: {
      costTypeTitle: "توزيع التكاليف حسب النوع",
      costTypeDescription: "التوزيع النسبي للتكاليف حسب النوع",
      categoryTitle: "أعلى 5 فئات",
      categoryDescription: "الفئات الأكثر تكلفة",
      monthlyTrendTitle: "الاتجاه الشهري",
      monthlyTrendDescription: "تطور التكاليف خلال الأشهر",
      topCategoriesTitle: "أعلى 10 فئات",
      topCategoriesDescription: "الفئات الأكثر تكلفة بالتفصيل",
      amount: "المبلغ",
    },

    // Breakdown
    breakdown: {
      byCostType: "توزيع التكاليف حسب النوع",
      byCategory: "توزيع التكاليف حسب الفئة",
      noData: "لا توجد بيانات للعرض",
      percentage: "{{value}}%",
      amount: "{{value}} {{currency}}",
    },

    // Trends
    trends: {
      monthly: "التكاليف الشهرية",
      last12Months: "آخر 12 شهر",
      month: "الشهر",
      amount: "المبلغ",
      count: "العدد",
    },

    // Recent Costs
    recent: {
      title: "أحدث التكاليف",
      viewAll: "عرض الكل",
      empty: "لا توجد تكاليف حديثة",
    },
  },

  // ============================================================================
  // BUDGET TRACKING
  // ============================================================================
  budget: {
    title: "تتبع الميزانية",
    totalBudget: "الميزانية",
    totalSpent: "المصروف",
    remaining: "المتبقي",
    utilization: "نسبة الاستخدام",
    noBudget: "لم يتم تحديد ميزانية لهذا المشروع",
    overBudget: "تجاوز الميزانية!",
  },

  // ============================================================================
  // COMMON
  // ============================================================================
  common: {
    loading: "جاري التحميل...",
    saving: "جاري الحفظ...",
    save: "حفظ",
    cancel: "إلغاء",
    create: "إنشاء",
    back: "رجوع",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض",
    none: "لا يوجد",
    actions: "الإجراءات",
    search: "بحث",
    filter: "فلترة",
    export: "تصدير",
    import: "استيراد",
    refresh: "تحديث",
    selectAll: "تحديد الكل",
    clearSelection: "إلغاء التحديد",
    selected: "محدد: {{count}}",
    total: "الإجمالي",
    currency: "ر.س", // SAR
    date: "التاريخ",
    status: "الحالة",
    active: "نشط",
    inactive: "غير نشط",
    yes: "نعم",
    no: "لا",
    optional: "(اختياري)",
    required: "(مطلوب)",
    noData: "لا توجد بيانات",
    error: "حدث خطأ",
    success: "تم بنجاح",
    confirm: "تأكيد",
    confirmAction: "هل أنت متأكد؟",
    cannotUndo: "لا يمكن التراجع عن هذا الإجراء",
  },

  // Permissions (for reference)
  permissions: {
    read: "عرض المالية",
    write: "إضافة/تعديل المالية",
    delete: "حذف المالية",
    approve: "الموافقة على التكاليف",
  },

  // ============================================================================
  // DASHBOARD & ANALYTICS
  // ============================================================================
  dashboard: {
    title: "لوحة المالية",
    description: "تحليلات وإحصائيات مالية شاملة",

    // KPI Cards
    kpis: {
      totalCosts: "إجمالي التكاليف",
      pendingAmount: "المبالغ المعلقة",
      approvedAmount: "المبالغ المعتمدة",
      paidAmount: "المبالغ المدفوعة",
      rejectedAmount: "المبالغ المرفوضة",
      totalEntries: "إجمالي السجلات",
      recentCosts: "تكاليف حديثة",
      averageCost: "متوسط التكلفة",
      growthRate: "معدل النمو",
      vsLastMonth: "مقارنة بالشهر السابق",
      perEntry: "لكل سجل",
      addedInLast30Days: "أضيفت في آخر 30 يوم",
      vsLastPeriod: "مقارنة بالفترة السابقة",
    },

    // Charts
    charts: {
      statusBreakdown: {
        title: "التكاليف حسب حالة الدفع",
        description: "توزيع التكاليف عبر حالات الدفع المختلفة",
      },
      costTypeBreakdown: {
        title: "التكاليف حسب النوع",
        description: "توزيع التكاليف حسب نوع الفئة",
      },
      monthlyTrend: {
        title: "الاتجاه الشهري للتكاليف",
        description: "اتجاهات التكاليف خلال الـ 6 أشهر الماضية",
      },
      categoryBreakdown: {
        title: "أعلى 5 فئات تكاليف",
        description: "الفئات الأعلى إنفاقاً",
      },
      topProjects: {
        title: "أعلى المشاريع من حيث التكلفة",
        description: "المشاريع ذات أعلى تكاليف إجمالية",
      },
    },

    allocations: {
      title: "توزيع التكلفة",
      description: "توزيع التكلفة على مشاريع متعددة",
      empty: "لا توجد توزيعات",
      allocated: "موزعة",
      notAllocated: "غير موزعة",

      fields: {
        project: "المشروع",
        amount: "المبلغ",
        percentage: "النسبة المئوية",
        notes: "ملاحظات",
        totalAmount: "المبلغ الإجمالي",
        remainingAmount: "المبلغ المتبقي",
        allocatedAmount: "المبلغ الموزع",
      },

      mode: {
        label: "طريقة التوزيع",
        amountSar: "مبلغ (ر.س)",
        percentagePct: "نسبة مئوية (%)",
        switchToAmount: "تبديل إلى مبلغ",
        switchToPercentage: "تبديل إلى نسبة",
      },

      actions: {
        convert: "تحويل إلى موزعة",
        addAllocation: "إضافة توزيع",
        editAllocation: "تعديل توزيع",
        deleteAllocation: "حذف توزيع",
        viewAllocations: "عرض التوزيعات",
        autoFill: "تعبئة تلقائية",
        saveAllocations: "حفظ التوزيعات",
      },

      create: {
        title: "إضافة توزيع",
        success: "تم إنشاء التوزيع بنجاح",
        error: "فشل في إنشاء التوزيع",
      },

      update: {
        title: "تحديث التوزيع",
        success: "تم تحديث التوزيع بنجاح",
        error: "فشل في تحديث التوزيع",
      },

      delete: {
        title: "حذف التوزيع",
        confirmation: "هل أنت متأكد من حذف هذا التوزيع؟",
        success: "تم حذف التوزيع بنجاح",
        error: "فشل في حذف التوزيع",
      },

      convert: {
        title: "تحويل إلى تكلفة موزعة",
        description: "توزيع هذه التكلفة على مشاريع متعددة",
        success: "تم تحويل التكلفة إلى موزعة بنجاح",
        error: "فشل في تحويل التكلفة",
        warning: "لا يمكن التراجع عن هذا الإجراء",
      },

      validation: {
        totalMismatch: "يجب أن يساوي مجموع التوزيعات مبلغ التكلفة",
        invalidAmount: "يجب أن يكون المبلغ أكبر من 0",
        duplicateProject: "المشروع موزع بالفعل",
        noAllocations: "يجب إضافة توزيع واحد على الأقل",
        minProjects: "الحد الأدنى لعدد المشاريع هو 2",
        duplicateDetected: "لا يمكن تكرار نفس المشروع",
        unselectedProject: "يجب اختيار مشروع لكل صف",
        nonPositiveValue: "جميع القيم يجب أن تكون أكبر من صفر",
        sumPercentage: "مجموع النسب يجب أن يساوي 100% (الحالي: {{current}}%)",
        sumAmount:
          "مجموع المبالغ يجب أن يساوي {{expected}} {{currency}} (الحالي: {{current}})",
      },
    },

    // Status Labels
    statusLabels: {
      PENDING: "معلق",
      APPROVED: "معتمد",
      PAID: "مدفوع",
      REJECTED: "مرفوض",
      PARTIALLY_PAID: "مدفوع جزئياً",
      CANCELLED: "ملغى",
      OVERDUE: "متأخر",
    },

    // Cost Type Labels
    costTypeLabels: {
      MAINTENANCE: "صيانة",
      PURCHASE: "مشتريات",
      SALARY: "رواتب",
      ALLOWANCE: "بدلات",
      FUEL: "وقود",
      MATERIAL: "مواد",
      EQUIPMENT_RENTAL: "إيجار معدات",
      SUBCONTRACTOR: "مقاولون باطن",
      UTILITY: "مرافق",
      TRANSPORTATION: "نقل",
      INSURANCE: "تأمين",
      TAX: "ضرائب",
      OTHER: "أخرى",
    },

    // Empty States
    empty: {
      noData: "لا توجد بيانات متاحة",
      noDataDescription: "لا توجد بيانات لعرضها في هذا الرسم البياني",
    },

    // Loading & Errors
    loading: "جاري تحميل البيانات...",
    loadingChart: "جاري تحميل الرسم البياني...",
    error: "فشل في تحميل البيانات",
    errorDescription: "حدث خطأ أثناء تحميل البيانات المالية",
  },

  // Allocated Costs Page
  allocations: {
    title: "التكاليف الموزعة",
    description: "إدارة التكاليف الموزعة على مشاريع متعددة",
    empty: "لا توجد تكاليف موزعة",
    totalAllocated: "إجمالي الموزع",
    totalProjects: "إجمالي المشاريع",
    totalAmount: "المبلغ الإجمالي",
    costs: "تكلفة",
    allocations: "توزيع",
    distributed: "موزع",
    projectsCount: "مشاريع",
    projects: "المشاريع",
    moreProjects: "المزيد",
    editDistribution: "تعديل التوزيع",
    convert: {
      success: "تم تحويل التكلفة إلى موزعة بنجاح",
    },
  },

  // Approval Queue Page
  approvals: {
    title: "قائمة الاعتمادات",
    description: "مراجعة واعتماد التكاليف المعلقة",
    empty: "لا توجد اعتمادات معلقة",
    pendingCosts: "التكاليف المعلقة",
    totalAmount: "المبلغ الإجمالي",
    avgAmount: "متوسط المبلغ",
    oldestPending: "أقدم معلق",
    days: "أيام",
    daysAgo: "أيام مضت",
    waiting: "في الانتظار",
    waitingApproval: "في انتظار الاعتماد",
    pendingValue: "القيمة المعلقة",
    perCost: "لكل تكلفة",
    approveSelected: "اعتماد المحدد",
    bulkApproveSuccess: "تم اعتماد {{count}} تكلفة بنجاح",
    bulkApproveError: "فشل في اعتماد بعض التكاليف",
    viewOnlyMode: "وضع العرض فقط",
    viewOnlyDescription:
      "ليس لديك صلاحيات الاعتماد. تواصل مع المسؤول لطلب الوصول.",
  },
};
