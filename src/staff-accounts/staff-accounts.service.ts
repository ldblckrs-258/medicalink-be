import { Injectable } from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ExceptionUtil } from '../common';
import { StaffAccount } from './domain/staff-account';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateStaffAccountDto } from './dto/create-staff-account.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateStaffAccountDto } from './dto/update-staff-account.dto';

@Injectable()
export class StaffAccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createStaffAccountDto: CreateStaffAccountDto,
  ): Promise<StaffAccount> {
    const { password, dateOfBirth, ...restData } = createStaffAccountDto;

    // Check if email already exists
    const existingAccount = await this.prisma.staffAccount.findUnique({
      where: { email: createStaffAccountDto.email },
    });

    if (existingAccount) {
      ExceptionUtil.conflict('Email already exists');
    }

    // Hash password
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
      where: { id },
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
    const staffAccount = await this.prisma.staffAccount.findUnique({
      where: { email },
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
      where: { role },
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

    const { password, dateOfBirth, email, ...restData } = updateStaffAccountDto;

    // Check if email is being changed and if new email already exists
    if (email && email !== existingAccount.email) {
      const emailExists = await this.prisma.staffAccount.findUnique({
        where: { email },
      });

      if (emailExists) {
        ExceptionUtil.conflict('Email already exists');
      }
    }

    let passwordHash: string | undefined;
    if (password) {
      const saltRounds = 10;
      passwordHash = await bcrypt.hash(password, saltRounds);
    }

    const staffAccount = await this.prisma.staffAccount.update({
      where: { id },
      data: {
        ...restData,
        ...(email && { email }),
        ...(passwordHash && { passwordHash }),
        ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      },
      include: {
        doctor: true,
        blogs: true,
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

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      staffAccount.passwordHash,
    );
    if (!isOldPasswordValid) {
      ExceptionUtil.badRequest('Old password is incorrect');
    }

    // Hash new password
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
      // Don't reveal if email exists or not for security reasons
      return {
        message: 'If the email exists, a password reset link has been sent',
      };
    }

    // TODO: Implement email sending logic here
    // For now, just return success message
    // In real implementation, you would:
    // 1. Generate a reset token
    // 2. Store it in database with expiration
    // 3. Send email with reset link

    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  async remove(id: string): Promise<void> {
    const existingAccount = await this.findOne(id);

    // Don't allow deleting Super Admin accounts (business rule)
    if (existingAccount.role === StaffRole.SUPER_ADMIN) {
      ExceptionUtil.badRequest('Cannot delete Super Admin accounts');
    }

    await this.prisma.staffAccount.delete({
      where: { id },
    });
  }

  async count(): Promise<number> {
    return this.prisma.staffAccount.count();
  }

  async countByRole(role: StaffRole): Promise<number> {
    return this.prisma.staffAccount.count({
      where: { role },
    });
  }
}
