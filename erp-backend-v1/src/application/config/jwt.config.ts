/**
 * JWT Configuration
 * Authentication token settings
 */

import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  // Access token settings — NO FALLBACK: app must fail if secret is missing
  accessSecret: process.env.JWT_ACCESS_SECRET,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',

  // Refresh token settings — NO FALLBACK: app must fail if secret is missing
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Legacy - kept for backward compatibility

  // Banking Model: Different expiry based on Remember Me
  refreshExpiresInWithRemember:
    process.env.JWT_REFRESH_EXPIRES_IN_WITH_REMEMBER || '7d',
  refreshExpiresInWithoutRemember:
    process.env.JWT_REFRESH_EXPIRES_IN_WITHOUT_REMEMBER || '24h',

  // Token validation
  ignoreExpiration: false,
  clockTolerance: 0, // seconds
}));
