import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Users
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@blackstore.uz' },
    update: { password: hashedPassword },
    create: {
      email: 'admin@blackstore.uz',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'ADMIN',
    },
  });

  const managerPassword = await bcrypt.hash('manager123', 10);
  await prisma.user.upsert({
    where: { email: 'manager@blackstore.uz' },
    update: { password: managerPassword },
    create: {
      email: 'manager@blackstore.uz',
      password: managerPassword,
      name: 'Store Manager',
      role: 'MANAGER',
    },
  });

  const salesPassword = await bcrypt.hash('sales123', 10);
  await prisma.user.upsert({
    where: { email: 'sales@blackstore.uz' },
    update: { password: salesPassword },
    create: {
      email: 'sales@blackstore.uz',
      password: salesPassword,
      name: 'John Seller',
      role: 'SALESPERSON',
    },
  });
  console.log('✅ Users created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📧 Login credentials:');
  console.log('   Admin: admin@blackstore.uz / admin123');
  console.log('   Manager: manager@blackstore.uz / manager123');
  console.log('   Sales: sales@blackstore.uz / sales123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
