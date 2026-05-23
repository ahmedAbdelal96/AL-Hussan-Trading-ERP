import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Validates Saudi National ID format
 * Format: 10 digits starting with 1 (Saudi citizen) or 2 (Resident)
 */
export function IsSaudiNationalId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSaudiNationalId',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;

          // Must be exactly 10 digits
          if (!/^\d{10}$/.test(value)) return false;

          // Must start with 1 (Saudi) or 2 (Resident)
          if (!['1', '2'].includes(value[0])) return false;

          return true;
        },
        defaultMessage() {
          return 'National ID must be 10 digits starting with 1 (Saudi) or 2 (Resident)';
        },
      },
    });
  };
}
