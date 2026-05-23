/**
 * Payroll Seed Data
 * - Covers all active employees with realistic payroll inputs
 * - Creates: salary baseline, allowance types, approved allowances, loans, deductions
 * - Dates are crafted to support monthly payroll report/testing scenarios
 */

import {
  AllowanceFrequency,
  DeductionStatus,
  DeductionType,
  EmployeeStatus,
  EmploymentType,
  LoanStatus,
  PrismaClient,
} from '@prisma/client';

const PAYROLL_SEED_TAG = 'SEED:PAYROLL-V2-AR';
const PERIOD_MONTHS = [
  new Date('2026-01-01'),
  new Date('2026-02-01'),
  new Date('2026-03-01'),
];

type RoleBand =
  | 'EXECUTIVE'
  | 'MANAGER'
  | 'SENIOR'
  | 'ENGINEER'
  | 'SUPERVISOR'
  | 'TECHNICAL'
  | 'STAFF';

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function classifyRole(positionName: string): RoleBand {
  const p = (positionName || '').toLowerCase();

  if (p.includes('chief') || p.includes('general manager')) return 'EXECUTIVE';
  if (p.includes('manager')) return 'MANAGER';
  if (p.includes('senior')) return 'SENIOR';
  if (p.includes('engineer')) return 'ENGINEER';
  if (p.includes('supervisor') || p.includes('foreman')) return 'SUPERVISOR';
  if (p.includes('technician') || p.includes('operator') || p.includes('welder'))
    return 'TECHNICAL';
  return 'STAFF';
}

function numericSeed(employeeNumber: string): number {
  const n = Number((employeeNumber || '').split('-').pop() || 0);
  return Number.isFinite(n) ? n : 0;
}

function salaryRangeByRole(role: RoleBand): [number, number] {
  switch (role) {
    case 'EXECUTIVE':
      return [32000, 42000];
    case 'MANAGER':
      return [18000, 29000];
    case 'SENIOR':
      return [14000, 22000];
    case 'ENGINEER':
      return [10500, 18000];
    case 'SUPERVISOR':
      return [9000, 14500];
    case 'TECHNICAL':
      return [7000, 12000];
    default:
      return [5000, 9500];
  }
}

function pickInRange(min: number, max: number, seed: number): number {
  const span = max - min;
  const ratio = (seed % 17) / 16;
  return round2(min + span * ratio);
}

function gosiRateByEmploymentType(type: EmploymentType): number {
  if (type === EmploymentType.PART_TIME) return 0.05;
  return 0.09;
}

function insuranceAmountByRole(role: RoleBand): number {
  switch (role) {
    case 'EXECUTIVE':
      return 480;
    case 'MANAGER':
      return 360;
    case 'SENIOR':
      return 300;
    case 'ENGINEER':
      return 260;
    case 'SUPERVISOR':
      return 230;
    case 'TECHNICAL':
      return 190;
    default:
      return 160;
  }
}

function housingRateByRole(role: RoleBand): number {
  switch (role) {
    case 'EXECUTIVE':
      return 0.2;
    case 'MANAGER':
      return 0.18;
    case 'SENIOR':
      return 0.16;
    case 'ENGINEER':
      return 0.14;
    case 'SUPERVISOR':
      return 0.12;
    default:
      return 0.1;
  }
}

function transportRateByRole(role: RoleBand): number {
  switch (role) {
    case 'EXECUTIVE':
      return 0.07;
    case 'MANAGER':
      return 0.065;
    case 'SENIOR':
      return 0.06;
    case 'ENGINEER':
      return 0.058;
    case 'SUPERVISOR':
      return 0.055;
    default:
      return 0.05;
  }
}

function foodDailyByRole(role: RoleBand): number {
  switch (role) {
    case 'EXECUTIVE':
      return 60;
    case 'MANAGER':
      return 55;
    case 'SENIOR':
      return 50;
    case 'ENGINEER':
      return 45;
    case 'SUPERVISOR':
      return 42;
    default:
      return 38;
  }
}

export async function seedPayroll(
  prisma: PrismaClient,
  _employees: any[],
  createdBy: string,
) {
  console.log('💰 Seeding Payroll Data...');

  // 1) Allowance types (names kept canonical for calculation engine consistency)
  const allowanceTypesInput = [
    {
      key: 'housing',
      name: 'Housing Allowance',
      description: 'بدل سكن شهري للموظفين حسب الدرجة الوظيفية',
      isActive: true,
    },
    {
      key: 'transport',
      name: 'Transport Allowance',
      description: 'بدل مواصلات شهري',
      isActive: true,
    },
    {
      key: 'food',
      name: 'Food Allowance',
      description: 'بدل طعام يومي (يحوّل شهريا في محرك الرواتب)',
      isActive: true,
    },
    {
      key: 'site',
      name: 'Site Allowance',
      description: 'بدل موقع ميداني للمشاريع',
      isActive: true,
    },
    {
      key: 'performance',
      name: 'Performance Bonus',
      description: 'مكافأة أداء دورية',
      isActive: true,
    },
    {
      key: 'communication',
      name: 'Communication Allowance',
      description: 'بدل اتصالات شهري',
      isActive: true,
    },
  ] as const;

  const allowanceTypes = new Map<string, string>();
  for (const item of allowanceTypesInput) {
    const type = await prisma.allowanceType.upsert({
      where: { name: item.name },
      update: {
        description: item.description,
        isActive: true,
      },
      create: {
        name: item.name,
        description: item.description,
        isActive: item.isActive,
        createdBy,
      },
      select: { id: true, name: true },
    });
    allowanceTypes.set(item.key, type.id);
  }

  // 2) Load employees with role context
  const employees = await prisma.employee.findMany({
    where: {
      deletedAt: null,
      status: EmployeeStatus.ACTIVE,
    },
    select: {
      id: true,
      employeeNumber: true,
      firstName: true,
      lastName: true,
      baseSalary: true,
      employmentType: true,
      position: { select: { nameEn: true, nameAr: true } },
      department: { select: { nameEn: true, nameAr: true } },
    },
    orderBy: { employeeNumber: 'asc' },
  });

  if (employees.length === 0) {
    console.warn('⚠ No active employees found for payroll seed');
    return;
  }

  // 3) Salary baseline + salary history
  const salaryMap = new Map<string, number>();
  for (const employee of employees) {
    const role = classifyRole(
      employee.position?.nameEn || employee.position?.nameAr || '',
    );
    const [minSalary, maxSalary] = salaryRangeByRole(role);
    const seed = numericSeed(employee.employeeNumber);
    let salary = pickInRange(minSalary, maxSalary, seed);

    if (employee.employmentType === EmploymentType.PART_TIME) {
      salary = round2(salary * 0.55);
    }
    if (employee.employmentType === EmploymentType.CONTRACT) {
      salary = round2(salary * 0.9);
    }

    const baseBefore = Number(employee.baseSalary || 0);
    await prisma.employee.update({
      where: { id: employee.id },
      data: { baseSalary: salary },
    });

    await prisma.salaryHistory.create({
      data: {
        employeeId: employee.id,
        baseSalaryBefore: baseBefore,
        baseSalaryAfter: salary,
        reason: `تهيئة راتب أساسي تشغيلي (${PAYROLL_SEED_TAG})`,
        source: 'MIGRATION',
        changedBy: createdBy,
      },
    });

    salaryMap.set(employee.id, salary);
  }

  // 4) Employee allowances (approved + production-like date ranges)
  const allowanceRows: any[] = [];
  for (const employee of employees) {
    const role = classifyRole(
      employee.position?.nameEn || employee.position?.nameAr || '',
    );
    const salary = salaryMap.get(employee.id) || 0;

    const housing = round2(Math.max(900, salary * housingRateByRole(role)));
    const transport = round2(Math.max(500, salary * transportRateByRole(role)));
    const foodDaily = foodDailyByRole(role);
    const siteAllowance =
      role === 'ENGINEER' || role === 'SUPERVISOR' || role === 'TECHNICAL'
        ? round2(700 + (numericSeed(employee.employeeNumber) % 6) * 120)
        : 0;
    const communication =
      role === 'EXECUTIVE' || role === 'MANAGER' || role === 'ENGINEER'
        ? round2(250 + (numericSeed(employee.employeeNumber) % 4) * 75)
        : 0;
    const performanceQuarterly =
      role === 'EXECUTIVE' || role === 'MANAGER' || role === 'SENIOR'
        ? round2(2500 + (numericSeed(employee.employeeNumber) % 5) * 700)
        : 0;

    if (allowanceTypes.get('housing')) {
      allowanceRows.push({
        employeeId: employee.id,
        allowanceTypeId: allowanceTypes.get('housing'),
        amount: housing,
        frequency: AllowanceFrequency.MONTHLY,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: null,
        status: 'APPROVED',
        approvedBy: createdBy,
        approvedAt: new Date('2025-01-01'),
        notes: `${PAYROLL_SEED_TAG}: بدل سكن`,
        createdBy,
      });
    }

    if (allowanceTypes.get('transport')) {
      allowanceRows.push({
        employeeId: employee.id,
        allowanceTypeId: allowanceTypes.get('transport'),
        amount: transport,
        frequency: AllowanceFrequency.MONTHLY,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: null,
        status: 'APPROVED',
        approvedBy: createdBy,
        approvedAt: new Date('2025-01-01'),
        notes: `${PAYROLL_SEED_TAG}: بدل مواصلات`,
        createdBy,
      });
    }

    if (allowanceTypes.get('food')) {
      allowanceRows.push({
        employeeId: employee.id,
        allowanceTypeId: allowanceTypes.get('food'),
        amount: foodDaily,
        frequency: AllowanceFrequency.DAILY,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: null,
        status: 'APPROVED',
        approvedBy: createdBy,
        approvedAt: new Date('2025-01-01'),
        notes: `${PAYROLL_SEED_TAG}: بدل طعام`,
        createdBy,
      });
    }

    if (siteAllowance > 0 && allowanceTypes.get('site')) {
      allowanceRows.push({
        employeeId: employee.id,
        allowanceTypeId: allowanceTypes.get('site'),
        amount: siteAllowance,
        frequency: AllowanceFrequency.MONTHLY,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: null,
        status: 'APPROVED',
        approvedBy: createdBy,
        approvedAt: new Date('2025-01-01'),
        notes: `${PAYROLL_SEED_TAG}: بدل موقع`,
        createdBy,
      });
    }

    if (communication > 0 && allowanceTypes.get('communication')) {
      allowanceRows.push({
        employeeId: employee.id,
        allowanceTypeId: allowanceTypes.get('communication'),
        amount: communication,
        frequency: AllowanceFrequency.MONTHLY,
        effectiveFrom: new Date('2025-06-01'),
        effectiveTo: null,
        status: 'APPROVED',
        approvedBy: createdBy,
        approvedAt: new Date('2025-06-01'),
        notes: `${PAYROLL_SEED_TAG}: بدل اتصالات`,
        createdBy,
      });
    }

    if (performanceQuarterly > 0 && allowanceTypes.get('performance')) {
      allowanceRows.push({
        employeeId: employee.id,
        allowanceTypeId: allowanceTypes.get('performance'),
        amount: performanceQuarterly,
        frequency: AllowanceFrequency.QUARTERLY,
        effectiveFrom: new Date('2025-01-01'),
        effectiveTo: null,
        status: 'APPROVED',
        approvedBy: createdBy,
        approvedAt: new Date('2025-01-01'),
        notes: `${PAYROLL_SEED_TAG}: مكافأة أداء`,
        createdBy,
      });
    }
  }

  await prisma.employeeAllowance.createMany({
    data: allowanceRows,
  });

  // 5) Loans (subset of employees, with realistic schedule)
  const loanRows: any[] = [];
  const rolePriority = new Set<RoleBand>([
    'EXECUTIVE',
    'MANAGER',
    'SENIOR',
    'ENGINEER',
  ]);

  const loanCandidates = employees.filter((employee, idx) => {
    const role = classifyRole(
      employee.position?.nameEn || employee.position?.nameAr || '',
    );
    return rolePriority.has(role) || idx % 7 === 0;
  });

  const selectedLoanEmployees = loanCandidates.slice(0, Math.min(16, loanCandidates.length));

  for (let idx = 0; idx < selectedLoanEmployees.length; idx++) {
    const employee = selectedLoanEmployees[idx];
    const role = classifyRole(
      employee.position?.nameEn || employee.position?.nameAr || '',
    );
    const salary = salaryMap.get(employee.id) || 9000;
    const startDate = addMonths(new Date('2025-01-01'), idx % 6);

    const installments =
      role === 'EXECUTIVE' || role === 'MANAGER' ? 24 : role === 'SENIOR' ? 18 : 12;
    const amount = round2(
      Math.max(12000, Math.min(95000, salary * (role === 'EXECUTIVE' ? 3 : 2.2))),
    );
    const installmentAmount = round2(amount / installments);
    const paidInstallments = Math.min(
      installments - 1,
      3 + (numericSeed(employee.employeeNumber) % 7),
    );
    const remainingAmount = round2(Math.max(0, amount - installmentAmount * paidInstallments));
    const endDate = addMonths(startDate, installments - 1);

    const purposes = [
      'ترميم منزل الأسرة',
      'مصاريف تعليم الأبناء',
      'شراء سيارة عائلية',
      'التزامات طبية طارئة',
      'تجهيز سكن جديد',
    ];

    loanRows.push({
      employeeId: employee.id,
      amount,
      remainingAmount,
      installments,
      paidInstallments,
      installmentAmount,
      startDate,
      endDate,
      status: LoanStatus.APPROVED,
      purpose: purposes[idx % purposes.length],
      notes: `${PAYROLL_SEED_TAG}: سلفة تشغيلية`,
      approvedBy: createdBy,
      approvedAt: addMonths(startDate, -1),
      createdBy,
    });
  }

  const createdLoans: any[] = [];
  for (const loanData of loanRows) {
    const loan = await prisma.employeeLoan.create({
      data: loanData,
      select: {
        id: true,
        employeeId: true,
        installmentAmount: true,
        paidInstallments: true,
        startDate: true,
      },
    });
    createdLoans.push(loan);
  }

  // 6) Monthly deductions for Jan/Feb/Mar 2026
  const loanByEmployee = new Map<string, any>();
  for (const loan of createdLoans) {
    loanByEmployee.set(loan.employeeId, loan);
  }

  const deductionRows: any[] = [];
  for (const periodDate of PERIOD_MONTHS) {
    for (const employee of employees) {
      const salary = salaryMap.get(employee.id) || 0;
      const role = classifyRole(
        employee.position?.nameEn || employee.position?.nameAr || '',
      );

      // GOSI / statutory deduction
      deductionRows.push({
        employeeId: employee.id,
        deductionType: DeductionType.TAX,
        amount: round2(salary * gosiRateByEmploymentType(employee.employmentType)),
        deductionDate: periodDate,
        reason: `استقطاع التأمينات الاجتماعية (${PAYROLL_SEED_TAG})`,
        status: DeductionStatus.APPROVED,
        approvedBy: createdBy,
        approvedAt: addMonths(periodDate, -1),
        notes: `${PAYROLL_SEED_TAG}`,
        createdBy,
      });

      // Medical insurance
      deductionRows.push({
        employeeId: employee.id,
        deductionType: DeductionType.INSURANCE,
        amount: insuranceAmountByRole(role),
        deductionDate: periodDate,
        reason: `قسط التأمين الطبي (${PAYROLL_SEED_TAG})`,
        status: DeductionStatus.APPROVED,
        approvedBy: createdBy,
        approvedAt: addMonths(periodDate, -1),
        notes: `${PAYROLL_SEED_TAG}`,
        createdBy,
      });

      // Occasional absence penalties
      const absenceSeed = numericSeed(employee.employeeNumber) + periodDate.getMonth();
      if (absenceSeed % 11 === 0) {
        deductionRows.push({
          employeeId: employee.id,
          deductionType: DeductionType.ABSENCE,
          amount: 250 + (absenceSeed % 4) * 75,
          deductionDate: periodDate,
          reason: `خصم غياب/تأخير (${PAYROLL_SEED_TAG})`,
          status: DeductionStatus.APPROVED,
          approvedBy: createdBy,
          approvedAt: addMonths(periodDate, -1),
          notes: `${PAYROLL_SEED_TAG}`,
          createdBy,
        });
      }

      // Historical loan installment deductions for paid months
      const loan = loanByEmployee.get(employee.id);
      if (!loan) continue;

      const periodIndex =
        (periodDate.getFullYear() - loan.startDate.getFullYear()) * 12 +
        (periodDate.getMonth() - loan.startDate.getMonth()) +
        1;

      if (periodIndex > 0 && periodIndex <= loan.paidInstallments) {
        deductionRows.push({
          employeeId: employee.id,
          deductionType: DeductionType.LOAN_REPAYMENT,
          amount: loan.installmentAmount,
          deductionDate: periodDate,
          loanId: loan.id,
          reason: `قسط سلفة شهري - ${monthKey(periodDate)}`,
          status: DeductionStatus.APPROVED,
          approvedBy: createdBy,
          approvedAt: addMonths(periodDate, -1),
          notes: `${PAYROLL_SEED_TAG}`,
          createdBy,
        });
      }
    }
  }

  await prisma.employeeDeduction.createMany({
    data: deductionRows,
  });

  console.log(
    `✅ Payroll seeded: employees=${employees.length}, allowances=${allowanceRows.length}, loans=${loanRows.length}, deductions=${deductionRows.length}`,
  );
}
