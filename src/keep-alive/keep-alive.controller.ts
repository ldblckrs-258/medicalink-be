import { Controller, Get, Post } from '@nestjs/common';
import { KeepAliveService } from './keep-alive.service';

@Controller('keep-alive')
export class KeepAliveController {
  constructor(private readonly keepAliveService: KeepAliveService) {}

  @Get('status')
  getStatus() {
    return this.keepAliveService.getStatus();
  }

  @Post('trigger')
  async triggerKeepAlive() {
    return this.keepAliveService.triggerKeepAlive();
  }
}
