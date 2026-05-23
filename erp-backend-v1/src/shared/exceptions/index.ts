/**
 * Custom Business Exceptions
 * Domain-specific exceptions for clear error handling
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Business Logic Exception
 * For business rule violations
 */
export class BusinessException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        message,
        error: 'BusinessRuleViolation',
        details,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * Resource Not Found Exception
 */
export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(
      {
        message,
        error: 'ResourceNotFound',
        resource,
        identifier,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

/**
 * Duplicate Resource Exception
 */
export class DuplicateResourceException extends HttpException {
  constructor(resource: string, field?: string, value?: string) {
    const message = field
      ? `${resource} with ${field} '${value}' already exists`
      : `${resource} already exists`;

    super(
      {
        message,
        error: 'DuplicateResource',
        resource,
        field,
        value,
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * Unauthorized Operation Exception
 */
export class UnauthorizedOperationException extends HttpException {
  constructor(
    message: string = 'You are not authorized to perform this operation',
  ) {
    super(
      {
        message,
        error: 'UnauthorizedOperation',
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

/**
 * Invalid Input Exception
 */
export class InvalidInputException extends HttpException {
  constructor(message: string, field?: string) {
    super(
      {
        message,
        error: 'InvalidInput',
        field,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * Insufficient Balance Exception (for financial operations)
 */
export class InsufficientBalanceException extends HttpException {
  constructor(available: number, required: number) {
    super(
      {
        message: 'Insufficient balance for this operation',
        error: 'InsufficientBalance',
        available,
        required,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * Conflict Exception (for concurrent updates)
 */
export class ConflictException extends HttpException {
  constructor(message: string = 'Resource conflict detected') {
    super(
      {
        message,
        error: 'ResourceConflict',
      },
      HttpStatus.CONFLICT,
    );
  }
}

/**
 * External Service Exception
 */
export class ExternalServiceException extends HttpException {
  constructor(
    service: string,
    message: string = 'External service unavailable',
  ) {
    super(
      {
        message,
        error: 'ExternalServiceError',
        service,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

/**
 * Rate Limit Exceeded Exception
 */
export class RateLimitException extends HttpException {
  constructor(retryAfter?: number) {
    super(
      {
        message: 'Rate limit exceeded',
        error: 'RateLimitExceeded',
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/**
 * Validation Exception (for custom validation logic)
 */
export class ValidationException extends HttpException {
  constructor(errors: Array<{ field: string; message: string }>) {
    super(
      {
        message: 'Validation failed',
        error: 'ValidationError',
        errors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
