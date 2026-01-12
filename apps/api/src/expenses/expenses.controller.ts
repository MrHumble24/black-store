import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto/expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Post()
  create(@Body() dto: CreateExpenseDto, @Request() req: any) {
    return this.service.create(dto, req.user.sub);
  }

  @Get()
  findAll(
    @Query('startDate') start?: string,
    @Query('endDate') end?: string,
    @Query('category') cat?: string,
  ) {
    return this.service.findAll(start, end, cat);
  }

  @Get('summary')
  getSummary(@Query('startDate') start: string, @Query('endDate') end: string) {
    return this.service.getSummary(start, end);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateExpenseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
