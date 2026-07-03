import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  UpdateInventoryDto,
  TransferInventoryDto,
  CreateInventoryDto,
} from './dto/inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Post()
  create(@Body() dto: CreateInventoryDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
    @Query('variantId') variantId?: string,
  ) {
    return this.service.findAll(
      warehouseId ? +warehouseId : undefined,
      status,
      variantId ? +variantId : undefined,
    );
  }

  @Get('warehouse/:id')
  getByWarehouse(@Param('id', ParseIntPipe) id: number) {
    return this.service.getByWarehouse(id);
  }

  @Get('variant/:id')
  getByVariant(@Param('id', ParseIntPipe) id: number) {
    return this.service.getByVariant(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryDto,
  ) {
    return this.service.update(id, dto);
  }

  @Post('transfer')
  transfer(@Body() dto: TransferInventoryDto, @Request() req: any) {
    return this.service.transfer(dto, req.user.sub);
  }
}
