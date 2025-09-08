import { IsString, MinLength, IsNotEmpty } from 'class-validator';

export class AdminResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  staffAccountId: string;

  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;

  @IsString()
  @MinLength(8, {
    message: 'Confirm password must be at least 8 characters long',
  })
  confirmPassword: string;
}
