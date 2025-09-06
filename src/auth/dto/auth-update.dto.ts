import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';

export class AuthUpdateDto {
  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  fullname?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase()?.trim())
  email?: string;

  @IsOptional()
  @IsNotEmpty()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsNotEmpty({ message: 'mustBeNotEmpty' })
  oldPassword?: string;
}
