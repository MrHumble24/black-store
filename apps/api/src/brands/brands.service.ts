import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateBrandDto) {
    return this.prisma.brand.create({ data: dto });
  }

  findAll() {
    return this.prisma.brand.findMany({ where: { isActive: true } });
  }

  async findOne(id: number) {
    const item = await this.prisma.brand.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Brand not found');
    return item;
  }

  async update(id: number, dto: UpdateBrandDto) {
    await this.findOne(id);
    return this.prisma.brand.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.brand.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
