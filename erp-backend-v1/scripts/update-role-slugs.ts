/**
 * Script to update role slugs to uppercase
 * This ensures consistency with the new UPPERCASE slug convention
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: 2,
  max: 10,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Updating role slugs to UPPERCASE...\n');

  // Update slugs
  const updates = [
    { from: 'superadmin', to: 'SUPERADMIN' },
    { from: 'admin', to: 'ADMIN' },
    { from: 'manager', to: 'MANAGER' },
    { from: 'user', to: 'USER' },
  ];

  for (const { from, to } of updates) {
    const role = await prisma.role.findUnique({ where: { slug: from } });

    if (role) {
      await prisma.role.update({
        where: { slug: from },
        data: { slug: to },
      });
      console.log(`✅ Updated: ${from} -> ${to}`);
    } else {
      console.log(`⏭️  Skipped: ${from} (not found)`);
    }
  }

  console.log('\n🎉 All role slugs updated successfully!');

  // Display current roles
  console.log('\n📋 Current roles:');
  const roles = await prisma.role.findMany({
    orderBy: { priority: 'desc' },
  });

  console.table(
    roles.map((r) => ({
      Name: r.name,
      Slug: r.slug,
      Active: r.isActive,
      Priority: r.priority,
    })),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
