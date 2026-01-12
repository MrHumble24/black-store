import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreateVariantDto,
  UpdateVariantDto,
  BulkCreateProductDto,
  BulkUpdateVariantsDto,
  BulkDeleteDto,
} from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  // === PRODUCTS CRUD ===

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.service.search(query);
  }

  @Get('low-stock')
  getLowStock() {
    return this.service.getLowStock();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }

  // === VARIANTS ===

  @Post(':id/variants')
  addVariant(
    @Param('id', ParseIntPipe) productId: number,
    @Body() dto: CreateVariantDto,
  ) {
    return this.service.addVariant(productId, dto);
  }

  @Get('variants/sku/:sku')
  getVariantBySku(@Param('sku') sku: string) {
    return this.service.getVariantBySku(sku);
  }

  @Patch('variants/:id')
  updateVariant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.service.updateVariant(id, dto);
  }

  @Delete('variants/:id')
  removeVariant(@Param('id', ParseIntPipe) id: number) {
    return this.service.removeVariant(id);
  }

  // === BULK OPERATIONS ===

  @Post('bulk')
  bulkCreate(@Body() dto: BulkCreateProductDto) {
    return this.service.bulkCreateProducts(dto);
  }

  @Patch('bulk/variants')
  bulkUpdateVariants(@Body() dto: BulkUpdateVariantsDto) {
    return this.service.bulkUpdateVariants(dto);
  }

  @Delete('bulk')
  bulkDeleteProducts(@Body() dto: BulkDeleteDto) {
    return this.service.bulkDeleteProducts(dto);
  }

  @Delete('bulk/variants')
  bulkDeleteVariants(@Body() dto: BulkDeleteDto) {
    return this.service.bulkDeleteVariants(dto);
  }
}
