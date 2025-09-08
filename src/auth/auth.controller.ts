import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { RateLimit } from '../redis/decorators/rate-limit.decorator';
import { RateLimitGuard } from '../redis/guards/rate-limit.guard';
import { ResetPasswordDto } from '../staff-accounts/dto/reset-password.dto';
import { StaffAccountsService } from '../staff-accounts/staff-accounts.service';
import { AuthService } from './auth.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRefreshDto } from './dto/auth-refresh.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly staffAccountsService: StaffAccountsService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ windowMs: 60000, limit: 5 })
  @UseGuards(RateLimitGuard)
  async login(@Body() loginDto: AuthEmailLoginDto) {
    return await this.authService.validateLogin(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ windowMs: 60000, limit: 20 })
  @UseGuards(RateLimitGuard)
  async refresh(@Body() refreshDto: AuthRefreshDto) {
    return await this.authService.refreshToken(refreshDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ windowMs: 300000, limit: 2 })
  @UseGuards(RateLimitGuard)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.staffAccountsService.resetPassword(resetPasswordDto);
  }
}
