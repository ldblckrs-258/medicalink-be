import { StaffRole } from '@prisma/client';

export interface SessionData {
  id: string;
  userId: string;
  email: string;
  role: StaffRole;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface CreateSessionData {
  userId: string;
  email: string;
  role: StaffRole;
}
