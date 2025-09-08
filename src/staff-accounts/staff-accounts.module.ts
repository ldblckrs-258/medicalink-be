import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StaffAccountProtectedController } from './staff-accounts-protected.controller';
import { StaffAccountsService } from './staff-accounts.service';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule)],
  controllers: [StaffAccountProtectedController],
  providers: [StaffAccountsService],
  exports: [StaffAccountsService],
})
export class StaffAccountsModule {}
