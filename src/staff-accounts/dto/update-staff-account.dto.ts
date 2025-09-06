import { PartialType } from '@nestjs/mapped-types';
import { Gender, StaffRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CreateStaffAccountDto } from './create-staff-account.dto';

export class UpdateStaffAccountDto extends PartialType(CreateStaffAccountDto) {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase()?.trim())
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsEnum(StaffRole)
  role?: StaffRole;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
