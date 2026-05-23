/**
 * ============================================================================
 * COMMON MODULE - Shared Components
 * ============================================================================
 *
 * This module contains shared decorators, guards, filters, interceptors,
 * and pipes that are used across multiple modules in the application.
 *
 * Components:
 * - Decorators: CurrentUser, Public
 * - Guards: JwtAccessGuard, RolesGuard, PermissionsGuard
 * - Filters: (to be added)
 * - Interceptors: (to be added)
 * - Pipes: (to be added)
 */

import { Module, Global } from '@nestjs/common';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

/**
 * Common Module
 *
 * @Global - Makes this module global so its exports are available everywhere
 * without needing to import it in every module
 */
@Global()
@Module({
  providers: [
    // Guards
    JwtAccessGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [
    // Export guards for use in other modules
    JwtAccessGuard,
    RolesGuard,
    PermissionsGuard,
  ],
})
export class CommonModule {}
