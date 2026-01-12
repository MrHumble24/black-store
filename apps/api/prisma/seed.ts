import * as bcrypt from 'bcrypt';
import { PrismaService } from '../src/prisma/prisma.service';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaService();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Users
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
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
  const manager = await prisma.user.upsert({
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
  const salesperson = await prisma.user.upsert({
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

  // 2. Create Warehouses
  const mainStore = await prisma.warehouse.upsert({
    where: { name: 'Main Store' },
    update: {},
    create: {
      name: 'Main Store',
      address: 'Tashkent, Amir Temur 1',
      isShop: true,
    },
  });

  const warehouseA = await prisma.warehouse.upsert({
    where: { name: 'Warehouse A' },
    update: {},
    create: {
      name: 'Warehouse A',
      address: 'Tashkent, Industrial Zone',
      isShop: false,
    },
  });
  console.log('✅ Warehouses created');

  // 3. Brands & Categories
  const apple = await prisma.brand.upsert({
    where: { name: 'Apple' },
    update: {},
    create: { name: 'Apple' },
  });

  const samsung = await prisma.brand.upsert({
    where: { name: 'Samsung' },
    update: {},
    create: { name: 'Samsung' },
  });

  const phones = await prisma.category.upsert({
    where: { name: 'Smartphones' },
    update: {},
    create: { name: 'Smartphones' },
  });

  const accessories = await prisma.category.upsert({
    where: { name: 'Accessories' },
    update: {},
    create: { name: 'Accessories' },
  });
  console.log('✅ Brands & Categories created');

  // 4. Products & Variants
  let iphone15 = await prisma.product.findFirst({
    where: { name: 'iPhone 15' },
  });
  if (!iphone15) {
    iphone15 = await prisma.product.create({
      data: {
        name: 'iPhone 15',
        description: 'Latest Apple iPhone',
        type: 'SERIALIZED',
        minStock: 5,
        brandId: apple.id,
        categoryId: phones.id,
        variants: {
          create: [
            {
              sku: 'IP15-BLK-128',
              name: 'iPhone 15 Black 128GB',
              specs: { color: 'Black', storage: '128GB' },
              sellPrice: 999.0,
            },
            {
              sku: 'IP15-BLU-256',
              name: 'iPhone 15 Blue 256GB',
              specs: { color: 'Blue', storage: '256GB' },
              sellPrice: 1099.0,
            },
          ],
        },
      },
    });
  }

  let galaxyS24 = await prisma.product.findFirst({
    where: { name: 'Galaxy S24' },
  });
  if (!galaxyS24) {
    galaxyS24 = await prisma.product.create({
      data: {
        name: 'Galaxy S24',
        description: 'Samsung flagship phone',
        type: 'SERIALIZED',
        minStock: 5,
        brandId: samsung.id,
        categoryId: phones.id,
        variants: {
          create: [
            {
              sku: 'GS24-BLK-256',
              name: 'Galaxy S24 Black 256GB',
              specs: { color: 'Black', storage: '256GB', ram: '8GB' },
              sellPrice: 899.0,
            },
          ],
        },
      },
    });
  }

  const variants = await prisma.productVariant.findMany();
  const v_iphone15_blk = variants.find((v) => v.sku === 'IP15-BLK-128')!;
  const v_iphone15_blu = variants.find((v) => v.sku === 'IP15-BLU-256')!;
  const v_galaxyS24 = variants.find((v) => v.sku === 'GS24-BLK-256')!;
  console.log('✅ Products & Variants created');

  // 5. Providers
  const provider = await prisma.provider.upsert({
    where: { name: 'Apple Distributor UZ' },
    update: {},
    create: { name: 'Apple Distributor UZ', contact: '+998901234567' },
  });
  console.log('✅ Providers created');

  // 6. Purchases & Initial Inventory
  // Check if we already have inventory to avoid duplicate seeding
  const existingInventory = await prisma.inventoryItem.count();
  if (existingInventory === 0) {
    await prisma.purchase.create({
      data: {
        providerId: provider.id,
        userId: admin.id,
        referenceNo: 'PUR-2024-001',
        totalCost: 15000.0,
        items: {
          create: [
            // 5 Black iPhones
            ...Array.from({ length: 5 }).map((_, i) => ({
              variantId: v_iphone15_blk.id,
              warehouseId: warehouseA.id,
              serialNumber: `SN-IP15-BLK-${1000 + i}`,
              quantity: 1,
              costPrice: 850.0,
              status: 'AVAILABLE' as const,
            })),
            // 5 Blue iPhones
            ...Array.from({ length: 5 }).map((_, i) => ({
              variantId: v_iphone15_blu.id,
              warehouseId: warehouseA.id,
              serialNumber: `SN-IP15-BLU-${1000 + i}`,
              quantity: 1,
              costPrice: 950.0,
              status: 'AVAILABLE' as const,
            })),
            // 5 Galaxy S24
            ...Array.from({ length: 5 }).map((_, i) => ({
              variantId: v_galaxyS24.id,
              warehouseId: warehouseA.id,
              serialNumber: `SN-GS24-${1000 + i}`,
              quantity: 1,
              costPrice: 750.0,
              status: 'AVAILABLE' as const,
            })),
          ],
        },
      },
    });
    console.log('✅ Recorded initial purchase and stocked Warehouse A');

    // 7. Stock Movements (Transfer some to Main Store)
    const transferItems = await prisma.inventoryItem.findMany({
      where: { warehouseId: warehouseA.id },
      take: 6,
    });

    for (const item of transferItems) {
      await prisma.inventoryItem.update({
        where: { id: item.id },
        data: { warehouseId: mainStore.id },
      });

      await prisma.stockMovement.create({
        data: {
          type: 'TRANSFER',
          productId: iphone15!.id, // Simplified for seed
          quantity: 1,
          fromWarehouseId: warehouseA.id,
          toWarehouseId: mainStore.id,
          userId: manager.id,
          notes: `Transferring ${item.serialNumber} to shop`,
        },
      });
    }
    console.log('✅ Transferred some items to Main Store');

    // 8. Sales
    const saleItem = await prisma.inventoryItem.findFirst({
      where: { warehouseId: mainStore.id, status: 'AVAILABLE' },
      include: { variant: true },
    });

    if (saleItem) {
      await prisma.sale.create({
        data: {
          invoiceNo: 'INV-2024-001',
          userId: salesperson.id,
          customerName: 'Anvar Alimov',
          totalAmount: saleItem.variant.sellPrice,
          items: {
            create: {
              variantId: saleItem.variantId,
              quantity: 1,
              sellPrice: saleItem.variant.sellPrice,
              inventoryItem: {
                connect: { id: saleItem.id },
              },
            },
          },
        },
      });

      await prisma.inventoryItem.update({
        where: { id: saleItem.id },
        data: { status: 'SOLD' },
      });
      console.log('✅ Recorded a sample sale');
    }
  }

  // 9. Expenses
  const existingExpenses = await prisma.expense.count();
  if (existingExpenses === 0) {
    await prisma.expense.createMany({
      data: [
        {
          category: 'RENT',
          amount: 1200.0,
          description: 'Shop rent for January',
          createdById: admin.id,
        },
        {
          category: 'UTILITIES',
          amount: 150.0,
          description: 'Electricity bill',
          createdById: admin.id,
        },
      ],
    });
    console.log('✅ Recorded sample expenses');
  }

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
