import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StaffRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import ms from 'ms';
import { ExceptionUtil, ResponseUtil } from '../common';
import { AllConfigType } from '../config/config.type';
import { RedisService } from '../redis';
import { StaffAccount } from '../staff-accounts/domain/staff-account';
import { StaffAccountsService } from '../staff-accounts/staff-accounts.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRefreshDto } from './dto/auth-refresh.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import {
  JwtPayloadType,
  JwtRefreshPayloadType,
} from './interfaces/jwt.interface';
import { CreateSessionData, SessionData } from './interfaces/session.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly staffAccountsService: StaffAccountsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly redisService: RedisService,
  ) {}

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
    const { email, password } = loginDto;

    const staff = await this.staffAccountsService.findByEmail(email);
    if (!staff) {
      ExceptionUtil.unauthorized('No email found with this address');
    }

    const isPasswordValid = await bcrypt.compare(password, staff.passwordHash);
    if (!isPasswordValid) {
      ExceptionUtil.unauthorized('The password is incorrect');
    }

    const sessionData: CreateSessionData = {
      userId: staff.id,
      email: staff.email,
      role: staff.role,
    };

    const session = await this.createSession(sessionData);
    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: staff.id,
      email: staff.email,
      role: staff.role,
      sessionId: session.id,
    });

    const { passwordHash: _passwordHash, ...userWithoutPassword } = staff;

    return {
      token,
      refreshToken,
      tokenExpires,
      user: new StaffAccount(userWithoutPassword),
    };
  }

  async refreshToken(
    refreshDto: AuthRefreshDto,
  ): Promise<Omit<LoginResponseDto, 'user'>> {
    try {
      const jwtData = await this.jwtService.verifyAsync<JwtRefreshPayloadType>(
        refreshDto.refreshToken,
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
        },
      );

      const sessionId = jwtData.sessionId;

      const session = await this.redisService.getSession(sessionId);
      if (!session) {
        ExceptionUtil.unauthorized('Session not found or inactive');
      }

      await this.updateSessionLastAccessed(sessionId);

      const { token, refreshToken, tokenExpires } = await this.getTokensData({
        id: session.userId || session.id,
        email: session.email,
        role: session.role,
        sessionId,
      });

      return {
        token,
        refreshToken,
        tokenExpires,
      };
    } catch {
      ExceptionUtil.unauthorized('Invalid refresh token');
    }
  }

  async logout(
    sessionId?: string,
    token?: string,
  ): Promise<{ message: string }> {
    if (sessionId) {
      await this.deactivateSession(sessionId);
    }

    // Blacklist the current token if provided
    if (token) {
      try {
        const decoded: JwtPayloadType = this.jwtService.decode(token);
        if (decoded && typeof decoded.exp === 'number') {
          const expiresAt = new Date(decoded.exp * 1000);
          await this.blacklistToken(token, expiresAt, 'User logout');
        }
      } catch (error) {
        // Log error but don't fail logout
        console.warn('Failed to blacklist token during logout:', error);
      }
    }

    return ResponseUtil.success(null, 'Logged out successfully');
  }
  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.deactivateAllUserSessions(userId);
    return ResponseUtil.success(
      null,
      'Logged out from all devices successfully',
    );
  }

  async blacklistToken(
    token: string,
    expiresAt: Date,
    reason?: string,
  ): Promise<boolean> {
    return await this.redisService.blacklistToken(token, expiresAt, reason);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return await this.redisService.isTokenBlacklisted(token);
  }

  async validateSession(sessionId: string): Promise<SessionData | null> {
    const session = await this.redisService.getSession(sessionId);
    if (!session) {
      return null;
    }

    if (new Date() > session.expiresAt) {
      await this.deactivateSession(sessionId);
      return null;
    }

    await this.updateSessionLastAccessed(sessionId);

    return {
      id: session.id,
      userId: session.userId || session.id,
      email: session.email,
      role: session.role as StaffRole,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isActive: true,
    };
  }

  async createSession(sessionData: CreateSessionData): Promise<SessionData> {
    const sessionId = this.generateSessionId();
    const authConfig = this.configService.getOrThrow('auth', { infer: true });
    const refreshExpires = authConfig.refreshExpires;
    const expiresInMs =
      typeof refreshExpires === 'string' ? ms(refreshExpires) : refreshExpires;
    const expiresAt = new Date(Date.now() + (expiresInMs || 3600000));

    const session: SessionData = {
      id: sessionId,
      userId: sessionData.userId,
      email: sessionData.email,
      role: sessionData.role,
      createdAt: new Date(),
      expiresAt,
      isActive: true,
    };

    const redisSessionData = {
      id: session.id,
      email: session.email,
      role: session.role,
      sessionId: session.id,
      userId: session.userId,
      createdAt: session.createdAt,
      lastAccessedAt: session.createdAt,
      expiresAt: session.expiresAt,
    };

    const ttlSeconds = Math.floor((expiresInMs || 3600000) / 1000);
    await this.redisService.setSession(redisSessionData, ttlSeconds);

    return session;
  }

  async deactivateSession(sessionId: string): Promise<boolean> {
    return await this.redisService.deleteSession(sessionId);
  }

  async deactivateAllUserSessions(userId: string): Promise<void> {
    const redisConfig = this.configService.getOrThrow('redis', { infer: true });
    const pattern = `${redisConfig.keyPrefix}session:*`;

    try {
      // Get all session keys
      const client = this.redisService.getClient();
      const keys = await client.keys(pattern);

      if (keys.length === 0) {
        return;
      }

      // Get all sessions and filter by userId
      const sessions = await Promise.all(
        keys.map(async (key) => {
          const sessionData = await client.get(key);
          if (sessionData) {
            try {
              const session = JSON.parse(sessionData) as {
                userId?: string;
                [key: string]: unknown;
              };
              return { key, session };
            } catch {
              return null;
            }
          }
          return null;
        }),
      );

      // Filter sessions belonging to the user and delete them
      const userSessionKeys = sessions
        .filter((item) => item?.session?.userId === userId)
        .map((item) => item!.key);

      if (userSessionKeys.length > 0) {
        await client.del(userSessionKeys);
      }
    } catch (error) {
      console.error('Error deactivating all user sessions:', error);
      throw error;
    }
  }

  async updateSessionLastAccessed(sessionId: string): Promise<boolean> {
    const session = await this.redisService.getSession(sessionId);
    if (!session) {
      return false;
    }

    session.lastAccessedAt = new Date();

    const authConfig = this.configService.getOrThrow('auth', { infer: true });
    const refreshExpires = authConfig.refreshExpires;
    const expiresInMs =
      typeof refreshExpires === 'string' ? ms(refreshExpires) : refreshExpires;
    const ttlSeconds = Math.floor((expiresInMs || 3600000) / 1000);

    return await this.redisService.setSession(session, ttlSeconds);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getUserActiveSessions(userId: string): Promise<SessionData[]> {
    // TODO: Implement if needed
    return Promise.resolve([]);
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getTokensData(data: {
    id: string;
    email: string;
    role: string;
    sessionId: string;
  }) {
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [token, refreshToken] = await Promise.all([
      await this.jwtService.signAsync(
        {
          id: data.id,
          email: data.email,
          role: data.role,
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      await this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }
}
