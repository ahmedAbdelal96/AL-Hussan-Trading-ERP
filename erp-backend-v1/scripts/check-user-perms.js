const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: 'f6e12316-2bec-4045-9696-4ef1fa4f95ca' },
    select: {
      email: true,
      firstName: true,
      roles: {
        select: {
          role: {
            select: {
              id: true,
              name: true,
              permissions: {
                select: { permission: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log('User:', user.firstName, user.email);
  for (const ur of user.roles) {
    console.log('\nRole:', ur.role.name, '(id:', ur.role.id + ')');
    const perms = ur.role.permissions.map((p) => p.permission.name).sort();
    console.log('Permissions:', perms.length);
    perms.forEach((p) => console.log(' -', p));
  }

  // Check if reports:users:audit permission exists
  const auditPerm = await prisma.permission.findFirst({
    where: { name: 'reports:users:audit' },
  });
  console.log(
    '\naudit permission exists?',
    auditPerm ? 'YES (id: ' + auditPerm.id + ')' : 'NO',
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
