/**
 * Employees Module - Arabic Translations
 */

export const employeesAr = {
  title: "الموظفون",
  subtitle: "إدارة بيانات الموظفين",

  // Details Page
  detailsPage: {
    title: "تفاصيل الموظف",
    personalInfo: "المعلومات الشخصية",
    employmentInfo: "معلومات التوظيف",
    employmentDuration: "أيام",
  },

  // Actions
  rowActions: {
    create: "إضافة موظف",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض التفاصيل",
    openMenu: "فتح القائمة",
  },

  list: {
    title: "قائمة الموظفين",
    description: "عرض وإدارة جميع موظفي الشركة",
    empty: "لا يوجد موظفون حالياً",
    emptyDescription: "ابدأ بإضافة موظف جديد",
    loading: "جاري تحميل الموظفين...",
    errorLoading: "حدث خطأ أثناء تحميل قائمة الموظفين",
  },

  stats: {
    total: "إجمالي الموظفين",
    active: "نشط",
    inactive: "غير نشط",
    onLeave: "في إجازة",
    terminated: "منتهي الخدمة",
  },

  table: {
    employeeNumber: "رقم الموظف",
    photo: "الصورة",
    fullName: "الاسم الكامل",
    nationalId: "الهوية الوطنية",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    department: "القسم",
    position: "المنصب",
    employmentType: "نوع التوظيف",
    status: "الحالة",
    hireDate: "تاريخ التعيين",
    actions: "الإجراءات",
  },

  form: {
    createTitle: "إضافة موظف جديد",
    createDescription: "قم بإضافة موظف جديد للنظام",
    editTitle: "تعديل بيانات الموظف",
    editDescription: "تحديث معلومات الموظف",
    employeeInfo: "معلومات الموظف",
    editEmployeeInfo: "تعديل معلومات الموظف",

    tabs: {
      personal: "البيانات الشخصية",
      employment: "بيانات التوظيف",
      contact: "معلومات الاتصال",
      emergency: "جهة الاتصال في حالات الطوارئ",
    },

    fields: {
      firstName: "الاسم الأول",
      lastName: "اسم العائلة",
      middleName: "الاسم الأوسط",
      nationalId: "رقم الهوية الوطنية",
      employeeNumber: "رقم الموظف",
      email: "البريد الإلكتروني",
      phone: "رقم الهاتف",
      alternatePhone: "رقم هاتف بديل",
      alternativePhone: "رقم هاتف بديل",
      dateOfBirth: "تاريخ الميلاد",
      gender: "الجنس",
      nationality: "الجنسية",
      address: "العنوان",
      city: "المدينة",
      state: "المنطقة/الولاية",
      postalCode: "الرمز البريدي",
      country: "الدولة",
      employmentType: "نوع التوظيف",
      status: "الحالة",
      department: "القسم",
      position: "المنصب",
      hireDate: "تاريخ التعيين",
      rehireDate: "تاريخ إعادة التعيين",
      terminationDate: "تاريخ انتهاء الخدمة",
      rehireReason: "سبب إعادة التعيين",
      terminationReason: "سبب انتهاء الخدمة",
      emergencyContactName: "اسم جهة الاتصال للطوارئ",
      emergencyContactPhone: "هاتف جهة الاتصال للطوارئ",
      emergencyContactRelation: "صلة القرابة",
      notes: "ملاحظات",
      documents: "المستندات",
    },

    descriptions: {
      nationalId:
        "يجب أن يكون رقم الهوية 10 أرقام ويبدأ بـ 1 (سعودي) أو 2 (مقيم)",
      employeeNumber: "سيتم إنشاء رقم تلقائي إذا ترك فارغاً",
      phone: "اختياري. يدعم الصيغة الدولية (مثال: +201234567890)",
      statusDefault: "الموظفون الجدد يبدأون بحالة 'نشط' افتراضياً",
      emergencyContactRelation: "مثال: الأب، الأم، الزوج/الزوجة، الأخ/الأخت",
      notes: "أي معلومات إضافية أو ملاحظات خاصة بالموظف",
      documents: "قم برفع المستندات المتعلقة بالموظف (صورة شخصية، عقد، شهادات)",
    },

    fileUpload: {
      title: "رفع المستندات",
      description:
        "يمكنك رفع المستندات الخاصة بالموظف مثل الصورة الشخصية، عقد العمل، الشهادات",
      maxSize: "الحد الأقصى",
      acceptedTypes: "الأنواع المقبولة",
      dragDrop: "اسحب وأفلت الملفات هنا",
      or: "أو",
      browse: "تصفح الملفات",
      uploadedFiles: "الملفات المرفوعة",
      ready: "جاهز للرفع",
      errors: {
        fileSize: "حجم الملف يتجاوز 5MB",
        fileType: "نوع الملف غير مدعوم. الأنواع المقبولة: JPG, PNG, WebP, PDF",
      },
    },

    descriptionsExtra: {
      nationalId:
        "يجب أن يكون رقم الهوية 10 أرقام ويبدأ بـ 1 (سعودي) أو 2 (مقيم)",
      employeeNumber: "سيتم إنشاء رقم تلقائي إذا ترك فارغاً",
      phone: "اختياري. يدعم الصيغة الدولية (مثال: +201234567890)",
      statusDefault: "الموظفون الجدد يبدأون بحالة 'نشط' افتراضياً",
      emergencyContactRelation: "مثال: الأب، الأم، الزوج/الزوجة، الأخ/الأخت",
      notes: "أي معلومات إضافية أو ملاحظات خاصة بالموظف",
    },

    sections: {
      basicInfo: {
        title: "البيانات الأساسية",
        description:
          "الحقول المطلوبة لإنشاء الموظف (الاسم، الهوية، نوع التوظيف، التعيين)",
      },
      employmentInfo: {
        title: "معلومات التوظيف",
        description: "اختياري - يمكن إضافتها لاحقاً",
      },
      contactInfo: {
        title: "معلومات الاتصال",
        description: "اختياري - البريد والجوال والعنوان",
      },
      emergencyContact: {
        title: "جهة الاتصال للطوارئ",
        description: "اختياري - يُفضل إضافتها لحالات الطوارئ",
      },
      additionalInfo: {
        title: "معلومات إضافية",
        description: "اختياري - ملاحظات أو تفاصيل أخرى",
      },
    },

    autoGeneratedNumber: {
      title: "رقم تلقائي",
      description: "سيتم توليد رقم الموظف تلقائياً عند الحفظ",
    },

    emergencyAlert: {
      title: "معلومات مهمة",
      description:
        "يُرجى إضافة جهة اتصال واحدة على الأقل للطوارئ لضمان السلامة والتواصل عند الحاجة",
    },

    placeholders: {
      firstName: "أدخل الاسم الأول",
      lastName: "أدخل اسم العائلة",
      middleName: "أدخل الاسم الأوسط (اختياري)",
      nationalId: "1234567890",
      employeeNumber: "EMP-001",
      email: "employee@company.com",
      phone: "+201234567890",
      alternatePhone: "+201234567891",
      alternativePhone: "+201234567891",
      dateOfBirth: "اختر تاريخ الميلاد",
      gender: "اختر الجنس",
      nationality: "أدخل الجنسية",
      address: "أدخل العنوان الكامل",
      city: "أدخل المدينة",
      state: "أدخل المنطقة",
      postalCode: "12345",
      country: "المملكة العربية السعودية",
      employmentType: "اختر نوع التوظيف",
      status: "اختر الحالة",
      department: "اختر أو أدخل القسم",
      position: "اختر أو أدخل المنصب",
      hireDate: "اختر تاريخ التعيين",
      terminationDate: "اختر تاريخ انتهاء الخدمة",
      terminationReason: "أدخل سبب انتهاء الخدمة",
      emergencyContactName: "أدخل اسم جهة الاتصال",
      emergencyContactPhone: "+201234567890",
      emergencyContactRelation: "مثال: الأب، الأم، الزوج/الزوجة",
      notes: "أدخل أي ملاحظات إضافية",
    },

    validation: {
      required: "هذا الحقل مطلوب",
      invalidEmail: "البريد الإلكتروني غير صحيح",
      invalidPhone: "رقم الهاتف غير صحيح",
      invalidNationalId: "رقم الهوية الوطنية غير صحيح (10 أرقام)",
      minLength: "يجب أن يكون على الأقل {{min}} أحرف",
      maxLength: "يجب أن لا يتجاوز {{max}} حرف",
      invalidDate: "التاريخ غير صحيح",
      hireDateFuture: "لا يمكن أن يكون تاريخ التعيين في المستقبل",
      terminationBeforeHire:
        "تاريخ انتهاء الخدمة لا يمكن أن يكون قبل تاريخ التعيين",
      firstNameRequired: "الاسم الأول مطلوب",
      firstNameMax: "الاسم الأول يجب أن لا يتجاوز 100 حرف",
      lastNameRequired: "اسم العائلة مطلوب",
      lastNameMax: "اسم العائلة يجب أن لا يتجاوز 100 حرف",
      nationalIdRequired: "رقم الهوية الوطنية مطلوب",
      nationalIdInvalid:
        "رقم الهوية يجب أن يكون 10 أرقام ويبدأ بـ 1 (سعودي) أو 2 (مقيم)",
      genderRequired: "الجنس مطلوب",
      employmentTypeRequired: "نوع التوظيف مطلوب",
      statusRequired: "الحالة مطلوبة",
      hireDateRequired: "تاريخ التعيين مطلوب",
      emailInvalid: "البريد الإلكتروني غير صحيح",
      phoneInvalid: "رقم الهاتف غير صحيح (مثال: +201234567890)",
      terminationDateInvalid:
        "تاريخ انتهاء الخدمة يجب أن يكون بعد تاريخ التعيين",
      terminationDateRequired:
        "تاريخ انتهاء الخدمة مطلوب عند تغيير الحالة إلى 'منتهي الخدمة'",
    },
  },

  filters: {
    title: "الفلاتر",
    search: "بحث...",
    searchPlaceholder: "ابحث بالاسم، الهاتف، أو الهوية...",
    employmentType: "نوع التوظيف",
    status: "الحالة",
    department: "القسم",
    position: "المنصب",
    nationality: "الجنسية",
    country: "الدولة",
    reset: "إعادة تعيين",
    apply: "تطبيق",
    allTypes: "جميع الأنواع",
    allEmploymentTypes: "جميع أنواع التوظيف",
    allStatuses: "جميع الحالات",
    allDepartments: "جميع الأقسام",
    allPositions: "جميع المناصب",
  },

  actions: {
    create: "إضافة موظف",
    edit: "تعديل",
    delete: "حذف",
    view: "عرض التفاصيل",
    bulkCreate: "إضافة جماعية",
    export: "تصدير",
    import: "استيراد",
    print: "طباعة",
    openMenu: "فتح القائمة",
  },

  status: {
    [EmployeeStatus.ACTIVE]: "نشط",
    [EmployeeStatus.INACTIVE]: "غير نشط",
    [EmployeeStatus.ON_LEAVE]: "في إجازة",
    [EmployeeStatus.SUSPENDED]: "موقوف",
    [EmployeeStatus.TERMINATED]: "منتهي الخدمة",
  },

  employmentType: {
    [EmploymentType.PERMANENT]: "دائم",
    [EmploymentType.CONTRACT]: "كفالة الشركة",
    [EmploymentType.TEMPORARY]: "مؤقت",
    [EmploymentType.PART_TIME]: "دوام جزئي",
    [EmploymentType.FULL_TIME]: "دوام كامل",
    [EmploymentType.FREELANCE]: "عمالة خارجية",
    [EmploymentType.CONSULTANT]: "استشاري",
    [EmploymentType.INTERN]: "متدرب",
    [EmploymentType.TRAINEE]: "متدرب تحت التدريب",
    [EmploymentType.SEASONAL]: "موسمي",
    [EmploymentType.ON_CALL]: "عند الطلب",
    [EmploymentType.PROBATION]: "فترة تجربة",
    [EmploymentType.REMOTE]: "عن بعد",
  },

  gender: {
    [Gender.MALE]: "ذكر",
    [Gender.FEMALE]: "أنثى",
    [Gender.OTHER]: "آخر",
  },

  create: {
    success: "تم إضافة الموظف بنجاح",
    error: "حدث خطأ أثناء إضافة الموظف",
    nationalIdExists: "رقم الهوية الوطنية مسجل مسبقاً في النظام",
    employeeNumberExists: "رقم الموظف موجود مسبقاً",
    emailExists: "البريد الإلكتروني مسجل لموظف آخر",
    phoneExists: "رقم الهاتف مسجل لموظف آخر",
  },

  bulkCreate: {
    success: "تم إضافة {{count}} موظف بنجاح",
    error: "حدث خطأ أثناء الإضافة الجماعية",
    partial: "تم إضافة {{success}} من {{total}} موظف",
  },

  update: {
    success: "تم تحديث بيانات الموظف بنجاح",
    error: "حدث خطأ أثناء تحديث بيانات الموظف",
  },

  delete: {
    success: "تم حذف الموظف بنجاح",
    error: "حدث خطأ أثناء حذف الموظف",
    confirm: "هل أنت متأكد من حذف هذا الموظف؟",
    confirmTitle: "تأكيد الحذف",
    confirmMessage:
      "سيتم حذف {{name}} من قاعدة البيانات. هذا الإجراء لا يمكن التراجع عنه.",
  },

  tabs: {
    overview: "نظرة عامة",
    salary: "الراتب",
    allowances: "البدلات",
    loans: "القروض",
    deductions: "الاستقطاعات",
    documents: "المستندات",
  },

  details: {
    title: "تفاصيل الموظف",
    personalInfo: "المعلومات الشخصية",
    employmentInfo: "معلومات التوظيف",
    contactInfo: "معلومات الاتصال",
    emergencyContact: "جهة الاتصال للطوارئ",
    employmentDuration: "مدة الخدمة",
    currentSalary: "الراتب الحالي",
    noSalaryAssigned: "لم يتم تحديد راتب بعد",
    joinedDate: "تاريخ الانضمام",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تعديل",
    documents: "المستندات",
  },

  // Documents Section
  documents: {
    title: "المستندات",
    count: "مستند",
    empty: "لا توجد مستندات مرفوعة",
    emptyHint: "ابدأ برفع المستندات الخاصة بالموظف",
    type: "النوع",
    name: "الاسم",
    issueDate: "تاريخ الإصدار",
    expiryDate: "تاريخ الانتهاء",
    status: "الحالة",
    notes: "ملاحظات",
    filesSelected: "ملف محدد",
    namePlaceholder: "مثال: عقد عمل 2026",
    notesPlaceholder: "ملاحظات إضافية...",

    types: {
      ID_CARD: "بطاقة الهوية",
      PASSPORT: "جواز السفر",
      CONTRACT: "عقد العمل",
      CERTIFICATE: "شهادة",
      OTHER: "أخرى",
    },

    statusLabels: {
      valid: "ساري",
      expiring: "ينتهي خلال {{days}} يوم",
      expired: "منتهي",
      noExpiry: "لا يوجد",
    },

    validation: {
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

  profilePicture: {
    upload: {
      success: "تم رفع صورة الموظف بنجاح",
      error: "حدث خطأ أثناء رفع صورة الموظف",
    },
    delete: {
      success: "تم حذف صورة الموظف بنجاح",
      error: "حدث خطأ أثناء حذف صورة الموظف",
    },
  },

  helpSteps: {
    title: "خطوات المساعدة",
    list: {
      step1: "استخدم الفلاتر للبحث عن موظفين محددين",
      step2: "اضغط على اسم الموظف لعرض التفاصيل",
      step3: "يمكنك تعديل أو حذف الموظفين من قائمة الإجراءات",
      step4: "استخدم زر 'إضافة موظف' لإضافة موظف جديد",
      step5: "يمكنك تصدير القائمة إلى Excel",
    },
    create: {
      step1:
        "املأ الحقول المطلوبة في الخطوة الأولى (الاسم، الهوية، نوع التوظيف، تاريخ التعيين) - يمكنك الحفظ فوراً!",
      step2:
        "استخدم زر 'التالي' للانتقال للخطوات التالية أو اضغط 'حفظ' مباشرة من الخطوة الأولى",
      step3:
        "يمكنك إضافة باقي المعلومات (التوظيف، الاتصال، الطوارئ) في أي وقت - كلها اختيارية",
      step4: "انقر على أي خطوة في الشريط العلوي للانتقال إليها مباشرة",
      step5: "إذا ظهرت علامة حمراء على خطوة، اضغط عليها لمعرفة الخطأ وتصحيحه",
    },
    edit: {
      step1: "استخدم الخطوات للتنقل بين أقسام البيانات المختلفة",
      step2: "عدّل أي حقل في أي خطوة - البيانات محفوظة أثناء التنقل",
      step3: "ارفع مستندات جديدة أو احذف القديمة في خطوة المستندات",
      step4: "اضغط 'حفظ' من أي خطوة لتطبيق جميع التعديلات",
    },
    step1:
      "الخطوة 1: ابدأ بإدخال البيانات الشخصية الأساسية (الاسم، الهوية، الهاتف)",
    step2:
      "الخطوة 2: أدخل معلومات التوظيف (نوع التوظيف، القسم، المنصب، تاريخ التعيين)",
    step3: "الخطوة 3: املأ بيانات الاتصال والعنوان",
    step4: "الخطوة 4: أضف معلومات جهة الاتصال في حالات الطوارئ (مهم)",
    step5: "الخطوة 5: راجع جميع البيانات واضغط حفظ",
  },

  messages: {
    noResults: "لم يتم العثور على نتائج",
    loadingError: "حدث خطأ أثناء تحميل البيانات",
    retry: "إعادة المحاولة",
    statusUpdated: "تم تحديث حالة الموظف بنجاح",
  },

  quickActions: {
    title: "إجراءات سريعة",
    changeStatus: {
      button: "تغيير الحالة",
      title: "تغيير حالة الموظف",
      description: "تغيير حالة الموظف بسرعة دون الحاجة للتعديل الكامل",
      currentStatus: "الحالة الحالية",
      newStatus: "الحالة الجديدة",
    },
    viewDocuments: "عرض المستندات",
    viewDocumentsDesc: "عرض ومراجعة مستندات الموظف",
    changeDepartment: "تغيير القسم",
    changeDepartmentDesc: "تغيير قسم الموظف",
    currentDepartment: "القسم الحالي",
    newDepartment: "القسم الجديد",
    noDepartment: "لا يوجد قسم",
    changeDepartmentFor: "تغيير قسم: {{name}}",
    changePosition: "تغيير المنصب",
    changePositionDesc: "تغيير منصب الموظف",
    currentPosition: "المنصب الحالي",
    newPosition: "المنصب الجديد",
    noPosition: "لا يوجد منصب",
    changePositionFor: "تغيير منصب: {{name}}",
    viewProfile: "عرض الملف الكامل",
    documentsCount: "مستند",
    uploadDocument: "رفع مستند",
    selectFiles: "اختيار ملفات",
    uploadAll: "رفع الكل",
    uploading: "جاري الرفع...",
    pending: "في الانتظار",
    noDocuments: "لا توجد مستندات مرفوعة حالياً",
    documentsInfo: "💡 يمكنك رفع وعرض المستندات مثل العقود، الشهادات، الهوية",
    fileTooLarge: "الملف أكبر من الحد المسموح (10 ميجابايت)",
    filesSelected: "تم اختيار الملفات. اضغط 'رفع الكل' للرفع",
    fileUploaded: "تم رفع الملف بنجاح",
    filesUploaded: "تم رفع الملفات بنجاح",
    uploadFailed: "فشل رفع الملفات",
    fileDeleted: "تم حذف المستند بنجاح",
    deleteFailed: "فشل حذف المستند",
  },

  // ========================================================================
  // DASHBOARD & STATISTICS
  // ========================================================================
  dashboard: {
    title: "لوحة معلومات الموظفين",
    subtitle: "نظرة شاملة على إحصائيات ومؤشرات الموظفين",
    loadingStats: "جارٍ تحميل الإحصائيات...",
    errorLoading: "حدث خطأ أثناء تحميل البيانات",
    retry: "إعادة المحاولة",
    noData: "لا توجد بيانات متاحة",
    lastUpdated: "آخر تحديث",

    // KPIs
    kpis: {
      totalEmployees: {
        title: "إجمالي الموظفين",
        description: "العدد الكلي للموظفين في النظام",
      },
      activeEmployees: {
        title: "الموظفون النشطون",
        description: "عدد الموظفين العاملين حالياً",
      },
      inactiveEmployees: {
        title: "الموظفون غير النشطين",
        description: "عدد الموظفين غير العاملين",
      },
      onLeaveEmployees: {
        title: "في إجازة",
        description: "عدد الموظفين في إجازة حالياً",
      },
      newHires: {
        title: "التعيينات الجديدة",
        description: "عدد الموظفين الجدد في آخر 30 يوم",
      },
      terminations: {
        title: "إنهاء الخدمات",
        description: "عدد الموظفين المنتهية خدمتهم في آخر 30 يوم",
      },
      turnoverRate: {
        title: "معدل الدوران",
        description: "نسبة إنهاء الخدمات خلال آخر 30 يوم",
      },
      averageTenure: {
        title: "متوسط مدة الخدمة",
        description: "متوسط عدد سنوات عمل الموظفين النشطين",
        years: "سنوات",
      },
      probationEmployees: {
        title: "في فترة التجربة",
        description: "عدد الموظفين في فترة التجربة (أقل من 90 يوم)",
      },
      maleCount: {
        title: "عدد الذكور",
        description: "إجمالي عدد الموظفين الذكور",
      },
      femaleCount: {
        title: "عدد الإناث",
        description: "إجمالي عدد الموظفات الإناث",
      },
      genderDiversityRatio: {
        title: "نسبة التنوع الجندري",
        description: "نسبة الإناث إلى الذكور في القوى العاملة",
      },
    },

    // Charts
    charts: {
      // Employment Type Distribution
      employmentTypeDistribution: {
        title: "توزيع الموظفين حسب نوع التوظيف",
        description: "نسبة كل نوع من أنواع التوظيف",
        tooltip: "عدد ونسبة الموظفين لكل نوع توظيف",
        noData: "لا توجد بيانات",
        legends: {
          employeeCount: "عدد الموظفين",
          percentage: "النسبة المئوية",
        },
      },

      // Status Breakdown
      statusBreakdown: {
        title: "توزيع الموظفين حسب الحالة",
        description: "عرض حالات الموظفين المختلفة",
        tooltip: "عدد الموظفين في كل حالة",
        noData: "لا توجد بيانات",
        legends: {
          active: "نشط",
          inactive: "غير نشط",
          onLeave: "في إجازة",
          suspended: "موقوف",
          terminated: "منتهي",
        },
      },

      // Department Distribution
      departmentDistribution: {
        title: "توزيع الموظفين حسب الأقسام",
        description: "أكبر 8 أقسام من حيث عدد الموظفين",
        tooltip: "عدد الموظفين في كل قسم",
        noData: "لا توجد أقسام",
        legends: {
          total: "إجمالي الموظفين",
          active: "النشطون",
        },
        showTop: "عرض أفضل",
        departments: "أقسام",
      },

      // Gender Distribution
      genderDistribution: {
        title: "التوزيع حسب الجنس",
        description: "نسبة الذكور والإناث في القوى العاملة",
        tooltip: "التنوع الجندري في الشركة",
        noData: "لا توجد بيانات",
        legends: {
          male: "ذكر",
          female: "أنثى",
          other: "آخر",
        },
      },

      // Age Group Distribution
      ageGroupDistribution: {
        title: "التوزيع حسب الفئة العمرية",
        description: "توزيع الموظفين حسب الأعمار",
        tooltip: "عدد الموظفين في كل فئة عمرية",
        noData: "لا توجد بيانات",
        legends: {
          ageGroup: "الفئة العمرية",
          count: "العدد",
          averageAge: "متوسط العمر",
        },
      },

      // Nationality Distribution
      nationalityDistribution: {
        title: "التوزيع حسب الجنسية",
        description: "أكثر 10 جنسيات في الشركة",
        tooltip: "التنوع في الجنسيات",
        noData: "لا توجد بيانات",
        showTop: "عرض أفضل",
        nationalities: "جنسيات",
      },

      // Position Breakdown
      positionBreakdown: {
        title: "التوزيع حسب المنصب",
        description: "أكثر 10 مناصب في الشركة",
        tooltip: "عدد الموظفين في كل منصب",
        noData: "لا توجد بيانات",
        showTop: "عرض أفضل",
        positions: "مناصب",
        legends: {
          count: "العدد",
          percentage: "النسبة المئوية",
        },
      },

      // Monthly Hiring Trend
      monthlyHiringTrend: {
        title: "اتجاه التوظيف الشهري",
        description: "التعيينات وإنهاء الخدمات خلال آخر 12 شهر",
        tooltip: "عدد التعيينات الجديدة والإنهاءات والإجمالي",
        noData: "لا توجد بيانات",
        legends: {
          newHires: "تعيينات جديدة",
          terminations: "إنهاءات",
          netChange: "صافي التغيير",
          totalEmployees: "إجمالي الموظفين",
        },
      },
    },

    // Export Options
    export: {
      title: "تصدير البيانات",
      pdf: "تصدير PDF",
      excel: "تصدير Excel",
      print: "طباعة",
    },

    // Filters
    filters: {
      title: "الفلاتر",
      dateRange: "نطاق التاريخ",
      startDate: "تاريخ البداية",
      endDate: "تاريخ النهاية",
      department: "القسم",
      employmentType: "نوع التوظيف",
      applyFilters: "تطبيق الفلاتر",
      clearFilters: "مسح الفلاتر",
      allDepartments: "جميع الأقسام",
      allTypes: "جميع الأنواع",
    },
  },
};

// Re-export enums for use in translations
import {
  EmployeeStatus,
  EmploymentType,
  Gender,
} from "@/types/employees.types";
