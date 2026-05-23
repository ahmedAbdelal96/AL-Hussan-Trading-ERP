/**
 * Cache Module
 * Global module that provides Redis cache service to the entire application
 */

import { Global, Module } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';

@Global()
@Module({
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class CacheModule {}
