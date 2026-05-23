/* eslint-disable no-console */
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required.');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function normalizeToHundred(assignments) {
  if (assignments.length === 0) return [];
  if (assignments.length === 1) {
    return [{ id: assignments[0].id, percentage: 100 }];
  }

  const current = assignments.map((a) => ({
    id: a.id,
    percentage: round2(Number(a.percentage || 0)),
  }));

  const currentTotal = round2(current.reduce((s, a) => s + a.percentage, 0));
  if (Math.abs(currentTotal - 100) <= 0.01) return current;

  // If total is zero/invalid, distribute evenly.
  if (currentTotal <= 0) {
    const base = round2(100 / current.length);
    const out = current.map((a) => ({ ...a, percentage: base }));
    const residual = round2(
      100 - out.reduce((s, a) => s + a.percentage, 0),
    );
    out[out.length - 1].percentage = round2(out[out.length - 1].percentage + residual);
    return out;
  }

  // Scale to 100 proportionally.
  const scaled = current.map((a) => ({
    id: a.id,
    percentage: round2((a.percentage / currentTotal) * 100),
  }));
  const residual = round2(
    100 - scaled.reduce((s, a) => s + a.percentage, 0),
  );
  scaled[scaled.length - 1].percentage = round2(
    scaled[scaled.length - 1].percentage + residual,
  );
  return scaled;
}

async function findFallbackProjectId(assetId) {
  // 1) Prefer project referenced by latest maintenance request for this asset.
  const latestMaintenance = await prisma.maintenanceRequest.findFirst({
    where: { assetId, projectId: { not: null } },
    orderBy: { createdAt: 'desc' },
    select: { projectId: true },
  });
  if (latestMaintenance?.projectId) return latestMaintenance.projectId;

  // 2) Fallback to latest historical project assignment.
  const latestHistory = await prisma.projectAsset.findFirst({
    where: { assetId },
    orderBy: { assignedDate: 'desc' },
    select: { projectId: true },
  });
  if (latestHistory?.projectId) return latestHistory.projectId;

  // 3) Fallback to any active/on-hold project.
  const activeProject = await prisma.project.findFirst({
    where: { deletedAt: null, status: { in: ['ACTIVE', 'ON_HOLD'] } },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return activeProject?.id || null;
}

async function pickAssignedByUserId(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { createdBy: true },
  });
  if (project?.createdBy) return project.createdBy;

  const fallbackUser = await prisma.user.findFirst({
    where: { isActive: true, deletedAt: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return fallbackUser?.id || null;
}

async function createUniqueDatedAssignment({
  projectId,
  assetId,
  assignedBy,
}) {
  // project_assets has unique(projectId, assetId, assignedDate) with Date-only precision.
  for (let offset = 0; offset < 30; offset++) {
    const candidate = new Date();
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(0, 0, 0, 0);

    const exists = await prisma.projectAsset.findFirst({
      where: { projectId, assetId, assignedDate: candidate },
      select: { id: true },
    });
    if (!exists) {
      return prisma.projectAsset.create({
        data: {
          projectId,
          assetId,
          assignedDate: candidate,
          isActive: true,
          percentage: 100,
          status: 'active',
          assignedBy,
        },
      });
    }
  }
  throw new Error(
    `Could not create unique assignment date for asset ${assetId} and project ${projectId}`,
  );
}

async function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    normalizedGroups: 0,
    updatedRows: 0,
    orphanOperationalAssets: 0,
    autoAssignedOrphans: 0,
    skippedOrphans: 0,
    details: [],
  };

  // 1) Normalize percentages for active assignment groups.
  const activeAssignments = await prisma.projectAsset.findMany({
    where: { isActive: true },
    select: { id: true, assetId: true, percentage: true },
    orderBy: [{ assetId: 'asc' }, { assignedDate: 'asc' }],
  });

  const groupMap = new Map();
  for (const row of activeAssignments) {
    const arr = groupMap.get(row.assetId) || [];
    arr.push(row);
    groupMap.set(row.assetId, arr);
  }

  for (const [assetId, rows] of groupMap.entries()) {
    const beforeTotal = round2(rows.reduce((s, r) => s + Number(r.percentage || 0), 0));
    if (Math.abs(beforeTotal - 100) <= 0.01) continue;

    const normalized = normalizeToHundred(rows);
    report.normalizedGroups++;

    for (const row of normalized) {
      const oldRow = rows.find((r) => r.id === row.id);
      const oldValue = round2(Number(oldRow?.percentage || 0));
      if (Math.abs(oldValue - row.percentage) <= 0.01) continue;
      await prisma.projectAsset.update({
        where: { id: row.id },
        data: { percentage: row.percentage },
      });
      report.updatedRows++;
    }

    report.details.push({
      type: 'normalized_group',
      assetId,
      beforeTotal,
      afterTotal: 100,
      rowCount: rows.length,
    });
  }

  // 2) Auto-assign orphan operational assets (IN_USE / UNDER_MAINTENANCE).
  const orphanOperationalAssets = await prisma.asset.findMany({
    where: {
      deletedAt: null,
      status: { in: ['IN_USE', 'UNDER_MAINTENANCE'] },
      projectAssignments: { none: { isActive: true } },
    },
    select: { id: true, assetNumber: true, status: true },
    orderBy: { assetNumber: 'asc' },
  });

  report.orphanOperationalAssets = orphanOperationalAssets.length;

  for (const asset of orphanOperationalAssets) {
    const projectId = await findFallbackProjectId(asset.id);
    if (!projectId) {
      report.skippedOrphans++;
      report.details.push({
        type: 'orphan_skipped',
        assetId: asset.id,
        assetNumber: asset.assetNumber,
        reason: 'No fallback project found',
      });
      continue;
    }

    const assignedBy = await pickAssignedByUserId(projectId);
    if (!assignedBy) {
      report.skippedOrphans++;
      report.details.push({
        type: 'orphan_skipped',
        assetId: asset.id,
        assetNumber: asset.assetNumber,
        reason: 'No active user to set assignedBy',
      });
      continue;
    }

    await createUniqueDatedAssignment({
      projectId,
      assetId: asset.id,
      assignedBy,
    });
    report.autoAssignedOrphans++;
    report.details.push({
      type: 'orphan_assigned',
      assetId: asset.id,
      assetNumber: asset.assetNumber,
      projectId,
    });
  }

  const fs = require('fs');
  const path = require('path');
  const outDir = path.join(process.cwd(), 'scripts', 'audit', 'results');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'assets-operational-fix-report.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2));

  console.log('========================================');
  console.log('Assets Operational Integrity Fix: DONE');
  console.log('========================================');
  console.log(`Normalized groups: ${report.normalizedGroups}`);
  console.log(`Updated rows: ${report.updatedRows}`);
  console.log(`Orphan operational assets: ${report.orphanOperationalAssets}`);
  console.log(`Auto-assigned orphans: ${report.autoAssignedOrphans}`);
  console.log(`Skipped orphans: ${report.skippedOrphans}`);
  console.log(`Report saved to: ${outFile}`);
}

main()
  .catch((e) => {
    console.error('Assets operational integrity fix failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

