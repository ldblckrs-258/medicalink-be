import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayloadType } from '../auth/interfaces/jwt.interface';
import { StaffAccountsService } from './staff-accounts.service';

@Controller('staff-accounts')
export class StaffAccountsProtectedController {
  constructor(private readonly staffAccountsService: StaffAccountsService) {}

  @Get('my-profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyProfile(@CurrentUser() user: JwtPayloadType) {
    return this.staffAccountsService.findOne(user.id, true);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.ADMIN, StaffRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getAllStaffAccounts(@CurrentUser() user: JwtPayloadType) {
    return {
      message: 'Admin access granted',
      requestedBy: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      data: await this.staffAccountsService.findAll(true),
    };
  }

  @Get('super-admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getStats(@CurrentUser() user: JwtPayloadType) {
    const [totalCount, adminCount, doctorCount, superAdminCount] =
      await Promise.all([
        this.staffAccountsService.count(),
        this.staffAccountsService.countByRole(StaffRole.ADMIN),
        this.staffAccountsService.countByRole(StaffRole.DOCTOR),
        this.staffAccountsService.countByRole(StaffRole.SUPER_ADMIN),
      ]);

    return {
      message: 'Super Admin stats',
      requestedBy: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      stats: {
        total: totalCount,
        admins: adminCount,
        doctors: doctorCount,
        superAdmins: superAdminCount,
      },
    };
  }

  @Post('doctor/update-profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(StaffRole.DOCTOR)
  @HttpCode(HttpStatus.OK)
  updateDoctorProfile(@CurrentUser() user: JwtPayloadType) {
    return {
      message: 'Doctor can update their own profile',
      userId: user.id,
      email: user.email,
      role: user.role,
      // TODO: Implement actual update logic
    };
  }
}
