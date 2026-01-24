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
  console.log('🌱 Starting COMPLETE seed for MacBook Lineup (2020 - 2026)...');

  // --- CLEANUP: Delete existing MacBook products and variants ---
  console.log('🧹 Cleaning up existing MacBook products and variants...');

  // First, find all MacBook variant IDs
  const existingVariants = await prisma.productVariant.findMany({
    where: {
      OR: [
        { sku: { startsWith: 'MBA-' } },
        { sku: { startsWith: 'MBA13-' } },
        { sku: { startsWith: 'MBA15-' } },
        { sku: { startsWith: 'MBP13-' } },
        { sku: { startsWith: 'MBP14-' } },
        { sku: { startsWith: 'MBP16-' } },
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
      `✅ Deleted ${deletedVariants.count} existing MacBook variants`,
    );
  }

  // Delete products by name (since modelCode is moved)
  const deletedProducts = await prisma.product.deleteMany({
    where: {
      OR: [{ name: { startsWith: 'MacBook' } }],
    },
  });
  console.log(`✅ Deleted ${deletedProducts.count} existing MacBook products`);

  const brand = await prisma.brand.upsert({
    where: { name: 'Apple' },
    update: {},
    create: { name: 'Apple' },
  });
  const category = await prisma.category.upsert({
    where: { name: 'Laptops' },
    update: {},
    create: { name: 'Laptops' },
  });

  const macbooks = [
    // ==========================================
    // MACBOOK AIR SERIES
    // ==========================================
    {
      name: 'MacBook Air (M1)',
      modelCode: 'MBA-M1-2020',
      skuPrefix: 'MBA-M1',
      description: `13.3" Retina, M1 Chip. Model: A2337`,
      colors: ['Space Gray', 'Gold', 'Silver'],
      configs: [
        { ram: '8GB', storage: '256GB' },
        { ram: '8GB', storage: '512GB' },
      ],
      specs: { display: '13.3-inch', chip: 'M1', year: 2020 },
    },
    {
      name: 'MacBook Air 13-inch (M2)',
      modelCode: 'MBA-13-M2-2022',
      skuPrefix: 'MBA13-M2',
      description: `13.6" Liquid Retina, M2 Chip. Model: A2681`,
      colors: ['Midnight', 'Starlight', 'Space Gray', 'Silver'],
      configs: [
        { ram: '8GB', storage: '256GB' },
        { ram: '8GB', storage: '512GB' },
      ],
      specs: { display: '13.6-inch', chip: 'M2', year: 2022 },
    },
    {
      name: 'MacBook Air 15-inch (M2)',
      modelCode: 'MBA-15-M2-2023',
      skuPrefix: 'MBA15-M2',
      description: `15.3" Liquid Retina, M2 Chip. Model: A2941`,
      colors: ['Midnight', 'Starlight', 'Space Gray', 'Silver'],
      configs: [
        { ram: '8GB', storage: '256GB' },
        { ram: '8GB', storage: '512GB' },
      ],
      specs: { display: '15.3-inch', chip: 'M2', year: 2023 },
    },
    {
      name: 'MacBook Air 13-inch (M3)',
      modelCode: 'MBA-13-M3-2024',
      skuPrefix: 'MBA13-M3',
      description: `13.6" Liquid Retina, M3 Chip. Model: A3113`,
      colors: ['Midnight', 'Starlight', 'Space Gray', 'Silver'],
      configs: [
        { ram: '8GB', storage: '256GB' },
        { ram: '16GB', storage: '512GB' },
      ],
      specs: { display: '13.6-inch', chip: 'M3', year: 2024 },
    },
    // --- ADDED MISSING MODEL ---
    {
      name: 'MacBook Air 15-inch (M3)',
      modelCode: 'MBA-15-M3-2024',
      skuPrefix: 'MBA15-M3',
      description: `15.3" Liquid Retina, M3 Chip. Model: A3114`,
      colors: ['Midnight', 'Starlight', 'Space Gray', 'Silver'],
      configs: [
        { ram: '8GB', storage: '256GB' },
        { ram: '16GB', storage: '512GB' },
        { ram: '24GB', storage: '1TB' },
      ],
      specs: { display: '15.3-inch', chip: 'M3', year: 2024 },
    },
    {
      name: 'MacBook Air 13-inch (M4)',
      modelCode: 'MBA-13-M4-2025',
      skuPrefix: 'MBA13-M4',
      description: `13.6" Liquid Retina, M4 Chip. Model: A3240`,
      colors: ['Sky Blue', 'Midnight', 'Starlight', 'Silver'],
      configs: [
        { ram: '16GB', storage: '256GB' }, // Base bumped to 16GB
        { ram: '16GB', storage: '512GB' },
      ],
      specs: { display: '13.6-inch', chip: 'M4', year: 2025 },
    },
    {
      name: 'MacBook Air 15-inch (M4)',
      modelCode: 'MBA-15-M4-2025',
      skuPrefix: 'MBA15-M4',
      description: `15.3" Liquid Retina, M4 Chip. Model: A3241`,
      colors: ['Sky Blue', 'Midnight', 'Starlight', 'Silver'],
      configs: [
        { ram: '16GB', storage: '256GB' },
        { ram: '16GB', storage: '512GB' },
      ],
      specs: { display: '15.3-inch', chip: 'M4', year: 2025 },
    },

    // ==========================================
    // MACBOOK PRO 13" (Legacy)
    // ==========================================
    {
      name: 'MacBook Pro 13-inch (M2)',
      modelCode: 'MBP-13-M2-2022',
      skuPrefix: 'MBP13-M2',
      description: `13.3" Touch Bar, M2 Chip. Model: A2338`,
      colors: ['Space Gray', 'Silver'],
      configs: [
        { ram: '8GB', storage: '256GB' },
        { ram: '8GB', storage: '512GB' },
      ],
      specs: { display: '13.3-inch', chip: 'M2', year: 2022 },
    },

    // ==========================================
    // MACBOOK PRO 14" & 16" (M1/M2/M3/M4/M5)
    // ==========================================

    // --- M1 Series ---
    {
      name: 'MacBook Pro 14-inch (M1)',
      modelCode: 'MBP-14-M1-2021',
      skuPrefix: 'MBP14-M1',
      description: `14.2" XDR, M1 Pro/Max. Model: A2442`,
      colors: ['Space Gray', 'Silver'],
      configs: [
        { ram: '16GB', storage: '512GB', chip: 'M1 Pro' },
        { ram: '32GB', storage: '1TB', chip: 'M1 Max' },
      ],
      specs: { display: '14.2-inch', year: 2021 },
    },
    {
      name: 'MacBook Pro 16-inch (M1)',
      modelCode: 'MBP-16-M1-2021',
      skuPrefix: 'MBP16-M1',
      description: `16.2" XDR, M1 Pro/Max. Model: A2485`,
      colors: ['Space Gray', 'Silver'],
      configs: [
        { ram: '16GB', storage: '512GB', chip: 'M1 Pro' },
        { ram: '32GB', storage: '1TB', chip: 'M1 Max' },
      ],
      specs: { display: '16.2-inch', year: 2021 },
    },

    // --- M2 Series ---
    {
      name: 'MacBook Pro 14-inch (M2)',
      modelCode: 'MBP-14-M2-2023',
      skuPrefix: 'MBP14-M2',
      description: `14.2" XDR, M2 Pro/Max. Model: A2779`,
      colors: ['Space Gray', 'Silver'],
      configs: [
        { ram: '16GB', storage: '512GB', chip: 'M2 Pro' },
        { ram: '32GB', storage: '1TB', chip: 'M2 Max' },
      ],
      specs: { display: '14.2-inch', year: 2023 },
    },
    {
      name: 'MacBook Pro 16-inch (M2)',
      modelCode: 'MBP-16-M2-2023',
      skuPrefix: 'MBP16-M2',
      description: `16.2" XDR, M2 Pro/Max. Model: A2780`,
      colors: ['Space Gray', 'Silver'],
      configs: [
        { ram: '16GB', storage: '512GB', chip: 'M2 Pro' },
        { ram: '32GB', storage: '1TB', chip: 'M2 Max' },
      ],
      specs: { display: '16.2-inch', year: 2023 },
    },

    // --- M3 Series ---
    {
      name: 'MacBook Pro 14-inch (M3)',
      modelCode: 'MBP-14-M3-2023',
      skuPrefix: 'MBP14-M3',
      description: `14.2" XDR, M3 Family. Models: A2918 (M3) / A2992 (Pro/Max)`,
      colors: ['Space Black', 'Silver', 'Space Gray'], // Space Gray only for base M3
      configs: [
        { ram: '8GB', storage: '512GB', chip: 'M3' },
        { ram: '8GB', storage: '1TB', chip: 'M3' },
        { ram: '18GB', storage: '512GB', chip: 'M3 Pro' }, // M3 Pro starts at 18GB
        { ram: '36GB', storage: '1TB', chip: 'M3 Max' },
      ],
      specs: { display: '14.2-inch', year: 2023 },
    },
    // --- ADDED MISSING MODEL ---
    {
      name: 'MacBook Pro 16-inch (M3)',
      modelCode: 'MBP-16-M3-2023',
      skuPrefix: 'MBP16-M3',
      description: `16.2" XDR, M3 Pro/Max. Model: A2991`,
      colors: ['Space Black', 'Silver'],
      configs: [
        { ram: '18GB', storage: '512GB', chip: 'M3 Pro' },
        { ram: '36GB', storage: '1TB', chip: 'M3 Pro' },
        { ram: '36GB', storage: '1TB', chip: 'M3 Max' },
        { ram: '48GB', storage: '1TB', chip: 'M3 Max' },
      ],
      specs: { display: '16.2-inch', year: 2023 },
    },

    // --- M4 Series (Late 2024) ---
    {
      name: 'MacBook Pro 14-inch (M4)',
      modelCode: 'MBP-14-M4-2024',
      skuPrefix: 'MBP14-M4',
      description: `14.2" XDR, M4 Family. Model: A3112`,
      colors: ['Space Black', 'Silver'],
      configs: [
        { ram: '16GB', storage: '512GB', chip: 'M4' },
        { ram: '24GB', storage: '1TB', chip: 'M4 Pro' },
        { ram: '36GB', storage: '1TB', chip: 'M4 Max' },
      ],
      specs: { display: '14.2-inch', year: 2024 },
    },
    // --- ADDED MISSING MODEL ---
    {
      name: 'MacBook Pro 16-inch (M4)',
      modelCode: 'MBP-16-M4-2024',
      skuPrefix: 'MBP16-M4',
      description: `16.2" XDR, M4 Pro/Max. Model: A3115`,
      colors: ['Space Black', 'Silver'],
      configs: [
        { ram: '24GB', storage: '512GB', chip: 'M4 Pro' },
        { ram: '48GB', storage: '1TB', chip: 'M4 Pro' },
        { ram: '64GB', storage: '1TB', chip: 'M4 Max' },
      ],
      specs: { display: '16.2-inch', year: 2024 },
    },

    // --- M5 Series (Latest 2026) ---
    {
      name: 'MacBook Pro 14-inch (M5)',
      modelCode: 'MBP-14-M5-2026',
      skuPrefix: 'MBP14-M5',
      description: `14.2" XDR, M5 Chip, AI Engine. Model: A3401`,
      colors: ['Titanium Black', 'Silver'],
      configs: [
        { ram: '24GB', storage: '512GB', chip: 'M5' },
        { ram: '32GB', storage: '1TB', chip: 'M5 Pro' },
        { ram: '48GB', storage: '1TB', chip: 'M5 Max' },
      ],
      specs: { display: '14.2-inch', year: 2026 },
    },
    {
      name: 'MacBook Pro 16-inch (M5)',
      modelCode: 'MBP-16-M5-2026',
      skuPrefix: 'MBP16-M5',
      description: `16.2" XDR, M5 Pro/Max. Model: A3403`,
      colors: ['Titanium Black', 'Silver'],
      configs: [
        { ram: '32GB', storage: '512GB', chip: 'M5 Pro' },
        { ram: '48GB', storage: '1TB', chip: 'M5 Pro' },
        { ram: '64GB', storage: '1TB', chip: 'M5 Max' },
      ],
      specs: { display: '16.2-inch', year: 2026 },
    },
  ];

  for (const model of macbooks) {
    console.log(`Processing ${model.name}...`);
    const product = await prisma.product.create({
      data: {
        name: model.name,
        description: model.description,
        type: ProductType.SERIALIZED,
        brandId: brand.id,
        categoryId: category.id,
        minStock: 2,
      },
    });

    for (const color of model.colors) {
      // Check if specific colors apply only to specific chips (Rare case: M3 Base is the only one with Space Gray in that gen)
      // Logic: If model name contains "M3" (but not Pro/Max specific parent) and color is Space Gray, it's valid.
      // If color is Space Black, it is NOT valid for Base M3.

      let validConfigForColor = true;
      if (model.modelCode === 'MBP-14-M3-2023') {
        if (color === 'Space Gray') validConfigForColor = false; // We will handle this inside the config loop instead
      }

      for (const config of model.configs) {
        // --- Special Color Logic for M3 Series ---
        // Base M3 = Space Gray or Silver.
        // M3 Pro/Max = Space Black or Silver.
        let skipVariant = false;

        if (model.modelCode === 'MBP-14-M3-2023') {
          const configChip = 'chip' in config ? config.chip : undefined;
          if (configChip === 'M3') {
            if (color === 'Space Black') skipVariant = true; // Base M3 doesn't come in Space Black
          } else if (configChip) {
            // Pro/Max chips
            if (color === 'Space Gray') skipVariant = true; // Pro/Max doesn't come in Space Gray
          }
        }

        if (skipVariant) continue;

        // SKU Generation
        const colorCode = color.split(' ')[0].toUpperCase().substring(0, 3);
        const storageCode = config.storage
          .replace('GB', 'G')
          .replace('TB', 'T');
        const ramCode = config.ram.replace('GB', 'G');
        const chipSuffix =
          'chip' in config && config.chip
            ? `-${config.chip.replace(/ /g, '').toUpperCase()}`
            : '';

        const sku = `${model.skuPrefix}-${colorCode}${chipSuffix}-${ramCode}-${storageCode}`;

        await prisma.productVariant.create({
          data: {
            productId: product.id,
            name: `${model.name} ${color} - ${'chip' in config ? config.chip : model.specs.chip} / ${config.ram} / ${config.storage}`,
            sku: sku,
            modelCode: sku,
            specs: {
              ...model.specs,
              color: color,
              storage: config.storage,
              ram: config.ram,
              processor: 'chip' in config ? config.chip : model.specs.chip,
            },
          },
        });
      }
    }
  }

  console.log('✅ All MacBook models (2020-2026) seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
