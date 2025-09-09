import { Prisma, StaffRole } from '@prisma/client';
import { BaseRepository } from '../../common/repositories';
import { StaffAccount } from '../domain/staff-account';
import { CreateStaffAccountDto } from '../dto/create-staff-account.dto';
import { FilterStaffAccountsDto } from '../dto/filter-staff-accounts.dto';
import { UpdateStaffAccountDto } from '../dto/update-staff-account.dto';

export interface StaffAccountRepository
  extends BaseRepository<
    StaffAccount,
    CreateStaffAccountDto,
    UpdateStaffAccountDto,
    Prisma.StaffAccountWhereUniqueInput
  > {
  findByEmail(
    email: string,
    includeRelations?: boolean,
  ): Promise<StaffAccount | null>;

  findByRole(
    role: StaffRole,
    includeRelations?: boolean,
    pagination?: { skip: number; take: number },
  ): Promise<StaffAccount[]>;

  findAllWithFilters(
    filterDto: FilterStaffAccountsDto,
    pagination?: { skip: number; take: number },
  ): Promise<StaffAccount[]>;

  countWithFilters(filterDto: FilterStaffAccountsDto): Promise<number>;

  countByRole(role: StaffRole): Promise<number>;

  findDeletedAccounts(pagination?: {
    skip: number;
    take: number;
  }): Promise<StaffAccount[]>;

  getStatistics(): Promise<{
    total: number;
    byRole: Record<StaffRole, number>;
    recentlyCreated: number;
    active: number;
  }>;

  findByEmailWithPassword(email: string): Promise<StaffAccount | null>;

  adminResetPassword(
    staffAccountId: string,
    passwordHash: string,
  ): Promise<void>;
  adminDelete(id: string): Promise<void>;
}
