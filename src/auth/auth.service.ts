import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import ms from 'ms';
import { ExceptionUtil, ResponseUtil } from '../common';
import { AllConfigType } from '../config/config.type';
import { StaffAccount } from '../staff-accounts/domain/staff-account';
import { StaffAccountsService } from '../staff-accounts/staff-accounts.service';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRefreshDto } from './dto/auth-refresh.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtRefreshPayloadType } from './interfaces/jwt.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly staffAccountsService: StaffAccountsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AllConfigType>,
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

    const sessionId = this.generateSessionId();
    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: staff.id,
      email: staff.email,
      role: staff.role,
      sessionId,
    });

    // Remove sensitive data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

      // In a real application, you might want to store sessions in Redis or database
      // For now, we'll just generate new tokens with the same session ID
      const { token, refreshToken, tokenExpires } = await this.getTokensData({
        id: '', // This should be retrieved from session storage
        email: '', // This should be retrieved from session storage
        role: '', // This should be retrieved from session storage
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

  logout(): { message: string } {
    // TODO: invalidate the session in Redis or database
    return ResponseUtil.success(null, 'Logged out successfully');
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
