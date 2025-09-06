import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HeaderResolver, I18nModule } from 'nestjs-i18n';
import path from 'path';
import { PrismaModule } from 'prisma/prisma.module';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import authConfig from './auth/config/auth.config';
import { CommonModule } from './common/common.module';
import appConfig from './config/app.config';
import { AllConfigType } from './config/config.type';
import { StaffAccountsModule } from './staff-accounts/staff-accounts.module';
import { MorganMiddleware } from './utils/morgan.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    I18nModule.forRootAsync({
      useFactory: (configService: ConfigService<AllConfigType>) => ({
        fallbackLanguage: configService.getOrThrow('app.fallbackLanguage', {
          infer: true,
        }),
        loaderOptions: {
          path: path.join(process.cwd(), 'src/i18n/'),
          watch: true,
        },
      }),
      resolvers: [
        {
          use: HeaderResolver,
          useFactory: (
            configService: ConfigService<AllConfigType>,
          ): string[] => [
            configService.getOrThrow<string>('app.headerLanguage', {
              infer: true,
            }),
          ],
          inject: [ConfigService],
        },
      ],
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
    CommonModule,
    PrismaModule,
    AuthModule,
    StaffAccountsModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(MorganMiddleware).forRoutes('*');
  }
}
