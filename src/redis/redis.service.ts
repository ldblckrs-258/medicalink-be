import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Cache } from 'cache-manager';
import { createClient, RedisClientType } from 'redis';
import { AllConfigType } from '../config/config.type';
import {
  CacheOptions,
  RateLimitData,
  SessionData,
  TokenBlacklistEntry,
} from './interfaces/redis.interface';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: RedisClientType;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService<AllConfigType>,
  ) {}

  async onModuleInit() {
    const redisConfig = this.configService.getOrThrow('redis', { infer: true });

    this.redisClient = createClient({
      socket: {
        host: redisConfig.host,
        port: redisConfig.port,
        connectTimeout: redisConfig.connectTimeout,
        family: redisConfig.family,
        keepAlive: (redisConfig.keepAlive || 0) > 0,
      },
      password: redisConfig.password,
      username: redisConfig.username,
      database: redisConfig.db,
      disableOfflineQueue: !redisConfig.enableOfflineQueue,
      commandsQueueMaxLength: redisConfig.maxRetriesPerRequest,
    }) as RedisClientType;

    this.redisClient.on('error', (err) => {
      this.logger.error('Redis Client Error:', err);
    });

    this.redisClient.on('end', () => {
      this.logger.log('Redis Client Connection Ended');
    });

    try {
      await this.redisClient.connect();
      this.logger.log('Redis Client Connected');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis connection closed');
    }
  }

  // Basic cache operations using cache-manager
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      return value || null;
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options?: CacheOptions,
  ): Promise<boolean> {
    try {
      const redisConfig = this.configService.getOrThrow('redis', {
        infer: true,
      });
      const ttl = options?.ttl || redisConfig.ttl;

      await this.cacheManager.set(key, value, ttl * 1000); // Convert to milliseconds
      return true;
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.cacheManager.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      return false;
    }
  }

  async reset(): Promise<boolean> {
    try {
      await this.redisClient.flushDb();
      return true;
    } catch (error) {
      this.logger.error('Error resetting cache:', error);
      return false;
    }
  }

  // Advanced Redis operations using direct client
  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.redisClient.hGet(key, field);
    } catch (error) {
      this.logger.error(
        `Error getting hash field ${field} from ${key}:`,
        error,
      );
      return null;
    }
  }

  async hset(key: string, field: string, value: string): Promise<boolean> {
    try {
      await this.redisClient.hSet(key, field, value);
      return true;
    } catch (error) {
      this.logger.error(`Error setting hash field ${field} in ${key}:`, error);
      return false;
    }
  }

  async hdel(key: string, field: string): Promise<boolean> {
    try {
      await this.redisClient.hDel(key, field);
      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting hash field ${field} from ${key}:`,
        error,
      );
      return false;
    }
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    try {
      return await this.redisClient.hGetAll(key);
    } catch (error) {
      this.logger.error(`Error getting all hash fields from ${key}:`, error);
      return null;
    }
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redisClient.sAdd(key, members);
    } catch (error) {
      this.logger.error(`Error adding members to set ${key}:`, error);
      return 0;
    }
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      return await this.redisClient.sRem(key, members);
    } catch (error) {
      this.logger.error(`Error removing members from set ${key}:`, error);
      return 0;
    }
  }

  async sismember(key: string, member: string): Promise<boolean> {
    try {
      const result = await this.redisClient.sIsMember(key, member);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking membership in set ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.redisClient.expire(key, seconds);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error setting expiration for key ${key}:`, error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await this.redisClient.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}:`, error);
      return -1;
    }
  }

  // Session management methods
  async setSession(
    sessionData: SessionData,
    ttlSeconds?: number,
  ): Promise<boolean> {
    const redisConfig = this.configService.getOrThrow('redis', { infer: true });
    const key = `${redisConfig.keyPrefix}session:${sessionData.sessionId}`;
    const ttl = ttlSeconds || redisConfig.ttl;

    try {
      await this.redisClient.setEx(key, ttl, JSON.stringify(sessionData));
      return true;
    } catch (error) {
      this.logger.error(
        `Error setting session ${sessionData.sessionId}:`,
        error,
      );
      return false;
    }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const redisConfig = this.configService.getOrThrow('redis', { infer: true });
    const key = `${redisConfig.keyPrefix}session:${sessionId}`;

    try {
      const data = await this.redisClient.get(key);
      return data ? (JSON.parse(data) as SessionData) : null;
    } catch (error) {
      this.logger.error(`Error getting session ${sessionId}:`, error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const redisConfig = this.configService.getOrThrow('redis', { infer: true });
    const key = `${redisConfig.keyPrefix}session:${sessionId}`;

    try {
      const result = await this.redisClient.del(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error deleting session ${sessionId}:`, error);
      return false;
    }
  }

  async refreshSession(
    sessionId: string,
    ttlSeconds?: number,
  ): Promise<boolean> {
    const redisConfig = this.configService.getOrThrow('redis', { infer: true });
    const key = `${redisConfig.keyPrefix}session:${sessionId}`;
    const ttl = ttlSeconds || redisConfig.ttl;

    try {
      const result = await this.redisClient.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error refreshing session ${sessionId}:`, error);
      return false;
    }
  }

  // Token blacklist methods
  async blacklistToken(
    token: string,
    expiresAt: Date,
    reason?: string,
  ): Promise<boolean> {
    const redisConfig = this.configService.getOrThrow('redis', { infer: true });
    const key = `${redisConfig.keyPrefix}blacklist:${token}`;
    const ttlSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

    if (ttlSeconds <= 0) {
      return true; // Token already expired
    }

    const entry: TokenBlacklistEntry = {
      token,
      expiresAt,
      reason,
    };

    try {
      await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(entry));
      return true;
    } catch (error) {
      this.logger.error(`Error blacklisting token:`, error);
      return false;
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const redisConfig = this.configService.getOrThrow('redis', { infer: true });
    const key = `${redisConfig.keyPrefix}blacklist:${token}`;

    try {
      return await this.exists(key);
    } catch (error) {
      this.logger.error(`Error checking token blacklist:`, error);
      return false;
    }
  }

  // Rate limiting methods
  async checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowSizeMs: number,
  ): Promise<boolean> {
    const redisConfig = this.configService.getOrThrow('redis', { infer: true });
    const key = `${redisConfig.keyPrefix}ratelimit:${identifier}`;
    const now = Date.now();
    const windowStart = Math.floor(now / windowSizeMs) * windowSizeMs;

    try {
      const current = await this.get<RateLimitData>(key);

      if (!current || current.windowStart !== windowStart) {
        // New window
        const newData: RateLimitData = {
          count: 1,
          windowStart,
          windowSize: windowSizeMs,
        };
        await this.set(key, newData, { ttl: Math.floor(windowSizeMs / 1000) });
        return true;
      }

      if (current.count >= maxRequests) {
        return false;
      }

      // Increment counter
      current.count++;
      await this.set(key, current, { ttl: Math.floor(windowSizeMs / 1000) });
      return true;
    } catch (error) {
      this.logger.error(`Error checking rate limit for ${identifier}:`, error);
      // In case of error, allow the request but log it
      return true;
    }
  }

  // Utility methods
  async ping(): Promise<string> {
    try {
      return await this.redisClient.ping();
    } catch (error) {
      this.logger.error('Error pinging Redis:', error);
      throw error;
    }
  }

  async getInfo(): Promise<string> {
    try {
      return await this.redisClient.info();
    } catch (error) {
      this.logger.error('Error getting Redis info:', error);
      throw error;
    }
  }

  getClient(): RedisClientType {
    return this.redisClient;
  }
}
