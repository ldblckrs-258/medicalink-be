import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status', () => {
    const result = controller.getHealth();
    expect(result).toHaveProperty('service');
    expect(result).toHaveProperty('version');
  });

  it('should return health check', () => {
    const result = controller.getHealthCheck();
    expect(result).toHaveProperty('service');
    expect(result).toHaveProperty('database');
    expect(result).toHaveProperty('version');
  });
});
