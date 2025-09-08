import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayloadType } from '../auth/interfaces/jwt.interface';
import { ResponseUtil } from '../common';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { CreateStaffAccountDto } from './dto/create-staff-account.dto';
import { FilterStaffAccountsDto } from './dto/filter-staff-accounts.dto';
import { UpdateStaffAccountDto } from './dto/update-staff-account.dto';
import { StaffAccountsService } from './staff-accounts.service';

@Controller('staff-accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(StaffRole.SUPER_ADMIN)
export class StaffAccountProtectedController {
  constructor(private readonly staffAccountsService: StaffAccountsService) {}

  /**
   * Get statistics of staff accounts
   */
  @Get('statistics')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getStaffAccountsStatistics(@CurrentUser() _user: JwtPayloadType) {
    const stats = await this.staffAccountsService.getStatistics();

    return ResponseUtil.success(
      stats,
      'Staff accounts statistics retrieved successfully',
    );
  }

  /**
   * Create new staff account
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createStaffAccount(
    @Body() createStaffAccountDto: CreateStaffAccountDto,
    @CurrentUser() _user: JwtPayloadType,
  ) {
    const staffAccount = await this.staffAccountsService.create(
      createStaffAccountDto,
    );

    return ResponseUtil.success(
      {
        ...staffAccount,
        passwordHash: undefined,
      },
      'Staff account created successfully',
      HttpStatus.CREATED,
    );
  }

  /**
   * Get all staff accounts with advanced filtering and pagination
   * Supports filtering by role, gender, search term, email, date range
   */
  @Get()
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getAllStaffAccounts(
    @Query() filterDto: FilterStaffAccountsDto,
    @CurrentUser() _user: JwtPayloadType,
  ) {
    const { page, limit, skip } = filterDto.getNormalized();

    const [staffAccounts, total] = await Promise.all([
      this.staffAccountsService.findAllWithFilters(filterDto, {
        skip,
        take: limit,
      }),
      this.staffAccountsService.countWithFilters(filterDto),
    ]);

    const responseData = staffAccounts.map((account) => ({
      ...account,
      passwordHash: undefined,
    }));

    return ResponseUtil.paginatedAuto(
      responseData,
      { page, limit },
      total,
      'Staff accounts retrieved successfully',
    );
  }

  /**
   * Get staff account by ID
   */
  @Get(':id')
  @Roles(StaffRole.SUPER_ADMIN, StaffRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async getStaffAccountById(
    @Param('id') id: string,
    @CurrentUser() _user: JwtPayloadType,
    @Query('includeRelations') includeRelations?: string,
  ) {
    const includeRel = includeRelations === 'true';
    const staffAccount = await this.staffAccountsService.findOne(
      id,
      includeRel,
    );

    return ResponseUtil.success(
      {
        ...staffAccount,
        passwordHash: undefined,
      },
      'Staff account retrieved successfully',
    );
  }

  /**
   * Update staff account
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateStaffAccount(
    @Param('id') id: string,
    @Body() updateStaffAccountDto: UpdateStaffAccountDto,
    @CurrentUser() _user: JwtPayloadType,
  ) {
    const staffAccount = await this.staffAccountsService.update(
      id,
      updateStaffAccountDto,
    );

    return ResponseUtil.success(
      {
        ...staffAccount,
        passwordHash: undefined,
      },
      'Staff account updated successfully',
    );
  }

  /**
   * Reset staff account password
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetStaffAccountPassword(
    @Body() adminResetPasswordDto: AdminResetPasswordDto,
    @CurrentUser() _user: JwtPayloadType,
  ) {
    await this.staffAccountsService.adminResetPassword(adminResetPasswordDto);

    return ResponseUtil.success(null, 'Password reset successfully');
  }

  /**
   * Delete staff account
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteStaffAccount(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayloadType,
  ) {
    await this.staffAccountsService.adminDelete(id, user.id);

    return ResponseUtil.success(null, 'Staff account deleted successfully');
  }
}
