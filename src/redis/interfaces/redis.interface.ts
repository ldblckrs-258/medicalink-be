export interface CacheOptions {
  ttl?: number;
  isJSON?: boolean;
}

export interface SessionData {
  id: string;
  email: string;
  role: string;
  sessionId: string;
  createdAt: Date;
  lastAccessedAt: Date;
  expiresAt: Date;
  isActive?: boolean;
  userId?: string;
}

export interface TokenBlacklistEntry {
  token: string;
  expiresAt: Date;
  reason?: string;
}

export interface RateLimitData {
  count: number;
  windowStart: number;
  windowSize: number;
}
