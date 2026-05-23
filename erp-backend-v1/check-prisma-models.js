const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  const keys = Object.keys(prisma).filter(
    (k) => !k.startsWith('_') && !k.startsWith('$'),
  );

  console.log('Prisma Client Properties:');
  console.log(keys.sort().join('\n'));

  await prisma.$disconnect();
}

main();
