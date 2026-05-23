/**
 * Sites Module - Arabic Translations
 */

export default {
  title: "إدارة المواقع",
  list: {
    title: "قائمة المواقع",
    description: "إدارة ومتابعة جميع المواقع",
    empty: "لا توجد مواقع",
  },
  create: {
    title: "إضافة موقع جديد",
    success: "تمت إضافة الموقع بنجاح",
    error: "حدث خطأ أثناء إضافة الموقع",
  },
  update: {
    title: "تعديل الموقع",
    success: "تم تحديث الموقع بنجاح",
    error: "حدث خطأ أثناء تحديث الموقع",
  },
  delete: {
    title: "حذف الموقع",
    message: "هل أنت متأكد من حذف هذا الموقع؟",
    success: "تم حذف الموقع بنجاح",
    error: "حدث خطأ أثناء حذف الموقع",
  },
  deleted: {
    title: "المواقع المحذوفة",
    description: "عرض واستعادة المواقع المحذوفة",
    info: "تعرض هذه الصفحة المواقع المحذوفة من النظام. يمكنك استعادتها لإعادة تفعيلها.",
    empty: {
      title: "لا توجد مواقع محذوفة",
      description: "لم يتم العثور على مواقع محذوفة.",
    },
  },
  restore: {
    title: "استعادة الموقع",
    confirmTitle: "تأكيد الاستعادة",
    confirmMessage:
      "هل أنت متأكد من استعادة هذا الموقع؟ سيتم إرجاعه إلى قائمة المواقع النشطة.",
    success: "تم استعادة الموقع بنجاح",
    error: "حدث خطأ أثناء استعادة الموقع",
  },
  bulkCreate: {
    title: "إضافة مواقع متعددة",
    success: "تمت إضافة {{count}} موقع بنجاح",
    error: "حدث خطأ أثناء الإضافة الجماعية",
  },

  fields: {
    name: "اسم الموقع",
    nameAr: "اسم إضافي",
    code: "رمز الموقع",
    description: "الوصف",
    descriptionAr: "الوصف بالعربية",
    status: "الحالة",
    address: "العنوان",
    city: "المدينة",
    state: "المنطقة",
    country: "الدولة",
    postalCode: "الرمز البريدي",
    latitude: "خط العرض",
    longitude: "خط الطول",
    area: "المساحة",
    capacity: "السعة",
    contactPerson: "جهة الاتصال",
    contactEmail: "البريد الإلكتروني",
    contactPhone: "رقم الهاتف",
    notes: "ملاحظات",
    isActive: "نشط",
    createdAt: "تاريخ الإنشاء",
    updatedAt: "آخر تحديث",
    fullLocation: "الموقع الكامل",
    hasCoordinates: "يحتوي على إحداثيات GPS",
    mapUrl: "رابط الخريطة",
  },

  placeholders: {
    name: "مثال: مستودع الرياض الرئيسي",
    nameAr: "مثال: مستودع الرياض الرئيسي",
    code: "مثال: WH-RYD-001",
    description: "أدخل وصف الموقع...",
    descriptionAr: "أدخل وصف الموقع بالعربية...",
    address: "مثال: طريق الملك فهد، حي الملز",
    city: "مثال: الرياض",
    state: "مثال: منطقة الرياض",
    country: "مثال: المملكة العربية السعودية",
    postalCode: "مثال: 12345",
    latitude: "مثال: 24.7136",
    longitude: "مثال: 46.6753",
    area: "مثال: 5000",
    capacity: "مثال: 10000",
    contactPerson: "مثال: أحمد محمد",
    contactEmail: "مثال: contact@example.com",
    contactPhone: "مثال: +201234567890",
    notes: "أدخل ملاحظات إضافية...",
    search: "ابحث عن موقع...",
    selectStatus: "اختر الحالة",
    selectCity: "اختر المدينة",
    selectState: "اختر المنطقة",
    selectCountry: "اختر الدولة",
  },

  status: {
    ACTIVE: "نشط",
    INACTIVE: "غير نشط",
    UNDER_PREPARATION: "تحت التجهيز",
    CLOSED: "مغلق",
  },

  actions: {
    add: "إضافة موقع",
    edit: "تعديل",
    delete: "حذف",
    restore: "استعادة",
    view: "عرض",
    viewDetails: "عرض التفاصيل",
    viewDeleted: "المواقع المحذوفة",
    save: "حفظ",
    cancel: "إلغاء",
    filter: "تصفية",
    clearFilters: "مسح الفلاتر",
    export: "تصدير",
    import: "استيراد",
    refresh: "تحديث",
    search: "بحث",
    reset: "إعادة تعيين",
    backToList: "العودة للمواقع",
    viewOnMap: "عرض على الخريطة",
    copyCoordinates: "نسخ الإحداثيات",
    generateCode: "توليد الرمز تلقائيًا",
    changeStatus: "تغيير الحالة",
  },

  validation: {
    nameRequired: "اسم الموقع مطلوب",
    nameMin: "اسم الموقع يجب أن يكون على الأقل 3 أحرف",
    nameMax: "اسم الموقع يجب ألا يتجاوز 100 حرف",
    nameArRequired: "الاسم الإضافي مطلوب",
    codeRequired: "رمز الموقع مطلوب",
    codeFormat: "رمز الموقع يجب أن يحتوي على أحرف كبيرة وأرقام وشرطة فقط",
    codeUnique: "رمز الموقع موجود مسبقًا",
    statusRequired: "الحالة مطلوبة",
    statusInvalid: "الحالة غير صحيحة",
    addressRequired: "العنوان مطلوب",
    cityRequired: "المدينة مطلوبة",
    stateRequired: "المنطقة مطلوبة",
    countryRequired: "الدولة مطلوبة",
    latitudeRange: "خط العرض يجب أن يكون بين -90 و90",
    longitudeRange: "خط الطول يجب أن يكون بين -180 و180",
    areaPositive: "المساحة يجب أن تكون أكبر من صفر",
    capacityPositive: "السعة يجب أن تكون أكبر من صفر",
    emailFormat: "صيغة البريد الإلكتروني غير صحيحة",
    phoneFormat: "رقم الهاتف غير صحيح",
    phoneCountryCode: "رقم الهاتف يجب أن يبدأ برمز الدولة (+)",
  },

  empty: {
    title: "لا توجد مواقع",
    description: "لم يتم العثور على مواقع. ابدأ بإضافة موقع جديد.",
    action: "إضافة موقع جديد",
    noResults: "لا توجد نتائج",
    noResultsDescription: "لا توجد مواقع تطابق معايير البحث.",
    tryAgain: "جرّب تغيير معايير البحث",
  },

  loading: {
    list: "جاري تحميل المواقع...",
    details: "جاري تحميل تفاصيل الموقع...",
    stats: "جاري تحميل الإحصائيات...",
    create: "جاري إضافة الموقع...",
    update: "جاري تحديث الموقع...",
    delete: "جاري حذف الموقع...",
    import: "جاري استيراد المواقع...",
  },

  error: {
    loadFailed: "فشل تحميل المواقع",
    statsLoadFailed: "فشل تحميل الإحصائيات",
    createFailed: "فشل إنشاء الموقع",
    updateFailed: "فشل تحديث الموقع",
    deleteFailed: "فشل حذف الموقع",
    notFound: "الموقع غير موجود",
    networkError: "خطأ في الاتصال بالشبكة",
    unknownError: "حدث خطأ غير متوقع",
    tryAgain: "حاول مرة أخرى",
  },

  stats: {
    total: "إجمالي المواقع",
    active: "المواقع النشطة",
    inactive: "المواقع غير النشطة",
    underPreparation: "تحت التجهيز",
    closed: "المواقع المغلقة",
    deleted: "المواقع المحذوفة",
    withCoordinates: "بإحداثيات",
    totalArea: "إجمالي المساحة",
    averageArea: "متوسط المساحة",
    totalCapacity: "إجمالي السعة",
    byCity: "التوزيع حسب المدينة",
    byState: "التوزيع حسب المنطقة",
    byCountry: "التوزيع حسب الدولة",
    additionalInfo: "معلومات إضافية",
    last7Days: "آخر 7 أيام",
    last30Days: "آخر 30 يوم",
  },

  dashboard: {
    title: "لوحة إحصائيات المواقع",
    description: "نظرة شاملة على جميع المواقع والإحصائيات",
  },

  table: {
    code: "الرمز",
    name: "الاسم",
    status: "الحالة",
    location: "الموقع",
    city: "المدينة",
    state: "المنطقة",
    area: "المساحة",
    capacity: "السعة",
    contact: "جهة الاتصال",
    deletedAt: "تاريخ الحذف",
    actions: "الإجراءات",
    noData: "لا توجد بيانات",
  },

  form: {
    sections: {
      basicInfo: "المعلومات الأساسية",
      locationInfo: "معلومات الموقع",
      gpsCoordinates: "الإحداثيات الجغرافية",
      contactInfo: "معلومات الاتصال",
      additionalInfo: "معلومات إضافية",
    },
    createDescription: "أدخل بيانات الموقع الجديد أدناه",
    editDescription: "قم بتعديل بيانات الموقع أدناه",
    hints: {
      code: "سيتم توليد الرمز تلقائيًا إذا تُرك فارغًا",
      coordinates: "إحداثيات GPS لموقع الموقع على الخريطة",
      area: "المساحة بالمتر المربع",
      capacity: "السعة القصوى للموقع",
      phone: "صيغة رقم الهاتف غير صحيحة (مثال: +201234567890)",
    },
  },

  help: {
    title: "كيفية إضافة موقع جديد",
    steps: [
      {
        title: "المعلومات الأساسية",
        description:
          "أدخل اسم الموقع ورمز الموقع (أو اتركه للتوليد التلقائي) وحدد حالة الموقع.",
      },
      {
        title: "معلومات الموقع",
        description:
          "أدخل العنوان الكامل، المدينة، المنطقة، الدولة، والرمز البريدي للموقع.",
      },
      {
        title: "الإحداثيات الجغرافية (اختياري)",
        description:
          "أدخل إحداثيات GPS (خط العرض وخط الطول) للموقع. يمكن الحصول عليها من الخرائط.",
      },
      {
        title: "معلومات الاتصال",
        description: "أدخل اسم جهة الاتصال، البريد الإلكتروني، ورقم الهاتف.",
      },
      {
        title: "معلومات إضافية",
        description:
          "أدخل مساحة الموقع، السعة القصوى، وأي ملاحظات إضافية عند الحاجة.",
      },
    ],
  },

  filters: {
    title: "تصفية المواقع",
    status: "الحالة",
    city: "المدينة",
    state: "المنطقة",
    country: "الدولة",
    search: "البحث",
    searchHint: "ابحث بالاسم أو الرمز أو العنوان أو المدينة",
    advanced: "فلاتر متقدمة",
    advancedHint: "تصفية أدق حسب الموقع الجغرافي",
    activeFilters: "الفلاتر النشطة:",
    apply: "تطبيق",
    clear: "مسح",
    results: "عرض {{count}} من {{total}} موقع",
  },

  pagination: {
    previous: "السابق",
    next: "التالي",
    page: "صفحة {{page}} من {{total}}",
    showing: "عرض {{from}}-{{to}} من {{total}}",
    perPage: "لكل صفحة",
  },

  confirmations: {
    delete: {
      title: "تأكيد الحذف",
      message: 'هل أنت متأكد من حذف الموقع "{{name}}"؟ لا يمكن التراجع عن هذا الإجراء.',
      confirm: "نعم، احذف",
      cancel: "إلغاء",
    },
    unsavedChanges: {
      title: "تغييرات غير محفوظة",
      message: "لديك تغييرات غير محفوظة. هل تريد المغادرة دون حفظ؟",
      confirm: "نعم، غادر",
      cancel: "البقاء",
    },
  },

  details: {
    title: "تفاصيل الموقع",
    error: "خطأ في تحميل البيانات",
    notFound: "لم يتم العثور على الموقع",
  },

  units: {
    squareMeters: "م²",
    units: "وحدة",
  },

  // Direct Arabic keys used by helper utilities
  نشط: "نشط",
  "تحت التجهيز": "تحت التجهيز",
  "غير نشط": "غير نشط",
  مغلق: "مغلق",
};

