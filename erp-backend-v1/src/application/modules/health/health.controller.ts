import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { RedisCacheService } from '../../../infrastructure/cache/redis-cache.service';
import { Public } from '../../common/decorators/public.decorator';

type DependencyStatus = 'healthy' | 'unhealthy';

interface DependencyCheckResult {
  status: DependencyStatus;
  error?: string;
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisCacheService: RedisCacheService,
  ) {}

  @Get('live')
  @Public()
  @HttpCode(HttpStatus.OK)
  getLiveness() {
    return {
      status: 'ok',
      service: 'erp-backend-v1',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  @Get()
  @Public()
  async getReadiness() {
    const [database, cache] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
    ]);

    const isReady = database.status === 'healthy' && cache.status === 'healthy';
    const responseBody = {
      status: isReady ? 'ready' : 'not_ready',
      service: 'erp-backend-v1',
      timestamp: new Date().toISOString(),
      dependencies: {
        database,
        cache,
      },
      uptimeSeconds: Math.floor(process.uptime()),
    };

    if (!isReady) {
      throw new ServiceUnavailableException(responseBody);
    }

    return responseBody;
  }

  private async checkDatabase(): Promise<DependencyCheckResult> {
    const dbHealth = await this.prismaService.healthCheck();
    return dbHealth.status === 'healthy'
      ? { status: 'healthy' }
      : { status: 'unhealthy', error: dbHealth.message ?? 'Unknown error' };
  }

  private async checkCache(): Promise<DependencyCheckResult> {
    const cacheHealth = await this.redisCacheService.healthCheck();
    return cacheHealth.status === 'healthy'
      ? { status: 'healthy' }
      : { status: 'unhealthy', error: cacheHealth.message ?? 'Unknown error' };
  }
}
