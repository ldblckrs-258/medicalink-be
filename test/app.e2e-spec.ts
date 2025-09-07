/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ApiResponseDto } from '../src/common/dto/api-response.dto';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  // Helper function to validate ApiResponseDto structure
  const validateApiResponse = <T>(
    body: any,
    expectedPath: string,
    expectedMessage = 'Data retrieved successfully',
    expectedStatusCode = 200,
  ): ApiResponseDto<T> => {
    expect(body).toHaveProperty('statusCode', expectedStatusCode);
    expect(body).toHaveProperty('message', expectedMessage);
    expect(body).toHaveProperty('path', expectedPath);
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('timestamp');
    expect(typeof body.timestamp).toBe('string');

    return body as ApiResponseDto<T>;
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should return service info on GET /', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        const response = validateApiResponse<{
          service: string;
          version: string;
        }>(res.body, '/');

        expect(response.data).toHaveProperty('service', 'MedicaLink API');
        expect(response.data).toHaveProperty('version', '1.0.0');
      });
  });

  it('should return health check on GET /health', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        const response = validateApiResponse<{
          service: string;
          version: string;
          database: string;
        }>(res.body, '/health');

        expect(response.data).toHaveProperty('service', 'MedicaLink API');
        expect(response.data).toHaveProperty('database', 'Connected');
        expect(response.data).toHaveProperty('version', '1.0.0');
      });
  });
});
