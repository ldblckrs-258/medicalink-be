import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import ms from 'ms';
import { AllConfigType } from '../../config/config.type';
import { RedisService } from '../../redis';
import { JwtPayloadType } from '../interfaces/jwt.interface';

@Injectable()
export class RedisJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(RedisJwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.redisService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync<JwtPayloadType>(token, {
        secret: this.configService.getOrThrow('auth.secret', { infer: true }),
      });

      // Validate session in Redis
      const sessionValid = await this.validateSession(payload.sessionId);
      if (!sessionValid) {
        throw new UnauthorizedException('Session is invalid or expired');
      }

      // Attach user and session info to request
      request['user'] = payload;
      request['sessionId'] = payload.sessionId;

      return true;
    } catch (error) {
      this.logger.warn(`JWT validation failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async validateSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.redisService.getSession(sessionId);
      if (!session) {
        return false;
      }

      // Check if session has expired
      if (new Date() > session.expiresAt) {
        await this.redisService.deleteSession(sessionId);
        return false;
      }

      // Update last accessed time
      session.lastAccessedAt = new Date();
      const authConfig = this.configService.getOrThrow('auth', { infer: true });
      const refreshExpires = authConfig.refreshExpires;
      const ttlSeconds = Math.floor(ms(refreshExpires || '7d') / 1000);
      await this.redisService.setSession(session, ttlSeconds);

      return true;
    } catch (error) {
      this.logger.error(
        `Session validation failed: ${(error as Error).message}`,
      );
      return false;
    }
  }
}
