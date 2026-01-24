import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateVariantDto,
  UpdateVariantDto,
  BulkCreateProductDto,
  BulkUpdateVariantsDto,
  BulkDeleteDto,
} from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // === PRODUCTS ===

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        minStock: dto.minStock ?? 5,
        brandId: dto.brandId,
        categoryId: dto.categoryId,
        variants: dto.variants
          ? {
              create: dto.variants.map((v) => ({
                sku: v.sku,
                modelCode: v.modelCode,
                name: v.name,
                specs: v.specs,
              })),
            }
          : undefined,
      },
      include: { brand: true, category: true, variants: true },
    });
  }

  findAll() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        brand: true,
        category: true,
        variants: { where: { isActive: true } },
      },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        brand: true,
        category: true,
        variants: {
          include: {
            inventory: {
              where: { status: 'AVAILABLE' },
              include: { warehouse: true },
            },
          },
        },
      },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Calculate stock per variant
    const variantsWithStock = product.variants.map((v) => ({
      ...v,
      totalStock: v.inventory.reduce((sum, i) => sum + i.quantity, 0),
      stockByWarehouse: v.inventory.reduce(
        (acc, i) => {
          acc[i.warehouse.name] = (acc[i.warehouse.name] || 0) + i.quantity;
          return acc;
        },
        {} as Record<string, number>,
      ),
    }));

    return { ...product, variants: variantsWithStock };
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { brand: true, category: true, variants: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // === VARIANTS ===

  async addVariant(productId: number, dto: CreateVariantDto) {
    await this.findOne(productId);
    return this.prisma.productVariant.create({
      data: {
        productId,
        sku: dto.sku,
        modelCode: dto.modelCode,
        name: dto.name,
        specs: dto.specs,
      },
    });
  }

  async updateVariant(variantId: number, dto: UpdateVariantDto) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: dto,
    });
  }

  async removeVariant(variantId: number) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive: false },
    });
  }

  async getVariantBySku(sku: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { sku },
      include: {
        product: { include: { brand: true, category: true } },
        inventory: {
          where: { status: 'AVAILABLE' },
          include: { warehouse: true },
        },
      },
    });
    if (!variant) throw new NotFoundException('Variant not found');
    return {
      ...variant,
      totalStock: variant.inventory.reduce((sum, i) => sum + i.quantity, 0),
    };
  }

  // === BULK OPERATIONS ===

  async bulkCreateProducts(dto: BulkCreateProductDto) {
    const results = await Promise.all(dto.products.map((p) => this.create(p)));
    return { created: results.length, products: results };
  }

  async bulkUpdateVariants(dto: BulkUpdateVariantsDto) {
    const results = await Promise.all(
      dto.variants.map((v) =>
        this.prisma.productVariant.update({
          where: { id: v.id },
          data: {
            sku: v.sku,
            modelCode: v.modelCode,
            name: v.name,
            specs: v.specs,
            isActive: v.isActive,
          },
        }),
      ),
    );
    return { updated: results.length, variants: results };
  }

  async bulkDeleteProducts(dto: BulkDeleteDto) {
    const result = await this.prisma.product.updateMany({
      where: { id: { in: dto.ids } },
      data: { isActive: false },
    });
    return { deleted: result.count };
  }

  async bulkDeleteVariants(dto: BulkDeleteDto) {
    const result = await this.prisma.productVariant.updateMany({
      where: { id: { in: dto.ids } },
      data: { isActive: false },
    });
    return { deleted: result.count };
  }

  // === HELPERS ===

  async getLowStock() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        variants: {
          where: { isActive: true },
          include: {
            inventory: { where: { status: 'AVAILABLE' } },
          },
        },
      },
    });

    return products
      .map((p) => ({
        id: p.id,
        name: p.name,
        minStock: p.minStock,
        variants: p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          currentStock: v.inventory.reduce((sum, i) => sum + i.quantity, 0),
        })),
        totalStock: p.variants.reduce(
          (sum, v) => sum + v.inventory.reduce((s, i) => s + i.quantity, 0),
          0,
        ),
      }))
      .filter((p) => p.totalStock < p.minStock);
  }

  async search(query: string) {
    return this.prisma.productVariant.findMany({
      where: {
        isActive: true,
        OR: [
          { sku: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { product: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: { product: { include: { brand: true } } },
      take: 20,
    });
  }
}
