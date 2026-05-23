/**
 * Database Configuration
 * Handles database connection settings with validation
 */

import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  url: process.env.DATABASE_URL,

  // Connection pool settings for optimal performance
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    connectionTimeoutMillis: parseInt(
      process.env.DB_CONNECT_TIMEOUT || '5000',
      10,
    ),
  },

  // Query logging settings
  logging: {
    enabled: process.env.DB_LOGGING === 'true',
    slowQueryThreshold: parseInt(
      process.env.DB_SLOW_QUERY_THRESHOLD || '100',
      10,
    ), // ms
  },
}));
