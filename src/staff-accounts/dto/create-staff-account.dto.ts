import { Gender, StaffRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateStaffAccountDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  fullName: string;

  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase()?.trim())
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(StaffRole)
  role: StaffRole;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender = Gender.UNKNOWN;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
