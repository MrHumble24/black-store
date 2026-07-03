import { IsInt, IsOptional, IsString, IsEnum, Min } from 'class-validator';

export enum ItemStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  SOLD = 'SOLD',
  DEFECTIVE = 'DEFECTIVE',
  LOST = 'LOST',
}

export class UpdateInventoryDto {
  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsInt()
  warehouseId?: number;

  @IsOptional()
  @IsString()
  batchNumber?: string;
}

export class CreateInventoryDto {
  @IsInt()
  variantId: number;

  @IsInt()
  warehouseId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  @Min(0)
  costPrice: number;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;
}

export class TransferInventoryDto {
  @IsInt()
  fromWarehouseId: number;

  @IsInt()
  toWarehouseId: number;

  @IsInt()
  variantId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsInt()
  inventoryItemId?: number; // For serialized

  @IsOptional()
  @IsString()
  notes?: string;
}
