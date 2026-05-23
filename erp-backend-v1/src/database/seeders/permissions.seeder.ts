/**
 * ============================================================================
 * PERMISSIONS & ROLES SEEDER
 * ============================================================================
 *
 * Automatically seeds the database with:
 * 1. All system permissions (36 permissions)
 * 2. Default roles (SUPERADMIN, ADMIN, HR_MANAGER, etc.)
 * 3. Role-Permission assignments
 *
 * Usage:
 * npm run seed:permissions
 *
 * ============================================================================
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  SYSTEM_ROLES,
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS_MAP,
  getPermissionString,
} from '../../application/common/constants/permissions.constants';

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file');
  process.exit(1);
}

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: 2,
  max: 10,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Main Seed Function
 */
async function main() {
  console.log('🌱 Starting Permissions & Roles Seeding...\n');

  let createdPermissions = 0;
  let existingPermissions = 0;
  let rolesResult = { count: 0 };
  let rolesTotal = 0;

  try {
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Seed Permissions
    // ═══════════════════════════════════════════════════════════════
    console.log('📋 Step 1: Seeding Permissions...');

    for (const permission of ALL_PERMISSIONS) {
      const permissionString = getPermissionString(permission);

      // Check if permission already exists
      const existing = await prisma.permission.findUnique({
        where: {
          name: permissionString,
        },
      });

      if (existing) {
        // Update existing permission with Arabic translation
        await prisma.permission.update({
          where: { id: existing.id },
          data: {
            nameAr: permission.nameAr,
            descriptionAr: permission.descriptionAr,
          },
        });
        existingPermissions++;
        console.log(`  🔄 ${permissionString} (updated with Arabic)`);
      } else {
        await prisma.permission.create({
          data: {
            name: permissionString,
            nameAr: permission.nameAr,
            resource: permission.resource,
            action: permission.action,
            description: permission.description,
            descriptionAr: permission.descriptionAr,
          },
        });
        createdPermissions++;
        console.log(`  ✅ ${permissionString} (created)`);
      }
    }

    console.log(
      `\n✨ Permissions Summary: ${createdPermissions} created, ${existingPermissions} existing\n`,
    );

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Seed Roles
    // ═══════════════════════════════════════════════════════════════
    console.log('👥 Step 2: Seeding Roles...');

    // استخدام upsert لكل دور بدلاً من createMany
    let createdRoles = 0;
    let updatedRoles = 0;

    for (const role of SYSTEM_ROLES) {
      try {
        const existing = await prisma.role.findUnique({
          where: { slug: role.slug },
        });

        if (existing) {
          // Update existing role with Arabic
          await prisma.role.update({
            where: { slug: role.slug },
            data: {
              name: role.name, // Update name too in case it changed
              nameAr: role.nameAr,
              descriptionAr: role.descriptionAr,
            },
          });
          updatedRoles++;
          console.log(`  🔄 ${role.slug} (updated)`);
        } else {
          // Create new role
          await prisma.role.create({
            data: role,
          });
          createdRoles++;
          console.log(`  ✅ ${role.slug} (created)`);
        }
      } catch (error: any) {
        // If unique constraint error on name, skip it
        if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
          console.log(`  ⚠️  ${role.slug} - skipped (name conflict)`);
        } else {
          throw error; // Re-throw other errors
        }
      }
    }
    rolesResult = { count: createdRoles };
    rolesTotal = SYSTEM_ROLES.length;

    console.log(`  ✅ ${rolesResult.count} new roles created`);
    console.log(`  🔄 ${updatedRoles} roles updated with Arabic`);
    console.log(
      `  ⏭️  ${rolesTotal - rolesResult.count - updatedRoles} roles already exist`,
    );

    console.log(
      `\n✨ Roles Summary: ${rolesResult.count} new, ${updatedRoles} updated, ${rolesTotal - rolesResult.count - updatedRoles} existing\n`,
    );

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Assign Permissions to Roles
    // ═══════════════════════════════════════════════════════════════
    console.log('🔗 Step 3: Assigning Permissions to Roles...');

    let totalAssignments = 0;

    for (const [roleSlug, permissionStrings] of Object.entries(
      ROLE_PERMISSIONS_MAP,
    )) {
      console.log(`\n  📌 Processing role: ${roleSlug}`);

      const role = await prisma.role.findUnique({
        where: { slug: roleSlug },
      });

      if (!role) {
        console.log(`    ⚠️  Role ${roleSlug} not found, skipping...`);
        continue;
      }

      // Reconcile role permissions with ROLE_PERMISSIONS_MAP:
      // - Remove stale permissions that are no longer part of the role defaults
      // - Add missing permissions from the defaults
      //
      // NOTE: This does NOT touch user custom GRANT/REVOKE permissions.
      const desiredPermissions = new Set(permissionStrings);
      const existingRolePermissions = await prisma.rolePermission.findMany({
        where: { roleId: role.id },
        include: {
          permission: {
            select: { id: true, name: true },
          },
        },
      });

      const stalePermissionIds = existingRolePermissions
        .filter((rp) => !desiredPermissions.has(rp.permission.name))
        .map((rp) => rp.permissionId);

      if (stalePermissionIds.length > 0) {
        const removed = await prisma.rolePermission.deleteMany({
          where: {
            roleId: role.id,
            permissionId: { in: stalePermissionIds },
          },
        });
        console.log(
          `    🧹 Removed ${removed.count} stale permissions from ${roleSlug}`,
        );
      }

      let assignedCount = 0;

      for (const permString of permissionStrings) {
        // Get permission by name directly
        const permission = await prisma.permission.findUnique({
          where: {
            name: permString,
          },
        });

        if (!permission) {
          console.log(`    ⚠️  Permission ${permString} not found`);
          continue;
        }

        // Check if already assigned
        const existing = await prisma.rolePermission.findUnique({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
        });

        if (!existing) {
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
          assignedCount++;
        }
      }

      console.log(`    ✅ Assigned ${assignedCount} new permissions`);
      totalAssignments += assignedCount;
    }

    console.log(`\n✨ Total new assignments: ${totalAssignments}\n`);

    // ═══════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ SEEDING COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(
      `📋 Permissions: ${createdPermissions} new, ${existingPermissions} existing`,
    );
    console.log(
      `👥 Roles: ${rolesResult.count} new, ${rolesTotal - rolesResult.count} existing`,
    );
    console.log(`🔗 Assignments: ${totalAssignments} new connections`);
    console.log(
      '═══════════════════════════════════════════════════════════\n',
    );
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

// Run the seeder
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
