/**
 * RBAC Seed Data
 * Creates roles, permissions, and assigns them to users
 * Now uses centralized SYSTEM_ROLES and ALL_PERMISSIONS from constants
 */

import { PrismaClient } from '@prisma/client';
import {
  SYSTEM_ROLES,
  ALL_PERMISSIONS,
  ROLE_PERMISSIONS_MAP,
  getPermissionString,
} from '../../src/application/common/constants/permissions.constants';

export async function seedRBAC(prisma: PrismaClient, users?: any) {
  console.log('🔐 Seeding RBAC from centralized constants...');

  // ============= Create Roles from SYSTEM_ROLES =============
  const roleMap: Record<string, any> = {};

  for (const roleData of SYSTEM_ROLES) {
    const role = await prisma.role.create({
      data: {
        slug: roleData.slug,
        name: roleData.name,
        nameAr: roleData.nameAr,
        description: roleData.description,
        descriptionAr: roleData.descriptionAr,
        isSystemRole: true,
        isActive: roleData.isActive,
        priority:
          roleData.slug === 'SUPERADMIN'
            ? 100
            : roleData.slug === 'IT_ADMIN'
              ? 95
            : roleData.slug === 'ADMIN'
              ? 90
              : roleData.slug.includes('MANAGER')
                ? 80
                : roleData.slug.includes('STAFF')
                  ? 70
                  : 50,
      },
    });
    roleMap[roleData.slug] = role;
  }

  console.log(`✅ ${Object.keys(roleMap).length} Roles created`);

  // ============= Create Permissions from ALL_PERMISSIONS =============
  const permissionMap: Record<string, any> = {};

  for (const permData of ALL_PERMISSIONS) {
    const permString = getPermissionString(permData);
    const permission = await prisma.permission.create({
      data: {
        name: permString,
        nameAr: permData.nameAr,
        resource: permData.resource,
        action: permData.action,
        description: permData.description,
        descriptionAr: permData.descriptionAr,
      },
    });
    permissionMap[permString] = permission;
  }

  console.log(`✅ ${Object.keys(permissionMap).length} Permissions created`);

  // ============= Assign Permissions to Roles from ROLE_PERMISSIONS_MAP =============
  let totalAssignments = 0;

  for (const [roleSlug, permissionNames] of Object.entries(
    ROLE_PERMISSIONS_MAP,
  )) {
    const role = roleMap[roleSlug];
    if (!role) {
      console.warn(`⚠️  Role ${roleSlug} not found, skipping...`);
      continue;
    }

    let assignedCount = 0;
    for (const permName of permissionNames) {
      const permission = permissionMap[permName];
      if (!permission) {
        console.warn(
          `⚠️  Permission ${permName} not found for role ${roleSlug}`,
        );
        continue;
      }

      await prisma.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
      assignedCount++;
    }
    totalAssignments += assignedCount;
  }

  console.log(`✅ ${totalAssignments} Permissions assigned to roles`);
}
