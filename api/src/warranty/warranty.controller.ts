import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { WarrantyService } from './warranty.service';
import { Public } from '../auth/public.decorator';

@Controller('warranty')
export class WarrantyController {
  constructor(private readonly service: WarrantyService) {}

  /**
   * Generate warranty card with QR code
   * @example GET /warranty/generate/15?baseUrl=https://mystore.com
   */
  @Get('generate/:orderItemId')
  generateWarranty(
    @Param('orderItemId', ParseIntPipe) orderItemId: number,
    @Query('baseUrl') baseUrl: string = 'https://black-store.uz',
  ) {
    return this.service.generateWarrantyCard(orderItemId, baseUrl);
  }

  /**
   * Get all warranties for a sale (for bulk printing)
   * @example GET /warranty/sale/5?baseUrl=https://mystore.com
   */
  @Get('sale/:saleId')
  getWarrantiesForSale(
    @Param('saleId', ParseIntPipe) saleId: number,
    @Query('baseUrl') baseUrl: string = 'https://black-store.uz',
  ) {
    return this.service.getWarrantiesForSale(saleId, baseUrl);
  }

  /**
   * Verify warranty (PUBLIC - customer scans QR)
   * @example GET /warranty/verify/WRN-5-15
   */
  @Public()
  @Get('verify/:code')
  verifyWarranty(@Param('code') code: string) {
    return this.service.verifyWarranty(code);
  }
}
