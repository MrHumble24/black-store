import {
  IsInt,
  IsEnum,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';

export enum ReturnReason {
  DEFECTIVE = 'DEFECTIVE',
  WRONG_ITEM = 'WRONG_ITEM',
  CUSTOMER_CHANGE_MIND = 'CUSTOMER_CHANGE_MIND',
  WARRANTY_CLAIM = 'WARRANTY_CLAIM',
  OTHER = 'OTHER',
}

export enum ReturnStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RESTOCKED = 'RESTOCKED',
  DISPOSED = 'DISPOSED',
}

export class CreateReturnDto {
  @IsInt()
  saleId: number;

  @IsInt()
  orderItemId: number;

  @IsEnum(ReturnReason)
  reason: ReturnReason;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNumber()
  @Min(0)
  refundAmount: number;
}

export class UpdateReturnDto {
  @IsOptional()
  @IsEnum(ReturnStatus)
  status?: ReturnStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
