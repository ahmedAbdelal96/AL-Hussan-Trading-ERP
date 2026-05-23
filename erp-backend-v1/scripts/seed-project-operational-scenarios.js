/* eslint-disable no-console */
require('dotenv/config');

const { PrismaClient, ProjectStatus, EmployeeStatus, AssetStatus, CostType } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SCENARIO_TAG = 'SCENARIO:PROJECT_OPS_AR_V1';
const ASSIGNED_DATE = new Date('2026-03-04');

function toNum(v) {
  if (v == null) return 0;
  return Number(v);
}

function round2(v) {
  return Math.round((toNum(v) + Number.EPSILON) * 100) / 100;
}

async function getActorUserId() {
  const email = process.env.PERF_EMAIL || 'superadmin@erp.sys';
  const actor = await prisma.user.findFirst({
    where: { email, deletedAt: null, isActive: true },
    select: { id: true, email: true },
  });
  if (actor) return actor.id;

  const fallback = await prisma.user.findFirst({
    where: { deletedAt: null, isActive: true },
    select: { id: true, email: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!fallback) {
    throw new Error('No active user found to use as createdBy/assignedBy.');
  }
  return fallback.id;
}

function generateAssetSeed(index) {
  const num = String(index).padStart(4, '0');
  const typeCycle = [
    { assetType: 'MACHINERY', category: 'حفارات', name: `حفارة تشغيلية ${num}`, model: 'CAT 320D' },
    { assetType: 'EQUIPMENT', category: 'مولدات كهرباء', name: `مولد كهربائي ${num}`, model: 'Cummins 250kVA' },
    { assetType: 'VEHICLE', category: 'شاحنات خفيفة', name: `شاحنة ميدانية ${num}`, model: 'Hilux 4x4' },
  ];
  return typeCycle[index % typeCycle.length];
}

async function createOperationalAssets(actorUserId, countNeeded) {
  if (countNeeded <= 0) return [];

  const existingOperational = await prisma.asset.count({
    where: { notes: { contains: SCENARIO_TAG } },
  });

  const created = [];
  for (let i = 0; i < countNeeded; i++) {
    const serial = existingOperational + i + 1;
    const seed = generateAssetSeed(serial);
    const year = 2025;
    const assetNumber = `AST-OPS-${String(serial).padStart(5, '0')}`;

    const asset = await prisma.asset.create({
      data: {
        assetNumber,
        name: seed.name,
        assetType: seed.assetType,
        category: seed.category,
        manufacturer: 'شركة معدات المقاولات العربية',
        model: seed.model,
        serialNumber: `OPS-SN-${String(serial).padStart(6, '0')}`,
        yearOfManufacture: year,
        purchaseDate: new Date('2025-01-01'),
        purchasePrice: 175000 + serial * 250,
        vendor: 'المورد التشغيلي الوطني',
        status: AssetStatus.AVAILABLE,
        currentLocation: 'المستودع التشغيلي - الرياض',
        description: 'أصل تشغيلي تم إنشاؤه تلقائياً لدعم تكامل بيانات المشاريع',
        notes: `${SCENARIO_TAG}: أصل تشغيلي تلقائي`,
        createdBy: actorUserId,
      },
      select: { id: true, assetNumber: true, name: true },
    });

    created.push(asset);
  }

  return created;
}

async function seedOperationalAssignments(actorUserId) {
  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      status: { in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING, ProjectStatus.ON_HOLD] },
    },
    select: {
      id: true,
      projectCode: true,
      name: true,
      _count: {
        select: {
          employees: { where: { isActive: true } },
          assets: { where: { isActive: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const projectsMissingEmployees = projects.filter((p) => p._count.employees === 0);
  const projectsMissingAssets = projects.filter((p) => p._count.assets === 0);

  const [activeEmployees, activeAssets, existingActiveProjectEmployees, existingActiveProjectAssets] = await Promise.all([
    prisma.employee.findMany({
      where: { deletedAt: null, status: EmployeeStatus.ACTIVE },
      select: { id: true, employeeNumber: true, firstName: true, lastName: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.asset.findMany({
      where: { deletedAt: null, status: { in: [AssetStatus.AVAILABLE, AssetStatus.IN_USE] } },
      select: { id: true, assetNumber: true, name: true },
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

  const assignedEmployeeIds = new Set(existingActiveProjectEmployees.map((x) => x.employeeId));
  const assignedAssetIds = new Set(existingActiveProjectAssets.map((x) => x.assetId));

  // Prefer unassigned employees/assets first to avoid distorting existing allocations.
  const freeEmployees = activeEmployees.filter((e) => !assignedEmployeeIds.has(e.id));
  let freeAssets = activeAssets.filter((a) => !assignedAssetIds.has(a.id));

  // Ensure operational coverage for all active/planning/on-hold projects:
  // if assets are insufficient, create Arabic operational assets.
  const additionalAssetsNeeded = Math.max(0, projectsMissingAssets.length - freeAssets.length);
  const createdOperationalAssets = await createOperationalAssets(
    actorUserId,
    additionalAssetsNeeded,
  );
  if (createdOperationalAssets.length > 0) {
    freeAssets = [...freeAssets, ...createdOperationalAssets];
  }

  let employeesLinked = 0;
  let assetsLinked = 0;
  const employeeWarnings = [];
  const assetWarnings = [];

  for (let i = 0; i < projectsMissingEmployees.length; i++) {
    const project = projectsMissingEmployees[i];
    const emp = freeEmployees[i];
    if (!emp) {
      employeeWarnings.push(
        `لا يوجد موظف نشط متاح لربطه بالمشروع ${project.projectCode}.`,
      );
      continue;
    }

    await prisma.projectEmployee.upsert({
      where: {
        projectId_employeeId_assignedDate: {
          projectId: project.id,
          employeeId: emp.id,
          assignedDate: ASSIGNED_DATE,
        },
      },
      update: {
        isActive: true,
        percentage: 100,
      },
      create: {
        projectId: project.id,
        employeeId: emp.id,
        assignedDate: ASSIGNED_DATE,
        isActive: true,
        percentage: 100,
        assignedBy: actorUserId,
        notes: `${SCENARIO_TAG}: ربط موظف تشغيلي`,
      },
    });
    employeesLinked++;
  }

  for (let i = 0; i < projectsMissingAssets.length; i++) {
    const project = projectsMissingAssets[i];
    const asset = freeAssets[i];
    if (!asset) {
      assetWarnings.push(`No free active asset available for project ${project.projectCode}.`);
      continue;
    }

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
        assignedBy: actorUserId,
        notes: `${SCENARIO_TAG}: ربط أصل تشغيلي`,
      },
    });
    assetsLinked++;
  }

  return {
    activeProjects: projects.length,
    projectsMissingEmployees: projectsMissingEmployees.length,
    projectsMissingAssets: projectsMissingAssets.length,
    employeesLinked,
    assetsLinked,
    operationalAssetsCreated: createdOperationalAssets.length,
    employeeWarnings,
    assetWarnings,
  };
}

async function seedAllocatedCosts(actorUserId) {
  // If scenario costs already exist, skip to keep script idempotent.
  const existingScenarioCosts = await prisma.cost.count({
    where: { notes: { contains: SCENARIO_TAG } },
  });
  if (existingScenarioCosts > 0) {
    return {
      skipped: true,
      reason: `تكاليف السيناريو موجودة مسبقاً (${existingScenarioCosts}).`,
      createdCosts: 0,
      createdAllocations: 0,
    };
  }

  const targetProjects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      status: { in: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING, ProjectStatus.ON_HOLD] },
    },
    select: { id: true, projectCode: true },
    orderBy: { createdAt: 'asc' },
    take: 4,
  });

  if (targetProjects.length < 2) {
    return {
      skipped: true,
      reason: 'لا يوجد عدد كافٍ من المشاريع النشطة/التخطيط/المعلقة لإنشاء تكاليف موزعة.',
      createdCosts: 0,
      createdAllocations: 0,
    };
  }

  const scenarioDefs = [
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

  for (const def of scenarioDefs) {
    const usedProjects = targetProjects.slice(0, def.splits.filter((s) => s > 0).length);
    const usedSplits = def.splits.filter((s) => s > 0);
    const totalSplit = usedSplits.reduce((s, x) => s + x, 0);
    if (usedProjects.length === 0 || totalSplit !== 100) {
      continue;
    }

    const cost = await prisma.cost.create({
      data: {
        projectId: null,
        isAllocated: true,
        costType: def.costType,
        amount: def.amount,
        currency: 'SAR',
        transactionDate: ASSIGNED_DATE,
        description: def.description,
        notes: `${SCENARIO_TAG}: تكلفة موزعة`,
        createdBy: actorUserId,
      },
      select: { id: true, amount: true },
    });
    createdCosts++;

    for (let i = 0; i < usedProjects.length; i++) {
      const project = usedProjects[i];
      const pct = usedSplits[i];
      const allocatedAmount = round2((toNum(cost.amount) * pct) / 100);
      await prisma.costAllocation.create({
        data: {
          costId: cost.id,
          projectId: project.id,
          percentage: pct,
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
    projectsUsed: targetProjects.map((p) => p.projectCode),
  };
}

async function main() {
  const actorUserId = await getActorUserId();
  const assignmentResult = await seedOperationalAssignments(actorUserId);
  const costsResult = await seedAllocatedCosts(actorUserId);

  console.log('========================================');
  console.log('تهيئة بيانات التشغيل للمشاريع: اكتملت');
  console.log('========================================');
  console.log(`إجمالي المشاريع النشطة المفحوصة: ${assignmentResult.activeProjects}`);
  console.log(`مشاريع بدون ربط موظفين قبل التشغيل: ${assignmentResult.projectsMissingEmployees}`);
  console.log(`مشاريع بدون ربط أصول قبل التشغيل: ${assignmentResult.projectsMissingAssets}`);
  console.log(`روابط الموظفين التي أضيفت/حُدّثت: ${assignmentResult.employeesLinked}`);
  console.log(`روابط الأصول التي أضيفت/حُدّثت: ${assignmentResult.assetsLinked}`);
  console.log(`أصول تشغيلية جديدة تم إنشاؤها: ${assignmentResult.operationalAssetsCreated}`);
  console.log(`التكاليف الموزعة التي أُنشئت: ${costsResult.createdCosts}`);
  console.log(`بنود توزيع التكلفة التي أُنشئت: ${costsResult.createdAllocations}`);
  if (costsResult.skipped) {
    console.log(`تم تخطي إنشاء التكاليف الموزعة: ${costsResult.reason}`);
  }
  if (assignmentResult.employeeWarnings.length > 0) {
    console.log('\nتنبيهات الموظفين:');
    assignmentResult.employeeWarnings.forEach((w, i) => console.log(`${i + 1}. ${w}`));
  }
  if (assignmentResult.assetWarnings.length > 0) {
    console.log('\nتنبيهات الأصول:');
    assignmentResult.assetWarnings.forEach((w, i) => console.log(`${i + 1}. ${w}`));
  }
}

main()
  .catch((e) => {
    console.error('فشل تهيئة سيناريو التشغيل:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
