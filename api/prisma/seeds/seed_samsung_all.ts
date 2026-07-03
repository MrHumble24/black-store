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
  console.log(
    '🌱 Starting COMPLETE seed for Samsung Lineup (S, Z, A Series)...',
  );

  // --- CLEANUP: Delete existing Samsung products and variants ---
  console.log('🧹 Cleaning up existing Samsung products and variants...');

  // First, find all Samsung variant IDs
  const existingVariants = await prisma.productVariant.findMany({
    where: {
      OR: [
        { sku: { startsWith: 'SAM-S22' } },
        { sku: { startsWith: 'SAM-S23' } },
        { sku: { startsWith: 'SAM-S24' } },
        { sku: { startsWith: 'SAM-S25' } },
        { sku: { startsWith: 'SAM-ZFOLD' } },
        { sku: { startsWith: 'SAM-ZFLIP' } },
        { sku: { startsWith: 'SAM-A' } },
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
    console.log(
      `✅ Deleted ${deletedVariants.count} existing Samsung variants`,
    );
  }

  // Delete products by name (since modelCode is moved)
  const deletedProducts = await prisma.product.deleteMany({
    where: {
      OR: [{ name: { startsWith: 'Samsung Galaxy' } }],
    },
  });
  console.log(`✅ Deleted ${deletedProducts.count} existing Samsung products`);

  // 1. Ensure Brand exists
  const brand = await prisma.brand.upsert({
    where: { name: 'Samsung' },
    update: {},
    create: { name: 'Samsung' },
  });

  // 2. Ensure Category exists
  const category = await prisma.category.upsert({
    where: { name: 'Smartphones' },
    update: {},
    create: { name: 'Smartphones' },
  });

  // ==========================================
  // DATA CATALOG
  // ==========================================

  const sSeries = [
    // --- S22 (2022) ---
    {
      name: 'Samsung Galaxy S22',
      modelCode: 'SM-S901',
      skuPrefix: 'SAM-S22',
      description: `6.1" AMOLED. Snap 8 Gen 1 / Exynos 2200.`,
      colors: [
        'Phantom Black',
        'Phantom White',
        'Green',
        'Pink Gold',
        'Bora Purple',
      ],
      storages: ['128GB', '256GB'],
      specs: { display: '6.1-inch', ram: '8GB', connectivity: '5G' },
    },
    {
      name: 'Samsung Galaxy S22+',
      modelCode: 'SM-S906',
      skuPrefix: 'SAM-S22P',
      description: `6.6" AMOLED. Snap 8 Gen 1 / Exynos 2200.`,
      colors: ['Phantom Black', 'Phantom White', 'Green', 'Pink Gold'],
      storages: ['128GB', '256GB'],
      specs: { display: '6.6-inch', ram: '8GB', connectivity: '5G' },
    },
    {
      name: 'Samsung Galaxy S22 Ultra',
      modelCode: 'SM-S908',
      skuPrefix: 'SAM-S22U',
      description: `6.8" Edge QHD+, S Pen. Snap 8 Gen 1 / Exynos 2200.`,
      colors: ['Phantom Black', 'Phantom White', 'Burgundy', 'Green'],
      storages: ['256GB', '512GB', '1TB'],
      specs: { display: '6.8-inch', ram: '12GB', connectivity: '5G' },
    },
    // --- S23 (2023) ---
    {
      name: 'Samsung Galaxy S23',
      modelCode: 'SM-S911',
      skuPrefix: 'SAM-S23',
      description: `6.1" AMOLED. Snap 8 Gen 2 for Galaxy.`,
      colors: ['Phantom Black', 'Cream', 'Green', 'Lavender'],
      storages: ['128GB', '256GB'],
      specs: { display: '6.1-inch', ram: '8GB', connectivity: '5G' },
    },
    {
      name: 'Samsung Galaxy S23+',
      modelCode: 'SM-S916',
      skuPrefix: 'SAM-S23P',
      description: `6.6" AMOLED. Snap 8 Gen 2 for Galaxy.`,
      colors: ['Phantom Black', 'Cream', 'Green', 'Lavender'],
      storages: ['256GB', '512GB'],
      specs: { display: '6.6-inch', ram: '8GB', connectivity: '5G' },
    },
    {
      name: 'Samsung Galaxy S23 Ultra',
      modelCode: 'SM-S918',
      skuPrefix: 'SAM-S23U',
      description: `6.8" Edge QHD+, 200MP. Snap 8 Gen 2 for Galaxy.`,
      colors: ['Phantom Black', 'Cream', 'Green', 'Lavender'],
      storages: ['256GB', '512GB', '1TB'],
      specs: { display: '6.8-inch', ram: '12GB', connectivity: '5G' },
    },
    // --- S24 (2024) ---
    {
      name: 'Samsung Galaxy S24',
      modelCode: 'SM-S921',
      skuPrefix: 'SAM-S24',
      description: `6.2" LTPO. Exynos 2400 / Snap 8 Gen 3. AI Features.`,
      colors: ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'],
      storages: ['128GB', '256GB', '512GB'],
      specs: { display: '6.2-inch', ram: '8GB', connectivity: '5G' },
    },
    {
      name: 'Samsung Galaxy S24+',
      modelCode: 'SM-S926',
      skuPrefix: 'SAM-S24P',
      description: `6.7" QHD+ LTPO. Exynos 2400 / Snap 8 Gen 3.`,
      colors: ['Onyx Black', 'Marble Gray', 'Cobalt Violet', 'Amber Yellow'],
      storages: ['256GB', '512GB'],
      specs: { display: '6.7-inch', ram: '12GB', connectivity: '5G' },
    },
    {
      name: 'Samsung Galaxy S24 Ultra',
      modelCode: 'SM-S928',
      skuPrefix: 'SAM-S24U',
      description: `6.8" Titanium Frame. Snap 8 Gen 3 (Global).`,
      colors: [
        'Titanium Black',
        'Titanium Gray',
        'Titanium Violet',
        'Titanium Yellow',
      ],
      storages: ['256GB', '512GB', '1TB'],
      specs: { display: '6.8-inch', ram: '12GB', connectivity: '5G' },
    },
    // --- S25 (2025/2026) ---
    {
      name: 'Samsung Galaxy S25',
      modelCode: 'SM-S931',
      skuPrefix: 'SAM-S25',
      description: `6.2" LTPO. Snap 8 Elite. One UI 7.`,
      colors: [
        'Moon Night Blue',
        'Silver Shadow',
        'Sparkling Green',
        'Midnight Black',
      ],
      storages: ['256GB', '512GB'],
      specs: { display: '6.2-inch', ram: '12GB', connectivity: '5G / Wi-Fi 7' },
    },
    {
      name: 'Samsung Galaxy S25+',
      modelCode: 'SM-S936',
      skuPrefix: 'SAM-S25P',
      description: `6.7" QHD+ LTPO. Snap 8 Elite.`,
      colors: [
        'Moon Night Blue',
        'Silver Shadow',
        'Sparkling Green',
        'Midnight Black',
      ],
      storages: ['256GB', '512GB'],
      specs: { display: '6.7-inch', ram: '12GB', connectivity: '5G / Wi-Fi 7' },
    },
    {
      name: 'Samsung Galaxy S25 Ultra',
      modelCode: 'SM-S938',
      skuPrefix: 'SAM-S25U',
      description: `6.9" Titanium. Snap 8 Elite. Rounded Corners.`,
      colors: [
        'Titanium Black',
        'Titanium Silver',
        'Titanium Blue',
        'Titanium Gray',
      ],
      storages: ['256GB', '512GB', '1TB'],
      specs: { display: '6.9-inch', ram: '16GB', connectivity: '5G / Wi-Fi 7' },
    },
  ];

  const zSeries = [
    // --- FOLD ---
    {
      name: 'Samsung Galaxy Z Fold4',
      modelCode: 'SM-F936',
      skuPrefix: 'SAM-ZFOLD4',
      description: `7.6" Inner. Snap 8+ Gen 1.`,
      colors: ['Graygreen', 'Phantom Black', 'Beige', 'Burgundy'],
      storages: ['256GB', '512GB', '1TB'],
      specs: { type: 'Foldable', ram: '12GB' },
    },
    {
      name: 'Samsung Galaxy Z Fold5',
      modelCode: 'SM-F946',
      skuPrefix: 'SAM-ZFOLD5',
      description: `7.6" Inner. Zero-gap hinge. Snap 8 Gen 2.`,
      colors: ['Icy Blue', 'Phantom Black', 'Cream', 'Gray', 'Blue'],
      storages: ['256GB', '512GB', '1TB'],
      specs: { type: 'Foldable', ram: '12GB' },
    },
    {
      name: 'Samsung Galaxy Z Fold6',
      modelCode: 'SM-F956',
      skuPrefix: 'SAM-ZFOLD6',
      description: `7.6" Inner. Snap 8 Gen 3. Boxier Design.`,
      colors: ['Silver Shadow', 'Pink', 'Navy', 'Crafted Black', 'White'],
      storages: ['256GB', '512GB', '1TB'],
      specs: { type: 'Foldable', ram: '12GB' },
    },
    {
      name: 'Samsung Galaxy Z Fold7', // 2025
      modelCode: 'SM-F966',
      skuPrefix: 'SAM-ZFOLD7',
      description: `7.8" Inner. Snap 8 Elite. Thinner.`,
      colors: [
        'Titanium Silver',
        'Titanium Black',
        'Deep Green',
        'Burgundy Red',
      ],
      storages: ['256GB', '512GB', '1TB', '2TB'],
      specs: { type: 'Foldable', ram: '16GB' },
    },
    // --- FLIP ---
    {
      name: 'Samsung Galaxy Z Flip4',
      modelCode: 'SM-F721',
      skuPrefix: 'SAM-ZFLIP4',
      description: `6.7" Main. Snap 8+ Gen 1.`,
      colors: ['Bora Purple', 'Graphite', 'Pink Gold', 'Blue'],
      storages: ['128GB', '256GB', '512GB'],
      specs: { type: 'Flip', ram: '8GB' },
    },
    {
      name: 'Samsung Galaxy Z Flip5',
      modelCode: 'SM-F731',
      skuPrefix: 'SAM-ZFLIP5',
      description: `6.7" Main / 3.4" Flex Window. Snap 8 Gen 2.`,
      colors: ['Mint', 'Graphite', 'Cream', 'Lavender', 'Gray'],
      storages: ['256GB', '512GB'],
      specs: { type: 'Flip', ram: '8GB' },
    },
    {
      name: 'Samsung Galaxy Z Flip6',
      modelCode: 'SM-F741',
      skuPrefix: 'SAM-ZFLIP6',
      description: `6.7" Main. Snap 8 Gen 3. 50MP Cam.`,
      colors: ['Silver Shadow', 'Yellow', 'Blue', 'Mint', 'Crafted Black'],
      storages: ['256GB', '512GB'],
      specs: { type: 'Flip', ram: '12GB' },
    },
    {
      name: 'Samsung Galaxy Z Flip7', // 2025
      modelCode: 'SM-F751',
      skuPrefix: 'SAM-ZFLIP7',
      description: `6.7" Main / 3.9" Cover. Snap 8 Elite.`,
      colors: ['Ocean Blue', 'Sunset Orange', 'Titanium Gray', 'Black'],
      storages: ['256GB', '512GB'],
      specs: { type: 'Flip', ram: '12GB' },
    },
  ];

  const aSeries = [
    {
      name: 'Samsung Galaxy A54 5G',
      modelCode: 'SM-A546',
      skuPrefix: 'SAM-A54',
      description: `6.4" AMOLED. Exynos 1380.`,
      colors: [
        'Awesome Lime',
        'Awesome Graphite',
        'Awesome Violet',
        'Awesome White',
      ],
      storages: ['128GB', '256GB'],
      specs: { display: '6.4-inch', ram: '8GB', connectivity: '5G' },
    },
    {
      name: 'Samsung Galaxy A34 5G',
      modelCode: 'SM-A346',
      skuPrefix: 'SAM-A34',
      description: `6.6" AMOLED. Dimensity 1080.`,
      colors: [
        'Awesome Lime',
        'Awesome Graphite',
        'Awesome Violet',
        'Awesome Silver',
      ],
      storages: ['128GB', '256GB'],
      specs: { display: '6.6-inch', ram: '6GB', connectivity: '5G' },
    },
    {
      name: 'Samsung Galaxy A55 5G',
      modelCode: 'SM-A556',
      skuPrefix: 'SAM-A55',
      description: `6.6" AMOLED. Exynos 1480. Metal Frame.`,
      colors: [
        'Awesome Iceblue',
        'Awesome Lilac',
        'Awesome Navy',
        'Awesome Lemon',
      ],
      storages: ['128GB', '256GB'],
      specs: { display: '6.6-inch', ram: '8GB', connectivity: '5G' },
    },
    {
      name: 'Samsung Galaxy A56 5G', // 2025
      modelCode: 'SM-A566',
      skuPrefix: 'SAM-A56',
      description: `6.5" OLED. Exynos 1580 (AMD GPU).`,
      colors: [
        'Awesome Graphite',
        'Awesome Mint',
        'Awesome Peach',
        'Awesome Sky',
      ],
      storages: ['128GB', '256GB'],
      specs: { display: '6.5-inch', ram: '8GB', connectivity: '5G' },
    },
  ];

  // Combine all arrays
  const allModels = [...sSeries, ...zSeries, ...aSeries];

  // ==========================================
  // EXECUTION
  // ==========================================

  for (const model of allModels) {
    console.log(`Processing ${model.name}...`);

    // 1. Create the Product Parent
    const product = await prisma.product.create({
      data: {
        name: model.name,
        description: model.description,
        type: ProductType.SERIALIZED,
        brandId: brand.id,
        categoryId: category.id,
        minStock: 5,
      },
    });

    // 2. Create Variants (SKUs)
    for (const color of model.colors) {
      for (const storage of model.storages) {
        // --- SKU GENERATION LOGIC ---
        let cleanColor = color;
        let colorCode = '';

        // Handle specific naming conventions
        if (cleanColor.startsWith('Awesome ')) {
          // A-Series: "Awesome Lime" -> "LIME"
          cleanColor = cleanColor.replace('Awesome ', '');
          colorCode = cleanColor.substring(0, 4).toUpperCase();
        } else if (cleanColor.startsWith('Phantom ')) {
          // S/Z Series: "Phantom Black" -> "PBLK"
          cleanColor = cleanColor.replace('Phantom ', '');
          colorCode = `P${cleanColor.substring(0, 3).toUpperCase()}`;
        } else if (cleanColor.startsWith('Titanium ')) {
          // S/Z Series: "Titanium Gray" -> "TGRA"
          cleanColor = cleanColor.replace('Titanium ', '');
          colorCode = `T${cleanColor.substring(0, 3).toUpperCase()}`;
        } else if (cleanColor === 'Silver Shadow') {
          colorCode = 'SLVS';
        } else if (cleanColor === 'Pink Gold') {
          colorCode = 'PKGD';
        } else {
          // Fallback: First 3 letters (e.g., "Green" -> "GRE")
          colorCode = cleanColor.substring(0, 3).toUpperCase();
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
              releaseYear:
                model.description.includes('S25') ||
                model.description.includes('Z Fold7')
                  ? 2025
                  : model.description.includes('S24') ||
                      model.description.includes('Z Fold6')
                    ? 2024
                    : model.description.includes('S23') ||
                        model.description.includes('Z Fold5')
                      ? 2023
                      : 2022,
            },
          },
        });
      }
    }
  }

  console.log('✅ COMPLETE Samsung Seed (S, Z, A Series) finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
