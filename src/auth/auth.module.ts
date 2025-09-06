import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AllConfigType } from '../config/config.type';
import { StaffAccountsModule } from '../staff-accounts/staff-accounts.module';
import { AuthProtectedController } from './auth-protected.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    forwardRef(() => StaffAccountsModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        secret: configService.getOrThrow('auth.secret', { infer: true }),
        signOptions: {
          expiresIn: configService.getOrThrow('auth.expires', { infer: true }),
        },
      }),
    }),
  ],
  controllers: [AuthController, AuthProtectedController],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtAuthGuard, RolesGuard, JwtModule],
})
export class AuthModule {}
