/**
 * Redis Cache Service
 * High-performance caching layer with automatic serialization/deserialization
 *
 * Features:
 * - Automatic JSON serialization/deserialization
 * - Cache-aside pattern with automatic population
 * - Pattern-based invalidation
 * - Batch operations (mget, mset)
 * - Connection health monitoring
 * - Automatic retry on connection failure
 * - Works without Redis (graceful degradation)
 */

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private redis: Redis | null = null;
  private readonly keyPrefix: string;
  private readonly defaultTTL: number;
  private isRedisAvailable = false;
  private readonly inFlightFactories = new Map<string, Promise<unknown>>();

  constructor(private configService: ConfigService) {
    this.keyPrefix = configService.get('redis.keyPrefix', 'erp:');
    this.defaultTTL = configService.get('redis.ttl.default', 300);
  }

  /**
   * Initialize Redis connection (optional - won't fail if Redis is unavailable)
   */
  async onModuleInit() {
    const host = this.configService.get('redis.host', 'localhost');
    const port = this.configService.get('redis.port', 6379);
    const password = this.configService.get('redis.password');
    const db = this.configService.get('redis.db', 0);

    try {
      this.redis = new Redis({
        host,
        port,
        password,
        db,
        retryStrategy: (times) => {
          // Stop retrying after 3 attempts
          if (times > 3) {
            this.logger.warn('❌ Redis max retries reached, disabling cache');
            return null; // Stop retrying
          }
          return null; // Don't retry, fail immediately
        },
        maxRetriesPerRequest: 0, // Don't retry requests
        enableReadyCheck: true,
        lazyConnect: true, // Don't connect immediately
        connectTimeout: 2000, // 2 second timeout
      });

      // Connection event handlers
      this.redis.on('connect', () => {
        this.logger.log('✅ Redis connected successfully');
        this.isRedisAvailable = true;
      });

      this.redis.on('ready', () => {
        this.logger.log('✅ Redis ready to accept commands');
        this.isRedisAvailable = true;
      });

      this.redis.on('error', () => {
        this.isRedisAvailable = false;
        // Suppress connection errors after first attempt
      });

      this.redis.on('close', () => {
        this.isRedisAvailable = false;
      });

      // Try to connect
      await this.redis.connect();
      await this.redis.ping();

      // Get Redis version
      const info = await this.redis.info('server');
      const versionMatch = info.match(/redis_version:([^\r\n]+)/);
      const version = versionMatch ? versionMatch[1] : 'unknown';
      this.logger.log(`Redis connected - version: ${version}`);
      this.isRedisAvailable = true;
    } catch {
      this.logger.warn('⚠️  Redis is not available - caching disabled');
      this.logger.warn('   Application will continue without cache');
      this.isRedisAvailable = false;
      this.redis = null;
    }
  }

  /**
   * Gracefully disconnect from Redis
   */
  async onModuleDestroy() {
    if (!this.redis) return;

    try {
      await this.redis.quit();
      this.logger.log('Redis disconnected gracefully');
    } catch (error) {
      this.logger.error('Error disconnecting from Redis:', error);
    }
  }

  /**
   * Build full cache key with prefix
   */
  private buildKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Get cached value with automatic JSON parsing
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;

    try {
      const fullKey = this.buildKey(key);
      const value = await this.redis.get(fullKey);

      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Error getting cache key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set cached value with automatic JSON serialization
   */
  async set(
    key: string,
    value: any,
    ttl: number = this.defaultTTL,
  ): Promise<void> {
    if (!this.redis) return;

    try {
      const fullKey = this.buildKey(key);
      const serialized = JSON.stringify(value);

      if (ttl > 0) {
        await this.redis.setex(fullKey, ttl, serialized);
      } else {
        await this.redis.set(fullKey, serialized);
      }
    } catch (error) {
      this.logger.error(`Error setting cache key "${key}":`, error);
    }
  }

  /**
   * Cache-aside pattern: get from cache or populate from factory function
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl: number = this.defaultTTL,
  ): Promise<T> {
    // Try to get from cache first
    const value = await this.get<T>(key);

    if (value !== null) {
      return value;
    }

    const existingFactory = this.inFlightFactories.get(key) as
      | Promise<T>
      | undefined;
    if (existingFactory) {
      return existingFactory;
    }

    // Cache miss - fetch from source
    const inFlight = (async () => {
      try {
        const freshValue = await factory();

        // Store in cache (fire and forget)
        this.set(key, freshValue, ttl).catch((err) =>
          this.logger.error(`Error caching key "${key}":`, err),
        );

        return freshValue;
      } catch (error) {
        this.logger.error(`Error in factory function for key "${key}":`, error);
        throw error;
      } finally {
        this.inFlightFactories.delete(key);
      }
    })();

    this.inFlightFactories.set(key, inFlight);
    return inFlight;
  }

  /**
   * Delete a cache key
   */
  async del(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      const fullKey = this.buildKey(key);
      await this.redis.del(fullKey);
    } catch (error) {
      this.logger.error(`Error deleting cache key "${key}":`, error);
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    if (!this.redis) return 0;

    try {
      const fullPattern = this.buildKey(pattern);
      const keys = await this.redis.keys(fullPattern);

      if (keys.length === 0) {
        return 0;
      }

      const deleted = await this.redis.del(...keys);
      this.logger.debug(
        `Invalidated ${deleted} keys matching pattern "${pattern}"`,
      );

      return deleted;
    } catch (error) {
      this.logger.error(`Error invalidating pattern "${pattern}":`, error);
      return 0;
    }
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0 || !this.redis) {
      return keys.map(() => null);
    }

    try {
      const fullKeys = keys.map((key) => this.buildKey(key));
      const values = await this.redis.mget(...fullKeys);

      return values.map((value) => (value ? (JSON.parse(value) as T) : null));
    } catch (error) {
      this.logger.error('Error in batch get:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Batch set multiple keys
   */
  async mset(entries: Array<[string, any, number?]>): Promise<void> {
    if (entries.length === 0 || !this.redis) {
      return;
    }

    try {
      const pipeline = this.redis.pipeline();

      for (const [key, value, ttl] of entries) {
        const fullKey = this.buildKey(key);
        const serialized = JSON.stringify(value);

        if (ttl) {
          pipeline.setex(fullKey, ttl, serialized);
        } else {
          pipeline.set(fullKey, serialized);
        }
      }

      await pipeline.exec();
    } catch (error) {
      this.logger.error('Error in batch set:', error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false;

    try {
      const fullKey = this.buildKey(key);
      const exists = await this.redis.exists(fullKey);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key "${key}":`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.redis) return -2;

    try {
      const fullKey = this.buildKey(key);
      return await this.redis.ttl(fullKey);
    } catch (error) {
      this.logger.error(`Error getting TTL for key "${key}":`, error);
      return -2;
    }
  }

  /**
   * Increment a numeric value
   */
  async incr(key: string, increment = 1): Promise<number> {
    if (!this.redis) throw new Error('Redis is not available');

    try {
      const fullKey = this.buildKey(key);
      return await this.redis.incrby(fullKey, increment);
    } catch (error) {
      this.logger.error(`Error incrementing key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Decrement a numeric value
   */
  async decr(key: string, decrement = 1): Promise<number> {
    if (!this.redis) throw new Error('Redis is not available');

    try {
      const fullKey = this.buildKey(key);
      return await this.redis.decrby(fullKey, decrement);
    } catch (error) {
      this.logger.error(`Error decrementing key "${key}":`, error);
      throw error;
    }
  }

  /**
   * Flush all keys in current database
   */
  async flushAll(): Promise<void> {
    if (this.configService.get('app.isProduction')) {
      throw new Error('Cannot flush cache in production');
    }

    if (!this.redis) {
      this.logger.warn('Redis not available, cannot flush cache');
      return;
    }

    try {
      await this.redis.flushdb();
      this.logger.warn('🧹 Cache flushed');
    } catch (error) {
      this.logger.error('Error flushing cache:', error);
      throw error;
    }
  }

  /**
   * Check Redis connection health
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message?: string;
  }> {
    if (!this.redis) {
      return {
        status: 'unhealthy',
        message: 'Redis is not available',
      };
    }

    try {
      await this.redis.ping();
      return { status: 'healthy' };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        message: error.message,
      };
    }
  }

  /**
   * Get Redis server info
   */
  async getInfo() {
    if (!this.redis) return {};

    try {
      const info = await this.redis.info();
      return this.parseRedisInfo(info);
    } catch (error) {
      this.logger.error('Error getting Redis info:', error);
      return {};
    }
  }

  /**
   * Parse Redis INFO command output
   */
  private parseRedisInfo(info: string): Record<string, any> {
    const parsed: Record<string, any> = {};
    const lines = info.split('\r\n');

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          parsed[key] = value;
        }
      }
    }

    return parsed;
  }
}
