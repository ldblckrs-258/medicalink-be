import { Injectable } from '@nestjs/common';
import { Prisma, StaffRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ExceptionUtil } from '../common';
import { StaffAccount } from './domain/staff-account';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateStaffAccountDto } from './dto/create-staff-account.dto';
import { FilterStaffAccountsDto } from './dto/filter-staff-accounts.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateStaffAccountDto } from './dto/update-staff-account.dto';

@Injectable()
export class StaffAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createStaffAccountDto: CreateStaffAccountDto,
  ): Promise<StaffAccount> {
    const { password, dateOfBirth, ...restData } = createStaffAccountDto;

    const existingAccount = await this.prisma.staffAccount.findUnique({
      where: { email: createStaffAccountDto.email },
    });

    if (existingAccount) {
      ExceptionUtil.conflict('Email already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const staffAccount = await this.prisma.staffAccount.create({
      data: {
        ...restData,
        passwordHash,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      },
      include: {
        doctor: true,
        blogs: true,
      },
    });

    return new StaffAccount(staffAccount);
  }

  async findAll(
    includeRelations = false,
    pagination?: { skip: number; take: number },
  ): Promise<StaffAccount[]> {
    const staffAccounts = await this.prisma.staffAccount.findMany({
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

    return staffAccounts.map((account) => new StaffAccount(account));
  }

  async findOne(id: string, includeRelations = false): Promise<StaffAccount> {
    const staffAccount = await this.prisma.staffAccount.findUnique({
      where: { id, deletedAt: null },
      include: includeRelations
        ? {
            doctor: true,
            blogs: true,
          }
        : undefined,
    });

    if (!staffAccount) {
      ExceptionUtil.notFound('Staff account', id);
    }

    return new StaffAccount(staffAccount);
  }

  async findByEmail(
    email: string,
    includeRelations = false,
  ): Promise<StaffAccount | null> {
    const staffAccount = await this.prisma.staffAccount.findFirst({
      where: { email, deletedAt: null },
      include: includeRelations
        ? {
            doctor: true,
            blogs: true,
          }
        : undefined,
    });

    return staffAccount ? new StaffAccount(staffAccount) : null;
  }

  async findByRole(
    role: StaffRole,
    includeRelations = false,
    pagination?: { skip: number; take: number },
  ): Promise<StaffAccount[]> {
    const staffAccounts = await this.prisma.staffAccount.findMany({
      where: { role, deletedAt: null },
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

    return staffAccounts.map((account) => new StaffAccount(account));
  }

  async update(
    id: string,
    updateStaffAccountDto: UpdateStaffAccountDto,
  ): Promise<StaffAccount> {
    const existingAccount = await this.findOne(id);

    const { dateOfBirth, email, ...restData } = updateStaffAccountDto;

    if (email && email !== existingAccount.email) {
      const emailExists = await this.prisma.staffAccount.findUnique({
        where: { email },
      });

      if (emailExists) {
        ExceptionUtil.conflict('Email already exists');
      }
    }

    const staffAccount = await this.prisma.staffAccount.update({
      where: { id },
      data: {
        ...restData,
        ...(email && { email }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      },
    });

    return new StaffAccount(staffAccount);
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

    await this.prisma.staffAccount.update({
      where: { id },
      data: { passwordHash },
    });
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

    await this.prisma.staffAccount.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async count(): Promise<number> {
    return this.prisma.staffAccount.count({
      where: { deletedAt: null },
    });
  }

  async countByRole(role: StaffRole): Promise<number> {
    return this.prisma.staffAccount.count({
      where: { role, deletedAt: null },
    });
  }

  async findAllWithFilters(
    filterDto: FilterStaffAccountsDto,
    pagination?: { skip: number; take: number },
  ): Promise<StaffAccount[]> {
    const {
      role,
      gender,
      search,
      email,
      createdFrom,
      createdTo,
      includeRelations,
      sortBy,
      sortOrder,
    } = filterDto;

    const where: Prisma.StaffAccountWhereInput = {
      deletedAt: null,
    };

    if (role) {
      where.role = role;
    }

    if (gender) {
      where.gender = gender;
    }

    if (email) {
      where.email = {
        contains: email,
        mode: 'insensitive',
      };
    }

    if (search) {
      where.OR = [
        {
          fullName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) {
        where.createdAt.gte = new Date(createdFrom);
      }
      if (createdTo) {
        where.createdAt.lte = new Date(createdTo);
      }
    }

    const orderBy: Prisma.StaffAccountOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const staffAccounts = await this.prisma.staffAccount.findMany({
      where,
      include: includeRelations
        ? {
            doctor: true,
            blogs: true,
          }
        : undefined,
      orderBy,
      ...(pagination && { skip: pagination.skip, take: pagination.take }),
    });

    return staffAccounts.map((account) => new StaffAccount(account));
  }

  async countWithFilters(filterDto: FilterStaffAccountsDto): Promise<number> {
    const { role, gender, search, email, createdFrom, createdTo } = filterDto;

    const where: Prisma.StaffAccountWhereInput = {
      deletedAt: null,
    };

    if (role) {
      where.role = role;
    }

    if (gender) {
      where.gender = gender;
    }

    if (email) {
      where.email = {
        contains: email,
        mode: 'insensitive',
      };
    }

    if (search) {
      where.OR = [
        {
          fullName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) {
        where.createdAt.gte = new Date(createdFrom);
      }
      if (createdTo) {
        where.createdAt.lte = new Date(createdTo);
      }
    }

    return this.prisma.staffAccount.count({ where });
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

    await this.prisma.staffAccount.update({
      where: { id: staffAccountId },
      data: { passwordHash },
    });
  }

  async adminDelete(id: string, adminId: string): Promise<void> {
    const existingAccount = await this.findOne(id);

    if (existingAccount.role === StaffRole.SUPER_ADMIN) {
      ExceptionUtil.badRequest('Cannot delete Super Admin accounts');
    }

    if (id === adminId) {
      ExceptionUtil.badRequest('Cannot delete your own account');
    }

    await this.prisma.staffAccount.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restoreAccount(id: string): Promise<void> {
    const existingAccount = await this.prisma.staffAccount.findUnique({
      where: { id },
    });

    if (!existingAccount) {
      ExceptionUtil.notFound('Staff account', id);
    }

    if (!existingAccount.deletedAt) {
      ExceptionUtil.badRequest('Account is not deleted');
    }

    await this.prisma.staffAccount.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async findDeletedAccounts(pagination?: {
    skip: number;
    take: number;
  }): Promise<StaffAccount[]> {
    const deletedAccounts = await this.prisma.staffAccount.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      ...(pagination && { skip: pagination.skip, take: pagination.take }),
    });

    return deletedAccounts.map((account) => new StaffAccount(account));
  }

  async getStatistics(): Promise<{
    total: number;
    byRole: Record<StaffRole, number>;
    recentlyCreated: number;
    active: number;
  }> {
    const [total, adminCount, doctorCount, superAdminCount] = await Promise.all(
      [
        this.count(),
        this.countByRole(StaffRole.ADMIN),
        this.countByRole(StaffRole.DOCTOR),
        this.countByRole(StaffRole.SUPER_ADMIN),
      ],
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyCreated = await this.prisma.staffAccount.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return {
      total,
      byRole: {
        [StaffRole.SUPER_ADMIN]: superAdminCount,
        [StaffRole.ADMIN]: adminCount,
        [StaffRole.DOCTOR]: doctorCount,
      },
      recentlyCreated,
      active: total,
    };
  }
}
