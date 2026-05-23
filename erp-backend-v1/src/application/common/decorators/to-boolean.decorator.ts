import { Transform } from 'class-transformer';

/**
 * Custom decorator to properly transform string boolean values from query params
 * This decorator handles the conversion before NestJS implicit conversion
 */
export function ToBoolean() {
  return Transform(
    ({ value }) => {
      // Handle string values from query params
      if (value === 'true' || value === '1') return true;
      if (value === 'false' || value === '0') return false;
      // Handle actual boolean values
      if (typeof value === 'boolean') return value;
      // Return undefined for any other value
      return undefined;
    },
    { toClassOnly: true },
  );
}
