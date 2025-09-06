import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ResponseUtil } from '../common/utils/response.util';
import { ChangePasswordDto } from '../staff-accounts/dto/change-password.dto';
import { ResetPasswordDto } from '../staff-accounts/dto/reset-password.dto';
import { StaffAccountsService } from '../staff-accounts/staff-accounts.service';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRefreshDto } from './dto/auth-refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { JwtPayloadType } from './interfaces/jwt.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly staffAccountsService: StaffAccountsService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: AuthEmailLoginDto) {
    return await this.authService.validateLogin(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshDto: AuthRefreshDto) {
    return await this.authService.refreshToken(refreshDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout() {
    return this.authService.logout();
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: JwtPayloadType,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.staffAccountsService.changePassword(user.id, changePasswordDto);
    return ResponseUtil.success(null, 'Password changed successfully');
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.staffAccountsService.resetPassword(resetPasswordDto);
  }
}
