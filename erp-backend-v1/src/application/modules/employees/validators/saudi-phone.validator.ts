import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Normalize an international phone number into E.164-like format.
 * Accepts common user formats:
 * - +201234567890
 * - 00201234567890
 * - 201234567890
 * - 0501234567 (kept as local if no country code is provided)
 */
export function normalizePhoneNumber(value: string): string | null {
  if (typeof value !== 'string') return null;

  const compact = value.replace(/[\s\-()]/g, '');
  if (!compact) return null;

  const withPlus = compact.startsWith('00') ? `+${compact.slice(2)}` : compact;

  // International format: +[country][number] (8..15 digits total)
  if (/^\+[1-9]\d{7,14}$/.test(withPlus)) {
    return withPlus;
  }

  // Country code without "+" (e.g. 201234567890, 966501234567)
  if (/^[1-9]\d{7,14}$/.test(withPlus)) {
    return `+${withPlus}`;
  }

  // Local number fallback (allows operational entry when country code is unknown)
  if (/^\d{8,15}$/.test(withPlus)) {
    return withPlus;
  }

  return null;
}

/**
 * NOTE:
 * Kept name for backward compatibility across DTOs.
 * Behavior now validates generic international phone numbers (not only Saudi).
 */
export function IsSaudiPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSaudiPhone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return false;
          return normalizePhoneNumber(value) !== null;
        },
        defaultMessage() {
          return 'صيغة رقم الهاتف غير صحيحة. مثال: +201234567890';
        },
      },
    });
  };
}
