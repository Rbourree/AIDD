import { PrismaClient, TenantRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Hash password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create first user
  const user1 = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
    },
  });

  // Create second user
  const user2 = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: hashedPassword,
      firstName: 'Regular',
      lastName: 'User',
    },
  });

  // Create tenant
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
    },
  });

  // Create tenant user relationships
  await prisma.tenantUser.upsert({
    where: {
      userId_tenantId: {
        userId: user1.id,
        tenantId: tenant1.id,
      },
    },
    update: {},
    create: {
      userId: user1.id,
      tenantId: tenant1.id,
      role: TenantRole.OWNER,
    },
  });

  await prisma.tenantUser.upsert({
    where: {
      userId_tenantId: {
        userId: user2.id,
        tenantId: tenant1.id,
      },
    },
    update: {},
    create: {
      userId: user2.id,
      tenantId: tenant1.id,
      role: TenantRole.MEMBER,
    },
  });

  // Create sample items
  await prisma.item.create({
    data: {
      name: 'Sample Item 1',
      description: 'This is a sample item for Acme Corp',
      tenantId: tenant1.id,
    },
  });

  await prisma.item.create({
    data: {
      name: 'Sample Item 2',
      description: 'Another sample item for Acme Corp',
      tenantId: tenant1.id,
    },
  });

  console.log('Seed completed successfully!');
  console.log('Login credentials:');
  console.log('- Email: admin@example.com, Password: password123');
  console.log('- Email: user@example.com, Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });