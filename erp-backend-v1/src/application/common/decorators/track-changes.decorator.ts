/**
 * ============================================================================
 * @TrackChanges DECORATOR - AUTOMATIC CHANGE TRACKING
 * ============================================================================
 *
 * Tracks changes between old and new values for audit logging.
 * Automatically captures oldValues, newValues, and changedFields.
 *
 * @example
 * @Put(':id')
 * @TrackChanges('project') // Resource type
 * async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
 *   return this.service.update(id, dto);
 * }
 *
 * ============================================================================
 */

import { SetMetadata } from '@nestjs/common';

export const TRACK_CHANGES_METADATA_KEY = 'track:changes';

export interface TrackChangesOptions {
  /**
   * Resource type (project, site, user, etc.)
   */
  resourceType: string;

  /**
   * Fields to exclude from tracking
   * Example: ['password', 'updatedAt', 'createdAt']
   */
  excludeFields?: string[];

  /**
   * Fields to include (if specified, only these will be tracked)
   */
  includeFields?: string[];

  /**
   * Route param name that holds the tracked resource id.
   * Defaults to 'id'. Example: 'userId' for routes like /:userId
   */
  resourceIdParam?: string;
}

/**
 * Decorator to enable automatic change tracking
 */
export const TrackChanges = (
  resourceTypeOrOptions: string | TrackChangesOptions,
) => {
  const options: TrackChangesOptions =
    typeof resourceTypeOrOptions === 'string'
      ? { resourceType: resourceTypeOrOptions }
      : resourceTypeOrOptions;

  return SetMetadata(TRACK_CHANGES_METADATA_KEY, options);
};
