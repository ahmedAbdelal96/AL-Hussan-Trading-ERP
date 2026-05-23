/**
 * Users Seed Data
 * Creates initial system users for the ERP system
 * Users are now linked to roles from SYSTEM_ROLES
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaClient) {
  console.log('👤 Seeding Users...');

  const hashedPassword = await bcrypt.hash('Admin@123456', 10);

  // Get roles first
  const superAdminRole = await prisma.role.findUnique({
    where: { slug: 'SUPERADMIN' },
  });
  const adminRole = await prisma.role.findUnique({ where: { slug: 'ADMIN' } });
  const itAdminRole = await prisma.role.findUnique({
    where: { slug: 'IT_ADMIN' },
  });
  const opsManagerRole = await prisma.role.findUnique({
    where: { slug: 'OPS_MANAGER' },
  });
  const hrManagerRole = await prisma.role.findUnique({
    where: { slug: 'HR_MANAGER' },
  });
  const finManagerRole = await prisma.role.findUnique({
    where: { slug: 'FIN_MANAGER' },
  });
  const userRole = await prisma.role.findUnique({ where: { slug: 'USER' } });

  // Super Admin User
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@erp.sys',
      password: hashedPassword,
      firstName: 'عبدالله',
      lastName: 'المري',
      phone: '+201501234567',
      isActive: true,
      tokenVersion: 1,
    },
  });

  // Assign SUPERADMIN role
  if (superAdminRole) {
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

  // Admin User
  const admin = await prisma.user.create({
    data: {
      email: 'admin@erp.sys',
      password: hashedPassword,
      firstName: 'محمد',
      lastName: 'العتيبي',
      phone: '+201502345678',
      isActive: true,
      tokenVersion: 1,
    },
  });

  // Assign ADMIN role
  if (adminRole) {
    await prisma.userRole.create({
      data: {
        userId: admin.id,
        roleId: adminRole.id,
        grantedBy: superAdmin.id,
        isTemporary: false,
        isActive: true,
      },
    });
  }

  // Project/Operations Manager
  const itAdmin = await prisma.user.create({
    data: {
      email: 'it@erp.sys',
      password: hashedPassword,
      firstName: 'علي',
      lastName: 'التقني',
      phone: '+201507890123',
      isActive: true,
      tokenVersion: 1,
    },
  });

  // Assign IT_ADMIN role
  if (itAdminRole) {
    await prisma.userRole.create({
      data: {
        userId: itAdmin.id,
        roleId: itAdminRole.id,
        grantedBy: superAdmin.id,
        isTemporary: false,
        isActive: true,
      },
    });
  }

  // Project/Operations Manager
  const projectManager = await prisma.user.create({
    data: {
      email: 'manager@erp.sys',
      password: hashedPassword,
      firstName: 'أحمد',
      lastName: 'الغامدي',
      phone: '+201503456789',
      isActive: true,
      tokenVersion: 1,
    },
  });

  // Assign OPS_MANAGER role
  if (opsManagerRole) {
    await prisma.userRole.create({
      data: {
        userId: projectManager.id,
        roleId: opsManagerRole.id,
        grantedBy: superAdmin.id,
        isTemporary: false,
        isActive: true,
      },
    });
  }

  // HR Manager
  const hrManager = await prisma.user.create({
    data: {
      email: 'hr@erp.sys',
      password: hashedPassword,
      firstName: 'فاطمة',
      lastName: 'الشهري',
      phone: '+201504567890',
      isActive: true,
      tokenVersion: 1,
    },
  });

  // Assign HR_MANAGER role
  if (hrManagerRole) {
    await prisma.userRole.create({
      data: {
        userId: hrManager.id,
        roleId: hrManagerRole.id,
        grantedBy: superAdmin.id,
        isTemporary: false,
        isActive: true,
      },
    });
  }

  // Finance Manager
  const financeManager = await prisma.user.create({
    data: {
      email: 'finance@erp.sys',
      password: hashedPassword,
      firstName: 'خالد',
      lastName: 'الدوسري',
      phone: '+201505678901',
      isActive: true,
      tokenVersion: 1,
    },
  });

  // Assign FIN_MANAGER role
  if (finManagerRole) {
    await prisma.userRole.create({
      data: {
        userId: financeManager.id,
        roleId: finManagerRole.id,
        grantedBy: superAdmin.id,
        isTemporary: false,
        isActive: true,
      },
    });
  }

  // Regular User
  const user = await prisma.user.create({
    data: {
      email: 'user@erp.sys',
      password: hashedPassword,
      firstName: 'سارة',
      lastName: 'القحطاني',
      phone: '+201506789012',
      isActive: true,
      tokenVersion: 1,
    },
  });

  // Assign USER role
  if (userRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: userRole.id,
        grantedBy: superAdmin.id,
        isTemporary: false,
        isActive: true,
      },
    });
  }

  console.log('✅ Users created and linked to roles:', {
    superAdmin: `${superAdmin.id} (SUPERADMIN)`,
    itAdmin: `${itAdmin.id} (IT_ADMIN)`,
    admin: `${admin.id} (ADMIN)`,
    projectManager: `${projectManager.id} (OPS_MANAGER)`,
    hrManager: `${hrManager.id} (HR_MANAGER)`,
    financeManager: `${financeManager.id} (FIN_MANAGER)`,
    user: `${user.id} (USER)`,
  });

  return {
    superAdmin,
    itAdmin,
    admin,
    projectManager,
    hrManager,
    financeManager,
    user,
  };
}

