import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
  IsArray,
  ValidateNested,
  IsNumber,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProductType {
  SERIALIZED = 'SERIALIZED',
  BATCH = 'BATCH',
}

// --- Variant DTOs ---
export class CreateVariantDto {
  @IsString()
  sku: string;

  @IsString()
  name: string;

  @IsObject()
  specs: Record<string, string>; // {color: "Black", storage: "128GB"}

  @IsNumber()
  @Min(0)
  sellPrice: number;
}

export class UpdateVariantDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  specs?: Record<string, string>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellPrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// --- Product DTOs ---
export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ProductType)
  type: ProductType;

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsInt()
  brandId: number;

  @IsInt()
  categoryId: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsInt()
  brandId?: number;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// --- Bulk DTOs ---
export class BulkCreateProductDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductDto)
  products: CreateProductDto[];
}

export class BulkUpdateVariantDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  specs?: Record<string, string>;

  @IsOptional()
  @IsNumber()
  sellPrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class BulkUpdateVariantsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateVariantDto)
  variants: BulkUpdateVariantDto[];
}

export class BulkDeleteDto {
  @IsArray()
  @IsInt({ each: true })
  ids: number[];
}
