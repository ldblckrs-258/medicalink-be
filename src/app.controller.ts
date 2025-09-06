import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'MedicaLink API',
      version: '1.0.0',
    };
  }

  @Get('health')
  getHealthCheck() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'MedicaLink API',
      database: 'Connected',
      version: '1.0.0',
    };
  }
}
