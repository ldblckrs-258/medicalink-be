import { Blog, Doctor, Gender, StaffRole } from '@prisma/client';

export class StaffAccount {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: StaffRole;
  gender: Gender;
  dateOfBirth?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  doctor?: Doctor | null;
  blogs?: Blog[] | null;

  constructor(partial: Partial<StaffAccount>) {
    Object.assign(this, partial);
  }

  // Business logic methods can be added here
  isDoctor(): boolean {
    return this.role === StaffRole.DOCTOR;
  }

  isAdmin(): boolean {
    return this.role === StaffRole.ADMIN;
  }

  isSuperAdmin(): boolean {
    return this.role === StaffRole.SUPER_ADMIN;
  }

  canManageAdmins(): boolean {
    return this.role === StaffRole.SUPER_ADMIN;
  }

  canManageContent(): boolean {
    return this.role === StaffRole.ADMIN || this.role === StaffRole.SUPER_ADMIN;
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  isActive(): boolean {
    return this.deletedAt === null;
  }
}
