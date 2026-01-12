import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateReturnDto,
  UpdateReturnDto,
  ReturnStatus,
} from './dto/return.dto';

@Injectable()
export class ReturnsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReturnDto, userId: number) {
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: dto.orderItemId },
      include: { sale: true, variant: { include: { product: true } } },
    });
    if (!orderItem) throw new NotFoundException('Order item not found');
    if (orderItem.saleId !== dto.saleId)
      throw new BadRequestException('Order item does not belong to sale');

    return this.prisma.return.create({
      data: {
        saleId: dto.saleId,
        orderItemId: dto.orderItemId,
        reason: dto.reason,
        notes: dto.notes,
        refundAmount: dto.refundAmount,
        createdById: userId,
      },
      include: { orderItem: { include: { variant: true } }, sale: true },
    });
  }

  findAll(status?: string) {
    return this.prisma.return.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        sale: true,
        orderItem: { include: { variant: { include: { product: true } } } },
        createdBy: { select: { id: true, name: true } },
        processedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.return.findUnique({
      where: { id },
      include: {
        sale: true,
        orderItem: {
          include: {
            variant: { include: { product: true } },
            inventoryItem: true,
          },
        },
        createdBy: { select: { id: true, name: true } },
        processedBy: { select: { id: true, name: true } },
      },
    });
    if (!item) throw new NotFoundException('Return not found');
    return item;
  }

  async process(id: number, dto: UpdateReturnDto, userId: number) {
    const ret = await this.findOne(id);
    if (ret.status !== 'PENDING')
      throw new BadRequestException('Return already processed');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.return.update({
        where: { id },
        data: { status: dto.status, notes: dto.notes, processedById: userId },
      });

      if (dto.status === ReturnStatus.RESTOCKED) {
        const orderItem = await tx.orderItem.findUnique({
          where: { id: ret.orderItemId },
          include: {
            variant: { include: { product: true } },
            inventoryItem: true,
          },
        });

        if (orderItem?.inventoryItem) {
          await tx.inventoryItem.update({
            where: { id: orderItem.inventoryItem.id },
            data: { status: 'AVAILABLE', soldAtItemId: null },
          });
        } else if (orderItem?.variant.product.type === 'BATCH') {
          await tx.inventoryItem.create({
            data: {
              variantId: orderItem.variantId,
              warehouseId: 1,
              quantity: orderItem.quantity,
              costPrice: 0,
              status: 'AVAILABLE',
            },
          });
        }

        await tx.stockMovement.create({
          data: {
            type: 'RETURN_RESTOCK',
            productId: orderItem!.variant.productId,
            quantity: orderItem!.quantity,
            toWarehouseId: 1,
            userId,
            notes: `Return #${id} restocked`,
          },
        });
      }

      return updated;
    });
  }
}
