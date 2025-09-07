import { CacheModule } from '@nestjs/cache-manager';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { AllConfigType } from '../config/config.type';
import redisConfig from './config/redis.config';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(redisConfig),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const redisConfiguration = configService.getOrThrow('redis', {
          infer: true,
        });

        return {
          store: redisStore as any,
          socket: {
            host: redisConfiguration.host,
            port: redisConfiguration.port,
          },
          password: redisConfiguration.password,
          username: redisConfiguration.username,
          database: redisConfiguration.db,
          ttl: redisConfiguration.ttl,
          max: redisConfiguration.max,
          keyPrefix: redisConfiguration.keyPrefix,
          retryDelayOnFailover: redisConfiguration.retryDelayOnFailover,
          enableReadyCheck: redisConfiguration.enableReadyCheck,
          maxRetriesPerRequest: redisConfiguration.maxRetriesPerRequest,
          lazyConnect: redisConfiguration.lazyConnect,
          connectTimeout: redisConfiguration.connectTimeout,
          commandTimeout: redisConfiguration.commandTimeout,
          family: redisConfiguration.family,
          keepAlive: redisConfiguration.keepAlive,
          enableOfflineQueue: redisConfiguration.enableOfflineQueue,
        };
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  providers: [RedisService, RateLimitGuard],
  exports: [RedisService, CacheModule, RateLimitGuard],
})
export class RedisModule {}
