import { Logger } from '@nestjs/common';

const logger = new Logger('CacheDecorator');

type CacheClient = {
  getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  invalidatePattern(pattern: string): Promise<void>;
};

type CacheHost = {
  cache?: CacheClient;
  cacheService?: CacheClient;
  redisCache?: CacheClient;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getCacheClient(host: unknown): CacheClient | null {
  if (!isRecord(host)) {
    return null;
  }

  const candidate =
    (host as CacheHost).cache ||
    (host as CacheHost).cacheService ||
    (host as CacheHost).redisCache;

  return candidate ?? null;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

type MethodFn = (...args: unknown[]) => Promise<unknown>;

export function Cacheable(
  keyGenerator: (...args: unknown[]) => string,
  ttl = 300,
) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as MethodFn;

    descriptor.value = async function (...args: unknown[]) {
      const cache = getCacheClient(this);

      if (!cache) {
        logger.warn(
          `Cache service not found in ${(target as { constructor?: { name?: string } }).constructor?.name ?? 'Unknown'}.${propertyKey}, calling method directly`,
        );
        return originalMethod.apply(this, args);
      }

      const cacheKey = keyGenerator(...args);

      try {
        return await cache.getOrSet(
          cacheKey,
          () => originalMethod.apply(this, args),
          ttl,
        );
      } catch (error) {
        logger.error(
          `Cache error in ${(target as { constructor?: { name?: string } }).constructor?.name ?? 'Unknown'}.${propertyKey}: ${errorMessage(error)}`,
        );
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

export function CacheEvict(patterns: string[], beforeInvocation = false) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as MethodFn;

    descriptor.value = async function (...args: unknown[]) {
      const cache = getCacheClient(this);

      if (!cache) {
        return originalMethod.apply(this, args);
      }

      if (beforeInvocation) {
        evictCache(cache, patterns, target, propertyKey);
      }

      const result = await originalMethod.apply(this, args);

      if (!beforeInvocation) {
        evictCache(cache, patterns, target, propertyKey);
      }

      return result;
    };

    return descriptor;
  };
}

export function CachePut(
  keyGenerator: (...args: unknown[]) => string,
  ttl = 300,
) {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as MethodFn;

    descriptor.value = async function (...args: unknown[]) {
      const cache = getCacheClient(this);
      const result = await originalMethod.apply(this, args);

      if (cache) {
        const cacheKey = keyGenerator(...args);
        try {
          await cache.set(cacheKey, result, ttl);
        } catch (error) {
          logger.error(
            `Error updating cache in ${(target as { constructor?: { name?: string } }).constructor?.name ?? 'Unknown'}.${propertyKey}: ${errorMessage(error)}`,
          );
        }
      }

      return result;
    };

    return descriptor;
  };
}

function evictCache(
  cache: CacheClient,
  patterns: string[],
  target: object,
  methodName: string,
): void {
  Promise.all(
    patterns.map((pattern) => cache.invalidatePattern(pattern)),
  ).catch((error: unknown) => {
    logger.error(
      `Error evicting cache in ${(target as { constructor?: { name?: string } }).constructor?.name ?? 'Unknown'}.${methodName}: ${errorMessage(error)}`,
    );
  });
}
