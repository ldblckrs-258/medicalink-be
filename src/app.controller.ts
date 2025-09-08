import { Controller, Get, Headers, Logger } from '@nestjs/common';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  @Get()
  getHealth(@Headers('x-keep-alive') keepAlive?: string) {
    if (keepAlive && process.env.NODE_ENV !== 'production') {
      this.logger.log(`Keep-alive request received: ${keepAlive}`);
    }

    return {
      service: 'MedicaLink API',
      version: '1.0.0',
    };
  }

  @Get('health')
  getHealthCheck(@Headers('x-keep-alive') keepAlive?: string) {
    if (keepAlive && process.env.NODE_ENV !== 'production') {
      this.logger.log(`Keep-alive health check: ${keepAlive}`);
    }

    return {
      service: 'MedicaLink API',
      database: 'Connected',
      version: '1.0.0',
    };
  }
}
