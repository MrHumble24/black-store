import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';

@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly service: StockMovementsService) {}

  @Get()
  findAll(
    @Query('productId') productId?: string,
    @Query('type') type?: string,
  ) {
    return this.service.findAll(productId ? +productId : undefined, type);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
