import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('dashboard')
  getDashboard() {
    return this.service.getDashboard();
  }

  @Get('sales')
  getSalesSummary(
    @Query('startDate') start: string,
    @Query('endDate') end: string,
  ) {
    return this.service.getSalesSummary(start, end);
  }

  @Get('inventory-value')
  getInventoryValue() {
    return this.service.getInventoryValue();
  }

  @Get('profit')
  getProfitReport(
    @Query('startDate') start: string,
    @Query('endDate') end: string,
  ) {
    return this.service.getProfitReport(start, end);
  }
}
