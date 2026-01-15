import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSaleDto, userId: number) {
    const subtotal = dto.items.reduce(
      (sum, i) => sum + i.sellPrice * i.quantity,
      0,
    );
    const totalAmount =
      subtotal - (dto.discountAmount || 0) + (dto.taxAmount || 0);

    const saleDate = dto.createdAt ? new Date(dto.createdAt) : new Date();
    const invoiceNo =
      dto.invoiceNo ||
      `INV-${saleDate.getFullYear()}${(saleDate.getMonth() + 1).toString().padStart(2, '0')}${saleDate.getDate().toString().padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          invoiceNo,
          userId,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          paymentMethod: dto.paymentMethod,
          totalAmount,
          discountAmount: dto.discountAmount || 0,
          taxAmount: dto.taxAmount || 0,
          createdAt: saleDate,
        },
      });

      for (const item of dto.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });
        if (!variant)
          throw new BadRequestException(`Variant ${item.variantId} not found`);

        const orderItem = await tx.orderItem.create({
          data: {
            saleId: sale.id,
            variantId: item.variantId,
            quantity: item.quantity,
            sellPrice: item.sellPrice,
            warrantyEnd: item.warrantyEnd ? new Date(item.warrantyEnd) : null,
          },
        });

        if (variant.product.type === 'SERIALIZED') {
          if (!item.inventoryItemId)
            throw new BadRequestException(
              'inventoryItemId required for serialized',
            );
          await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: { status: 'SOLD', soldAtItemId: orderItem.id },
          });
        } else {
          const inv = await tx.inventoryItem.findFirst({
            where: {
              variantId: item.variantId,
              status: 'AVAILABLE',
              quantity: { gte: item.quantity },
            },
          });
          if (!inv) throw new BadRequestException('Insufficient stock');
          if (inv.quantity === item.quantity) {
            await tx.inventoryItem.update({
              where: { id: inv.id },
              data: { status: 'SOLD', soldAtItemId: orderItem.id },
            });
          } else {
            await tx.inventoryItem.update({
              where: { id: inv.id },
              data: { quantity: { decrement: item.quantity } },
            });
          }
        }

        await tx.stockMovement.create({
          data: {
            type: 'OUTBOUND_SALE',
            productId: variant.productId,
            quantity: item.quantity,
            userId,
          },
        });
      }

      return tx.sale.findUnique({
        where: { id: sale.id },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });
    });
  }

  findAll() {
    return this.prisma.sale.findMany({
      include: {
        user: { select: { id: true, name: true } },
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    brandId: true,
                    categoryId: true,
                  },
                },
                inventory: {
                  select: { costPrice: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
            inventoryItem: true,
          },
        },
      },
    });
  }
}
