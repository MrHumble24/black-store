import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { LookupService } from './lookup.service';

@Controller('lookup')
export class LookupController {
  constructor(private readonly service: LookupService) {}

  /**
   * Universal lookup - scan any code
   * @example GET /lookup?code=SKU-12345
   * @example GET /lookup?code=353456789012345 (IMEI)
   * @example GET /lookup?code=INV-1705012345678
   */
  @Get()
  lookup(@Query('code') code: string) {
    return this.service.lookup(code);
  }

  /**
   * Get variant with full stock info
   * @example GET /lookup/variant/1
   */
  @Get('variant/:id')
  getVariantWithStock(@Param('id', ParseIntPipe) id: number) {
    return this.service.getVariantWithStock(id);
  }

  /**
   * Get available serialized items for a variant (phones with IMEI)
   * @example GET /lookup/variant/1/serials?warehouseId=1
   */
  @Get('variant/:id/serials')
  getSerializedItems(
    @Param('id', ParseIntPipe) id: number,
    @Query('warehouseId') warehouseId?: string,
  ) {
    return this.service.getSerializedItems(
      id,
      warehouseId ? +warehouseId : undefined,
    );
  }
}
