import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { KeepAliveController } from './keep-alive.controller';
import { KeepAliveService } from './keep-alive.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [KeepAliveController],
  providers: [KeepAliveService],
  exports: [KeepAliveService],
})
export class KeepAliveModule {}
