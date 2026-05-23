/**
 * Global HTTP Exception Filter
 * Centralized error handling for all HTTP exceptions
 *
 * Features:
 * - Standardized error response format
 * - Automatic error logging
 * - Error sanitization (no sensitive data exposure)
 * - Request ID tracking
 * - Different error details for dev vs production
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { WinstonLoggerService } from '../../infrastructure/logger/winston-logger.service';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  requestId?: string;
  stack?: string;
  details?: any;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly isDevelopment: boolean;

  constructor(
    private configService: ConfigService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.isDevelopment = configService.get('app.isDevelopment', false);
    this.logger.setContext(HttpExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, error, details, stack } =
      this.parseException(exception);

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      requestId: (request as any).id, // From request ID middleware
    };

    // Include validation errors if present
    if (details) {
      errorResponse.details = details;
    }

    // Include additional details in development
    if (this.isDevelopment) {
      if (stack) {
        errorResponse.stack = stack;
      }
    }

    // Log the error
    this.logError(exception, request, status);

    // Send response
    response.status(status).json(errorResponse);
  }

  /**
   * Parse exception and extract relevant information
   */
  private parseException(exception: unknown): {
    status: number;
    message: string | string[];
    error: string;
    details?: any;
    stack?: string;
  } {
    // HTTP Exception
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return {
          status,
          message: exceptionResponse,
          error: exception.name,
          stack: exception.stack,
        };
      }

      const responseObj = exceptionResponse as any;
      const rawMessage =
        responseObj.message || responseObj.error || 'An error occurred';
      const uniqueField = this.extractUniqueFieldFromText(
        typeof rawMessage === 'string' ? rawMessage : '',
      );

      // Normalize leaked Prisma unique-constraint messages into safe, structured conflicts.
      if (
        status === HttpStatus.CONFLICT &&
        typeof rawMessage === 'string' &&
        rawMessage.includes('Unique constraint failed on the fields')
      ) {
        return {
          status,
          message: 'A record with this value already exists',
          error: 'UniqueConstraintViolation',
          details: uniqueField ? { field: uniqueField } : undefined,
          stack: exception.stack,
        };
      }

      return {
        status,
        message: rawMessage,
        error: responseObj.error || exception.name,
        details: responseObj.errors || responseObj.details, // Include validation errors
        stack: exception.stack,
      };
    }

    // Prisma Errors
    if (this.isPrismaError(exception)) {
      return this.parsePrismaError(exception as any);
    }

    // Unknown errors
    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: this.isDevelopment
          ? exception.message
          : 'An unexpected error occurred',
        error: exception.name,
        stack: exception.stack,
      };
    }

    // Fallback for non-Error objects
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
      error: 'InternalServerError',
    };
  }

  /**
   * Check if error is a Prisma error
   */
  private isPrismaError(exception: unknown): boolean {
    return (
      exception instanceof Error &&
      (exception.constructor.name.includes('Prisma') ||
        (exception as any).code?.startsWith('P'))
    );
  }

  /**
   * Parse Prisma-specific errors into user-friendly messages
   */
  private parsePrismaError(error: any): {
    status: number;
    message: string;
    error: string;
    details?: any;
    stack?: string;
  } {
    const code = error.code;

    switch (code) {
      case 'P2002': {
        const uniqueField = this.extractUniqueField(error);
        return {
          status: HttpStatus.CONFLICT,
          message: 'A record with this value already exists',
          error: 'UniqueConstraintViolation',
          details: {
            ...(this.isDevelopment ? { meta: error.meta } : {}),
            ...(uniqueField ? { field: uniqueField } : {}),
          },
          stack: error.stack,
        };
      }

      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'NotFoundError',
          details: this.isDevelopment ? error.meta : undefined,
          stack: error.stack,
        };

      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Foreign key constraint violation',
          error: 'ForeignKeyConstraintViolation',
          details: this.isDevelopment ? error.meta : undefined,
          stack: error.stack,
        };

      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid relationship data',
          error: 'RelationViolation',
          details: this.isDevelopment ? error.meta : undefined,
          stack: error.stack,
        };

      case 'P2034':
        return {
          status: HttpStatus.CONFLICT,
          message: 'Transaction conflict detected, please retry',
          error: 'TransactionConflict',
          stack: error.stack,
        };

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: this.isDevelopment
            ? error.message
            : 'A database error occurred',
          error: 'DatabaseError',
          details: this.isDevelopment ? { code, meta: error.meta } : undefined,
          stack: error.stack,
        };
    }
  }

  /**
   * Log error with appropriate level
   */
  private logError(exception: unknown, request: Request, status: number) {
    const errorMessage =
      exception instanceof Error ? exception.message : 'Unknown error';
    const errorStack = exception instanceof Error ? exception.stack : undefined;

    const logContext = {
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.get('user-agent'),
      requestId: (request as any).id,
      userId: (request as any).user?.id,
    };

    // Log as error if 5xx, warn if 4xx
    if (status >= 500) {
      this.logger.logWithMeta(
        `[${status}] ${errorMessage}`,
        {
          ...logContext,
          trace: errorStack,
        },
        'error',
      );
    } else if (status >= 400) {
      this.logger.logWithMeta(
        `[${status}] ${errorMessage}`,
        logContext,
        'warn',
      );
    }
  }

  private extractUniqueField(error: any): string | undefined {
    const target = error?.meta?.target;

    if (Array.isArray(target) && target.length > 0) {
      return String(target[0]);
    }

    if (typeof target === 'string' && target.trim().length > 0) {
      return target;
    }

    return this.extractUniqueFieldFromText(String(error?.message || ''));
  }

  private extractUniqueFieldFromText(message: string): string | undefined {
    // Example: Unique constraint failed on the fields: (`email`)
    const match = message.match(/\(`([^`]+)`\)/);
    return match?.[1];
  }
}
