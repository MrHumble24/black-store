import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaClient, ProductType } from '../../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a robust color code for SKU.
 */
function generateColorCode(color: string): string {
  return color.replace(/\s+/g, '').toUpperCase().slice(0, 4);
}

/**
 * Safely upsert a product and all its variants
 */
async function syncProduct(data: {
  brandId: number;
  categoryId: number;
  name: string;
  modelCode: string;
  skuPrefix: string;
  colors: string[];
  storages?: string[];
  specs: any;
  type?: ProductType;
  configs?: any[]; // For MacBooks
}) {
  // 1. Upsert the Product (using name as unique identifier for seeding)
  // Note: In real scenarios, use a more robust unique key if name is not enough
  const product = await prisma.product.upsert({
    where: {
      id:
        (await prisma.product.findFirst({ where: { name: data.name } }))?.id ||
        -1,
    },
    update: {
      name: data.name,
      brandId: data.brandId,
      categoryId: data.categoryId,
      type: data.type || ProductType.SERIALIZED,
    },
    create: {
      name: data.name,
      type: data.type || ProductType.SERIALIZED,
      brandId: data.brandId,
      categoryId: data.categoryId,
      minStock: 3,
    },
  });

  // 2. Handle Variants
  if (data.configs) {
    // MacBook Logic (configs: ram/storage combos)
    for (const color of data.colors) {
      for (const config of data.configs) {
        const colorCode = generateColorCode(color);
        const ramCode = config.ram.replace('GB', 'G');
        const storageCode = config.storage
          .replace('GB', 'G')
          .replace('TB', 'T');
        const chipSuffix = config.chip
          ? `-${config.chip.replace(/\s+/g, '').toUpperCase()}`
          : '';

        const sku = `${data.skuPrefix}-${colorCode}${chipSuffix}-${ramCode}-${storageCode}`;
        const processor = config.chip || data.specs.chip;

        await prisma.productVariant.upsert({
          where: { sku },
          update: {
            name: `${data.name} ${color} (${processor} / ${config.ram} / ${config.storage})`,
            modelCode: sku,
            specs: {
              ...data.specs,
              color,
              ram: config.ram,
              storage: config.storage,
              processor,
            },
          },
          create: {
            productId: product.id,
            sku,
            modelCode: sku,
            name: `${data.name} ${color} (${processor} / ${config.ram} / ${config.storage})`,
            specs: {
              ...data.specs,
              color,
              ram: config.ram,
              storage: config.storage,
              processor,
            },
          },
        });
      }
    }
  } else {
    // Smartphone / Tablet Logic
    for (const color of data.colors) {
      for (const storage of data.storages || []) {
        const colorCode = generateColorCode(color);
        const skuBase = `${data.skuPrefix}-${colorCode}-${storage.replace(/\s+/g, '')}`;

        if (data.categoryId === (await getCategory('Tablets')).id) {
          // iPad Logic: create Wi-Fi and Cellular
          const variants = [
            { suffix: 'WIFI', conn: 'Wi-Fi Only' },
            { suffix: 'CELL', conn: 'Wi-Fi + Cellular' },
          ];
          for (const v of variants) {
            const sku = `${skuBase}-${v.suffix}`;
            await prisma.productVariant.upsert({
              where: { sku },
              update: {
                name: `${data.name} ${color} ${storage} (${v.conn})`,
                modelCode: sku,
                specs: { ...data.specs, color, storage, connection: v.conn },
              },
              create: {
                productId: product.id,
                sku,
                modelCode: sku,
                name: `${data.name} ${color} ${storage} (${v.conn})`,
                specs: { ...data.specs, color, storage, connection: v.conn },
              },
            });
          }
        } else {
          // Standard Smartphone Logic
          const sku = skuBase;
          await prisma.productVariant.upsert({
            where: { sku },
            update: {
              name: `${data.name} ${color} ${storage}`,
              modelCode: sku,
              specs: { ...data.specs, color, storage },
            },
            create: {
              productId: product.id,
              sku,
              modelCode: sku,
              name: `${data.name} ${color} ${storage}`,
              specs: { ...data.specs, color, storage },
            },
          });
        }
      }
    }
  }
}

let categoryCache: Record<string, any> = {};
async function getCategory(name: string) {
  if (categoryCache[name]) return categoryCache[name];
  const cat = await prisma.category.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  categoryCache[name] = cat;
  return cat;
}

// ============================================================================
// SEED SECTIONS
// ============================================================================

async function seedUsers() {
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
  console.log('✅ Users synced');
}

async function main() {
  console.log('🌱 Starting Idempotent Database Seed...');

  await seedUsers();

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

  const smartphones = await getCategory('Smartphones');
  const tablets = await getCategory('Tablets');
  const laptops = await getCategory('Laptops');

  // --- IPHONES ---
  console.log('📱 Syncing iPhones...');
  const iPhones = [
    {
      name: 'iPhone 15',
      modelCode: 'IPHONE-15',
      skuPrefix: 'IP15',
      colors: ['Blue', 'Pink', 'Yellow', 'Green', 'Black'],
      storages: ['128GB', '256GB', '512GB'],
      specs: { display: '6.1"', chip: 'A16 Bionic' },
    },
    {
      name: 'iPhone 15 Pro Max',
      modelCode: 'IPHONE-15-PM',
      skuPrefix: 'IP15PM',
      colors: [
        'Natural Titanium',
        'Blue Titanium',
        'White Titanium',
        'Black Titanium',
      ],
      storages: ['256GB', '512GB', '1TB'],
      specs: { display: '6.7"', chip: 'A17 Pro' },
    },
    {
      name: 'iPhone 16',
      modelCode: 'IPHONE-16',
      skuPrefix: 'IP16',
      colors: ['Ultramarine', 'Teal', 'Pink', 'White', 'Black'],
      storages: ['128GB', '256GB', '512GB'],
      specs: { display: '6.1"', chip: 'A18' },
    },
    {
      name: 'iPhone 16 Pro Max',
      modelCode: 'IPHONE-16-PM',
      skuPrefix: 'IP16PM',
      colors: [
        'Desert Titanium',
        'Natural Titanium',
        'White Titanium',
        'Black Titanium',
      ],
      storages: ['256GB', '512GB', '1TB'],
      specs: { display: '6.9"', chip: 'A18 Pro' },
    },
  ];
  for (const m of iPhones)
    await syncProduct({ ...m, brandId: apple.id, categoryId: smartphones.id });

  // --- IPADS ---
  console.log('📱 Syncing iPads...');
  const iPads = [
    {
      name: 'iPad Pro 11-inch (M4)',
      modelCode: 'IPAD-PRO-11-M4',
      skuPrefix: 'IPP11M4',
      colors: ['Space Black', 'Silver'],
      storages: ['256GB', '512GB', '1TB'],
      specs: { chip: 'M4' },
    },
    {
      name: 'iPad Pro 13-inch (M5)',
      modelCode: 'IPAD-PRO-13-M5',
      skuPrefix: 'IPP13M5',
      colors: ['Titanium Black', 'Titanium Gray'],
      storages: ['512GB', '1TB', '2TB'],
      specs: { chip: 'M5' },
    },
  ];
  for (const m of iPads)
    await syncProduct({ ...m, brandId: apple.id, categoryId: tablets.id });

  // --- SAMSUNG ---
  console.log('📱 Syncing Samsung...');
  const samModels = [
    {
      name: 'Galaxy S24 Ultra',
      modelCode: 'SM-S928',
      skuPrefix: 'S24U',
      colors: ['Titanium Black', 'Titanium Gray', 'Titanium Violet'],
      storages: ['256GB', '512GB', '1TB'],
      specs: { chip: 'Snap 8 Gen 3' },
    },
    {
      name: 'Galaxy S25 Ultra',
      modelCode: 'SM-S938',
      skuPrefix: 'S25U',
      colors: ['Titanium Black', 'Titanium Silver', 'Titanium Blue'],
      storages: ['256GB', '512GB', '1TB'],
      specs: { chip: 'Snap 8 Elite' },
    },
  ];
  for (const m of samModels)
    await syncProduct({
      ...m,
      brandId: samsung.id,
      categoryId: smartphones.id,
    });

  // --- MACBOOKS ---
  console.log('💻 Syncing MacBooks...');
  const macs = [
    {
      name: 'MacBook Pro 14-inch (M4)',
      modelCode: 'MBP-14-M4',
      skuPrefix: 'MBP14',
      colors: ['Space Black', 'Silver'],
      configs: [
        { ram: '16GB', storage: '512GB', chip: 'M4' },
        { ram: '24GB', storage: '1TB', chip: 'M4 Pro' },
      ],
      specs: { display: '14.2"' },
    },
  ];
  for (const m of macs)
    await syncProduct({ ...m, brandId: apple.id, categoryId: laptops.id });

  console.log('\n🎉 Seed finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
