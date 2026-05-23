/**
 * Application Bootstrap
 * Entry point for the ERP system backend
 */

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { createValidationPipe } from './shared/pipes/validation.pipe';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';
import { WinstonLoggerService } from './infrastructure/logger/winston-logger.service';
import { requestIdMiddleware } from './shared/middleware/request-id.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Nest + watch tooling can register many process-level listeners in dev mode.
  // Use a higher cap to prevent noisy warnings without muting real runtime errors.
  process.setMaxListeners(100);

  // Create application instance with reduced logging
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: false,
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const winstonLogger = app.get(WinstonLoggerService);

  // Use unified logger backend (console + rotated files in production)
  app.useLogger(winstonLogger);
  app.flushLogs();

  // Correlation ID for tracing requests across logs
  app.use(requestIdMiddleware);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable for API — frontend handles CSP
      crossOriginEmbedderPolicy: false, // Allow cross-origin resource loading
      crossOriginResourcePolicy: false, // Allow images/files to load cross-origin
    }),
  );

  // Serve uploaded files (profile pictures, documents) as static assets
  // Path: /uploads/** → ./uploads/ on disk
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  // Get configuration
  const port = configService.get<number>('app.port', 3000);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  const corsEnabled = configService.get<boolean>('app.cors.enabled', true);
  const corsOrigins = configService.get<string[]>('app.cors.origins', [
    'http://localhost:3000',
  ]);

  // Set global prefix
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  if (corsEnabled) {
    app.enableCors({
      origin: corsOrigins,
      credentials: configService.get<boolean>('app.cors.credentials', true),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    });
    logger.log(`CORS enabled for origins: ${corsOrigins.join(', ')}`);
  }

  // Apply global validation pipe
  app.useGlobalPipes(createValidationPipe());

  // Enable graceful shutdown
  app.enableShutdownHooks();

  // Start server
  await app.listen(port, '0.0.0.0');

  logger.log(
    `🚀 Application is running on: http://localhost:${port}/${apiPrefix}`,
  );
  logger.log(
    `📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs`,
  );
  logger.log(`🏥 Health Check: http://localhost:${port}/${apiPrefix}/health`);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
