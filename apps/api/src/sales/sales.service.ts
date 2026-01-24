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

        let costPrice = 0;
        if (variant.product.type === 'SERIALIZED') {
          if (!item.inventoryItemId)
            throw new BadRequestException(
              'inventoryItemId required for serialized',
            );
          const inventoryItem = await tx.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: { status: 'SOLD', soldAtItemId: orderItem.id },
          });
          costPrice = Number(inventoryItem.costPrice);
        } else {
          const inv = await tx.inventoryItem.findFirst({
            where: {
              variantId: item.variantId,
              status: 'AVAILABLE',
              quantity: { gte: item.quantity },
            },
          });
          if (!inv) throw new BadRequestException('Insufficient stock');
          costPrice = Number(inv.costPrice);

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

        await tx.orderItem.update({
          where: { id: orderItem.id },
          data: { costPrice: costPrice * item.quantity },
        });

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
                include: {
                  product: true,
                },
              },
              inventoryItem: true,
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
            inventoryItem: true,
            returns: {
              select: {
                id: true,
                status: true,
                reason: true,
                refundAmount: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        returns: {
          select: {
            id: true,
            orderItemId: true,
            status: true,
            reason: true,
            refundAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: { include: { product: true } },
            inventoryItem: true,
            returns: {
              select: {
                id: true,
                status: true,
                reason: true,
                refundAmount: true,
                notes: true,
                createdAt: true,
                updatedAt: true,
                processedBy: { select: { id: true, name: true } },
              },
            },
          },
        },
        returns: {
          select: {
            id: true,
            orderItemId: true,
            status: true,
            reason: true,
            refundAmount: true,
          },
        },
      },
    });
  }

  async remove(id: number, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
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

      if (!sale) throw new BadRequestException('Sale not found');

      for (const item of sale.items) {
        if (item.variant.product.type === 'SERIALIZED') {
          if (item.inventoryItem) {
            await tx.inventoryItem.update({
              where: { id: item.inventoryItem.id },
              data: {
                status: 'AVAILABLE',
                soldAtItemId: null,
              },
            });
          }
        } else {
          // For batch items, we need to find the inventory item that was used
          // Since we don't store which specific batch items were sold in a linked way (other than soldAtItemId which might be shared)
          // We look for any available record or create a new one/update existing for that variant/warehouse
          const inv = await tx.inventoryItem.findFirst({
            where: {
              variantId: item.variantId,
              status: 'AVAILABLE',
            },
          });

          if (inv) {
            await tx.inventoryItem.update({
              where: { id: inv.id },
              data: { quantity: { increment: item.quantity } },
            });
          } else {
            // This case shouldn't happen often if we always have at least one record,
            // but for safety, we might need a warehouse ID.
            // Let's assume there's at least one record or use a default warehouse if we had it.
            // In this specific schema, it's better to find any matching record.
            throw new BadRequestException(
              'Matching inventory record not found for restocking',
            );
          }
        }

        // Record restock movement
        await tx.stockMovement.create({
          data: {
            type: 'RETURN_RESTOCK',
            productId: item.variant.productId,
            quantity: item.quantity,
            userId,
            notes: `Voided Sale ${sale.invoiceNo}`,
          },
        });
      }

      return tx.sale.delete({ where: { id } });
    });
  }
}
