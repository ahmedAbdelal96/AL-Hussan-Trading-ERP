/**
 * ============================================================================
 * REFERENCE DATA CONSTANTS - Real Estate & Construction Company (Saudi Arabia)
 * ============================================================================
 *
 * Static reference data for departments, positions, and other lookup values.
 * Used across frontend and backend for consistent data entry.
 *
 * USAGE:
 * - Backend: Validation and dropdown options
 * - Frontend: Combobox options (user can select or type custom value)
 *
 * SYNC: Keep this file identical across backend and frontend
 * ============================================================================
 */

// ============================================================================
// ============================================================================

export const ASSET_CATEGORIES = [
  // Vehicles
  {
    value: "LIGHT_VEHICLES",
    labelEn: "Light Vehicles",
    labelAr: "مركبات خفيفة",
  },
  {
    value: "HEAVY_VEHICLES",
    labelEn: "Heavy Vehicles",
    labelAr: "مركبات ثقيلة",
  },
  { value: "TRUCKS", labelEn: "Trucks", labelAr: "شاحنات" },

  // Heavy Equipment
  { value: "EXCAVATORS", labelEn: "Excavators", labelAr: "حفارات" },
  { value: "LOADERS", labelEn: "Loaders", labelAr: "لودرات" },
  { value: "CRANES", labelEn: "Cranes", labelAr: "رافعات" },
  { value: "BULLDOZERS", labelEn: "Bulldozers", labelAr: "جرافات" },
  {
    value: "CONCRETE_MIXERS",
    labelEn: "Concrete Mixers",
    labelAr: "خلاطات خرسانة",
  },

  // Tools & Machinery
  { value: "POWER_TOOLS", labelEn: "Power Tools", labelAr: "أدوات كهربائية" },
  { value: "HAND_TOOLS", labelEn: "Hand Tools", labelAr: "أدوات يدوية" },
  { value: "GENERATORS", labelEn: "Generators", labelAr: "مولدات كهربائية" },
  { value: "COMPRESSORS", labelEn: "Compressors", labelAr: "ضواغط هواء" },

  // IT Equipment
  { value: "COMPUTERS", labelEn: "Computers", labelAr: "أجهزة كمبيوتر" },
  { value: "LAPTOPS", labelEn: "Laptops", labelAr: "أجهزة لابتوب" },
  {
    value: "PRINTERS",
    labelEn: "Printers & Scanners",
    labelAr: "طابعات وماسحات",
  },
  {
    value: "NETWORK_EQUIPMENT",
    labelEn: "Network Equipment",
    labelAr: "معدات شبكات",
  },

  // Furniture & Office
  {
    value: "OFFICE_FURNITURE",
    labelEn: "Office Furniture",
    labelAr: "أثاث مكتبي",
  },
  { value: "SITE_FURNITURE", labelEn: "Site Furniture", labelAr: "أثاث مواقع" },

  // Safety Equipment
  {
    value: "SAFETY_EQUIPMENT",
    labelEn: "Safety Equipment",
    labelAr: "معدات السلامة",
  },
];

// ============================================================================
// ============================================================================

export const DEPARTMENTS = [
  // Core Departments
  {
    code: "PROJECTS",
    nameAr: "إدارة المشاريع",
    nameEn: "Project Management",
    description: "تخطيط وإدارة وتنفيذ المشاريع العقارية والإنشائية",
  },
  {
    code: "ENGINEERING",
    nameAr: "الهندسة والمكتب الفني",
    nameEn: "Engineering & Technical Office",
    description: "التصاميم والمخططات والإشراف الهندسي",
  },
  {
    code: "OPERATIONS",
    nameAr: "العمليات",
    nameEn: "Operations",
    description: "إدارة العمليات اليومية والتشغيلية",
  },
  {
    code: "CONSTRUCTION",
    nameAr: "التنفيذ والإنشاءات",
    nameEn: "Construction & Execution",
    description: "تنفيذ الأعمال الإنشائية في المواقع",
  },

  // Support Departments
  {
    code: "FINANCE",
    nameAr: "المالية والمحاسبة",
    nameEn: "Finance & Accounting",
    description: "الحسابات والميزانيات والتقارير المالية",
  },
  {
    code: "HR",
    nameAr: "الموارد البشرية",
    nameEn: "Human Resources",
    description: "شؤون الموظفين والتوظيف والرواتب",
  },
  {
    code: "PROCUREMENT",
    nameAr: "المشتريات والمخازن",
    nameEn: "Procurement & Warehousing",
    description: "شراء المواد والمعدات وإدارة المخزون",
  },
  {
    code: "SALES",
    nameAr: "المبيعات والتسويق",
    nameEn: "Sales & Marketing",
    description: "بيع الوحدات العقارية والتسويق",
  },

  // Quality & Safety
  {
    code: "QC",
    nameAr: "مراقبة الجودة",
    nameEn: "Quality Control",
    description: "ضمان الجودة والمطابقة للمواصفات",
  },
  {
    code: "SAFETY",
    nameAr: "السلامة والصحة المهنية",
    nameEn: "Safety & Occupational Health",
    description: "السلامة في المواقع والصحة المهنية",
  },
  {
    code: "MAINTENANCE",
    nameAr: "الصيانة",
    nameEn: "Maintenance",
    description: "صيانة المعدات والمباني والمرافق",
  },

  // Technical & Support
  {
    code: "IT",
    nameAr: "تقنية المعلومات",
    nameEn: "Information Technology",
    description: "الأنظمة والبرمجيات والدعم التقني",
  },
  {
    code: "LEGAL",
    nameAr: "الشؤون القانونية",
    nameEn: "Legal Affairs",
    description: "العقود والاستشارات القانونية",
  },
  {
    code: "ADMIN",
    nameAr: "الشؤون الإدارية",
    nameEn: "Administration",
    description: "الخدمات الإدارية والعامة",
  },
  {
    code: "CUSTOMER_SERVICE",
    nameAr: "خدمة العملاء",
    nameEn: "Customer Service",
    description: "دعم وخدمة العملاء",
  },

  // Executive
  {
    code: "EXECUTIVE",
    nameAr: "الإدارة العليا",
    nameEn: "Executive Management",
    description: "مجلس الإدارة والإدارة التنفيذية",
  },
] as const;

// ============================================================================
// ============================================================================

export const POSITIONS = [
  // Executive Positions
  {
    code: "CEO",
    nameAr: "الرئيس التنفيذي",
    nameEn: "Chief Executive Officer",
    level: "executive",
  },
  {
    code: "GM",
    nameAr: "المدير العام",
    nameEn: "General Manager",
    level: "executive",
  },
  {
    code: "DEPUTY_GM",
    nameAr: "نائب المدير العام",
    nameEn: "Deputy General Manager",
    level: "executive",
  },

  // Senior Management
  {
    code: "DEPT_MGR",
    nameAr: "مدير إدارة",
    nameEn: "Department Manager",
    level: "senior",
  },
  {
    code: "PROJECT_MGR",
    nameAr: "مدير مشروع",
    nameEn: "Project Manager",
    level: "senior",
  },
  {
    code: "SENIOR_PROJECT_MGR",
    nameAr: "مدير مشروع أول",
    nameEn: "Senior Project Manager",
    level: "senior",
  },
  {
    code: "OPERATIONS_MGR",
    nameAr: "مدير عمليات",
    nameEn: "Operations Manager",
    level: "senior",
  },
  {
    code: "FINANCE_MGR",
    nameAr: "مدير مالي",
    nameEn: "Finance Manager",
    level: "senior",
  },

  // Engineering Positions
  {
    code: "CONSULTANT_ENG",
    nameAr: "مهندس استشاري",
    nameEn: "Consultant Engineer",
    level: "senior",
  },
  {
    code: "SENIOR_ENG",
    nameAr: "مهندس أول",
    nameEn: "Senior Engineer",
    level: "mid",
  },
  {
    code: "CIVIL_ENG",
    nameAr: "مهندس مدني",
    nameEn: "Civil Engineer",
    level: "mid",
  },
  {
    code: "ARCH_ENG",
    nameAr: "مهندس معماري",
    nameEn: "Architectural Engineer",
    level: "mid",
  },
  {
    code: "ELEC_ENG",
    nameAr: "مهندس كهرباء",
    nameEn: "Electrical Engineer",
    level: "mid",
  },
  {
    code: "MECH_ENG",
    nameAr: "مهندس ميكانيكا",
    nameEn: "Mechanical Engineer",
    level: "mid",
  },
  {
    code: "QC_ENG",
    nameAr: "مهندس جودة",
    nameEn: "Quality Control Engineer",
    level: "mid",
  },
  {
    code: "SAFETY_ENG",
    nameAr: "مهندس سلامة",
    nameEn: "Safety Engineer",
    level: "mid",
  },
  {
    code: "SITE_ENG",
    nameAr: "مهندس موقع",
    nameEn: "Site Engineer",
    level: "mid",
  },
  {
    code: "JUNIOR_ENG",
    nameAr: "مهندس مبتدئ",
    nameEn: "Junior Engineer",
    level: "junior",
  },

  // Technical Positions
  {
    code: "SITE_SUPERVISOR",
    nameAr: "مشرف موقع",
    nameEn: "Site Supervisor",
    level: "mid",
  },
  {
    code: "SURVEYOR",
    nameAr: "مساح",
    nameEn: "Surveyor",
    level: "mid",
  },
  {
    code: "QC_INSPECTOR",
    nameAr: "مراقب جودة",
    nameEn: "Quality Control Inspector",
    level: "mid",
  },
  {
    code: "SAFETY_OFFICER",
    nameAr: "مسؤول سلامة",
    nameEn: "Safety Officer",
    level: "mid",
  },
  {
    code: "FOREMAN",
    nameAr: "رئيس عمال",
    nameEn: "Foreman",
    level: "mid",
  },
  {
    code: "TECHNICIAN",
    nameAr: "فني",
    nameEn: "Technician",
    level: "junior",
  },
  {
    code: "ELECTRICIAN",
    nameAr: "كهربائي",
    nameEn: "Electrician",
    level: "junior",
  },
  {
    code: "PLUMBER",
    nameAr: "سباك",
    nameEn: "Plumber",
    level: "junior",
  },
  {
    code: "CARPENTER",
    nameAr: "نجار",
    nameEn: "Carpenter",
    level: "junior",
  },
  {
    code: "MASON",
    nameAr: "بناء",
    nameEn: "Mason",
    level: "junior",
  },
  {
    code: "PAINTER",
    nameAr: "دهان",
    nameEn: "Painter",
    level: "junior",
  },

  // Finance & Accounting
  {
    code: "CHIEF_ACCOUNTANT",
    nameAr: "كبير المحاسبين",
    nameEn: "Chief Accountant",
    level: "senior",
  },
  {
    code: "ACCOUNTANT",
    nameAr: "محاسب",
    nameEn: "Accountant",
    level: "mid",
  },
  {
    code: "FINANCIAL_ANALYST",
    nameAr: "محلل مالي",
    nameEn: "Financial Analyst",
    level: "mid",
  },
  {
    code: "COST_CONTROLLER",
    nameAr: "مراقب تكاليف",
    nameEn: "Cost Controller",
    level: "mid",
  },
  {
    code: "CASHIER",
    nameAr: "أمين صندوق",
    nameEn: "Cashier",
    level: "junior",
  },

  // HR & Admin
  {
    code: "HR_MANAGER",
    nameAr: "مدير موارد بشرية",
    nameEn: "HR Manager",
    level: "senior",
  },
  {
    code: "HR_SPECIALIST",
    nameAr: "أخصائي موارد بشرية",
    nameEn: "HR Specialist",
    level: "mid",
  },
  {
    code: "RECRUITER",
    nameAr: "أخصائي توظيف",
    nameEn: "Recruiter",
    level: "mid",
  },
  {
    code: "ADMIN_OFFICER",
    nameAr: "موظف إداري",
    nameEn: "Administrative Officer",
    level: "mid",
  },
  {
    code: "RECEPTIONIST",
    nameAr: "موظف استقبال",
    nameEn: "Receptionist",
    level: "junior",
  },

  // Procurement & Warehousing
  {
    code: "PROCUREMENT_MGR",
    nameAr: "مدير مشتريات",
    nameEn: "Procurement Manager",
    level: "senior",
  },
  {
    code: "BUYER",
    nameAr: "مسؤول مشتريات",
    nameEn: "Buyer",
    level: "mid",
  },
  {
    code: "WAREHOUSE_MGR",
    nameAr: "مدير مخازن",
    nameEn: "Warehouse Manager",
    level: "mid",
  },
  {
    code: "STOREKEEPER",
    nameAr: "أمين مخزن",
    nameEn: "Storekeeper",
    level: "junior",
  },

  // Sales & Marketing
  {
    code: "SALES_MGR",
    nameAr: "مدير مبيعات",
    nameEn: "Sales Manager",
    level: "senior",
  },
  {
    code: "SALES_REP",
    nameAr: "مندوب مبيعات",
    nameEn: "Sales Representative",
    level: "mid",
  },
  {
    code: "REAL_ESTATE_AGENT",
    nameAr: "وسيط عقاري",
    nameEn: "Real Estate Agent",
    level: "mid",
  },
  {
    code: "MARKETING_SPECIALIST",
    nameAr: "أخصائي تسويق",
    nameEn: "Marketing Specialist",
    level: "mid",
  },

  // IT
  {
    code: "IT_MGR",
    nameAr: "مدير تقنية معلومات",
    nameEn: "IT Manager",
    level: "senior",
  },
  {
    code: "SOFTWARE_DEV",
    nameAr: "مطور برمجيات",
    nameEn: "Software Developer",
    level: "mid",
  },
  {
    code: "IT_SUPPORT",
    nameAr: "دعم فني",
    nameEn: "IT Support",
    level: "junior",
  },

  // Legal & Customer Service
  {
    code: "LEGAL_ADVISOR",
    nameAr: "مستشار قانوني",
    nameEn: "Legal Advisor",
    level: "senior",
  },
  {
    code: "CUSTOMER_SERVICE_REP",
    nameAr: "موظف خدمة عملاء",
    nameEn: "Customer Service Representative",
    level: "mid",
  },

  // Labor & Support Staff
  {
    code: "DRIVER",
    nameAr: "سائق",
    nameEn: "Driver",
    level: "junior",
  },
  {
    code: "HEAVY_EQUIPMENT_OPERATOR",
    nameAr: "مشغل معدات ثقيلة",
    nameEn: "Heavy Equipment Operator",
    level: "mid",
  },
  {
    code: "WORKER",
    nameAr: "عامل",
    nameEn: "Worker",
    level: "junior",
  },
  {
    code: "SECURITY_GUARD",
    nameAr: "حارس أمن",
    nameEn: "Security Guard",
    level: "junior",
  },
  {
    code: "CLEANER",
    nameAr: "عامل نظافة",
    nameEn: "Cleaner",
    level: "junior",
  },
  {
    code: "OFFICE_BOY",
    nameAr: "عامل خدمات",
    nameEn: "Office Boy",
    level: "junior",
  },
] as const;

// ============================================================================
// ============================================================================

export const CURRENCIES = [
  { code: "SAR", nameAr: "ريال سعودي", nameEn: "Saudi Riyal", symbol: "ر.س" },
] as const;

// ============================================================================
// ============================================================================

export const NATIONALITIES = [
  { code: "SA", nameAr: "سعودي", nameEn: "Saudi" },
  { code: "EG", nameAr: "مصري", nameEn: "Egyptian" },
  { code: "PK", nameAr: "باكستاني", nameEn: "Pakistani" },
  { code: "IN", nameAr: "هندي", nameEn: "Indian" },
  { code: "BD", nameAr: "بنغالي", nameEn: "Bangladeshi" },
  { code: "PH", nameAr: "فلبيني", nameEn: "Filipino" },
  { code: "YE", nameAr: "يمني", nameEn: "Yemeni" },
  { code: "SD", nameAr: "سوداني", nameEn: "Sudanese" },
  { code: "SY", nameAr: "سوري", nameEn: "Syrian" },
  { code: "JO", nameAr: "أردني", nameEn: "Jordanian" },
  { code: "LB", nameAr: "لبناني", nameEn: "Lebanese" },
  { code: "IQ", nameAr: "عراقي", nameEn: "Iraqi" },
  { code: "NP", nameAr: "نيبالي", nameEn: "Nepali" },
  { code: "LK", nameAr: "سيريلانكي", nameEn: "Sri Lankan" },
  { code: "ET", nameAr: "إثيوبي", nameEn: "Ethiopian" },
  { code: "ER", nameAr: "إريتري", nameEn: "Eritrean" },
  { code: "SO", nameAr: "صومالي", nameEn: "Somali" },
  { code: "AE", nameAr: "إماراتي", nameEn: "Emirati" },
  { code: "KW", nameAr: "كويتي", nameEn: "Kuwaiti" },
  { code: "BH", nameAr: "بحريني", nameEn: "Bahraini" },
  { code: "QA", nameAr: "قطري", nameEn: "Qatari" },
  { code: "OM", nameAr: "عماني", nameEn: "Omani" },
] as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type DepartmentCode = (typeof DEPARTMENTS)[number]["code"];
export type PositionCode = (typeof POSITIONS)[number]["code"];
export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export type NationalityCode = (typeof NATIONALITIES)[number]["code"];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get department by code
 */
export function getDepartmentByCode(code: string) {
  return DEPARTMENTS.find((dept) => dept.code === code);
}

/**
 * Get position by code
 */
export function getPositionByCode(code: string) {
  return POSITIONS.find((pos) => pos.code === code);
}

/**
 * Get currency by code
 */
export function getCurrencyByCode(code: string) {
  return CURRENCIES.find((curr) => curr.code === code);
}

/**
 * Get nationality by code
 */
export function getNationalityByCode(code: string) {
  return NATIONALITIES.find((nat) => nat.code === code);
}

/**
 * Check if value is a valid department code
 */
export function isValidDepartmentCode(value: string): value is DepartmentCode {
  return DEPARTMENTS.some((dept) => dept.code === value);
}

/**
 * Check if value is a valid position code
 */
export function isValidPositionCode(value: string): value is PositionCode {
  return POSITIONS.some((pos) => pos.code === value);
}
