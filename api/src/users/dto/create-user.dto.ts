import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  IsEnum,
} from 'class-validator';

// Define an enum to show how complex types are shared
export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export class CreateUserDto {
  /**
   * The full name of the user
   * @example "John Doe"
   */
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  /**
   * Minimum age is 18
   */
  @IsOptional()
  age?: number;

  @IsEnum(UserRole)
  role: UserRole;
}
