import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StaffAccountRepositoryImpl } from './repositories';
import { StaffAccountProtectedController } from './staff-accounts-protected.controller';
import { StaffAccountsService } from './staff-accounts.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [StaffAccountProtectedController],
  providers: [
    StaffAccountsService,
    {
      provide: 'StaffAccountRepository',
      useClass: StaffAccountRepositoryImpl,
    },
  ],
  exports: [StaffAccountsService, 'StaffAccountRepository'],
})
export class StaffAccountsModule {}
