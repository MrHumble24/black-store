import {
  IsEnum,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export enum ExpenseCategory {
  RENT = 'RENT',
  UTILITIES = 'UTILITIES',
  SALARY = 'SALARY',
  TRANSPORT = 'TRANSPORT',
  REPAIRS = 'REPAIRS',
  MARKETING = 'MARKETING',
  SUPPLIES = 'SUPPLIES',
  OTHER = 'OTHER',
}

export class CreateExpenseDto {
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  receiptNo?: string;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsEnum(ExpenseCategory)
  category?: ExpenseCategory;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  receiptNo?: string;
}
