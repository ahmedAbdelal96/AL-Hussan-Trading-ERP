/**
 * Configuration Module
 * Centralized configuration management with validation
 *
 * Features:
 * - Environment variable validation
 * - Type-safe configuration access
 * - Modular configuration files
 * - Fail-fast on missing required config
 */

import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validate } from './env.validation';
import appConfig from './app.config';
import databaseConfig from './database.config';
import redisConfig from './redis.config';
import jwtConfig from './jwt.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validate,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig],
      envFilePath: ['.env.local', '.env'],
    }),
  ],
})
export class ConfigurationModule {}
