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

    // Reuse orderItem from findOne() - already includes variant, product, and inventoryItem
    const orderItem = ret.orderItem;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.return.update({
        where: { id },
        data: { status: dto.status, notes: dto.notes, processedById: userId },
      });

      // Handle different return statuses
      switch (dto.status) {
        case ReturnStatus.RESTOCKED:
          // Restore inventory and record stock movement
          if (orderItem.inventoryItem) {
            // Serialized item - restore the original inventory item
            await tx.inventoryItem.update({
              where: { id: orderItem.inventoryItem.id },
              data: { status: 'AVAILABLE', soldAtItemId: null },
            });
          } else if (orderItem.variant.product.type === 'BATCH') {
            // Batch item - find existing available inventory or create new
            const existingInventory = await tx.inventoryItem.findFirst({
              where: {
                variantId: orderItem.variantId,
                status: 'AVAILABLE',
              },
            });

            if (existingInventory) {
              // Add quantity back to existing inventory
              await tx.inventoryItem.update({
                where: { id: existingInventory.id },
                data: { quantity: { increment: orderItem.quantity } },
              });
            } else {
              // Create new inventory item with cost from the original order
              const costPerUnit =
                Number(orderItem.costPrice) / orderItem.quantity;
              await tx.inventoryItem.create({
                data: {
                  variantId: orderItem.variantId,
                  warehouseId: 1, // Default warehouse
                  quantity: orderItem.quantity,
                  costPrice: costPerUnit,
                  status: 'AVAILABLE',
                },
              });
            }
          }

          // Record stock movement for audit trail
          await tx.stockMovement.create({
            data: {
              type: 'RETURN_RESTOCK',
              productId: orderItem.variant.productId,
              quantity: orderItem.quantity,
              toWarehouseId: 1,
              userId,
              notes: `Return #${id} restocked - refund: ${ret.refundAmount}`,
            },
          });
          break;

        case ReturnStatus.APPROVED:
          // Refund approved but no restock (customer keeps item or item not suitable for resale)
          // No inventory changes needed, refund amount is already recorded on the return
          await tx.stockMovement.create({
            data: {
              type: 'ADJUSTMENT',
              productId: orderItem.variant.productId,
              quantity: 0, // No physical stock change
              userId,
              notes: `Return #${id} approved (no restock) - refund: ${ret.refundAmount}`,
            },
          });
          break;

        case ReturnStatus.DISPOSED:
          // Item returned but disposed/destroyed (e.g., defective beyond repair)
          // No inventory restoration, but mark for records
          await tx.stockMovement.create({
            data: {
              type: 'ADJUSTMENT',
              productId: orderItem.variant.productId,
              quantity: 0, // Item is disposed, not added back
              userId,
              notes: `Return #${id} disposed - item destroyed/discarded`,
            },
          });
          break;

        case ReturnStatus.REJECTED:
          // Return rejected - no changes to inventory or finances
          // Just update the status (already done above)
          break;
      }

      return updated;
    });
  }
}
