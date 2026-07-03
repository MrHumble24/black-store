import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateProviderDto) {
    return this.prisma.provider.create({ data: dto });
  }

  findAll() {
    return this.prisma.provider.findMany({ where: { isActive: true } });
  }

  async findOne(id: number) {
    const item = await this.prisma.provider.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Provider not found');
    return item;
  }

  async update(id: number, dto: UpdateProviderDto) {
    await this.findOne(id);
    return this.prisma.provider.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.provider.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
