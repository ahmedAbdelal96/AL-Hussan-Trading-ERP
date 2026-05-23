/**
 * Redis Configuration
 * Handles cache connection settings with retry strategy
 */

import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),

  // Connection settings
  retryStrategy: {
    maxRetriesPerRequest: 3,
    retryDelayMs: 50,
    maxRetryDelayMs: 2000,
  },

  // Default TTL settings (in seconds)
  ttl: {
    default: parseInt(process.env.REDIS_DEFAULT_TTL || '300', 10), // 5 minutes
    short: parseInt(process.env.REDIS_SHORT_TTL || '60', 10), // 1 minute
    medium: parseInt(process.env.REDIS_MEDIUM_TTL || '600', 10), // 10 minutes
    long: parseInt(process.env.REDIS_LONG_TTL || '3600', 10), // 1 hour
  },

  // Key prefixes for organization
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'erp:',
}));
