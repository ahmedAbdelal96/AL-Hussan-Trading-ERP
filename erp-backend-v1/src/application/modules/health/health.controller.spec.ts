import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'http';
import { HealthController } from './health.controller';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { RedisCacheService } from '../../../infrastructure/cache/redis-cache.service';

describe('HealthController', () => {
  let app: INestApplication;
  let httpServer: Server;

  const prismaMock = {
    healthCheck: jest.fn(),
  };

  const redisMock = {
    healthCheck: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisCacheService, useValue: redisMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health/live should return 200', async () => {
    await request(httpServer)
      .get('/health/live')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('GET /health should return ready when dependencies are healthy', async () => {
    prismaMock.healthCheck.mockResolvedValue({ status: 'healthy' });
    redisMock.healthCheck.mockResolvedValue({ status: 'healthy' });

    await request(httpServer)
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ready');
        expect(res.body.dependencies.database.status).toBe('healthy');
        expect(res.body.dependencies.cache.status).toBe('healthy');
      });
  });

  it('GET /health should return 503 when a dependency is unhealthy', async () => {
    prismaMock.healthCheck.mockResolvedValue({
      status: 'unhealthy',
      message: 'db down',
    });
    redisMock.healthCheck.mockResolvedValue({ status: 'healthy' });

    await request(httpServer)
      .get('/health')
      .expect(503)
      .expect((res) => {
        const status =
          (res.body?.status as string | undefined) ??
          (res.body?.message?.status as string | undefined);
        expect(status).toBe('not_ready');
      });
  });
});
