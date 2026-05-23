/**
 * Auth Module - Arabic Translations
 */

export const auth = {
  login: {
    title: "مرحبًا بك",
    subtitle: "سجّل الدخول للوصول إلى لوحة التحكم",
    email: "البريد الإلكتروني",
    emailPlaceholder: "admin@example.com",
    password: "كلمة المرور",
    passwordPlaceholder: "أدخل كلمة المرور",
    rememberMe: "تذكرني",
    forgotPassword: "نسيت كلمة المرور؟",
    submit: "تسجيل الدخول",
    noAccount: "ليس لديك حساب؟",
    createAccount: "إنشاء حساب",

    success: "مرحبًا {{name}}! تم تسجيل الدخول بنجاح",
    error: "فشل تسجيل الدخول. حاول مرة أخرى",
    invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    accountLocked: "حسابك مقفل مؤقتًا. حاول لاحقًا",
    accountPermanentlyLocked: "حسابك مقفل بشكل دائم. تواصل مع الإدارة",
    tooManyAttempts: "محاولات كثيرة. حاول بعد {{minutes}} دقيقة",
    accountInactive: "حسابك غير نشط. تواصل مع الإدارة",

    validation: {
      emailRequired: "البريد الإلكتروني مطلوب",
      emailInvalid: "البريد الإلكتروني غير صحيح",
      passwordRequired: "كلمة المرور مطلوبة",
      passwordMin: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
    },

    helpSteps: {
      title: "كيفية تسجيل الدخول",
      step1: "أدخل البريد الإلكتروني الخاص بك",
      step2: "أدخل كلمة المرور (8 أحرف على الأقل)",
      step3: "اضغط على أيقونة العين لإظهار أو إخفاء كلمة المرور",
      step4: "اختر تذكرني للبقاء مسجلًا للدخول",
      step5: "اضغط تسجيل الدخول للوصول إلى لوحة التحكم",
    },
    enterprise: {
      badge: "دخول نظام ERP المؤسسي",
      tagSecure: "دخول آمن",
      tagAudited: "تدقيق وتتبع",
      sideTitle: "منصة ERP لإدارة التشغيل المؤسسي",
      sideDescription:
        "إدارة موحدة للمشاريع والرواتب والمالية والصيانة والامتثال داخل بيئة تشغيل آمنة للشركة.",
      featureSecurityTitle: "صلاحيات محمية بالأدوار",
      featureSecurityDesc: "حماية على مستوى الصفحات والإجراءات حسب السياسة.",
      featureLiveDataTitle: "بيانات تشغيلية مباشرة",
      featureLiveDataDesc: "تحديثات لحظية عبر الموديولات والتقارير.",
      featureEnterpriseTitle: "جاهز للمؤسسات",
      featureEnterpriseDesc: "مصمم للتوسع والتدقيق والحوكمة التشغيلية.",
    },
  },

  logout: {
    title: "تسجيل الخروج",
    confirm: "هل أنت متأكد من تسجيل الخروج؟",
    success: "تم تسجيل الخروج بنجاح",
    error: "حدث خطأ أثناء تسجيل الخروج",
  },

  changePassword: {
    title: "تغيير كلمة المرور",
    subtitle: "قم بتحديث كلمة المرور الخاصة بك",
    info: "سيتم إنهاء جميع جلساتك النشطة وستحتاج لتسجيل الدخول مرة أخرى",
    currentPassword: "كلمة المرور الحالية",
    currentPasswordPlaceholder: "أدخل كلمة المرور الحالية",
    newPassword: "كلمة المرور الجديدة",
    newPasswordPlaceholder: "أدخل كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    confirmPasswordPlaceholder: "أعد إدخال كلمة المرور الجديدة",
    passwordRequirements:
      "8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص",
    submit: "تغيير كلمة المرور",
    cancel: "إلغاء",

    success: "تم تغيير كلمة المرور بنجاح",
    pleaseLoginAgain: "يرجى تسجيل الدخول مرة أخرى بكلمة المرور الجديدة",
    error: "فشل تغيير كلمة المرور",
    invalidCurrentPassword: "كلمة المرور الحالية غير صحيحة",
    weakPassword:
      "كلمة المرور ضعيفة. استخدم أحرفًا كبيرة وصغيرة وأرقامًا ورموزًا",
    passwordsNotMatch: "كلمتا المرور غير متطابقتين",

    validation: {
      currentPasswordRequired: "كلمة المرور الحالية مطلوبة",
      newPasswordRequired: "كلمة المرور الجديدة مطلوبة",
      newPasswordMin: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
      newPasswordStrong:
        "يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص",
      confirmPasswordRequired: "تأكيد كلمة المرور مطلوب",
      passwordsNotMatch: "كلمتا المرور غير متطابقتين",
      sameAsOld: "كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة",
    },

    helpSteps: {
      step1: "أدخل كلمة المرور الحالية",
      step2: "أدخل كلمة مرور جديدة قوية (8 أحرف على الأقل)",
      step3: "يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص",
      step4: "أعد إدخال كلمة المرور للتأكيد",
      step5: "اضغط حفظ لتطبيق التغييرات",
    },
  },

  resetUserPassword: {
    title: "إعادة تعيين كلمة المرور",
    description: "إعادة تعيين كلمة المرور للمستخدم: {{user}}",
    info: "سيتم إلغاء جميع جلسات المستخدم النشطة وسيحتاج لتسجيل الدخول مرة أخرى",
    newPassword: "كلمة المرور الجديدة",
    newPasswordPlaceholder: "أدخل كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    confirmPasswordPlaceholder: "أعد إدخال كلمة المرور",
    passwordRequirements:
      "8 أحرف على الأقل، حرف كبير، حرف صغير، رقم، ورمز خاص",
    submit: "إعادة التعيين",

    success: "تمت إعادة تعيين كلمة المرور بنجاح",
    error: "فشلت إعادة تعيين كلمة المرور",
    forbidden: "غير مصرح - لا يمكنك إعادة تعيين كلمة مرور هذا المستخدم",
    userNotFound: "المستخدم غير موجود",
    weakPassword: "كلمة المرور لا تلبي متطلبات الأمان",
    sameAsCurrent: "كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية",

    validation: {
      newPasswordRequired: "كلمة المرور الجديدة مطلوبة",
      newPasswordMin: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
      newPasswordStrong:
        "يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص",
      confirmPasswordRequired: "تأكيد كلمة المرور مطلوب",
      passwordsNotMatch: "كلمتا المرور غير متطابقتين",
    },
  },

  unlockAccount: {
    title: "فتح الحساب",
    confirm: "هل أنت متأكد من فتح هذا الحساب؟",
    confirmDescription: "سيتمكن المستخدم من تسجيل الدخول مباشرة",
    submit: "فتح الحساب",
    cancel: "إلغاء",

    success: "تم فتح الحساب بنجاح",
    error: "فشل فتح الحساب",
    unauthorized: "ليس لديك صلاحية لفتح الحسابات",
    userNotFound: "المستخدم غير موجود",
  },

  sessions: {
    forceLogoutUserSuccess: "تم تسجيل خروج المستخدم إجباريًا من جميع الأجهزة",
    forceLogoutUserError: "فشل تسجيل خروج المستخدم إجباريًا",
    forceLogoutUserInvalid:
      "معرّف المستخدم غير صالح أو لا يمكنك تسجيل خروج نفسك إجباريًا",
    forceLogoutUserForbidden:
      "الصلاحيات غير كافية. يلزم ADMIN أو SUPERADMIN",
    userNotFound: "المستخدم غير موجود",
    forceLogoutAllSuccess:
      "تم تسجيل خروج جميع المستخدمين إجباريًا. المتأثرون: {{users}} مستخدم، {{sessions}} جلسة",
    forceLogoutAllError: "فشل تسجيل خروج جميع المستخدمين إجباريًا",
    forceLogoutAllForbidden:
      "فقط SUPERADMIN يمكنه تسجيل خروج جميع المستخدمين إجباريًا",
  },

  apiErrors: {
    requestTimeout: "انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.",
    networkUnavailable:
      "تعذر الاتصال بالخادم. تحقق من الشبكة ثم أعد المحاولة.",
    conflictNationalId: "رقم الهوية الوطنية مسجل مسبقًا في النظام",
    conflictEmployeeNumber: "رقم الموظف موجود مسبقًا",
    conflictEmail: "البريد الإلكتروني مسجل لموظف آخر",
    conflictPhone: "رقم الهاتف مسجل لموظف آخر",
    forbiddenRead: "ليس لديك صلاحية للوصول إلى هذه البيانات",
    forbiddenResource: "ليس لديك صلاحية للوصول إلى هذا المورد",
    forbiddenAction: "ليس لديك صلاحية لتنفيذ هذه العملية",
    resourceNotFound: "المورد المطلوب غير موجود",
    serverError: "حدث خطأ في الخادم. يرجى المحاولة لاحقًا.",
  },

  refreshToken: {
    error: "انتهت جلستك. سجّل الدخول مرة أخرى",
    expired: "انتهت صلاحية الجلسة",
  },

  profile: {
    title: "الملف الشخصي",
    email: "البريد الإلكتروني",
    firstName: "الاسم الأول",
    lastName: "الاسم الأخير",
    phone: "رقم الهاتف",
    roles: "الأدوار",
    status: "الحالة",
    active: "نشط",
    inactive: "غير نشط",
    lastLogin: "آخر تسجيل دخول",
    createdAt: "تاريخ الإنشاء",
  },

  security: {
    title: "أمان الحساب",
    failedAttempts: "محاولات فاشلة",
    lastFailedLogin: "آخر محاولة فاشلة",
    lockedUntil: "مقفل حتى",
    permanentlyLocked: "مقفل بشكل دائم",
    unlockAttempts: "محاولات فتح الحساب",
  },

  userProfile: {
    title: "الملف الشخصي",
    subtitle: "عرض وإدارة معلوماتك الشخصية",
    personalInfo: "المعلومات الشخصية",
    personalInfoDescription: "معلوماتك الأساسية والبيانات الشخصية",
    organizationInfo: "معلومات المؤسسة",
    organizationInfoDescription: "دورك وقسمك في المؤسسة",
    accountInfo: "معلومات الحساب",
    accountInfoDescription: "تفاصيل حسابك ونشاطك",
    security: "الأمان",
    securityDescription: "إدارة إعدادات أمان حسابك",

    firstName: "الاسم الأول",
    lastName: "الاسم الأخير",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    nationalId: "الرقم القومي",
    address: "العنوان",
    role: "الدور",
    department: "القسم",
    jobTitle: "المسمى الوظيفي",
    status: "الحالة",
    active: "نشط",
    inactive: "غير نشط",
    createdAt: "تاريخ الإنشاء",
    lastLogin: "آخر تسجيل دخول",

    changePassword: "تغيير كلمة المرور",
    changePasswordDescription:
      "قم بتحديث كلمة المرور الخاصة بك للحفاظ على أمان حسابك",
    changePasswordButton: "تغيير كلمة المرور",

    changePhoto: "تغيير الصورة",
    uploadButton: "رفع الصورة",
    removePhoto: "حذف الصورة",
    invalidImageType: "يرجى اختيار ملف صورة فقط (JPG, PNG)",
    imageTooLarge: "حجم الصورة يجب أن يكون أقل من 5 ميجابايت",
    profilePictureUpdated: "تم تحديث الصورة الشخصية بنجاح",
    profilePictureDeleted: "تم حذف الصورة الشخصية بنجاح",
    uploadFailed: "فشل رفع الصورة الشخصية",
    deleteFailed: "فشل حذف الصورة الشخصية",
  },

  common: {
    loading: "جارٍ التحميل...",
    submitting: "جارٍ الحفظ...",
    save: "حفظ",
    cancel: "إلغاء",
    confirm: "تأكيد",
    back: "رجوع",
    continue: "متابعة",
    notAvailable: "غير متوفر",
    pleaseLogin: "يرجى تسجيل الدخول للوصول إلى هذه الصفحة",
    loadingProfile: "جارٍ تحميل الملف الشخصي...",
  },
};
