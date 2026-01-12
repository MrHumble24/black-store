import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export type LookupResult =
  | { type: 'variant'; data: any }
  | { type: 'inventory'; data: any }
  | { type: 'sale'; data: any }
  | { type: 'product'; data: any }
  | { type: 'not_found'; data: null };

@Injectable()
export class LookupService {
  constructor(private readonly prisma: PrismaService) {}

  async lookup(code: string): Promise<LookupResult> {
    const trimmedCode = code.trim();

    // 1. Check if it's an invoice number (INV-*)
    if (trimmedCode.startsWith('INV-')) {
      const sale = await this.prisma.sale.findUnique({
        where: { invoiceNo: trimmedCode },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          user: { select: { id: true, name: true } },
        },
      });
      if (sale) return { type: 'sale', data: sale };
    }

    // 2. Check if it's a serial number / IMEI
    const inventory = await this.prisma.inventoryItem.findFirst({
      where: { serialNumber: trimmedCode },
      include: {
        variant: {
          include: { product: { include: { brand: true, category: true } } },
        },
        warehouse: true,
        purchase: true,
      },
    });
    if (inventory) return { type: 'inventory', data: inventory };

    // 3. Check if it's a variant SKU
    const variant = await this.prisma.productVariant.findUnique({
      where: { sku: trimmedCode },
      include: {
        product: { include: { brand: true, category: true } },
        inventory: {
          where: { status: 'AVAILABLE' },
          include: { warehouse: true },
        },
      },
    });
    if (variant) {
      const totalStock = variant.inventory.reduce(
        (sum, i) => sum + i.quantity,
        0,
      );
      return {
        type: 'variant',
        data: {
          ...variant,
          totalStock,
          stockByWarehouse: variant.inventory.reduce(
            (acc, i) => {
              const key = i.warehouse.name;
              acc[key] = (acc[key] || 0) + i.quantity;
              return acc;
            },
            {} as Record<string, number>,
          ),
        },
      };
    }

    // 4. Try partial match on variant name/sku or product name
    const variants = await this.prisma.productVariant.findMany({
      where: {
        OR: [
          { sku: { contains: trimmedCode, mode: 'insensitive' } },
          { name: { contains: trimmedCode, mode: 'insensitive' } },
          { product: { name: { contains: trimmedCode, mode: 'insensitive' } } },
        ],
        isActive: true,
      },
      include: { product: { include: { brand: true } } },
      take: 10,
    });
    if (variants.length > 0) {
      return {
        type: 'variant',
        data: variants.length === 1 ? variants[0] : variants,
      };
    }

    return { type: 'not_found', data: null };
  }

  async getVariantWithStock(variantId: number) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: { include: { brand: true, category: true } },
        inventory: {
          where: { status: 'AVAILABLE' },
          include: { warehouse: true },
        },
      },
    });

    if (!variant) return null;

    return {
      ...variant,
      totalStock: variant.inventory.reduce((sum, i) => sum + i.quantity, 0),
      availableItems: variant.inventory.map((i) => ({
        id: i.id,
        serialNumber: i.serialNumber,
        quantity: i.quantity,
        costPrice: i.costPrice,
        warehouse: i.warehouse.name,
      })),
    };
  }

  async getSerializedItems(variantId: number, warehouseId?: number) {
    return this.prisma.inventoryItem.findMany({
      where: {
        variantId,
        status: 'AVAILABLE',
        serialNumber: { not: null },
        ...(warehouseId && { warehouseId }),
      },
      select: {
        id: true,
        serialNumber: true,
        costPrice: true,
        warehouse: { select: { id: true, name: true } },
      },
    });
  }
}
