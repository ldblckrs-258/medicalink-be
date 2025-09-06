import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { StaffRole } from '@prisma/client';
import { PaginationHelper, PaginationQueryDto } from '../common';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateStaffAccountDto } from './dto/create-staff-account.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateStaffAccountDto } from './dto/update-staff-account.dto';
import { StaffAccountsService } from './staff-accounts.service';

@Controller('staff-accounts')
export class StaffAccountsController {
  constructor(private readonly staffAccountsService: StaffAccountsService) {}

  @Post()
  async create(@Body() createStaffAccountDto: CreateStaffAccountDto) {
    return await this.staffAccountsService.create(createStaffAccountDto);
  }

  @Get()
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @Query('includeRelations') includeRelations?: string,
  ) {
    const includeRel = includeRelations === 'true';
    const { page, limit, skip } = pagination.getNormalized();

    const [staffAccounts, total] = await Promise.all([
      this.staffAccountsService.findAll(includeRel, { skip, take: limit }),
      this.staffAccountsService.count(),
    ]);

    return PaginationHelper.createResponse(
      staffAccounts,
      { page, limit },
      total,
    );
  }

  @Get('count')
  async count() {
    return await this.staffAccountsService.count();
  }

  @Get('count/:role')
  async countByRole(@Param('role') role: StaffRole) {
    return await this.staffAccountsService.countByRole(role);
  }

  @Get('role/:role')
  async findByRole(
    @Param('role') role: StaffRole,
    @Query() pagination: PaginationQueryDto,
    @Query('includeRelations') includeRelations?: string,
  ) {
    const includeRel = includeRelations === 'true';
    const { page, limit, skip } = pagination.getNormalized();

    const [staffAccounts, total] = await Promise.all([
      this.staffAccountsService.findByRole(role, includeRel, {
        skip,
        take: limit,
      }),
      this.staffAccountsService.countByRole(role),
    ]);

    return PaginationHelper.createResponse(
      staffAccounts,
      { page, limit },
      total,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: string,
    @Query('includeRelations') includeRelations?: string,
  ) {
    const includeRel = includeRelations === 'true';
    return await this.staffAccountsService.findOne(id, includeRel);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateStaffAccountDto: UpdateStaffAccountDto,
  ) {
    return await this.staffAccountsService.update(id, updateStaffAccountDto);
  }

  @Patch(':id/change-password')
  async changePassword(
    @Param('id', ParseIntPipe) id: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.staffAccountsService.changePassword(id, changePasswordDto);
    return null;
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.staffAccountsService.resetPassword(resetPasswordDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: string) {
    await this.staffAccountsService.remove(id);
    return null;
  }
}
