import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateExpenseDto, userId: number) {
    return this.prisma.expense.create({
      data: {
        category: dto.category,
        amount: dto.amount,
        description: dto.description,
        receiptNo: dto.receiptNo,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
        createdById: userId,
      },
    });
  }

  findAll(startDate?: string, endDate?: string, category?: string) {
    return this.prisma.expense.findMany({
      where: {
        ...(category && { category: category as any }),
        ...(startDate &&
          endDate && {
            expenseDate: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
      },
      include: { createdBy: { select: { id: true, name: true } } },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.expense.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true, name: true } } },
    });
    if (!item) throw new NotFoundException('Expense not found');
    return item;
  }

  async update(id: number, dto: UpdateExpenseDto) {
    await this.findOne(id);
    return this.prisma.expense.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.expense.delete({ where: { id } });
  }

  async getSummary(startDate: string, endDate: string) {
    const expenses = await this.prisma.expense.groupBy({
      by: ['category'],
      where: {
        expenseDate: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      _sum: { amount: true },
    });

    const total = await this.prisma.expense.aggregate({
      where: {
        expenseDate: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      _sum: { amount: true },
    });

    return { byCategory: expenses, total: total._sum.amount || 0 };
  }
}
