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

export interface RedisSessionData {
  id: string;
  email: string;
  role: string;
  sessionId: string;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
}
