import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StaffAccountsProtectedController } from './staff-accounts-protected.controller';
import { StaffAccountsController } from './staff-accounts.controller';
import { StaffAccountsService } from './staff-accounts.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [StaffAccountsController, StaffAccountsProtectedController],
  providers: [StaffAccountsService],
  exports: [StaffAccountsService],
})
export class StaffAccountsModule {}
