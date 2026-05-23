/**
 * Environment Variables Validation Schema
 * Validates and type-checks all environment variables at application startup
 *
 * Benefits:
 * - Fail fast if required config is missing
 * - Type safety for environment variables
 * - Automatic type coercion
 * - Clear validation error messages
 */

import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
  Max,
  validateSync,
} from 'class-validator';
import { plainToInstance, Transform } from 'class-transformer';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

const toInteger = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
};

const toBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  return fallback;
};

export class EnvironmentVariables {
  // Application
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsString()
  @IsOptional()
  APP_NAME: string = 'ERP System';

  @IsNumber()
  @IsOptional()
  @Min(1000)
  @Max(65535)
  @Transform(({ value }) => toInteger(value, 3000))
  PORT: number = 3000;

  @IsString()
  @IsOptional()
  API_PREFIX: string = 'api/v1';

  // Database
  @IsString()
  DATABASE_URL: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => toInteger(value, 2))
  DB_POOL_MIN: number = 2;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => toInteger(value, 10))
  DB_POOL_MAX: number = 10;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value, false))
  DB_LOGGING: boolean = false;

  @IsNumber()
  @IsOptional()
  @Min(10)
  @Transform(({ value }) => toInteger(value, 100))
  DB_SLOW_QUERY_THRESHOLD: number = 100;

  // Redis
  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(65535)
  @Transform(({ value }) => toInteger(value, 6379))
  REDIS_PORT: number = 6379;

  @IsString()
  @IsOptional()
  REDIS_PASSWORD?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(15)
  @Transform(({ value }) => toInteger(value, 0))
  REDIS_DB: number = 0;

  @IsString()
  @IsOptional()
  REDIS_KEY_PREFIX: string = 'erp:';

  @IsNumber()
  @IsOptional()
  @Min(60)
  @Transform(({ value }) => toInteger(value, 300))
  REDIS_TTL_DEFAULT: number = 300;

  @IsNumber()
  @IsOptional()
  @Min(10)
  @Transform(({ value }) => toInteger(value, 60))
  REDIS_TTL_SHORT: number = 60;

  @IsNumber()
  @IsOptional()
  @Min(300)
  @Transform(({ value }) => toInteger(value, 600))
  REDIS_TTL_MEDIUM: number = 600;

  @IsNumber()
  @IsOptional()
  @Min(600)
  @Transform(({ value }) => toInteger(value, 1800))
  REDIS_TTL_LONG: number = 1800;

  // JWT
  @IsString()
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRES_IN: string = '15m';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  // JWT - Banking Model: Different expiry based on Remember Me
  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN_WITH_REMEMBER: string = '7d';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRES_IN_WITHOUT_REMEMBER: string = '24h';

  // CORS
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value, true))
  CORS_ENABLED: boolean = true;

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value, true))
  CORS_CREDENTIALS: boolean = true;

  // Rate Limiting
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => toInteger(value, 60))
  RATE_LIMIT_TTL: number = 60;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Transform(({ value }) => toInteger(value, 100))
  RATE_LIMIT_LIMIT: number = 100;

  // Logging
  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'info';

  @IsString()
  @IsOptional()
  LOGS_DIR: string = './logs';

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value, false))
  ENABLE_FILE_LOGGING: boolean = false;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => toBoolean(value, true))
  PRETTY_CONSOLE_LOGS: boolean = true;

  // File Upload
  @IsNumber()
  @IsOptional()
  @Min(1024)
  @Max(52428800) // 50MB max
  @Transform(({ value }) => toInteger(value, 10485760))
  MAX_FILE_SIZE: number = 10485760; // 10MB

  @IsString()
  @IsOptional()
  ALLOWED_FILE_TYPES?: string;

  @IsString()
  @IsOptional()
  UPLOAD_DIR: string = './uploads';
}

/**
 * Validation function to be used in ConfigModule
 */
export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const validationErrors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
  });

  if (validationErrors.length > 0) {
    const formattedErrors = validationErrors
      .map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints).join(', ')
          : 'unknown error';
        return `  - ${error.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${formattedErrors}`);
  }

  return validatedConfig;
}
