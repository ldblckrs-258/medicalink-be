import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthEmailLoginDto {
  @IsEmail()
  @Transform(({ value }: { value: string }) => value?.toLowerCase()?.trim())
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
