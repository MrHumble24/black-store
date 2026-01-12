import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  async findAll() {
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number) {
    try {
      return await this.prisma.user.findUnique({ where: { id } });
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      // await this.prisma.user.update({ where: { id }, data: updateUserDto });
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      throw error;
    }
  }
}
