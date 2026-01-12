import {
  IsInt,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SaleItemDto {
  @IsInt()
  variantId: number;

  @IsOptional()
  @IsInt()
  inventoryItemId?: number; // For serialized items

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  sellPrice: number;

  @IsOptional()
  @IsDateString()
  warrantyEnd?: string;
}

export class CreateSaleDto {
  @IsOptional()
  @IsString()
  customerName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}
