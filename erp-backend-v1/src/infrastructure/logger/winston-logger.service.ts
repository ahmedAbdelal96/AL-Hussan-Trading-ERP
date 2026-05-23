/**
 * Winston Logger Service
 * Production-ready logging service with file rotation and structured logging.
 */

import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';

interface LogEntry {
  level: string;
  message: string;
  context?: string;
  timestamp: string;
  trace?: string;
  [key: string]: unknown;
}

interface RequestLike {
  method?: string;
  url?: string;
  ip?: string;
  id?: string;
  get?: (name: string) => string | undefined;
}

interface ResponseLike {
  statusCode?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toStringValue = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return '[Unserializable]';
  }
};

@Injectable()
export class WinstonLoggerService implements LoggerService {
  private logger: winston.Logger;
  private context?: string;
  private readonly isDevelopment: boolean;
  private readonly isProduction: boolean;

  private readonly sensitiveFields = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'authorization',
    'creditCard',
    'ssn',
    'nationalId',
  ];

  constructor(private configService: ConfigService) {
    this.isDevelopment = configService.get<boolean>('app.isDevelopment', false);
    this.isProduction = configService.get<boolean>('app.isProduction', false);

    this.logger = this.createLogger();
  }

  setContext(context: string): void {
    this.context = context;
  }

  private createLogger(): winston.Logger {
    const logLevel = this.configService.get<string>('app.logLevel', 'info');
    const logsDir = this.configService.get<string>('app.logsDir', 'logs');
    const prettyConsoleLogs = this.configService.get<boolean>(
      'app.prettyConsoleLogs',
      this.isDevelopment,
    );

    const devFormat = winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.colorize({ all: true }),
      winston.format.printf(
        ({ timestamp, level, message, context, ...meta }) => {
          const contextValue =
            typeof context === 'string' && context.trim().length > 0
              ? `[${context}]`
              : '';

          const hasMeta = Object.keys(meta).some((key) => key !== 'timestamp');
          const metaString = hasMeta ? ` ${toStringValue(meta)}` : '';

          return `${toStringValue(timestamp)} ${toStringValue(level)} ${contextValue} ${toStringValue(message)}${metaString}`;
        },
      ),
    );

    const prodFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: prettyConsoleLogs ? devFormat : prodFormat,
      }),
    ];

    if (
      this.isProduction ||
      this.configService.get<boolean>('app.enableFileLogging', false)
    ) {
      transports.push(
        new DailyRotateFile({
          dirname: logsDir,
          filename: 'application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: prodFormat,
        }),
      );

      transports.push(
        new DailyRotateFile({
          level: 'error',
          dirname: path.join(logsDir, 'errors'),
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          format: prodFormat,
        }),
      );
    }

    return winston.createLogger({
      level: logLevel,
      transports,
      exitOnError: false,
      exceptionHandlers: this.isProduction
        ? [
            new DailyRotateFile({
              dirname: path.join(logsDir, 'exceptions'),
              filename: 'exceptions-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '30d',
            }),
          ]
        : [],
      rejectionHandlers: this.isProduction
        ? [
            new DailyRotateFile({
              dirname: path.join(logsDir, 'rejections'),
              filename: 'rejections-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '30d',
            }),
          ]
        : [],
    });
  }

  private toErrorTrace(error: unknown): string {
    return error instanceof Error
      ? (error.stack ?? error.message)
      : toStringValue(error);
  }

  private sanitize(obj: unknown): unknown {
    if (!isRecord(obj) && !Array.isArray(obj)) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item));
    }

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = this.sensitiveFields.some((field) =>
        lowerKey.includes(field.toLowerCase()),
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (isRecord(value) || Array.isArray(value)) {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private logMessage(
    level: string,
    message: unknown,
    meta?: Record<string, unknown>,
  ): void {
    const sanitizedMeta = this.sanitize(meta);
    const metaObject = isRecord(sanitizedMeta) ? sanitizedMeta : {};

    const payload: LogEntry = {
      level,
      message: toStringValue(message),
      context: this.context,
      timestamp: new Date().toISOString(),
      ...metaObject,
    };

    this.logger.log(payload);
  }

  log(message: unknown, context?: string): void {
    this.logger.info(toStringValue(message), {
      context: context || this.context,
    });
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.logger.error(toStringValue(message), {
      context: context || this.context,
      trace: trace ? toStringValue(this.sanitize(trace)) : undefined,
    });
  }

  warn(message: unknown, context?: string): void {
    this.logger.warn(toStringValue(message), {
      context: context || this.context,
    });
  }

  debug(message: unknown, context?: string): void {
    this.logger.debug(toStringValue(message), {
      context: context || this.context,
    });
  }

  verbose(message: unknown, context?: string): void {
    this.logger.verbose(toStringValue(message), {
      context: context || this.context,
    });
  }

  logWithMeta(
    message: string,
    meta: Record<string, unknown>,
    level: string = 'info',
  ): void {
    this.logMessage(level, message, meta);
  }

  logRequest(req: RequestLike): void {
    this.logWithMeta('HTTP Request', {
      method: req.method ?? 'UNKNOWN',
      url: req.url ?? 'UNKNOWN',
      ip: req.ip ?? 'UNKNOWN',
      userAgent: req.get?.('user-agent') ?? 'UNKNOWN',
      requestId: req.id ?? 'UNKNOWN',
    });
  }

  logResponse(req: RequestLike, res: ResponseLike, responseTime: number): void {
    const level = (res.statusCode ?? 0) >= 400 ? 'warn' : 'info';

    this.logWithMeta(
      'HTTP Response',
      {
        method: req.method ?? 'UNKNOWN',
        url: req.url ?? 'UNKNOWN',
        statusCode: res.statusCode ?? 0,
        responseTime: `${responseTime}ms`,
        requestId: req.id ?? 'UNKNOWN',
      },
      level,
    );
  }

  logQuery(query: string, duration: number, params?: unknown): void {
    if (!this.isDevelopment) {
      return;
    }

    this.logWithMeta('Database Query', {
      query,
      params: this.sanitize(params),
      duration: `${duration}ms`,
    });
  }

  logSlowOperation(
    operation: string,
    duration: number,
    threshold: number,
    meta?: Record<string, unknown>,
  ): void {
    this.logWithMeta(
      `Slow operation detected: ${operation} took ${duration}ms (threshold: ${threshold}ms)`,
      {
        operation,
        duration,
        threshold,
        ...(isRecord(this.sanitize(meta))
          ? (this.sanitize(meta) as Record<string, unknown>)
          : {}),
      },
      'warn',
    );
  }

  time(label: string): () => void {
    const start = Date.now();

    return () => {
      const duration = Date.now() - start;
      this.logWithMeta(`Timer: ${label}`, { duration: `${duration}ms` });
    };
  }

  async logPerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    warnThreshold: number = 1000,
  ): Promise<T> {
    const start = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - start;

      if (duration > warnThreshold) {
        this.logSlowOperation(operation, duration, warnThreshold);
      } else if (this.isDevelopment) {
        this.logWithMeta(`Performance: ${operation}`, {
          duration: `${duration}ms`,
        });
      }

      return result;
    } catch (error: unknown) {
      const duration = Date.now() - start;
      this.error(
        `Operation failed: ${operation} after ${duration}ms`,
        this.toErrorTrace(error),
      );
      throw error;
    }
  }

  logEvent(eventName: string, data?: unknown): void {
    this.logWithMeta(`Event: ${eventName}`, {
      event: eventName,
      data: this.sanitize(data),
    });
  }

  logSecurity(
    action: string,
    userId?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.logWithMeta(
      `Security: ${action}`,
      {
        action,
        userId,
        timestamp: new Date().toISOString(),
        ...(isRecord(this.sanitize(meta))
          ? (this.sanitize(meta) as Record<string, unknown>)
          : {}),
      },
      'warn',
    );
  }

  logAuth(
    action: 'login' | 'logout' | 'refresh' | 'failed',
    userId?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.logWithMeta(`Auth: ${action}`, {
      action,
      userId,
      ...(isRecord(this.sanitize(meta))
        ? (this.sanitize(meta) as Record<string, unknown>)
        : {}),
    });
  }

  createChildLogger(context: string): WinstonLoggerService {
    const childLogger = new WinstonLoggerService(this.configService);
    childLogger.setContext(context);
    return childLogger;
  }
}
