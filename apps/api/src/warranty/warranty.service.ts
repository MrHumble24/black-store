import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as QRCode from 'qrcode';

@Injectable()
export class WarrantyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate warranty info and QR code for an order item
   */
  async generateWarrantyCard(orderItemId: number, baseUrl: string) {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        variant: { include: { product: { include: { brand: true } } } },
        sale: true,
        inventoryItem: true,
      },
    });

    if (!orderItem) throw new NotFoundException('Order item not found');

    const warrantyCode = `WRN-${orderItem.saleId}-${orderItem.id}`;
    const verifyUrl = `${baseUrl}/warranty/verify/${warrantyCode}`;

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    return {
      warrantyCode,
      qrCode: qrDataUrl,
      verifyUrl,
      product: {
        name: orderItem.variant.product.name,
        variant: orderItem.variant.name,
        brand: orderItem.variant.product.brand.name,
        sku: orderItem.variant.sku,
        specs: orderItem.variant.specs,
      },
      serialNumber: orderItem.inventoryItem?.serialNumber || null,
      purchaseDate: orderItem.sale.createdAt,
      warrantyEnd: orderItem.warrantyEnd,
      invoiceNo: orderItem.sale.invoiceNo,
      customerName: orderItem.sale.customerName,
      isValid: orderItem.warrantyEnd
        ? new Date() < orderItem.warrantyEnd
        : false,
    };
  }

  /**
   * Verify warranty by code (customer scans QR)
   */
  async verifyWarranty(warrantyCode: string) {
    // Parse code: WRN-{saleId}-{orderItemId}
    const match = warrantyCode.match(/^WRN-(\d+)-(\d+)$/);
    if (!match) return { valid: false, message: 'Invalid warranty code' };

    const [, saleIdStr, orderItemIdStr] = match;
    const orderItemId = parseInt(orderItemIdStr, 10);

    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: orderItemId },
      include: {
        variant: {
          include: { product: { include: { brand: true, category: true } } },
        },
        sale: true,
        inventoryItem: true,
      },
    });

    if (!orderItem || orderItem.sale.id !== parseInt(saleIdStr, 10)) {
      return { valid: false, message: 'Warranty not found' };
    }

    const now = new Date();
    const isExpired = orderItem.warrantyEnd
      ? now > orderItem.warrantyEnd
      : true;
    const daysRemaining = orderItem.warrantyEnd
      ? Math.max(
          0,
          Math.ceil(
            (orderItem.warrantyEnd.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

    return {
      valid: !isExpired,
      status: isExpired ? 'EXPIRED' : 'ACTIVE',
      message: isExpired ? 'Warranty has expired' : 'Warranty is valid',
      product: {
        name: orderItem.variant.product.name,
        variant: orderItem.variant.name,
        brand: orderItem.variant.product.brand.name,
        category: orderItem.variant.product.category.name,
        sku: orderItem.variant.sku,
        specs: orderItem.variant.specs,
      },
      serialNumber: orderItem.inventoryItem?.serialNumber || null,
      purchaseDate: orderItem.sale.createdAt,
      warrantyEnd: orderItem.warrantyEnd,
      daysRemaining,
      invoiceNo: orderItem.sale.invoiceNo,
      storeName: 'Black Store',
    };
  }

  /**
   * Get all warranties for a sale (for printing)
   */
  async getWarrantiesForSale(saleId: number, baseUrl: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          where: { warrantyEnd: { not: null } },
          include: {
            variant: { include: { product: { include: { brand: true } } } },
            inventoryItem: true,
          },
        },
      },
    });

    if (!sale) throw new NotFoundException('Sale not found');

    const warranties = await Promise.all(
      sale.items.map((item) => this.generateWarrantyCard(item.id, baseUrl)),
    );

    return {
      invoiceNo: sale.invoiceNo,
      customerName: sale.customerName,
      saleDate: sale.createdAt,
      warranties,
    };
  }
}
