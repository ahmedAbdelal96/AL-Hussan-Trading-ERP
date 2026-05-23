/**
 * Production Foundation Seed
 *
 * Seeds only the minimum reference data required to bootstrap a clean
 * production environment:
 * - Roles
 * - Permissions
 * - Role-permission mappings
 * - Initial super admin account
 * - Departments
 * - Positions
 *
 * This seed intentionally wipes all application data before recreating
 * the production foundation dataset.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import {
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS_MAP,
  SYSTEM_ROLES,
  getPermissionString,
} from '../src/application/common/constants/permissions.constants';
import { seedDepartmentsAndPositions } from './seeds/00-departments-positions.seed';

type SeedConfig = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getRolePriority(roleSlug: string): number {
  if (roleSlug === 'SUPERADMIN') {
    return 100;
  }

  if (roleSlug === 'IT_ADMIN') {
    return 95;
  }

  if (roleSlug === 'ADMIN') {
    return 90;
  }

  if (roleSlug.includes('MANAGER')) {
    return 80;
  }

  if (roleSlug.includes('STAFF')) {
    return 70;
  }

  return 50;
}

function loadSeedConfig(): SeedConfig {
  return {
    email: requireEnv('PRODUCTION_SUPERADMIN_EMAIL'),
    password: requireEnv('PRODUCTION_SUPERADMIN_PASSWORD'),
    firstName: process.env.PRODUCTION_SUPERADMIN_FIRST_NAME?.trim() || 'مدير',
    lastName: process.env.PRODUCTION_SUPERADMIN_LAST_NAME?.trim() || 'النظام',
    phone: process.env.PRODUCTION_SUPERADMIN_PHONE?.trim() || undefined,
  };
}

function loadItAdminSeedConfig(): SeedConfig {
  return {
    email: requireEnv('PRODUCTION_IT_ADMIN_EMAIL'),
    password: requireEnv('PRODUCTION_IT_ADMIN_PASSWORD'),
    firstName: process.env.PRODUCTION_IT_ADMIN_FIRST_NAME?.trim() || 'مدير',
    lastName: process.env.PRODUCTION_IT_ADMIN_LAST_NAME?.trim() || 'تقنية المعلومات',
    phone: process.env.PRODUCTION_IT_ADMIN_PHONE?.trim() || undefined,
  };
}

async function clearDatabase(prisma: PrismaClient) {
  console.log('Clearing existing database data...');

  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) {
    console.log('No application tables found to truncate');
    return;
  }

  const quotedTables = tables
    .map(({ tablename }) => `"public"."${tablename}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE`,
  );

  console.log(`Database cleared (${tables.length} tables truncated)`);
}

async function seedProductionRBAC(prisma: PrismaClient) {
  console.log('Seeding production RBAC foundation...');

  const roleMap = new Map<string, string>();
  const permissionMap = new Map<string, string>();

  for (const roleData of SYSTEM_ROLES) {
    const role = await prisma.role.upsert({
      where: { slug: roleData.slug },
      update: {
        name: roleData.name,
        nameAr: roleData.nameAr,
        description: roleData.description,
        descriptionAr: roleData.descriptionAr,
        isSystemRole: true,
        isActive: roleData.isActive,
        priority: getRolePriority(roleData.slug),
      },
      create: {
        slug: roleData.slug,
        name: roleData.name,
        nameAr: roleData.nameAr,
        description: roleData.description,
        descriptionAr: roleData.descriptionAr,
        isSystemRole: true,
        isActive: roleData.isActive,
        priority: getRolePriority(roleData.slug),
      },
    });

    roleMap.set(roleData.slug, role.id);
  }

  for (const permissionData of ALL_PERMISSIONS) {
    const permissionName = getPermissionString(permissionData);
    const permission = await prisma.permission.upsert({
      where: { name: permissionName },
      update: {
        nameAr: permissionData.nameAr,
        resource: permissionData.resource,
        action: permissionData.action,
        description: permissionData.description,
        descriptionAr: permissionData.descriptionAr,
      },
      create: {
        name: permissionName,
        nameAr: permissionData.nameAr,
        resource: permissionData.resource,
        action: permissionData.action,
        description: permissionData.description,
        descriptionAr: permissionData.descriptionAr,
      },
    });

    permissionMap.set(permissionName, permission.id);
  }

  for (const [roleSlug, permissionNames] of Object.entries(
    ROLE_PERMISSIONS_MAP,
  )) {
    const roleId = roleMap.get(roleSlug);
    if (!roleId) {
      continue;
    }

    for (const permissionName of permissionNames) {
      const permissionId = permissionMap.get(permissionName);
      if (!permissionId) {
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId,
          permissionId,
        },
      });
    }
  }

  return {
    roles: roleMap.size,
    permissions: permissionMap.size,
  };
}

async function seedProductionSuperAdmin(
  prisma: PrismaClient,
  config: SeedConfig,
): Promise<{ userId: string; created: boolean }> {
  console.log('Seeding initial super admin...');

  const superAdminRole = await prisma.role.findUnique({
    where: { slug: 'SUPERADMIN' },
  });

  if (!superAdminRole) {
    throw new Error('SUPERADMIN role was not found after RBAC seed');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: config.email },
  });

  const hashedPassword = await bcrypt.hash(config.password, 10);

  const superAdmin = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstName: config.firstName,
          lastName: config.lastName,
          phone: config.phone,
          password: hashedPassword,
          isActive: true,
          deletedAt: null,
          deletedBy: null,
          tokenVersion: 1,
        },
      })
    : await prisma.user.create({
        data: {
          email: config.email,
          password: hashedPassword,
          firstName: config.firstName,
          lastName: config.lastName,
          phone: config.phone,
          isActive: true,
          tokenVersion: 1,
        },
      });

  const activeAssignment = await prisma.userRole.findFirst({
    where: {
      userId: superAdmin.id,
      roleId: superAdminRole.id,
      isActive: true,
    },
  });

  if (!activeAssignment) {
    await prisma.userRole.create({
      data: {
        userId: superAdmin.id,
        roleId: superAdminRole.id,
        grantedBy: superAdmin.id,
        isTemporary: false,
        isActive: true,
      },
    });
  }

  return {
    userId: superAdmin.id,
    created: existingUser === null,
  };
}

async function seedSystemAdminAccount(
  prisma: PrismaClient,
  config: SeedConfig,
  roleSlug: 'IT_ADMIN',
): Promise<{ userId: string; created: boolean }> {
  const role = await prisma.role.findUnique({
    where: { slug: roleSlug },
  });

  if (!role) {
    throw new Error(`${roleSlug} role was not found after RBAC seed`);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: config.email },
  });

  const hashedPassword = await bcrypt.hash(config.password, 10);

  const user = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstName: config.firstName,
          lastName: config.lastName,
          phone: config.phone,
          password: hashedPassword,
          isActive: true,
          deletedAt: null,
          deletedBy: null,
          tokenVersion: 1,
        },
      })
    : await prisma.user.create({
        data: {
          email: config.email,
          password: hashedPassword,
          firstName: config.firstName,
          lastName: config.lastName,
          phone: config.phone,
          isActive: true,
          tokenVersion: 1,
        },
      });

  const activeAssignment = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: role.id,
      isActive: true,
    },
  });

  if (!activeAssignment) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
        grantedBy: user.id,
        isTemporary: false,
        isActive: true,
      },
    });
  }

  return {
    userId: user.id,
    created: existingUser === null,
  };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const config = loadSeedConfig();
  const itAdminConfig = loadItAdminSeedConfig();

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    min: 1,
    max: 5,
  });

  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  try {
    console.log('Starting production foundation seed...');
    await clearDatabase(prisma);

    const rbac = await seedProductionRBAC(prisma);
    const superAdmin = await seedProductionSuperAdmin(prisma, config);
    const itAdmin = await seedSystemAdminAccount(
      prisma,
      itAdminConfig,
      'IT_ADMIN',
    );
    const { deptMap, posMap } = await seedDepartmentsAndPositions(prisma);

    console.log('Production foundation seed completed successfully');
    console.log(
      JSON.stringify(
        {
          superAdminEmail: config.email,
          superAdminCreated: superAdmin.created,
          itAdminEmail: itAdminConfig.email,
          itAdminCreated: itAdmin.created,
          roles: rbac.roles,
          permissions: rbac.permissions,
          departments: Object.keys(deptMap).length,
          positions: Object.keys(posMap).length,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Production seed failed');
  console.error(error);
  process.exit(1);
});
