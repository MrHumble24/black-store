import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  UpdateInventoryDto,
  TransferInventoryDto,
  CreateInventoryDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInventoryDto) {
    return this.prisma.inventoryItem.create({
      data: dto,
    });
  }

  findAll(warehouseId?: number, status?: string, variantId?: number) {
    return this.prisma.inventoryItem.findMany({
      where: {
        ...(warehouseId && { warehouseId }),
        ...(status && { status: status as any }),
        ...(variantId && { variantId }),
      },
      include: {
        variant: { include: { product: true } },
        warehouse: true,
        purchase: { include: { provider: true } },
      },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        variant: { include: { product: true } },
        warehouse: true,
        purchase: true,
      },
    });
    if (!item) throw new NotFoundException('Inventory item not found');
    return item;
  }

  async update(id: number, dto: UpdateInventoryDto) {
    await this.findOne(id);
    return this.prisma.inventoryItem.update({ where: { id }, data: dto });
  }

  async transfer(dto: TransferInventoryDto, userId: number) {
    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        where: { id: dto.variantId },
        include: { product: true },
      });
      if (!variant) throw new BadRequestException('Variant not found');

      if (variant.product.type === 'SERIALIZED') {
        if (!dto.inventoryItemId)
          throw new BadRequestException('inventoryItemId required');
        await tx.inventoryItem.update({
          where: { id: dto.inventoryItemId },
          data: { warehouseId: dto.toWarehouseId },
        });
      } else {
        const source = await tx.inventoryItem.findFirst({
          where: {
            variantId: dto.variantId,
            warehouseId: dto.fromWarehouseId,
            status: 'AVAILABLE',
            quantity: { gte: dto.quantity },
          },
        });
        if (!source) throw new BadRequestException('Insufficient stock');

        if (source.quantity === dto.quantity) {
          await tx.inventoryItem.update({
            where: { id: source.id },
            data: { warehouseId: dto.toWarehouseId },
          });
        } else {
          await tx.inventoryItem.update({
            where: { id: source.id },
            data: { quantity: { decrement: dto.quantity } },
          });
          await tx.inventoryItem.create({
            data: {
              variantId: dto.variantId,
              warehouseId: dto.toWarehouseId,
              quantity: dto.quantity,
              costPrice: source.costPrice,
            },
          });
        }
      }

      return tx.stockMovement.create({
        data: {
          type: 'TRANSFER',
          productId: variant.productId,
          quantity: dto.quantity,
          fromWarehouseId: dto.fromWarehouseId,
          toWarehouseId: dto.toWarehouseId,
          userId,
          notes: dto.notes,
        },
      });
    });
  }

  getByWarehouse(warehouseId: number) {
    return this.prisma.inventoryItem.groupBy({
      by: ['variantId', 'status'],
      where: { warehouseId },
      _sum: { quantity: true },
    });
  }

  getByVariant(variantId: number) {
    return this.prisma.inventoryItem.findMany({
      where: { variantId, status: 'AVAILABLE' },
      include: { warehouse: true },
    });
  }
}
