import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaClient, ProductType } from '../../src/generated/prisma/client';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed for iPad Lineup (2020 - 2026)...');

  // --- CLEANUP: Delete existing iPad products and variants ---
  console.log('🧹 Cleaning up existing iPad products and variants...');

  // First, find all iPad variant IDs
  const existingVariants = await prisma.productVariant.findMany({
    where: {
      OR: [
        { sku: { startsWith: 'IPP11-' } },
        { sku: { startsWith: 'IPP12-' } },
        { sku: { startsWith: 'IPP13-' } },
        { sku: { startsWith: 'IPAIR-' } },
        { sku: { startsWith: 'IPMINI-' } },
        { sku: { startsWith: 'IPAD-' } },
      ],
    },
    select: { id: true },
  });
  const variantIds = existingVariants.map((v) => v.id);

  if (variantIds.length > 0) {
    // Delete inventory items first (FK constraint)
    const deletedInventory = await prisma.inventoryItem.deleteMany({
      where: { variantId: { in: variantIds } },
    });
    console.log(`  🗑️ Deleted ${deletedInventory.count} inventory items`);

    // Delete order items (FK constraint)
    const deletedOrderItems = await prisma.orderItem.deleteMany({
      where: { variantId: { in: variantIds } },
    });
    console.log(`  🗑️ Deleted ${deletedOrderItems.count} order items`);

    // Now delete variants
    const deletedVariants = await prisma.productVariant.deleteMany({
      where: { id: { in: variantIds } },
    });
    console.log(`✅ Deleted ${deletedVariants.count} existing iPad variants`);
  }

  // Delete products by name (since modelCode is moved)
  const deletedProducts = await prisma.product.deleteMany({
    where: {
      OR: [{ name: { startsWith: 'iPad' } }],
    },
  });
  console.log(`✅ Deleted ${deletedProducts.count} existing iPad products`);

  // 1. Ensure Brand exists
  const brand = await prisma.brand.upsert({
    where: { name: 'Apple' },
    update: {},
    create: { name: 'Apple' },
  });

  // 2. Ensure Category exists
  const category = await prisma.category.upsert({
    where: { name: 'Tablets' },
    update: {},
    create: { name: 'Tablets' },
  });

  // --- DATA CATALOG ---

  const ipadModels = [
    // ==========================================
    // IPAD PRO SERIES (High-End)
    // ==========================================
    {
      name: 'iPad Pro 11-inch (2nd Gen)',
      modelCode: 'IPAD-PRO-11-2GEN',
      skuPrefix: 'IPP11-2G',
      year: 2020,
      description: `11" Liquid Retina, A12Z Bionic. Models: A2228 (Wi-Fi) | A2068, A2230, A2231 (Cellular)`,
      colors: ['Space Gray', 'Silver'],
      storages: ['128GB', '256GB', '512GB', '1TB'],
      specs: {
        display: '11-inch',
        chip: 'A12Z Bionic',
        connectivity: 'Wi-Fi / 4G LTE',
      },
    },
    {
      name: 'iPad Pro 12.9-inch (4th Gen)',
      modelCode: 'IPAD-PRO-12.9-4GEN',
      skuPrefix: 'IPP12-4G',
      year: 2020,
      description: `12.9" Liquid Retina, A12Z Bionic. Models: A2229 (Wi-Fi) | A2069, A2232, A2233 (Cellular)`,
      colors: ['Space Gray', 'Silver'],
      storages: ['128GB', '256GB', '512GB', '1TB'],
      specs: {
        display: '12.9-inch',
        chip: 'A12Z Bionic',
        connectivity: 'Wi-Fi / 4G LTE',
      },
    },
    {
      name: 'iPad Pro 11-inch (3rd Gen)',
      modelCode: 'IPAD-PRO-11-3GEN',
      skuPrefix: 'IPP11-3G',
      year: 2021,
      description: `11" Liquid Retina, M1 Chip. Models: A2377 (Wi-Fi) | A2459, A2301, A2460 (Cellular)`,
      colors: ['Space Gray', 'Silver'],
      storages: ['128GB', '256GB', '512GB', '1TB', '2TB'],
      specs: { display: '11-inch', chip: 'M1', connectivity: '5G / Wi-Fi 6' },
    },
    {
      name: 'iPad Pro 12.9-inch (5th Gen)',
      modelCode: 'IPAD-PRO-12.9-5GEN',
      skuPrefix: 'IPP12-5G',
      year: 2021,
      description: `12.9" Liquid Retina XDR (Mini-LED), M1 Chip. Models: A2378 (Wi-Fi) | A2461, A2379, A2462 (Cellular)`,
      colors: ['Space Gray', 'Silver'],
      storages: ['128GB', '256GB', '512GB', '1TB', '2TB'],
      specs: { display: '12.9-inch', chip: 'M1', connectivity: '5G / Wi-Fi 6' },
    },
    {
      name: 'iPad Pro 11-inch (4th Gen)',
      modelCode: 'IPAD-PRO-11-4GEN',
      skuPrefix: 'IPP11-4G',
      year: 2022,
      description: `11" Liquid Retina, M2 Chip. Models: A2759 (Wi-Fi) | A2761, A2435, A2762 (Cellular)`,
      colors: ['Space Gray', 'Silver'],
      storages: ['128GB', '256GB', '512GB', '1TB', '2TB'],
      specs: { display: '11-inch', chip: 'M2', connectivity: '5G / Wi-Fi 6E' },
    },
    {
      name: 'iPad Pro 12.9-inch (6th Gen)',
      modelCode: 'IPAD-PRO-12.9-6GEN',
      skuPrefix: 'IPP12-6G',
      year: 2022,
      description: `12.9" XDR Display, M2 Chip. Models: A2436 (Wi-Fi) | A2764, A2437, A2766 (Cellular)`,
      colors: ['Space Gray', 'Silver'],
      storages: ['128GB', '256GB', '512GB', '1TB', '2TB'],
      specs: {
        display: '12.9-inch',
        chip: 'M2',
        connectivity: '5G / Wi-Fi 6E',
      },
    },
    {
      name: 'iPad Pro 11-inch (M4)',
      modelCode: 'IPAD-PRO-11-M4',
      skuPrefix: 'IPP11-M4',
      year: 2024,
      description: `11" Ultra Retina XDR (OLED), M4 Chip. Models: A2836 (Wi-Fi) | A2837 (Cellular) | A3006 (China)`,
      colors: ['Space Black', 'Silver'],
      storages: ['256GB', '512GB', '1TB', '2TB'],
      specs: { display: '11-inch', chip: 'M4', connectivity: '5G / Wi-Fi 6E' },
    },
    {
      name: 'iPad Pro 13-inch (M4)',
      modelCode: 'IPAD-PRO-13-M4',
      skuPrefix: 'IPP13-M4',
      year: 2024,
      description: `13" Ultra Retina XDR (OLED), M4 Chip. Models: A2925 (Wi-Fi) | A2926 (Cellular) | A3007 (China)`,
      colors: ['Space Black', 'Silver'],
      storages: ['256GB', '512GB', '1TB', '2TB'],
      specs: { display: '13-inch', chip: 'M4', connectivity: '5G / Wi-Fi 6E' },
    },
    // Future Model (2026 Context)
    {
      name: 'iPad Pro 13-inch (M5)',
      modelCode: 'IPAD-PRO-13-M5',
      skuPrefix: 'IPP13-M5',
      year: 2026,
      description: `13" OLED, M5 Chip, AI Engine. Models: A3801 (Wi-Fi) | A3802 (Cellular)`,
      colors: ['Titanium Black', 'Titanium Gray'],
      storages: ['512GB', '1TB', '2TB'],
      specs: { display: '13-inch', chip: 'M5', connectivity: '5G / Wi-Fi 7' },
    },

    // ==========================================
    // IPAD AIR SERIES (Mid-Range)
    // ==========================================
    {
      name: 'iPad Air (4th Gen)',
      modelCode: 'IPAD-AIR-4GEN',
      skuPrefix: 'IPAIR-4G',
      year: 2020,
      description: `10.9" Liquid Retina, A14 Bionic. Models: A2316 (Wi-Fi) | A2324, A2325, A2072 (Cellular)`,
      colors: ['Space Gray', 'Silver', 'Rose Gold', 'Green', 'Sky Blue'],
      storages: ['64GB', '256GB'],
      specs: {
        display: '10.9-inch',
        chip: 'A14 Bionic',
        connectivity: '4G LTE',
      },
    },
    {
      name: 'iPad Air (5th Gen)',
      modelCode: 'IPAD-AIR-5GEN',
      skuPrefix: 'IPAIR-5G',
      year: 2022,
      description: `10.9" Liquid Retina, M1 Chip. Models: A2588 (Wi-Fi) | A2589, A2591 (Cellular)`,
      colors: ['Space Gray', 'Starlight', 'Pink', 'Purple', 'Blue'],
      storages: ['64GB', '256GB'],
      specs: { display: '10.9-inch', chip: 'M1', connectivity: '5G' },
    },
    {
      name: 'iPad Air 11-inch (M2)',
      modelCode: 'IPAD-AIR-11-M2',
      skuPrefix: 'IPAIR-11-M2',
      year: 2024,
      description: `11" Liquid Retina, M2 Chip. Models: A2902 (Wi-Fi) | A2903 (Cellular) | A2904 (China)`,
      colors: ['Space Gray', 'Blue', 'Purple', 'Starlight'],
      storages: ['128GB', '256GB', '512GB', '1TB'],
      specs: { display: '11-inch', chip: 'M2', connectivity: '5G' },
    },
    {
      name: 'iPad Air 13-inch (M2)',
      modelCode: 'IPAD-AIR-13-M2',
      skuPrefix: 'IPAIR-13-M2',
      year: 2024,
      description: `13" Liquid Retina, M2 Chip. Models: A2898 (Wi-Fi) | A2899 (Cellular) | A2900 (China)`,
      colors: ['Space Gray', 'Blue', 'Purple', 'Starlight'],
      storages: ['128GB', '256GB', '512GB', '1TB'],
      specs: { display: '13-inch', chip: 'M2', connectivity: '5G' },
    },
    // Future Model (2025/26 Context)
    {
      name: 'iPad Air 13-inch (M3)',
      modelCode: 'IPAD-AIR-13-M3',
      skuPrefix: 'IPAIR-13-M3',
      year: 2025,
      description: `13" Liquid Retina, M3 Chip. Models: A3268 (Wi-Fi) | A3269 (Cellular)`,
      colors: ['Midnight', 'Starlight', 'Blue', 'Purple'],
      storages: ['128GB', '256GB', '512GB', '1TB'],
      specs: { display: '13-inch', chip: 'M3', connectivity: '5G / Wi-Fi 7' },
    },

    // ==========================================
    // IPAD MINI SERIES (Compact)
    // ==========================================
    {
      name: 'iPad mini (6th Gen)',
      modelCode: 'IPAD-MINI-6GEN',
      skuPrefix: 'IPMINI-6G',
      year: 2021,
      description: `8.3" Liquid Retina, A15 Bionic. Models: A2567 (Wi-Fi) | A2568, A2569 (Cellular)`,
      colors: ['Space Gray', 'Pink', 'Purple', 'Starlight'],
      storages: ['64GB', '256GB'],
      specs: { display: '8.3-inch', chip: 'A15 Bionic', connectivity: '5G' },
    },
    {
      name: 'iPad mini (A17 Pro)',
      modelCode: 'IPAD-MINI-7GEN',
      skuPrefix: 'IPMINI-7G',
      year: 2024,
      description: `8.3" Liquid Retina, A17 Pro Chip. Models: A2993 (Wi-Fi) | A2995 (Cellular) | A2996 (China)`,
      colors: ['Space Gray', 'Blue', 'Purple', 'Starlight'],
      storages: ['128GB', '256GB', '512GB'],
      specs: { display: '8.3-inch', chip: 'A17 Pro', connectivity: '5G' },
    },

    // ==========================================
    // IPAD STANDARD SERIES (Entry Level)
    // ==========================================
    {
      name: 'iPad (8th Gen)',
      modelCode: 'IPAD-8GEN',
      skuPrefix: 'IPAD-8G',
      year: 2020,
      description: `10.2" Retina, A12 Bionic. Models: A2270 (Wi-Fi) | A2428, A2429, A2430 (Cellular)`,
      colors: ['Space Gray', 'Silver', 'Gold'],
      storages: ['32GB', '128GB'],
      specs: {
        display: '10.2-inch',
        chip: 'A12 Bionic',
        connectivity: '4G LTE',
      },
    },
    {
      name: 'iPad (9th Gen)',
      modelCode: 'IPAD-9GEN',
      skuPrefix: 'IPAD-9G',
      year: 2021,
      description: `10.2" Retina, A13 Bionic. Models: A2602 (Wi-Fi) | A2603, A2604, A2605 (Cellular)`,
      colors: ['Space Gray', 'Silver'],
      storages: ['64GB', '256GB'],
      specs: {
        display: '10.2-inch',
        chip: 'A13 Bionic',
        connectivity: '4G LTE',
      },
    },
    {
      name: 'iPad (10th Gen)',
      modelCode: 'IPAD-10GEN',
      skuPrefix: 'IPAD-10G',
      year: 2022,
      description: `10.9" Liquid Retina, A14 Bionic. Models: A2696 (Wi-Fi) | A2757, A2777 (Cellular)`,
      colors: ['Silver', 'Blue', 'Pink', 'Yellow'],
      storages: ['64GB', '256GB'],
      specs: { display: '10.9-inch', chip: 'A14 Bionic', connectivity: '5G' },
    },
    {
      name: 'iPad (11th Gen)',
      modelCode: 'IPAD-11GEN',
      skuPrefix: 'IPAD-11G',
      year: 2025,
      description: `10.9" Liquid Retina, A16 Bionic. Models: A3354 (Wi-Fi) | A3355 (Cellular)`,
      colors: ['Silver', 'Blue', 'Pink', 'Green'],
      storages: ['128GB', '256GB'],
      specs: { display: '10.9-inch', chip: 'A16 Bionic', connectivity: '5G' },
    },
  ];

  // --- EXECUTION LOOP ---

  for (const model of ipadModels) {
    console.log(`Processing ${model.name} (${model.year})...`);

    // 1. Create the Product Parent
    const product = await prisma.product.create({
      data: {
        name: model.name,
        description: model.description,
        type: ProductType.SERIALIZED, // Tablets are tracked by Serial
        brandId: brand.id,
        categoryId: category.id,
        minStock: 3,
      },
    });

    // 2. Create Variants (SKUs)
    for (const color of model.colors) {
      for (const storage of model.storages) {
        // SKU Generation Logic: IPAIR-5G-PUR-64GB
        // Handle multi-word colors like "Titanium Black" vs "Titanium Gray"
        const colorParts = color.split(' ');
        let colorCode: string;
        if (colorParts.length > 1) {
          // Use first 2 chars of first word + first 2 chars of second word
          colorCode = (
            colorParts[0].substring(0, 2) + colorParts[1].substring(0, 2)
          ).toUpperCase();
        } else {
          colorCode = color.toUpperCase().substring(0, 4);
        }
        const cleanStorage = storage.replace(' ', '');
        const skuBase = `${model.skuPrefix}-${colorCode}-${cleanStorage}`;

        // Create Wi-Fi Only Variant
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: `${model.name} ${color} ${storage} (Wi-Fi)`,
            sku: `${skuBase}-WIFI`,
            modelCode: `${skuBase}-WIFI`,
            specs: {
              ...model.specs,
              color: color,
              storage: storage,
              connection: 'Wi-Fi Only',
              year: model.year,
            },
          },
        });

        // Create Wi-Fi + Cellular Variant
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: `${model.name} ${color} ${storage} (Cellular)`,
            sku: `${skuBase}-CELL`,
            modelCode: `${skuBase}-CELL`,
            specs: {
              ...model.specs,
              color: color,
              storage: storage,
              connection: 'Wi-Fi + Cellular',
              year: model.year,
            },
          },
        });
      }
    }
  }

  console.log('✅ All iPad models (2020-2026) seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
