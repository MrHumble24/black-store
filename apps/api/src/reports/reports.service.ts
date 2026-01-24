import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSalesSummary(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [sales, salesByDay, topVariants, topSellers, processedReturns] =
      await Promise.all([
        // Total sales
        this.prisma.sale.aggregate({
          where: { createdAt: { gte: start, lte: end } },
          _sum: { totalAmount: true },
          _count: true,
        }),

        // Sales by day
        this.prisma.$queryRaw`
        SELECT DATE("createdAt") as date, SUM("totalAmount") as total, COUNT(*) as count
        FROM sales
        WHERE "createdAt" >= ${start} AND "createdAt" <= ${end}
        GROUP BY DATE("createdAt")
        ORDER BY date
      `,

        // Top selling variants
        this.prisma.orderItem.groupBy({
          by: ['variantId'],
          where: { sale: { createdAt: { gte: start, lte: end } } },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 10,
        }),

        // Top sellers (users)
        this.prisma.sale.groupBy({
          by: ['userId'],
          where: { createdAt: { gte: start, lte: end } },
          _sum: { totalAmount: true },
          _count: true,
          orderBy: { _sum: { totalAmount: 'desc' } },
          take: 5,
        }),

        // Total refunds from processed returns (APPROVED, RESTOCKED, DISPOSED)
        this.prisma.return.aggregate({
          where: {
            updatedAt: { gte: start, lte: end },
            status: { in: ['APPROVED', 'RESTOCKED', 'DISPOSED'] },
          },
          _sum: { refundAmount: true },
          _count: true,
        }),
      ]);

    // Enrich top variants with names
    const variantIds = topVariants.map((v) => v.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        product: { select: { name: true } },
      },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // Top variants with real revenue using raw SQL for accuracy (sellPrice * quantity)
    const topProductsRaw = await this.prisma.$queryRaw<
      {
        variantId: number;
        quantitySold: number;
        revenue: number;
      }[]
    >`
      SELECT 
        "variantId", 
        SUM(quantity) as "quantitySold", 
        SUM(quantity * "sellPrice") as revenue
      FROM order_items oi
      JOIN sales s ON oi."saleId" = s.id
      WHERE s."createdAt" >= ${start} AND s."createdAt" <= ${end}
      GROUP BY "variantId"
      ORDER BY revenue DESC
      LIMIT 10
    `;

    // Enrich sellers with names
    const userIds = topSellers.map((s) => s.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Calculate net revenue (total sales minus refunds)
    const grossRevenue = Number(sales._sum.totalAmount) || 0;
    const totalRefunds = Number(processedReturns._sum.refundAmount) || 0;
    const netRevenue = grossRevenue - totalRefunds;

    return {
      totalRevenue: netRevenue,
      grossRevenue,
      totalRefunds,
      refundCount: processedReturns._count,
      totalOrders: sales._count,
      averageOrderValue: sales._count > 0 ? grossRevenue / sales._count : 0,
      salesByDay,
      topProducts: topProductsRaw.map((v) => {
        const variant = variantMap.get(v.variantId);
        return {
          productName: variant?.product?.name || 'Unknown',
          name: variant?.name || '',
          sku: variant?.sku || '',
          quantitySold: Number(v.quantitySold),
          revenue: Number(v.revenue),
        };
      }),
      topSellers: topSellers.map((s) => ({
        ...userMap.get(s.userId),
        totalSales: s._sum.totalAmount,
        orderCount: s._count,
      })),
    };
  }

  async getInventoryValue() {
    const result = await this.prisma.$queryRaw<
      { total_value: number; total_items: number }[]
    >`
      SELECT 
        SUM("costPrice" * quantity) as total_value,
        SUM(quantity) as total_items
      FROM inventory_items
      WHERE status = 'AVAILABLE'
    `;

    const byWarehouse = await this.prisma.$queryRaw`
      SELECT w.name, SUM(i."costPrice" * i.quantity) as value, SUM(i.quantity) as items
      FROM inventory_items i
      JOIN warehouses w ON i."warehouseId" = w.id
      WHERE i.status = 'AVAILABLE'
      GROUP BY w.id, w.name
    `;

    const byCategory = await this.prisma.$queryRaw`
      SELECT c.name, SUM(i."costPrice" * i.quantity) as value, SUM(i.quantity) as items
      FROM inventory_items i
      JOIN product_variants pv ON i."variantId" = pv.id
      JOIN products p ON pv."productId" = p.id
      JOIN categories c ON p."categoryId" = c.id
      WHERE i.status = 'AVAILABLE'
      GROUP BY c.id, c.name
    `;

    return {
      totalValue: result[0]?.total_value || 0,
      totalItems: result[0]?.total_items || 0,
      byWarehouse,
      byCategory,
    };
  }

  async getProfitReport(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [revenue, cogs, expenses, processedReturns, restockedReturns] =
      await Promise.all([
        this.prisma.sale.aggregate({
          where: { createdAt: { gte: start, lte: end } },
          _sum: { totalAmount: true },
        }),

        this.prisma.orderItem.aggregate({
          where: { sale: { createdAt: { gte: start, lte: end } } },
          _sum: { costPrice: true },
        }),

        this.prisma.expense.aggregate({
          where: { expenseDate: { gte: start, lte: end } },
          _sum: { amount: true },
        }),

        // Total refunds from processed returns
        this.prisma.return.aggregate({
          where: {
            updatedAt: { gte: start, lte: end },
            status: { in: ['APPROVED', 'RESTOCKED', 'DISPOSED'] },
          },
          _sum: { refundAmount: true },
        }),

        // COGS recovered from restocked items (need to subtract from COGS)
        this.prisma.return.findMany({
          where: {
            updatedAt: { gte: start, lte: end },
            status: 'RESTOCKED',
          },
          include: {
            orderItem: { select: { costPrice: true } },
          },
        }),
      ]);

    // Calculate returned COGS (only for restocked items)
    const returnedCogs = restockedReturns.reduce(
      (sum, ret) => sum + Number(ret.orderItem.costPrice),
      0,
    );

    const grossRevenue = Number(revenue._sum.totalAmount) || 0;
    const totalRefunds = Number(processedReturns._sum.refundAmount) || 0;
    const totalRevenue = grossRevenue - totalRefunds;
    const totalCogs = (Number(cogs._sum?.costPrice) || 0) - returnedCogs;
    const totalExpenses = Number(expenses._sum.amount) || 0;
    const grossProfit = totalRevenue - totalCogs;
    const netProfit = grossProfit - totalExpenses;

    return {
      revenue: totalRevenue,
      grossRevenue,
      totalRefunds,
      cogs: totalCogs,
      returnedCogs,
      grossProfit,
      expenses: totalExpenses,
      netProfit,
      grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
      netMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
    };
  }

  async getDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todaySales, todayRefunds, lowStock, pendingReturns, recentSales] =
      await Promise.all([
        this.prisma.sale.aggregate({
          where: { createdAt: { gte: today, lt: tomorrow } },
          _sum: { totalAmount: true },
          _count: true,
        }),

        // Today's refunds from processed returns
        this.prisma.return.aggregate({
          where: {
            updatedAt: { gte: today, lt: tomorrow },
            status: { in: ['APPROVED', 'RESTOCKED', 'DISPOSED'] },
          },
          _sum: { refundAmount: true },
          _count: true,
        }),

        this.prisma.$queryRaw`
        SELECT p.id, p.name, p."minStock", COALESCE(SUM(i.quantity), 0) as current_stock
        FROM products p
        LEFT JOIN product_variants pv ON pv."productId" = p.id
        LEFT JOIN inventory_items i ON i."variantId" = pv.id AND i.status = 'AVAILABLE'
        WHERE p."isActive" = true
        GROUP BY p.id
        HAVING COALESCE(SUM(i.quantity), 0) < p."minStock"
        LIMIT 10
      `,

        this.prisma.return.count({ where: { status: 'PENDING' } }),

        this.prisma.sale.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true } } },
        }),
      ]);

    const grossRevenue = Number(todaySales._sum.totalAmount) || 0;
    const refundAmount = Number(todayRefunds._sum.refundAmount) || 0;
    const netRevenue = grossRevenue - refundAmount;

    return {
      todayRevenue: netRevenue,
      todayGrossRevenue: grossRevenue,
      todayRefunds: refundAmount,
      todayRefundCount: todayRefunds._count,
      todayOrders: todaySales._count,
      lowStockItems: lowStock,
      pendingReturns,
      recentSales,
    };
  }
}
