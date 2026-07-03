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
  console.log('🌱 Starting comprehensive seed for iPhone 15, 16, and 17...');

  // --- CLEANUP: Delete existing iPhone products and variants ---
  console.log('🧹 Cleaning up existing iPhone products and variants...');

  // First, find all iPhone variant IDs
  const existingVariants = await prisma.productVariant.findMany({
    where: {
      OR: [
        { sku: { startsWith: 'IP15' } },
        { sku: { startsWith: 'IP16' } },
        { sku: { startsWith: 'IP17' } },
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
    console.log(`✅ Deleted ${deletedVariants.count} existing iPhone variants`);
  }

  // Delete products by name (since modelCode is moved)
  const deletedProducts = await prisma.product.deleteMany({
    where: {
      OR: [{ name: { startsWith: 'iPhone' } }],
    },
  });
  console.log(`✅ Deleted ${deletedProducts.count} existing iPhone products`);

  // 1. Ensure Brand exists
  const brand = await prisma.brand.upsert({
    where: { name: 'Apple' },
    update: {},
    create: { name: 'Apple' },
  });

  // 2. Ensure Category exists
  const category = await prisma.category.upsert({
    where: { name: 'Smartphones' },
    update: {},
    create: { name: 'Smartphones' },
  });

  // --- DATA CATALOG ---

  const allModels = [
    // ==========================================
    // IPHONE 15 SERIES (2023)
    // ==========================================
    {
      name: 'iPhone 15',
      modelCode: 'IPHONE-15',
      skuPrefix: 'IP15',
      description: `6.1" Display, A16 Bionic. Regions: US: A2846 | Global: A3090 | CN/HK: A3092 | JP/CA: A3089`,
      colors: ['Blue', 'Pink', 'Yellow', 'Green', 'Black'],
      storages: ['128GB', '256GB', '512GB'],
      specs: {
        display: '6.1-inch',
        chip: 'A16 Bionic',
        ram: '6GB',
        connectivity: '5G',
      },
    },
    {
      name: 'iPhone 15 Plus',
      modelCode: 'IPHONE-15-PLUS',
      skuPrefix: 'IP15P',
      description: `6.7" Display, A16 Bionic. Regions: US: A2847 | Global: A3094 | CN/HK: A3096 | JP/CA: A3093`,
      colors: ['Blue', 'Pink', 'Yellow', 'Green', 'Black'],
      storages: ['128GB', '256GB', '512GB'],
      specs: {
        display: '6.7-inch',
        chip: 'A16 Bionic',
        ram: '6GB',
        connectivity: '5G',
      },
    },
    {
      name: 'iPhone 15 Pro',
      modelCode: 'IPHONE-15-PRO',
      skuPrefix: 'IP15PRO',
      description: `6.1" Display, A17 Pro. Regions: US: A2848 | Global: A3102 | CN/HK: A3104 | JP/CA: A3101`,
      colors: [
        'Natural Titanium',
        'Blue Titanium',
        'White Titanium',
        'Black Titanium',
      ],
      storages: ['128GB', '256GB', '512GB', '1TB'],
      specs: {
        display: '6.1-inch',
        chip: 'A17 Pro',
        ram: '8GB',
        connectivity: '5G',
      },
    },
    {
      name: 'iPhone 15 Pro Max',
      modelCode: 'IPHONE-15-PRO-MAX',
      skuPrefix: 'IP15PM',
      description: `6.7" Display, A17 Pro, 5x Zoom. Regions: US: A2849 | Global: A3106 | CN/HK: A3108 | JP/CA: A3105`,
      colors: [
        'Natural Titanium',
        'Blue Titanium',
        'White Titanium',
        'Black Titanium',
      ],
      storages: ['256GB', '512GB', '1TB'], // Starts at 256GB
      specs: {
        display: '6.7-inch',
        chip: 'A17 Pro',
        ram: '8GB',
        connectivity: '5G',
      },
    },

    // ==========================================
    // IPHONE 16 SERIES (2024)
    // ==========================================
    {
      name: 'iPhone 16',
      modelCode: 'IPHONE-16',
      skuPrefix: 'IP16',
      description: `6.1" Display, A18 Chip. Regions: US: A3081 | Global: A3287 | CN/HK: A3288 | JP/CA: A3286`,
      colors: ['Ultramarine', 'Teal', 'Pink', 'White', 'Black'],
      storages: ['128GB', '256GB', '512GB'],
      specs: {
        display: '6.1-inch',
        chip: 'A18',
        ram: '8GB',
        connectivity: '5G / Wi-Fi 7',
      },
    },
    {
      name: 'iPhone 16 Plus',
      modelCode: 'IPHONE-16-PLUS',
      skuPrefix: 'IP16P',
      description: `6.7" Display, A18 Chip. Regions: US: A3082 | Global: A3290 | CN/HK: A3291 | JP/CA: A3289`,
      colors: ['Ultramarine', 'Teal', 'Pink', 'White', 'Black'],
      storages: ['128GB', '256GB', '512GB'],
      specs: {
        display: '6.7-inch',
        chip: 'A18',
        ram: '8GB',
        connectivity: '5G / Wi-Fi 7',
      },
    },
    {
      name: 'iPhone 16 Pro',
      modelCode: 'IPHONE-16-PRO',
      skuPrefix: 'IP16PRO',
      description: `6.3" Display, A18 Pro. Regions: US: A3083 | Global: A3293 | CN/HK: A3294 | JP/CA: A3292`,
      colors: [
        'Desert Titanium',
        'Natural Titanium',
        'White Titanium',
        'Black Titanium',
      ],
      storages: ['128GB', '256GB', '512GB', '1TB'],
      specs: {
        display: '6.3-inch',
        chip: 'A18 Pro',
        ram: '8GB',
        connectivity: '5G / Wi-Fi 7',
      },
    },
    {
      name: 'iPhone 16 Pro Max',
      modelCode: 'IPHONE-16-PRO-MAX',
      skuPrefix: 'IP16PM',
      description: `6.9" Display, A18 Pro. Regions: US: A3084 | Global: A3296 | CN/HK: A3297 | JP/CA: A3295`,
      colors: [
        'Desert Titanium',
        'Natural Titanium',
        'White Titanium',
        'Black Titanium',
      ],
      storages: ['256GB', '512GB', '1TB'], // Starts at 256GB
      specs: {
        display: '6.9-inch',
        chip: 'A18 Pro',
        ram: '8GB',
        connectivity: '5G / Wi-Fi 7',
      },
    },

    // ==========================================
    // IPHONE 17 SERIES (2025)
    // ==========================================
    {
      name: 'iPhone 17',
      modelCode: 'IPHONE-17',
      skuPrefix: 'IP17',
      description: `6.3" 120Hz Display, A19 Chip. Regions: US: A3258 | Global: A3520 | CN/HK: A3521 | JP/CA: A3519`,
      colors: ['Lavender', 'Sage', 'Mist Blue', 'White', 'Black'],
      storages: ['256GB', '512GB'], // Base 128GB Discontinued
      specs: {
        display: '6.3-inch',
        chip: 'A19',
        ram: '8GB',
        connectivity: '5G / Wi-Fi 7',
      },
    },
    {
      name: 'iPhone 17 Air',
      modelCode: 'IPHONE-17-AIR',
      skuPrefix: 'IP17AIR',
      description: `6.6" Ultra-Thin, A19 Pro, Single 48MP Cam. Regions: US: A3260 | Global: A3517 | CN/HK: A3518 | JP/CA: A3516`,
      colors: ['Space Black', 'Cloud White', 'Light Gold', 'Sky Blue'],
      storages: ['256GB', '512GB', '1TB'],
      specs: {
        display: '6.6-inch',
        chip: 'A19 Pro',
        ram: '12GB',
        connectivity: '5G / Wi-Fi 7',
      },
    },
    {
      name: 'iPhone 17 Pro',
      modelCode: 'IPHONE-17-PRO',
      skuPrefix: 'IP17PRO',
      description: `6.3" Display, A19 Pro, 12GB RAM. Regions: US: A3256 | Global: A3522 | CN/HK: A3524 | JP/CA: A3523`,
      colors: ['Cosmic Orange', 'Deep Blue', 'Silver', 'Space Black'],
      storages: ['256GB', '512GB', '1TB', '2TB'],
      specs: {
        display: '6.3-inch',
        chip: 'A19 Pro',
        ram: '12GB',
        connectivity: '5G / Wi-Fi 7',
      },
    },
    {
      name: 'iPhone 17 Pro Max',
      modelCode: 'IPHONE-17-PRO-MAX',
      skuPrefix: 'IP17PM',
      description: `6.9" Display, A19 Pro, 12GB RAM. Regions: US: A3257 | Global: A3526 | CN/HK: A3525 | JP/CA: A3527`,
      colors: ['Cosmic Orange', 'Deep Blue', 'Silver', 'Space Black'],
      storages: ['256GB', '512GB', '1TB', '2TB'],
      specs: {
        display: '6.9-inch',
        chip: 'A19 Pro',
        ram: '12GB',
        connectivity: '5G / Wi-Fi 7',
      },
    },
  ];

  // --- EXECUTION LOOP ---

  for (const model of allModels) {
    console.log(`Processing ${model.name}...`);

    // 1. Create the Product Parent
    const product = await prisma.product.create({
      data: {
        name: model.name,
        description: model.description,
        type: ProductType.SERIALIZED, // Tracking via Serial/IMEI
        brandId: brand.id,
        categoryId: category.id,
        minStock: 5,
      },
    });

    // 2. Create Variants (SKUs)
    for (const color of model.colors) {
      for (const storage of model.storages) {
        // SKU Generation Logic: IP17PRO-COS-1TB
        // Handle multi-word colors like "Natural Titanium" vs "Blue Titanium"
        const colorParts = color.split(' ');
        let colorCode: string;
        if (colorParts.length > 1) {
          colorCode = (
            colorParts[0].substring(0, 2) + colorParts[1].substring(0, 2)
          ).toUpperCase();
        } else {
          colorCode = color.toUpperCase().substring(0, 4);
        }
        const cleanStorage = storage.replace(' ', '');
        const sku = `${model.skuPrefix}-${colorCode}-${cleanStorage}`;

        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: `${model.name} ${color} ${storage}`,
            sku: sku,
            modelCode: sku,
            specs: {
              ...model.specs,
              color: color,
              storage: storage,
            },
          },
        });
      }
    }
  }

  console.log('✅ All iPhone models (15, 16, 17) seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
