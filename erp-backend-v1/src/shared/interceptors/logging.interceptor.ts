/**
 * Logging Interceptor
 * Logs HTTP requests and responses in compact format
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { WinstonLoggerService } from '../../infrastructure/logger/winston-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: WinstonLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;

          this.logger.logWithMeta('HTTP Request completed', {
            method,
            url,
            statusCode,
            responseTimeMs: responseTime,
            requestId: (request as Request & { id?: string }).id ?? 'UNKNOWN',
            userId: (request as Request & { user?: { id?: string } }).user?.id,
          });
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.logWithMeta(
            'HTTP Request failed',
            {
              method,
              url,
              statusCode,
              responseTimeMs: responseTime,
              requestId: (request as Request & { id?: string }).id ?? 'UNKNOWN',
              userId: (request as Request & { user?: { id?: string } }).user
                ?.id,
              errorMessage: error?.message ?? 'Unknown error',
            },
            statusCode >= 500 ? 'error' : 'warn',
          );
        },
      }),
    );
  }
}
