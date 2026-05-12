const { PrismaClient } = require('c:/tusuper-backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const mod = await prisma.module.findUnique({ where: { name: 'orders' } });
  if (!mod) {
    console.log('Module "orders" not found. Creating it...');
    await prisma.module.create({
      data: {
        name: 'orders',
        description: 'Module for managing orders',
        isActive: true,
      }
    });
    console.log('Module "orders" created.');
  } else {
    console.log('Module "orders" already exists:', mod);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
