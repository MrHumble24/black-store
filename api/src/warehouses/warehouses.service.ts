import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({ data: dto });
  }

  findAll() {
    return this.prisma.warehouse.findMany({ where: { isActive: true } });
  }

  async findOne(id: number) {
    const item = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Warehouse not found');
    return item;
  }

  async update(id: number, dto: UpdateWarehouseDto) {
    await this.findOne(id);
    return this.prisma.warehouse.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
