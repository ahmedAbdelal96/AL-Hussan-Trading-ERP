/**
 * Application Configuration
 * General application settings
 */

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  // Application info
  name: process.env.APP_NAME || 'ERP System',
  version: process.env.APP_VERSION || '1.0.0',
  description:
    process.env.APP_DESCRIPTION || 'Enterprise Resource Planning System',

  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Server settings
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  // CORS settings
  cors: {
    enabled: process.env.CORS_ENABLED === 'true',
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },

  // Rate limiting
  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10), // seconds
    limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10), // requests
  },

  // File upload settings
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'application/pdf',
    ],
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },

  // Logging settings
  logLevel:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  logsDir: process.env.LOGS_DIR || './logs',
  enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true',
  prettyConsoleLogs:
    process.env.PRETTY_CONSOLE_LOGS === 'true' ||
    process.env.NODE_ENV !== 'production',

  // Auth settings
  auth: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  },
}));
