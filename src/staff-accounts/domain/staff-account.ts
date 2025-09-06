import { Gender, StaffRole } from '@prisma/client';

export class StaffAccount {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: StaffRole;
  gender: Gender;
  dateOfBirth?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  doctor?: any; // Will be defined when Doctor module is implemented
  blogs?: any[]; // Will be defined when Blog module is implemented

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
}
