import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import type { JwtPayloadType } from './interfaces/jwt.interface';

@Controller('auth')
export class AuthProtectedController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  getProfile(@CurrentUser() user: JwtPayloadType) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId: user.sessionId,
    };
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.ADMIN, StaffRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  adminOnly(@CurrentUser() user: JwtPayloadType) {
    return {
      message: 'This endpoint is only accessible by ADMIN or SUPER_ADMIN',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Get('super-admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  superAdminOnly(@CurrentUser() user: JwtPayloadType) {
    return {
      message: 'This endpoint is only accessible by SUPER_ADMIN',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Get('doctor-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.DOCTOR)
  @HttpCode(HttpStatus.OK)
  doctorOnly(@CurrentUser() user: JwtPayloadType) {
    return {
      message: 'This endpoint is only accessible by DOCTOR',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
