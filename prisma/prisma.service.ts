import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma Client Connected');
  }

  enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', () => {
      (async () => {
        await app.close();
      })().catch((e) => {
        this.logger.error('Error during app shutdown', e);
      });
    });
  }
}
