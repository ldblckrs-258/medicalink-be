import { Injectable } from '@nestjs/common';
import { Prisma, StaffRole } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AbstractBaseRepository } from '../../common/repositories';
import { StaffAccount } from '../domain/staff-account';
import { CreateStaffAccountDto } from '../dto/create-staff-account.dto';
import { FilterStaffAccountsDto } from '../dto/filter-staff-accounts.dto';
import { UpdateStaffAccountDto } from '../dto/update-staff-account.dto';
import { StaffAccountRepository } from './staff-account.repository.interface';

@Injectable()
export class StaffAccountRepositoryImpl
  extends AbstractBaseRepository<
    StaffAccount,
    CreateStaffAccountDto,
    UpdateStaffAccountDto,
    Prisma.StaffAccountWhereUniqueInput
  >
  implements StaffAccountRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected getModel() {
    return this.prisma.staffAccount;
  }

  protected toDomainEntity(raw: Partial<StaffAccount>): StaffAccount {
    return new StaffAccount(raw);
  }

  async findByEmail(
    email: string,
    includeRelations = false,
  ): Promise<StaffAccount | null> {
    const result = await this.getModel().findFirst({
      where: { email, deletedAt: null },
      include: includeRelations
        ? {
            doctor: true,
            blogs: true,
          }
        : undefined,
    });

    return result ? this.toDomainEntity(result) : null;
  }

  async findByEmailWithPassword(email: string): Promise<StaffAccount | null> {
    const result = await this.getModel().findFirst({
      where: { email, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        passwordHash: true,
        role: true,
        gender: true,
        dateOfBirth: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return result ? this.toDomainEntity(result) : null;
  }

  async findByRole(
    role: StaffRole,
    includeRelations = false,
    pagination?: { skip: number; take: number },
  ): Promise<StaffAccount[]> {
    const results = await this.getModel().findMany({
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

    return results.map((result) => this.toDomainEntity(result));
  }

  async findAllWithFilters(
    filterDto: FilterStaffAccountsDto,
    pagination?: { skip: number; take: number },
  ): Promise<StaffAccount[]> {
    const where = this.buildFilterWhere(filterDto);
    const orderBy = this.buildFilterOrderBy(filterDto);

    const results = await this.getModel().findMany({
      where,
      include: filterDto.includeRelations
        ? {
            doctor: true,
            blogs: true,
          }
        : undefined,
      orderBy,
      ...(pagination && { skip: pagination.skip, take: pagination.take }),
    });

    return results.map((result) => this.toDomainEntity(result));
  }

  async countWithFilters(filterDto: FilterStaffAccountsDto): Promise<number> {
    const where = this.buildFilterWhere(filterDto);
    return this.getModel().count({ where });
  }

  async countByRole(role: StaffRole): Promise<number> {
    return this.getModel().count({
      where: { role, deletedAt: null },
    });
  }

  async findDeletedAccounts(pagination?: {
    skip: number;
    take: number;
  }): Promise<StaffAccount[]> {
    const results = await this.getModel().findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      ...(pagination && { skip: pagination.skip, take: pagination.take }),
    });

    return results.map((result) => this.toDomainEntity(result));
  }

  async getStatistics(): Promise<{
    total: number;
    byRole: Record<StaffRole, number>;
    recentlyCreated: number;
    active: number;
  }> {
    const [total, adminCount, doctorCount, superAdminCount] = await Promise.all(
      [
        this.count({ deletedAt: null }),
        this.countByRole(StaffRole.ADMIN),
        this.countByRole(StaffRole.DOCTOR),
        this.countByRole(StaffRole.SUPER_ADMIN),
      ],
    );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentlyCreated = await this.getModel().count({
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

  async adminResetPassword(
    staffAccountId: string,
    passwordHash: string,
  ): Promise<void> {
    await this.getModel().update({
      where: { id: staffAccountId },
      data: { passwordHash },
    });
  }

  async adminDelete(id: string): Promise<void> {
    await this.getModel().update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findMany(options?: {
    where?: any;
    include?: any;
    orderBy?: any;
    skip?: number;
    take?: number;
  }): Promise<StaffAccount[]> {
    const whereWithActiveCheck = {
      ...options?.where,
      deletedAt: null,
    };

    return super.findMany({
      ...options,
      where: whereWithActiveCheck,
    });
  }

  async findUnique(
    where: Prisma.StaffAccountWhereUniqueInput,
  ): Promise<StaffAccount | null> {
    const result = await this.getModel().findUnique({
      where: { ...where, deletedAt: null },
    });

    return result ? this.toDomainEntity(result) : null;
  }

  private buildFilterWhere(
    filterDto: FilterStaffAccountsDto,
  ): Prisma.StaffAccountWhereInput {
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

    return where;
  }

  private buildFilterOrderBy(
    filterDto: FilterStaffAccountsDto,
  ): Prisma.StaffAccountOrderByWithRelationInput {
    const { sortBy, sortOrder } = filterDto;

    const orderBy: Prisma.StaffAccountOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    return orderBy;
  }
}
