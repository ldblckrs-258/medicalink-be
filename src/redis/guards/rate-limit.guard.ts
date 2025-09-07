import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  RATE_LIMIT_KEY,
  RateLimitOptions,
} from '../decorators/rate-limit.decorator';
import { RedisService } from '../redis.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitOptions) {
      return true; // No rate limiting configured
    }

    const request = context.switchToHttp().getRequest<Request>();

    // Skip if condition is met
    if (rateLimitOptions.skipIf && rateLimitOptions.skipIf(request)) {
      return true;
    }

    // Generate key for rate limiting
    const key = rateLimitOptions.keyGenerator
      ? rateLimitOptions.keyGenerator(request)
      : this.getDefaultKey(request);

    try {
      const isAllowed = await this.redisService.checkRateLimit(
        key,
        rateLimitOptions.limit,
        rateLimitOptions.windowMs,
      );

      if (!isAllowed) {
        throw new HttpException(
          `Rate limit exceeded. Maximum ${rateLimitOptions.limit} requests per ${rateLimitOptions.windowMs}ms`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(
        `Rate limiting check failed: ${(error as Error).message}`,
      );
      return true; // Allow request if Redis is down
    }
  }

  private getDefaultKey(request: Request): string {
    const ip = request.ip || request.connection.remoteAddress || 'unknown';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const route = ((request as any).route?.path as string) || request.url;
    return `rate_limit:${ip}:${route}`;
  }
}
