export type RedisConfig = {
  host: string;
  port: number;
  password?: string;
  username?: string;
  db?: number;
  ttl: number;
  max: number;
  keyPrefix?: string;
  retryDelayOnFailover?: number;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
  connectTimeout?: number;
  commandTimeout?: number;
  family?: 4 | 6;
  keepAlive?: number;
  enableOfflineQueue?: boolean;
};
