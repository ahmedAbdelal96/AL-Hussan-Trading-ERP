/**
 * Project Operational Scenarios Seed
 * - Strengthens operational links for active/planning/on-hold projects
 * - Ensures project-asset assignments coverage
 * - Creates shared allocated costs across multiple projects
 * - Arabic-friendly labels/descriptions for business context
 */

import {
  AssetStatus,
  AssetType,
  CostType,
  EmployeeStatus,
  PrismaClient,
  ProjectStatus,
} from '@prisma/client';

const SCENARIO_TAG = 'SEED:تشغيل-المشاريع-V1';
const ASSIGNED_DATE = new Date('2026-03-04');

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function distributeHundredPercent(count: number): number[] {
  if (count <= 0) return [];

  // 100.00% in basis points to keep deterministic 2-decimal percentages.
  const totalBp = 10000;
  const baseBp = Math.floor(totalBp / count);
  const remainderBp = totalBp - baseBp * count;
  const values = new Array<number>(count).fill(baseBp);

  for (let i = 0; i < remainderBp; i++) {
    values[i] += 1;
  }

  return values.map((bp) => bp / 100);
}

function normalizePercentages(input: Array<number | null>): number[] {
  const sanitized = input.map((value) => (value && value > 0 ? value : 0));
  const sum = sanitized.reduce((acc, value) => acc + value, 0);

  if (sum <= 0) {
    return distributeHundredPercent(input.length);
  }

  const basisPoints = sanitized.map((value) =>
    Math.round((value / sum) * 10000),
  );
  const basisPointsSum = basisPoints.reduce((acc, value) => acc + value, 0);
  const delta = 10000 - basisPointsSum;

  if (delta !== 0) {
    let maxIndex = 0;
    for (let i = 1; i < basisPoints.length; i++) {
      if (basisPoints[i] > basisPoints[maxIndex]) maxIndex = i;
    }
    basisPoints[maxIndex] += delta;
  }

  return basisPoints.map((bp) => bp / 100);
}

async function normalizeEmployeeProjectPercentages(prisma: PrismaClient) {
  const activeAssignments = await prisma.projectEmployee.findMany({
    where: {
      isActive: true,
      OR: [{ endDate: null }, { endDate: { gte: ASSIGNED_DATE } }],
    },
    select: {
      id: true,
      employeeId: true,
      percentage: true,
    },
    orderBy: [{ employeeId: 'asc' }, { assignedDate: 'asc' }],
  });

  const grouped = new Map<
    string,
    Array<{ id: string; percentage: number | null }>
  >();

  for (const assignment of activeAssignments) {
    const bucket = grouped.get(assignment.employeeId) ?? [];
    bucket.push({
      id: assignment.id,
      percentage:
        assignment.percentage === null ? null : Number(assignment.percentage),
    });
    grouped.set(assignment.employeeId, bucket);
  }

  let touchedEmployees = 0;
  let updatedRows = 0;

  for (const assignments of grouped.values()) {
    if (assignments.length === 0) continue;

    const current = assignments.map((item) => item.percentage);
    const normalized = normalizePercentages(current);

    let changedForEmployee = false;
    for (let i = 0; i < assignments.length; i++) {
      const before = current[i] ?? 0;
      const after = normalized[i];
      if (Math.abs(before - after) > 0.009) {
        await prisma.projectEmployee.update({
          where: { id: assignments[i].id },
          data: { percentage: after },
        });
        changedForEmployee = true;
        updatedRows++;
      }
    }

    if (changedForEmployee) {
      touchedEmployees++;
    }
  }

  return {
    activeAssignments: activeAssignments.length,
    touchedEmployees,
    updatedRows,
  };
}

function buildOperationalAssetTemplate(index: number): {
  name: string;
  assetType: AssetType;
  category: string;
  model: string;
  purchasePrice: number;
} {
  const patterns = [
    {
      name: `حفارة تشغيلية ${String(index).padStart(3, '0')}`,
      assetType: AssetType.MACHINERY,
      category: 'حفارات',
      model: 'CAT 320D',
      purchasePrice: 390000,
    },
    {
      name: `مولد كهربائي ميداني ${String(index).padStart(3, '0')}`,
      assetType: AssetType.EQUIPMENT,
      category: 'مولدات كهرباء',
      model: 'Cummins 250kVA',
      purchasePrice: 175000,
    },
    {
      name: `شاحنة خدمة مشاريع ${String(index).padStart(3, '0')}`,
      assetType: AssetType.VEHICLE,
      category: 'شاحنات خفيفة',
      model: 'Hilux 4x4',
      purchasePrice: 135000,
    },
  ];

  return patterns[index % patterns.length];
}

async function createAdditionalOperationalAssets(
  prisma: PrismaClient,
  createdBy: string,
  count: number,
) {
  if (count <= 0) return [];

  const existingCount = await prisma.asset.count({
    where: { notes: { contains: SCENARIO_TAG } },
  });

  const createdAssets: Array<{ id: string; assetNumber: string; name: string }> =
    [];
  for (let i = 0; i < count; i++) {
    const serial = existingCount + i + 1;
    const t = buildOperationalAssetTemplate(serial);

    const asset = await prisma.asset.create({
      data: {
        assetNumber: `AST-OPS-${String(serial).padStart(5, '0')}`,
        name: t.name,
        assetType: t.assetType,
        category: t.category,
        manufacturer: 'شركة معدات المقاولات العربية',
        model: t.model,
        serialNumber: `OPS-SN-${String(serial).padStart(6, '0')}`,
        yearOfManufacture: 2025,
        purchaseDate: new Date('2025-01-01'),
        purchasePrice: t.purchasePrice,
        vendor: 'المورد التشغيلي الوطني',
        status: AssetStatus.AVAILABLE,
        currentLocation: 'المستودع التشغيلي - الرياض',
        description:
          'أصل تشغيلي تم إنشاؤه تلقائياً لتعزيز تكامل وربط بيانات المشاريع',
        notes: `${SCENARIO_TAG}: أصل تشغيلي`,
        createdBy,
      },
      select: { id: true, assetNumber: true, name: true },
    });

    createdAssets.push(asset);
  }

  return createdAssets;
}

async function ensureOperationalLinks(prisma: PrismaClient, createdBy: string) {
  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      status: {
        in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING, ProjectStatus.ON_HOLD],
      },
    },
    select: {
      id: true,
      projectCode: true,
      _count: {
        select: {
          employees: { where: { isActive: true } },
          assets: { where: { isActive: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const missingEmployeeProjects = projects.filter(
    (project) => project._count.employees === 0,
  );
  const missingAssetProjects = projects.filter(
    (project) => project._count.assets === 0,
  );

  const [
    activeEmployees,
    activeAssets,
    existingEmployeeAssignments,
    existingAssetAssignments,
  ] = await Promise.all([
    prisma.employee.findMany({
      where: { deletedAt: null, status: EmployeeStatus.ACTIVE },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.asset.findMany({
      where: {
        deletedAt: null,
        status: { in: [AssetStatus.AVAILABLE, AssetStatus.IN_USE] },
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.projectEmployee.findMany({
      where: { isActive: true },
      select: { employeeId: true },
    }),
    prisma.projectAsset.findMany({
      where: { isActive: true },
      select: { assetId: true },
    }),
  ]);

  const assignedEmployeeIds = new Set(
    existingEmployeeAssignments.map((assignment) => assignment.employeeId),
  );
  const assignedAssetIds = new Set(
    existingAssetAssignments.map((assignment) => assignment.assetId),
  );

  const freeEmployees = activeEmployees.filter(
    (employee) => !assignedEmployeeIds.has(employee.id),
  );
  let freeAssets = activeAssets.filter(
    (asset) => !assignedAssetIds.has(asset.id),
  );

  const additionalAssetsNeeded = Math.max(
    0,
    missingAssetProjects.length - freeAssets.length,
  );
  const createdOperationalAssets = await createAdditionalOperationalAssets(
    prisma,
    createdBy,
    additionalAssetsNeeded,
  );
  if (createdOperationalAssets.length > 0) {
    freeAssets = [...freeAssets, ...createdOperationalAssets];
  }

  let employeeLinks = 0;
  for (let i = 0; i < missingEmployeeProjects.length; i++) {
    const project = missingEmployeeProjects[i];
    const employee = freeEmployees[i];
    if (!employee) break;

    await prisma.projectEmployee.upsert({
      where: {
        projectId_employeeId_assignedDate: {
          projectId: project.id,
          employeeId: employee.id,
          assignedDate: ASSIGNED_DATE,
        },
      },
      update: {
        isActive: true,
        percentage: 100,
      },
      create: {
        projectId: project.id,
        employeeId: employee.id,
        assignedDate: ASSIGNED_DATE,
        isActive: true,
        percentage: 100,
        assignedBy: createdBy,
        notes: `${SCENARIO_TAG}: ربط موظف تشغيلي`,
      },
    });

    employeeLinks++;
  }

  let assetLinks = 0;
  for (let i = 0; i < missingAssetProjects.length; i++) {
    const project = missingAssetProjects[i];
    const asset = freeAssets[i];
    if (!asset) break;

    await prisma.projectAsset.upsert({
      where: {
        projectId_assetId_assignedDate: {
          projectId: project.id,
          assetId: asset.id,
          assignedDate: ASSIGNED_DATE,
        },
      },
      update: {
        isActive: true,
        percentage: 100,
      },
      create: {
        projectId: project.id,
        assetId: asset.id,
        assignedDate: ASSIGNED_DATE,
        isActive: true,
        percentage: 100,
        status: 'APPROVED',
        assignedBy: createdBy,
        notes: `${SCENARIO_TAG}: ربط أصل تشغيلي`,
      },
    });

    assetLinks++;
  }

  return {
    activeProjects: projects.length,
    missingEmployeeProjects: missingEmployeeProjects.length,
    missingAssetProjects: missingAssetProjects.length,
    employeeLinks,
    assetLinks,
    createdOperationalAssets: createdOperationalAssets.length,
  };
}

async function seedSharedAllocatedCosts(prisma: PrismaClient, createdBy: string) {
  const existingCosts = await prisma.cost.count({
    where: { notes: { contains: SCENARIO_TAG } },
  });

  if (existingCosts > 0) {
    return {
      skipped: true,
      reason: `تم العثور على بيانات سيناريو سابقة (${existingCosts})`,
      createdCosts: 0,
      createdAllocations: 0,
    };
  }

  const targetProjects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      status: {
        in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING, ProjectStatus.ON_HOLD],
      },
    },
    select: { id: true, projectCode: true },
    orderBy: { createdAt: 'asc' },
    take: 4,
  });

  if (targetProjects.length < 2) {
    return {
      skipped: true,
      reason: 'عدد المشاريع غير كافٍ لإنشاء تكاليف موزعة متعددة المشاريع',
      createdCosts: 0,
      createdAllocations: 0,
    };
  }

  const scenarios = [
    {
      costType: CostType.SALARY,
      amount: 120000,
      description: 'توزيع رواتب فريق مشترك على عدة مشاريع',
      splits: [40, 30, 20, 10],
    },
    {
      costType: CostType.MAINTENANCE,
      amount: 90000,
      description: 'توزيع تكلفة صيانة أصول مشتركة بين المشاريع',
      splits: [25, 25, 25, 25],
    },
    {
      costType: CostType.MATERIAL,
      amount: 150000,
      description: 'توزيع تكلفة مشتريات مواد مشتركة',
      splits: [50, 30, 20, 0],
    },
  ];

  let createdCosts = 0;
  let createdAllocations = 0;

  for (const scenario of scenarios) {
    const usedSplits = scenario.splits.filter((split) => split > 0);
    const projectsForScenario = targetProjects.slice(0, usedSplits.length);
    const splitSum = usedSplits.reduce((sum, split) => sum + split, 0);

    if (projectsForScenario.length === 0 || splitSum !== 100) {
      continue;
    }

    const cost = await prisma.cost.create({
      data: {
        projectId: null,
        isAllocated: true,
        costType: scenario.costType,
        amount: scenario.amount,
        amountBeforeTax: scenario.amount,
        currency: 'SAR',
        transactionDate: ASSIGNED_DATE,
        description: scenario.description,
        notes: `${SCENARIO_TAG}: تكلفة موزعة`,
        createdBy,
      },
      select: { id: true, amount: true },
    });
    createdCosts++;

    for (let i = 0; i < projectsForScenario.length; i++) {
      const project = projectsForScenario[i];
      const percentage = usedSplits[i];
      const allocatedAmount = round2((Number(cost.amount) * percentage) / 100);

      await prisma.costAllocation.create({
        data: {
          costId: cost.id,
          projectId: project.id,
          percentage,
          allocatedAmount,
          notes: `${SCENARIO_TAG}: توزيع على ${project.projectCode}`,
        },
      });
      createdAllocations++;
    }
  }

  return {
    skipped: false,
    createdCosts,
    createdAllocations,
  };
}

export async function seedProjectOperationalScenarios(
  prisma: PrismaClient,
  createdBy: string,
) {
  console.log('🔧 تقوية بيانات التشغيل للمشاريع...');

  const links = await ensureOperationalLinks(prisma, createdBy);
  const normalizedPercentages = await normalizeEmployeeProjectPercentages(prisma);
  const allocations = await seedSharedAllocatedCosts(prisma, createdBy);

  console.log(
    `✅ تغطية التشغيل: مشاريع نشطة=${links.activeProjects}, ربط موظفين=${links.employeeLinks}, ربط أصول=${links.assetLinks}, أصول جديدة=${links.createdOperationalAssets}`,
  );
  console.log(
    `✅ التكاليف الموزعة: costs=${allocations.createdCosts}, allocations=${allocations.createdAllocations}${allocations.skipped ? ` (${allocations.reason})` : ''}`,
  );

  console.log('Normalized employee percentages: activeAssignments=' + normalizedPercentages.activeAssignments + ', employees=' + normalizedPercentages.touchedEmployees + ', rows=' + normalizedPercentages.updatedRows);

  return { links, normalizedPercentages, allocations };
}

