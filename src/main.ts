import {
  ClassSerializerInterceptor,
  ConsoleLogger,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';

import { useContainer } from 'class-validator';
import 'dotenv/config';
import { AppModule } from './app.module';
import { AllConfigType } from './config/config.type';
import { ResolvePromisesInterceptor } from './utils/serializer.interceptor';
import validationOptions from './utils/validation-options';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: new ConsoleLogger({
      prefix: 'Medicalink',
      colors: true,
      timestamp: true,
      maxArrayLength: 10,
      maxStringLength: 1000,
      depth: 7,
    }),
  });
  const logger = new Logger('Bootstrap');
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService<AllConfigType>);

  app.enableShutdownHooks();
  app.setGlobalPrefix(
    configService.getOrThrow('app.apiPrefix', { infer: true }),
    {
      exclude: ['/'],
    },
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe(validationOptions));
  app.useGlobalInterceptors(
    new ResolvePromisesInterceptor(),
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  const port = configService.get('app.port', { infer: true }) || 3000;
  const backendDomain = configService.get('app.backendDomain', { infer: true });

  await app.listen(port);
  logger.log(`Application is running on: ${backendDomain}`);
}
void bootstrap();
