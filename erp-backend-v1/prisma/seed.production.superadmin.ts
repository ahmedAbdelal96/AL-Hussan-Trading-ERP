/**
 * Production Super Admin Seed
 *
 * Safe, idempotent bootstrap seed for production environments.
 * It only ensures:
 * - SUPERADMIN role exists
 * - the configured superadmin user exists
 * - the user has the SUPERADMIN role
 *
 * It does not truncate or touch any other application data.
 */

import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { SYSTEM_ROLES } from '../src/application/common/constants/permissions.constants';

type SeedConfig = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  resetPassword: boolean;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function loadSeedConfig(): SeedConfig {
  return {
    email: requireEnv('PRODUCTION_SUPERADMIN_EMAIL'),
    password: requireEnv('PRODUCTION_SUPERADMIN_PASSWORD'),
    firstName: process.env.PRODUCTION_SUPERADMIN_FIRST_NAME?.trim() || 'مدير',
    lastName: process.env.PRODUCTION_SUPERADMIN_LAST_NAME?.trim() || 'النظام',
    phone: process.env.PRODUCTION_SUPERADMIN_PHONE?.trim() || undefined,
    resetPassword:
      process.env.PRODUCTION_SUPERADMIN_RESET_PASSWORD?.trim() === 'true',
  };
}

function getSuperAdminRoleConfig() {
  const role = SYSTEM_ROLES.find((entry) => entry.slug === 'SUPERADMIN');
  if (!role) {
    throw new Error('SUPERADMIN role definition was not found');
  }

  return role;
}

async function ensureSuperAdminRole(prisma: Prisma.TransactionClient) {
  const roleConfig = getSuperAdminRoleConfig();

  return prisma.role.upsert({
    where: { slug: roleConfig.slug },
    update: {
      name: roleConfig.name,
      nameAr: roleConfig.nameAr,
      description: roleConfig.description,
      descriptionAr: roleConfig.descriptionAr,
      isSystemRole: true,
      isActive: roleConfig.isActive,
      priority: 100,
    },
    create: {
      slug: roleConfig.slug,
      name: roleConfig.name,
      nameAr: roleConfig.nameAr,
      description: roleConfig.description,
      descriptionAr: roleConfig.descriptionAr,
      isSystemRole: true,
      isActive: roleConfig.isActive,
      priority: 100,
    },
  });
}

async function upsertSuperAdminUser(
  prisma: Prisma.TransactionClient,
  config: SeedConfig,
) {
  const existingUser = await prisma.user.findUnique({
    where: { email: config.email },
  });

  const baseData = {
    firstName: config.firstName,
    lastName: config.lastName,
    phone: config.phone,
    isActive: true,
    deletedAt: null,
    deletedBy: null,
    permanentlyLocked: false,
    permanentlyLockedAt: null,
    lockedUntil: null,
    failedLoginAttempts: 0,
    lastFailedLoginAt: null,
    unlockAttemptCount: 0,
    tokenVersion: 1,
  };

  if (existingUser) {
    const data = config.resetPassword
      ? {
          ...baseData,
          password: await bcrypt.hash(config.password, 10),
        }
      : baseData;

    return prisma.user.update({
      where: { id: existingUser.id },
      data,
    });
  }

  return prisma.user.create({
    data: {
      email: config.email,
      password: await bcrypt.hash(config.password, 10),
      ...baseData,
    },
  });
}

async function ensureSuperAdminAssignment(
  prisma: Prisma.TransactionClient,
  userId: string,
  roleId: string,
) {
  const existingAssignment = await prisma.userRole.findFirst({
    where: {
      userId,
      roleId,
    },
  });

  if (!existingAssignment) {
    return prisma.userRole.create({
      data: {
        userId,
        roleId,
        grantedBy: userId,
        isTemporary: false,
        isActive: true,
      },
    });
  }

  if (existingAssignment.isActive) {
    return existingAssignment;
  }

  return prisma.userRole.update({
    where: { id: existingAssignment.id },
    data: {
      isTemporary: false,
      isActive: true,
      revokedAt: null,
      revokedBy: null,
      revokeReason: null,
      expiresAt: null,
      grantedBy: userId,
    },
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  const config = loadSeedConfig();

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    min: 1,
    max: 5,
  });

  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
  });

  try {
    console.log('Starting production superadmin seed...');

    const result = await prisma.$transaction(async (tx) => {
      const role = await ensureSuperAdminRole(tx);
      const user = await upsertSuperAdminUser(tx, config);
      const assignment = await ensureSuperAdminAssignment(tx, user.id, role.id);

      return {
        role,
        user,
        assignment,
      };
    });

    console.log('Production superadmin seed completed successfully');
    console.log(
      JSON.stringify(
        {
          email: config.email,
          userId: result.user.id,
          roleId: result.role.id,
          roleSlug: result.role.slug,
          assignmentId: result.assignment.id,
          passwordReset: config.resetPassword,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Production superadmin seed failed');
  console.error(error);
  process.exit(1);
});
