import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StockMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(productId?: number, type?: string) {
    return this.prisma.stockMovement.findMany({
      where: {
        ...(productId && { productId }),
        ...(type && { type: type as any }),
      },
      include: {
        product: true,
        user: { select: { id: true, name: true } },
        fromWarehouse: true,
        toWarehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: number) {
    return this.prisma.stockMovement.findUnique({
      where: { id },
      include: {
        product: true,
        user: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
    });
  }
}
