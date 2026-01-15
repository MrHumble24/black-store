import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { WarehousesModule } from './warehouses/warehouses.module';
import { BrandsModule } from './brands/brands.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { ProvidersModule } from './providers/providers.module';
import { PurchasesModule } from './purchases/purchases.module';
import { SalesModule } from './sales/sales.module';
import { InventoryModule } from './inventory/inventory.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { ReturnsModule } from './returns/returns.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ReportsModule } from './reports/reports.module';
import { LookupModule } from './lookup/lookup.module';
import { WarrantyModule } from './warranty/warranty.module';

import { AiModule } from './ai/ai.module';

@Module({
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    WarehousesModule,
    BrandsModule,
    CategoriesModule,
    ProductsModule,
    ProvidersModule,
    PurchasesModule,
    SalesModule,
    InventoryModule,
    StockMovementsModule,
    ReturnsModule,
    ExpensesModule,
    ReportsModule,
    LookupModule,
    WarrantyModule,
    AiModule,
  ],
})
export class AppModule {}
