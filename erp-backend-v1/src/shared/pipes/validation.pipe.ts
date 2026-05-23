/**
 * Global Validation Pipe Configuration
 * Pre-configured validation pipe with best practices
 */

import { ValidationPipe, BadRequestException } from '@nestjs/common';

/**
 * Create a global validation pipe with optimal settings
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    // Remove properties that don't have decorators
    whitelist: true,

    // Throw error if non-whitelisted properties are present
    forbidNonWhitelisted: true,

    // Automatically transform payloads to DTO instances
    transform: true,

    // Disable implicit conversion - use explicit @Transform decorators instead
    // This prevents "false" string from being converted to true boolean
    transformOptions: {
      enableImplicitConversion: false,
    },

    // Return detailed validation errors
    disableErrorMessages: false,

    // Custom error message factory for consistent error format
    exceptionFactory: (errors) => {
      const formattedErrors = errors.map((error) => ({
        field: error.property,
        message: Object.values(error.constraints || {}).join(', '),
        value: error.value,
      }));

      return new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: formattedErrors,
      });
    },
  });
}
