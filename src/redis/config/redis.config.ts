import { registerAs } from '@nestjs/config';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import validateConfig from '../../utils/validate-config';
import { RedisConfig } from './redis-config.type';

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  REDIS_HOST: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  REDIS_PORT: number;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD: string;

  @IsString()
  @IsOptional()
  REDIS_USERNAME: string;

  @IsInt()
  @Min(0)
  @Max(15)
  @IsOptional()
  REDIS_DB: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  REDIS_TTL: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  REDIS_MAX: number;

  @IsString()
  @IsOptional()
  REDIS_KEY_PREFIX: string;
}

export default registerAs<RedisConfig>('redis', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
    password: process.env.REDIS_PASSWORD,
    username: process.env.REDIS_USERNAME,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
    ttl: process.env.REDIS_TTL ? parseInt(process.env.REDIS_TTL, 10) : 300, // 5 minutes
    max: process.env.REDIS_MAX ? parseInt(process.env.REDIS_MAX, 10) : 100, // Maximum number of items in cache
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'medicalink:',
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 60000,
    commandTimeout: 5000,
    family: 4,
    keepAlive: 30000,
    enableOfflineQueue: false,
  };
});
