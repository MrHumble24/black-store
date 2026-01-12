import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePurchaseDto, userId: number) {
    const totalCost = dto.items.reduce(
      (sum, i) => sum + i.costPrice * i.quantity,
      0,
    );

    return this.prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          providerId: dto.providerId,
          userId,
          referenceNo: dto.referenceNo,
          totalCost,
        },
      });

      for (const item of dto.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });
        if (!variant)
          throw new BadRequestException(`Variant ${item.variantId} not found`);

        if (variant.product.type === 'SERIALIZED') {
          if (!item.serialNumber)
            throw new BadRequestException(
              'Serial number required for serialized products',
            );
          await tx.inventoryItem.create({
            data: {
              variantId: item.variantId,
              warehouseId: item.warehouseId,
              serialNumber: item.serialNumber,
              quantity: 1,
              costPrice: item.costPrice,
              purchaseId: purchase.id,
            },
          });
        } else {
          await tx.inventoryItem.create({
            data: {
              variantId: item.variantId,
              warehouseId: item.warehouseId,
              quantity: item.quantity,
              costPrice: item.costPrice,
              purchaseId: purchase.id,
            },
          });
        }

        await tx.stockMovement.create({
          data: {
            type: 'INBOUND_PURCHASE',
            productId: variant.productId,
            quantity: variant.product.type === 'SERIALIZED' ? 1 : item.quantity,
            toWarehouseId: item.warehouseId,
            userId,
          },
        });
      }

      return tx.purchase.findUnique({
        where: { id: purchase.id },
        include: { items: { include: { variant: true } }, provider: true },
      });
    });
  }

  findAll() {
    return this.prisma.purchase.findMany({
      include: { provider: true, user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.purchase.findUnique({
      where: { id },
      include: {
        items: { include: { variant: { include: { product: true } } } },
        provider: true,
      },
    });
  }
}
