import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { ResponseUtil } from '../common/utils/response.util';
import { RateLimit } from '../redis/decorators/rate-limit.decorator';
import { RateLimitGuard } from '../redis/guards/rate-limit.guard';
import { ChangePasswordDto } from '../staff-accounts/dto/change-password.dto';
import { StaffAccountsService } from '../staff-accounts/staff-accounts.service';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { JwtPayloadType } from './interfaces/jwt.interface';

@Controller('auth')
export class AuthProtectedController {
  constructor(
    private readonly authService: AuthService,
    private readonly staffAccountsService: StaffAccountsService,
  ) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: JwtPayloadType) {
    const staffAccount = await this.staffAccountsService.findOne(
      user.id,
      false,
    );

    const { passwordHash: _passwordHash, ...profileData } = staffAccount;

    return {
      ...profileData,
      sessionId: user.sessionId,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ windowMs: 60000, limit: 30 })
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  logout(@CurrentUser() user: JwtPayloadType, @Req() req: Request) {
    const token = this.extractTokenFromHeader(req);
    return this.authService.logout(user.sessionId, token);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @RateLimit({ windowMs: 60000, limit: 10 })
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  logoutAll(@CurrentUser() user: JwtPayloadType) {
    return this.authService.logoutAll(user.id);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @HttpCode(HttpStatus.OK)
  @RateLimit({ windowMs: 300000, limit: 3 })
  async changePassword(
    @CurrentUser() user: JwtPayloadType,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.staffAccountsService.changePassword(user.id, changePasswordDto);
    return ResponseUtil.success(null, 'Password changed successfully');
  }

  private extractTokenFromHeader(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
