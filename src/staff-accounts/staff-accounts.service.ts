import { Inject, Injectable } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ExceptionUtil } from '../common';
import { StaffAccount } from './domain/staff-account';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateStaffAccountDto } from './dto/create-staff-account.dto';
import { FilterStaffAccountsDto } from './dto/filter-staff-accounts.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateStaffAccountDto } from './dto/update-staff-account.dto';
import type { StaffAccountRepository } from './repositories';

@Injectable()
export class StaffAccountsService {
  constructor(
    @Inject('StaffAccountRepository')
    private readonly staffAccountRepository: StaffAccountRepository,
  ) {}

  async create(
    createStaffAccountDto: CreateStaffAccountDto,
  ): Promise<StaffAccount> {
    const { password, dateOfBirth, ...restData } = createStaffAccountDto;

    const existingAccount = await this.staffAccountRepository.findByEmail(
      createStaffAccountDto.email,
    );

    if (existingAccount) {
      ExceptionUtil.conflict('Email already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const createData = {
      ...restData,
      passwordHash,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
    };

    return this.staffAccountRepository.create(createData);
  }

  async findAll(
    includeRelations = false,
    pagination?: { skip: number; take: number },
  ): Promise<StaffAccount[]> {
    return this.staffAccountRepository.findMany({
      where: { deletedAt: null },
      include: includeRelations
        ? {
            doctor: true,
            blogs: true,
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      ...(pagination && { skip: pagination.skip, take: pagination.take }),
    });
  }

  async findOne(id: string, includeRelations = false): Promise<StaffAccount> {
    const staffAccount = await this.staffAccountRepository.findMany({
      where: { id, deletedAt: null },
      include: includeRelations
        ? {
            doctor: true,
            blogs: true,
          }
        : undefined,
      take: 1,
    });

    if (!staffAccount || staffAccount.length === 0) {
      ExceptionUtil.notFound('Staff account', id);
    }

    return staffAccount[0];
  }

  async findByEmail(
    email: string,
    includeRelations = false,
  ): Promise<StaffAccount | null> {
    return this.staffAccountRepository.findByEmail(email, includeRelations);
  }

  async findByRole(
    role: StaffRole,
    includeRelations = false,
    pagination?: { skip: number; take: number },
  ): Promise<StaffAccount[]> {
    return this.staffAccountRepository.findByRole(
      role,
      includeRelations,
      pagination,
    );
  }

  async update(
    id: string,
    updateStaffAccountDto: UpdateStaffAccountDto,
  ): Promise<StaffAccount> {
    const existingAccount = await this.findOne(id);

    const { dateOfBirth, email, ...restData } = updateStaffAccountDto;

    if (email && email !== existingAccount.email) {
      const emailExists = await this.staffAccountRepository.findByEmail(email);

      if (emailExists) {
        ExceptionUtil.conflict('Email already exists');
      }
    }

    const updateData = {
      ...restData,
      ...(email && { email }),
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
    };

    return this.staffAccountRepository.update({ id }, updateData);
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      ExceptionUtil.badRequest(
        'New password and confirm password do not match',
      );
    }

    const staffAccount = await this.findOne(id);

    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      staffAccount.passwordHash,
    );
    if (!isOldPasswordValid) {
      ExceptionUtil.badRequest('Old password is incorrect');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.staffAccountRepository.update({ id }, { passwordHash });
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = resetPasswordDto;

    const staffAccount = await this.findByEmail(email);
    if (!staffAccount) {
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    // TODO: Implement email sending logic here

    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  async remove(id: string): Promise<void> {
    const existingAccount = await this.findOne(id);

    if (existingAccount.role === StaffRole.SUPER_ADMIN) {
      ExceptionUtil.badRequest('Cannot delete Super Admin accounts');
    }

    await this.staffAccountRepository.update({ id }, { deletedAt: new Date() });
  }

  async count(): Promise<number> {
    return this.staffAccountRepository.count({ deletedAt: null });
  }

  async countByRole(role: StaffRole): Promise<number> {
    return this.staffAccountRepository.countByRole(role);
  }

  async findAllWithFilters(
    filterDto: FilterStaffAccountsDto,
    pagination?: { skip: number; take: number },
  ): Promise<StaffAccount[]> {
    return this.staffAccountRepository.findAllWithFilters(
      filterDto,
      pagination,
    );
  }

  async countWithFilters(filterDto: FilterStaffAccountsDto): Promise<number> {
    return this.staffAccountRepository.countWithFilters(filterDto);
  }

  async adminResetPassword(
    adminResetPasswordDto: AdminResetPasswordDto,
  ): Promise<void> {
    const { staffAccountId, newPassword, confirmPassword } =
      adminResetPasswordDto;

    if (newPassword !== confirmPassword) {
      ExceptionUtil.badRequest(
        'New password and confirm password do not match',
      );
    }

    // Verify staff account exists
    await this.findOne(staffAccountId);

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.staffAccountRepository.adminResetPassword(
      staffAccountId,
      passwordHash,
    );
  }

  async adminDelete(id: string, adminId: string): Promise<void> {
    const existingAccount = await this.findOne(id);

    if (existingAccount.role === StaffRole.SUPER_ADMIN) {
      ExceptionUtil.badRequest('Cannot delete Super Admin accounts');
    }

    if (id === adminId) {
      ExceptionUtil.badRequest('Cannot delete your own account');
    }

    await this.staffAccountRepository.adminDelete(id);
  }

  async restoreAccount(id: string): Promise<void> {
    const existingAccount = await this.staffAccountRepository.findMany({
      where: { id },
      take: 1,
    });

    if (!existingAccount || existingAccount.length === 0) {
      ExceptionUtil.notFound('Staff account', id);
    }

    if (!existingAccount[0].deletedAt) {
      ExceptionUtil.badRequest('Account is not deleted');
    }

    await this.staffAccountRepository.update({ id }, { deletedAt: null });
  }

  async findDeletedAccounts(pagination?: {
    skip: number;
    take: number;
  }): Promise<StaffAccount[]> {
    return this.staffAccountRepository.findDeletedAccounts(pagination);
  }

  async getStatistics(): Promise<{
    total: number;
    byRole: Record<StaffRole, number>;
    recentlyCreated: number;
    active: number;
  }> {
    return this.staffAccountRepository.getStatistics();
  }
}
