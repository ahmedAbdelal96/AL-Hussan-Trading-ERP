/**
 * Departments & Positions Seed Data
 * Must run BEFORE employees seed (employees depend on dept/pos IDs)
 *
 * 12 Departments  |  62 Positions
 */

import { PrismaClient } from '@prisma/client';

// ─────────────────────────────────────────────────────────────────────────────
// Department Definitions
// ─────────────────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  {
    code: 'EXEC_MGMT',
    nameAr: 'الإدارة العليا',
    nameEn: 'Executive Management',
  },
  { code: 'OPERATIONS', nameAr: 'العمليات', nameEn: 'Operations' },
  { code: 'FINANCE', nameAr: 'المالية', nameEn: 'Finance' },
  { code: 'HR', nameAr: 'الموارد البشرية', nameEn: 'Human Resources' },
  { code: 'ADMIN', nameAr: 'الإدارة', nameEn: 'Administration' },
  { code: 'ENGINEERING', nameAr: 'الهندسة', nameEn: 'Engineering' },
  { code: 'IT', nameAr: 'تقنية المعلومات', nameEn: 'IT' },
  { code: 'MAINTENANCE', nameAr: 'الصيانة', nameEn: 'Maintenance' },
  { code: 'CRUSHER', nameAr: 'قسم الكسارة', nameEn: 'Crusher Department' },
  { code: 'EQUIPMENT', nameAr: 'قسم المعدات', nameEn: 'Equipment Department' },
  { code: 'PROCUREMENT', nameAr: 'المشتريات', nameEn: 'Procurement' },
  { code: 'QUALITY', nameAr: 'الجودة', nameEn: 'Quality' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Position Definitions (department referenced by nameEn for readability)
// level: executive | senior | mid | junior
// ─────────────────────────────────────────────────────────────────────────────
const POSITIONS: {
  code: string;
  nameAr: string;
  nameEn: string;
  level: string;
  departmentEn: string;
}[] = [
  // ── Executive Management ──────────────────────────────────────────────────
  {
    code: 'GENERAL_MANAGER',
    nameAr: 'المدير العام',
    nameEn: 'General Manager',
    level: 'executive',
    departmentEn: 'Executive Management',
  },

  // ── Operations ────────────────────────────────────────────────────────────
  {
    code: 'CHIEF_OPS_OFFICER',
    nameAr: 'مدير العمليات',
    nameEn: 'Chief Operations Officer',
    level: 'executive',
    departmentEn: 'Operations',
  },
  {
    code: 'SR_SITE_SUPERVISOR',
    nameAr: 'مشرف الموقع الأول',
    nameEn: 'Senior Site Supervisor',
    level: 'senior',
    departmentEn: 'Operations',
  },
  {
    code: 'SR_SUPERVISOR',
    nameAr: 'المشرف الأول',
    nameEn: 'Senior Supervisor',
    level: 'senior',
    departmentEn: 'Operations',
  },
  {
    code: 'CONSTRUCTION_SUPV',
    nameAr: 'مشرف البناء',
    nameEn: 'Construction Supervisor',
    level: 'mid',
    departmentEn: 'Operations',
  },
  {
    code: 'SITE_SUPERVISOR',
    nameAr: 'مشرف الموقع',
    nameEn: 'Site Supervisor',
    level: 'mid',
    departmentEn: 'Operations',
  },
  {
    code: 'MEP_SUPERVISOR',
    nameAr: 'مشرف الميكانيك والكهرباء والسباكة',
    nameEn: 'MEP Supervisor',
    level: 'mid',
    departmentEn: 'Operations',
  },
  {
    code: 'CONCRETE_SUPV',
    nameAr: 'مشرف أعمال الخرسانة',
    nameEn: 'Concrete Works Supervisor',
    level: 'mid',
    departmentEn: 'Operations',
  },
  {
    code: 'FINISHING_SUPV',
    nameAr: 'مشرف أعمال التشطيب',
    nameEn: 'Finishing Supervisor',
    level: 'mid',
    departmentEn: 'Operations',
  },
  {
    code: 'SAFETY_SUPERVISOR',
    nameAr: 'مشرف السلامة',
    nameEn: 'Safety Supervisor',
    level: 'mid',
    departmentEn: 'Operations',
  },
  {
    code: 'CONSTRUCTION_WORKER',
    nameAr: 'عامل بناء',
    nameEn: 'Construction Worker',
    level: 'junior',
    departmentEn: 'Operations',
  },
  {
    code: 'CARPENTER',
    nameAr: 'نجار',
    nameEn: 'Carpenter',
    level: 'junior',
    departmentEn: 'Operations',
  },
  {
    code: 'CRANE_OPERATOR',
    nameAr: 'مشغل رافعة',
    nameEn: 'Crane Operator',
    level: 'junior',
    departmentEn: 'Operations',
  },
  {
    code: 'EXCAVATOR_OPERATOR',
    nameAr: 'مشغل حفارة',
    nameEn: 'Excavator Operator',
    level: 'junior',
    departmentEn: 'Operations',
  },
  {
    code: 'HEAVY_EQ_OPERATOR',
    nameAr: 'مشغل معدات ثقيلة',
    nameEn: 'Heavy Equipment Operator',
    level: 'junior',
    departmentEn: 'Operations',
  },
  {
    code: 'MASONRY_WORKER',
    nameAr: 'عامل بناء بالطوب',
    nameEn: 'Masonry Worker',
    level: 'junior',
    departmentEn: 'Operations',
  },
  {
    code: 'PAINTING_WORKER',
    nameAr: 'عامل دهان',
    nameEn: 'Painting Worker',
    level: 'junior',
    departmentEn: 'Operations',
  },
  {
    code: 'STEEL_FIXING_WORKER',
    nameAr: 'عامل حديد تسليح',
    nameEn: 'Steel Fixing Worker',
    level: 'junior',
    departmentEn: 'Operations',
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  {
    code: 'CFO',
    nameAr: 'المدير المالي التنفيذي',
    nameEn: 'Chief Financial Officer',
    level: 'executive',
    departmentEn: 'Finance',
  },
  {
    code: 'SR_ACCOUNTANT',
    nameAr: 'محاسب أول',
    nameEn: 'Senior Accountant',
    level: 'senior',
    departmentEn: 'Finance',
  },
  {
    code: 'ACCOUNTANT',
    nameAr: 'محاسب',
    nameEn: 'Accountant',
    level: 'mid',
    departmentEn: 'Finance',
  },

  // ── Human Resources ───────────────────────────────────────────────────────
  {
    code: 'HR_MANAGER',
    nameAr: 'مدير الموارد البشرية',
    nameEn: 'HR Manager',
    level: 'executive',
    departmentEn: 'Human Resources',
  },
  {
    code: 'HR_SPECIALIST',
    nameAr: 'أخصائي موارد بشرية',
    nameEn: 'HR Specialist',
    level: 'mid',
    departmentEn: 'Human Resources',
  },
  {
    code: 'HR_COORDINATOR',
    nameAr: 'منسق موارد بشرية',
    nameEn: 'HR Coordinator',
    level: 'mid',
    departmentEn: 'Human Resources',
  },

  // ── Administration ────────────────────────────────────────────────────────
  {
    code: 'OFFICE_MANAGER',
    nameAr: 'مدير المكتب',
    nameEn: 'Office Manager',
    level: 'senior',
    departmentEn: 'Administration',
  },
  {
    code: 'ADMIN_ASSISTANT',
    nameAr: 'مساعد إداري',
    nameEn: 'Administrative Assistant',
    level: 'junior',
    departmentEn: 'Administration',
  },

  // ── Engineering ───────────────────────────────────────────────────────────
  {
    code: 'SR_CIVIL_ENG',
    nameAr: 'مهندس مدني أول',
    nameEn: 'Senior Civil Engineer',
    level: 'senior',
    departmentEn: 'Engineering',
  },
  {
    code: 'SR_STRUCTURAL_ENG',
    nameAr: 'مهندس إنشائي أول',
    nameEn: 'Senior Structural Engineer',
    level: 'senior',
    departmentEn: 'Engineering',
  },
  {
    code: 'CIVIL_ENG',
    nameAr: 'مهندس مدني',
    nameEn: 'Civil Engineer',
    level: 'mid',
    departmentEn: 'Engineering',
  },
  {
    code: 'STRUCTURAL_ENG',
    nameAr: 'مهندس إنشائي',
    nameEn: 'Structural Engineer',
    level: 'mid',
    departmentEn: 'Engineering',
  },
  {
    code: 'ARCH_ENG',
    nameAr: 'مهندس معماري',
    nameEn: 'Architectural Engineer',
    level: 'mid',
    departmentEn: 'Engineering',
  },
  {
    code: 'ELECTRICAL_ENG',
    nameAr: 'مهندس كهربائي',
    nameEn: 'Electrical Engineer',
    level: 'mid',
    departmentEn: 'Engineering',
  },
  {
    code: 'MECHANICAL_ENG',
    nameAr: 'مهندس ميكانيكي',
    nameEn: 'Mechanical Engineer',
    level: 'mid',
    departmentEn: 'Engineering',
  },
  {
    code: 'ENV_ENG',
    nameAr: 'مهندس بيئي',
    nameEn: 'Environmental Engineer',
    level: 'mid',
    departmentEn: 'Engineering',
  },
  {
    code: 'GEO_ENG',
    nameAr: 'مهندس جيوتقني',
    nameEn: 'Geotechnical Engineer',
    level: 'mid',
    departmentEn: 'Engineering',
  },
  {
    code: 'INTERIOR_ENG',
    nameAr: 'مهندس تصميم داخلي',
    nameEn: 'Interior Design Engineer',
    level: 'mid',
    departmentEn: 'Engineering',
  },
  {
    code: 'PROJECT_ENG',
    nameAr: 'مهندس مشاريع',
    nameEn: 'Project Engineer',
    level: 'mid',
    departmentEn: 'Engineering',
  },
  {
    code: 'MEP_COORDINATOR',
    nameAr: 'منسق الأعمال الميكانيكية والكهربائية',
    nameEn: 'MEP Coordinator',
    level: 'mid',
    departmentEn: 'Engineering',
  },

  // ── IT ────────────────────────────────────────────────────────────────────
  {
    code: 'IT_MANAGER',
    nameAr: 'مدير تقنية المعلومات',
    nameEn: 'IT Manager',
    level: 'executive',
    departmentEn: 'IT',
  },
  {
    code: 'SYSTEMS_ANALYST',
    nameAr: 'محلل أنظمة',
    nameEn: 'Systems Analyst',
    level: 'mid',
    departmentEn: 'IT',
  },

  // ── Maintenance ───────────────────────────────────────────────────────────
  {
    code: 'ELECTRICAL_TECH',
    nameAr: 'فني كهرباء',
    nameEn: 'Electrical Technician',
    level: 'junior',
    departmentEn: 'Maintenance',
  },
  {
    code: 'FIRE_SYS_TECH',
    nameAr: 'فني أنظمة إطفاء الحريق',
    nameEn: 'Fire Systems Technician',
    level: 'junior',
    departmentEn: 'Maintenance',
  },
  {
    code: 'HVAC_TECH',
    nameAr: 'فني تكييف وتهوية',
    nameEn: 'HVAC Technician',
    level: 'junior',
    departmentEn: 'Maintenance',
  },
  {
    code: 'INSTRUMENT_TECH',
    nameAr: 'فني أجهزة قياس',
    nameEn: 'Instrumentation Technician',
    level: 'junior',
    departmentEn: 'Maintenance',
  },
  {
    code: 'PLUMBING_TECH',
    nameAr: 'فني سباكة',
    nameEn: 'Plumbing Technician',
    level: 'junior',
    departmentEn: 'Maintenance',
  },
  {
    code: 'WELDING_TECH',
    nameAr: 'فني لحام',
    nameEn: 'Welding Technician',
    level: 'junior',
    departmentEn: 'Maintenance',
  },

  // ── Crusher Department ────────────────────────────────────────────────────
  {
    code: 'CRUSHER_SUPERVISOR',
    nameAr: 'مشرف كسارة',
    nameEn: 'Crusher Supervisor',
    level: 'mid',
    departmentEn: 'Crusher Department',
  },
  {
    code: 'CRUSHER_OPERATOR',
    nameAr: 'مشغل كسارة',
    nameEn: 'Crusher Operator',
    level: 'junior',
    departmentEn: 'Crusher Department',
  },
  {
    code: 'CRUSHER_WORKER',
    nameAr: 'عمال كسارة',
    nameEn: 'Crusher Worker',
    level: 'junior',
    departmentEn: 'Crusher Department',
  },
  {
    code: 'CRUSHER_TIRE_TECH',
    nameAr: 'بنشري كسارة',
    nameEn: 'Crusher Tire Technician',
    level: 'junior',
    departmentEn: 'Crusher Department',
  },
  {
    code: 'CRUSHER_GUARD',
    nameAr: 'حارس كسارة',
    nameEn: 'Crusher Guard',
    level: 'junior',
    departmentEn: 'Crusher Department',
  },

  // ── Equipment Department ──────────────────────────────────────────────────
  {
    code: 'EQUIPMENT_SUPERVISOR',
    nameAr: 'مشرف معدات',
    nameEn: 'Equipment Supervisor',
    level: 'mid',
    departmentEn: 'Equipment Department',
  },
  {
    code: 'BOWSER_DRIVER',
    nameAr: 'سائق بوزر',
    nameEn: 'Bowser Driver',
    level: 'junior',
    departmentEn: 'Equipment Department',
  },
  {
    code: 'BACKHOE_DRIVER',
    nameAr: 'سائق بوكلين',
    nameEn: 'Backhoe Driver',
    level: 'junior',
    departmentEn: 'Equipment Department',
  },
  {
    code: 'BULLDOZER_DRIVER',
    nameAr: 'سائق بلدوزر',
    nameEn: 'Bulldozer Driver',
    level: 'junior',
    departmentEn: 'Equipment Department',
  },
  {
    code: 'LOADER_DRIVER',
    nameAr: 'سائق شيول',
    nameEn: 'Loader Driver',
    level: 'junior',
    departmentEn: 'Equipment Department',
  },
  {
    code: 'TRAILER_DRIVER',
    nameAr: 'سائق تريلا',
    nameEn: 'Trailer Driver',
    level: 'junior',
    departmentEn: 'Equipment Department',
  },

  // ── Procurement ───────────────────────────────────────────────────────────
  {
    code: 'PROCUREMENT_MGR',
    nameAr: 'مدير المشتريات',
    nameEn: 'Procurement Manager',
    level: 'executive',
    departmentEn: 'Procurement',
  },
  {
    code: 'PROCUREMENT_SPEC',
    nameAr: 'أخصائي مشتريات',
    nameEn: 'Procurement Specialist',
    level: 'mid',
    departmentEn: 'Procurement',
  },

  // ── Quality ───────────────────────────────────────────────────────────────
  {
    code: 'QAQC_SUPERVISOR',
    nameAr: 'مشرف ضمان وضبط الجودة',
    nameEn: 'QA/QC Supervisor',
    level: 'senior',
    departmentEn: 'Quality',
  },
  {
    code: 'QUALITY_SUPERVISOR',
    nameAr: 'مشرف الجودة',
    nameEn: 'Quality Supervisor',
    level: 'senior',
    departmentEn: 'Quality',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
export async function seedDepartmentsAndPositions(prisma: PrismaClient) {
  console.log('  Seeding Departments & Positions...');

  // ── Upsert departments ──────────────────────────────────────────────────
  const deptRecords: Record<string, string> = {}; // nameEn -> id

  for (const d of DEPARTMENTS) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: { nameAr: d.nameAr, nameEn: d.nameEn, isActive: true },
      create: {
        code: d.code,
        nameAr: d.nameAr,
        nameEn: d.nameEn,
        isActive: true,
      },
    });
    deptRecords[d.nameEn] = dept.id;
  }

  // ── Upsert positions ────────────────────────────────────────────────────
  const posRecords: Record<string, string> = {}; // nameEn -> id

  for (const p of POSITIONS) {
    const departmentId = deptRecords[p.departmentEn] ?? null;
    const pos = await prisma.position.upsert({
      where: { code: p.code },
      update: {
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        level: p.level,
        departmentId,
        isActive: true,
      },
      create: {
        code: p.code,
        nameAr: p.nameAr,
        nameEn: p.nameEn,
        level: p.level,
        departmentId,
        isActive: true,
      },
    });
    posRecords[p.nameEn] = pos.id;
  }

  console.log(
    `  ✅ ${Object.keys(deptRecords).length} Departments, ${Object.keys(posRecords).length} Positions seeded`,
  );

  return {
    /** Map: department nameEn → department id */
    deptMap: deptRecords,
    /** Map: position nameEn → position id */
    posMap: posRecords,
  };
}
