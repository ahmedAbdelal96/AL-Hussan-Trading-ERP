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

async function main() {
  console.log('[fix:sites:soft-delete-status] Normalizing soft-deleted sites status...');

  const before = await prisma.site.count({
    where: {
      deletedAt: { not: null },
      status: 'ACTIVE',
    },
  });

  const result = await prisma.site.updateMany({
    where: {
      deletedAt: { not: null },
      status: 'ACTIVE',
    },
    data: {
      status: 'INACTIVE',
      rowVersion: { increment: 1 },
    },
  });

  const after = await prisma.site.count({
    where: {
      deletedAt: { not: null },
      status: 'ACTIVE',
    },
  });

  console.log(`Affected rows: ${result.count}`);
  console.log(`Before: ${before}, After: ${after}`);
}

main()
  .catch((e) => {
    console.error('Fix failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
