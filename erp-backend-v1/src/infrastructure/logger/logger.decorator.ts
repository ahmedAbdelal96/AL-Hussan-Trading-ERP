/**
 * Logger Decorators
 * Method-level decorators for automatic logging and performance tracking.
 */

import { WinstonLoggerService } from './winston-logger.service';

interface LoggerAwareInstance {
  logger?: WinstonLoggerService;
  loggerService?: WinstonLoggerService;
  winstonLogger?: WinstonLoggerService;
}

const resolveLogger = (
  instance: LoggerAwareInstance,
): WinstonLoggerService | null =>
  instance.logger ?? instance.loggerService ?? instance.winstonLogger ?? null;

const toErrorTrace = (error: unknown): string =>
  error instanceof Error ? (error.stack ?? error.message) : String(error);

const toErrorName = (error: unknown): string =>
  error instanceof Error ? error.name : 'UnknownError';

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export function LogMethod(logArgs = false, logResult = false) {
  return function (
    target: LoggerAwareInstance,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (
      this: LoggerAwareInstance,
      ...args: unknown[]
    ) {
      const logger = resolveLogger(this);

      if (!logger) {
        return originalMethod.apply(this, args);
      }

      const methodName = `${className}.${propertyKey}`;
      const startTime = Date.now();

      try {
        const entryLog: Record<string, unknown> = {
          method: methodName,
          type: 'entry',
        };

        if (logArgs && args.length > 0) {
          entryLog.args = args;
        }

        logger.logWithMeta(`-> ${methodName}`, entryLog, 'debug');

        const result = await originalMethod.apply(this, args);

        const duration = Date.now() - startTime;
        const exitLog: Record<string, unknown> = {
          method: methodName,
          type: 'exit',
          duration: `${duration}ms`,
        };

        if (logResult) {
          exitLog.result = result;
        }

        logger.logWithMeta(`<- ${methodName}`, exitLog, 'debug');

        return result;
      } catch (error: unknown) {
        const duration = Date.now() - startTime;
        logger.error(
          `x ${methodName} failed after ${duration}ms`,
          toErrorTrace(error),
        );
        throw error;
      }
    };

    return descriptor;
  };
}

export function LogPerformance(warnThreshold = 1000) {
  return function (
    target: LoggerAwareInstance,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (
      this: LoggerAwareInstance,
      ...args: unknown[]
    ) {
      const logger = resolveLogger(this);

      if (!logger) {
        return originalMethod.apply(this, args);
      }

      const methodName = `${className}.${propertyKey}`;
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;

        if (duration > warnThreshold) {
          logger.logSlowOperation(methodName, duration, warnThreshold);
        } else {
          logger.logWithMeta(`Performance: ${methodName}`, {
            duration: `${duration}ms`,
          });
        }

        return result;
      } catch (error: unknown) {
        const duration = Date.now() - startTime;
        logger.error(
          `${methodName} failed after ${duration}ms`,
          toErrorTrace(error),
        );
        throw error;
      }
    };

    return descriptor;
  };
}

export function LogError(includeArgs = true) {
  return function (
    target: LoggerAwareInstance,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (
      this: LoggerAwareInstance,
      ...args: unknown[]
    ) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error: unknown) {
        const logger = resolveLogger(this);

        if (logger) {
          const methodName = `${className}.${propertyKey}`;
          const errorContext: Record<string, unknown> = {
            method: methodName,
            errorName: toErrorName(error),
            errorMessage: toErrorMessage(error),
            trace: toErrorTrace(error),
          };

          if (includeArgs && args.length > 0) {
            errorContext.args = args;
          }

          logger.logWithMeta(`Error in ${methodName}`, errorContext, 'error');
        }

        throw error;
      }
    };

    return descriptor;
  };
}

export function LogAsync() {
  return function (
    target: LoggerAwareInstance,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = async function (
      this: LoggerAwareInstance,
      ...args: unknown[]
    ) {
      const logger = resolveLogger(this);
      const methodName = `${className}.${propertyKey}`;

      if (logger) {
        logger.logWithMeta(
          `Starting async operation: ${methodName}`,
          { method: methodName, type: 'entry' },
          'debug',
        );
      }

      try {
        const result = await originalMethod.apply(this, args);

        if (logger) {
          logger.logWithMeta(
            `Completed async operation: ${methodName}`,
            { method: methodName, type: 'exit' },
            'debug',
          );
        }

        return result;
      } catch (error: unknown) {
        if (logger) {
          logger.error(
            `Failed async operation: ${methodName}`,
            toErrorTrace(error),
          );
        }
        throw error;
      }
    };

    return descriptor;
  };
}
