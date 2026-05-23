/**
 * Master Seed File
 * Orchestrates seeding of all modules in the correct order
 * Run with: npx prisma db seed
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { seedUsers } from './seeds/01-users.seed';
import { seedRBAC } from './seeds/02-rbac.seed';
import { seedSites } from './seeds/03-sites.seed';
import { seedDepartmentsAndPositions } from './seeds/00-departments-positions.seed';
import { seedEmployees } from './seeds/04-employees.seed';
import { seedProjects } from './seeds/05-projects.seed';
import { seedAssets } from './seeds/06-assets.seed';
import { seedPayroll } from './seeds/07-payroll.seed';
import { seedFinance } from './seeds/08-finance.seed';
import { seedMaintenance } from './seeds/09-maintenance.seed';
import { seedProjectOperationalScenarios } from './seeds/10-project-operational-scenarios.seed';

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file');
  process.exit(1);
}

console.log(
  '🔗 Using DATABASE_URL:',
  process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'),
);

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: 2,
  max: 10,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...\n');
  console.log('='.repeat(60));

  try {
    // 0. Cleanup existing data (prevent duplicates)
    console.log('\n🧹 Step 0/10: Cleaning up existing seed data...');
    console.log('-'.repeat(60));

    // Delete in reverse order of dependencies
    await prisma.maintenanceRequest.deleteMany({});
    await prisma.cost.deleteMany({});
    await prisma.costCategory.deleteMany({});
    await prisma.employeeDeduction.deleteMany({});
    await prisma.employeeLoan.deleteMany({});
    await prisma.employeeAllowance.deleteMany({});
    await prisma.salaryHistory.deleteMany({});
    await prisma.allowanceType.deleteMany({});
    await prisma.projectAsset.deleteMany({});
    await prisma.assetEmployee.deleteMany({});
    await prisma.asset.deleteMany({});
    await prisma.projectEmployee.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.position.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.site.deleteMany({});
    await prisma.permissionGrantHistory.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Old data cleaned up successfully');

    // 1. Seed RBAC First (Foundation - Roles & Permissions)
    console.log('\n📍 Step 1/9: RBAC (Roles & Permissions)');
    console.log('-'.repeat(60));
    await seedRBAC(prisma, null); // Pass null, users will be linked in step 2

    // 2. Seed Users (and link to roles)
    console.log('\n📍 Step 2/9: Users & Authentication');
    console.log('-'.repeat(60));
    const users = await seedUsers(prisma);

    // 3. Seed Sites
    console.log('\n📍 Step 3/9: Construction Sites');
    console.log('-'.repeat(60));
    const sites = await seedSites(prisma, users.superAdmin.id);

    // 4. Seed Departments & Positions
    console.log('\n📍 Step 4/9: Departments & Positions');
    console.log('-'.repeat(60));
    const { deptMap, posMap } = await seedDepartmentsAndPositions(prisma);

    // 5. Seed Employees
    console.log('\n📍 Step 5/9: Employees');
    console.log('-'.repeat(60));
    const employees = await seedEmployees(
      prisma,
      users.superAdmin.id,
      deptMap,
      posMap,
    );

    // 6. Seed Projects
    console.log('\n📍 Step 6/9: Projects');
    console.log('-'.repeat(60));
    const projects = await seedProjects(
      prisma,
      sites,
      employees,
      users.superAdmin.id,
    );

    // 7. Seed Assets
    console.log('\n📍 Step 7/9: Assets & Equipment');
    console.log('-'.repeat(60));
    const assets = await seedAssets(
      prisma,
      projects,
      employees,
      users.superAdmin.id,
    );

    // 7. Seed Maintenance
    console.log('\n📍 Step 7/9: Maintenance Requests');
    console.log('-'.repeat(60));
    await seedMaintenance(
      prisma,
      assets,
      projects,
      employees,
      users.superAdmin.id,
    );

    // 8. Seed Payroll
    console.log('\n📍 Step 8/9: Payroll System');
    console.log('-'.repeat(60));
    await seedPayroll(prisma, employees, users.superAdmin.id);

    // 9. Seed Finance
    console.log('\n📍 Step 9/10: Finance & Project Costs');
    console.log('-'.repeat(60));
    await seedFinance(prisma, projects, users.superAdmin.id);

    // 10. Strengthen project operational scenarios
    console.log('\n📍 Step 10/10: Project Operational Scenarios');
    console.log('-'.repeat(60));
    await seedProjectOperationalScenarios(prisma, users.superAdmin.id);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Database seeding completed successfully!\n');

    console.log('📊 SEED DATA SUMMARY:');
    console.log('-'.repeat(60));

    const counts = await Promise.all([
      prisma.user.count(),
      prisma.role.count(),
      prisma.permission.count(),
      prisma.userRole.count(),
      prisma.site.count(),
      prisma.employee.count(),
      prisma.project.count(),
      prisma.projectEmployee.count(),
      prisma.asset.count(),
      prisma.assetEmployee.count(),
      prisma.projectAsset.count(),
      prisma.maintenanceRequest.count(),
      prisma.allowanceType.count(),
      prisma.employeeAllowance.count(),
      prisma.employeeLoan.count(),
      prisma.employeeDeduction.count(),
      prisma.costCategory.count(),
      prisma.cost.count(),
      prisma.costAllocation.count(),
    ]);

    console.log(
      `👥 Users:                    ${counts[0].toString().padStart(3)}`,
    );
    console.log(
      `🔐 Roles:                    ${counts[1].toString().padStart(3)}`,
    );
    console.log(
      `🛡️  Permissions:              ${counts[2].toString().padStart(3)}`,
    );
    console.log(
      `🔗 User-Role Assignments:    ${counts[3].toString().padStart(3)}`,
    );
    console.log(
      `🏗️  Construction Sites:       ${counts[4].toString().padStart(3)}`,
    );
    console.log(
      `👷 Employees:                ${counts[5].toString().padStart(3)}`,
    );
    console.log(
      `📋 Projects:                 ${counts[6].toString().padStart(3)}`,
    );
    console.log(
      `🔗 Project Assignments:      ${counts[7].toString().padStart(3)}`,
    );
    console.log(
      `🚜 Assets:                   ${counts[8].toString().padStart(3)}`,
    );
    console.log(
      `🔗 Asset Operators:          ${counts[9].toString().padStart(3)}`,
    );
    console.log(
      `🔗 Project Assets:           ${counts[10].toString().padStart(3)}`,
    );
    console.log(
      `� Maintenance Requests:     ${counts[11].toString().padStart(3)}`,
    );
    console.log(
      `💵 Allowance Types:          ${counts[12].toString().padStart(3)}`,
    );
    console.log(
      `📊 Employee Allowances:      ${counts[13].toString().padStart(3)}`,
    );
    console.log(
      `💳 Employee Loans:           ${counts[14].toString().padStart(3)}`,
    );
    console.log(
      `📉 Employee Deductions:      ${counts[15].toString().padStart(3)}`,
    );
    console.log(
      `📁 Cost Categories:          ${counts[16].toString().padStart(3)}`,
    );
    console.log(
      `💸 Project Costs:            ${counts[17].toString().padStart(3)}`,
    );
    console.log(
      `🔀 Cost Allocations:         ${counts[18].toString().padStart(3)}`,
    );

    console.log('-'.repeat(60));
    console.log(
      `📦 Total Records Created:    ${counts
        .reduce((a, b) => a + b, 0)
        .toString()
        .padStart(3)}`,
    );
    console.log('='.repeat(60));

    console.log('\n🔑 TEST CREDENTIALS:');
    console.log('-'.repeat(60));
    console.log('Email:    admin@erp.sys');
    console.log('Password: Admin@123456');
    console.log('-'.repeat(60));
    console.log('All users use the same password for testing purposes.');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Error during seeding:');
    console.error(error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
