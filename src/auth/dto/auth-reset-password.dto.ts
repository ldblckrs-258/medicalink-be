import { IsNotEmpty, IsString } from 'class-validator';

export class AuthResetPasswordDto {
  @IsNotEmpty()
  token: string;

  @IsString()
  password: string;
}
