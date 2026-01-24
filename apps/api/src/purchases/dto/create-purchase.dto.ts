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

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  costPrice: number;

  @IsInt()
  warehouseId: number;
}

export enum PurchaseType {
  PROVIDER = 'PROVIDER',
  WALKING_CUSTOMER = 'WALKING_CUSTOMER',
}

export class CreatePurchaseDto {
  @IsOptional()
  @IsInt()
  providerId?: number;

  @IsOptional()
  @IsString()
  type?: PurchaseType;

  @IsOptional()
  @IsString()
  sellerInfo?: string;

  @IsOptional()
  @IsString()
  createdAt?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}
