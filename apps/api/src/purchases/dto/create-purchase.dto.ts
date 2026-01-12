import {
  IsInt,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseItemDto {
  @IsInt()
  variantId: number;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  costPrice: number;

  @IsInt()
  warehouseId: number;
}

export class CreatePurchaseDto {
  @IsInt()
  providerId: number;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}
