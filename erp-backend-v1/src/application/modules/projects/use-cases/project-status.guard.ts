import { BadRequestException } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';

/**
 * Statuses that prevent any write operations on project assignments.
 * A project in these states is considered "frozen" — no employees or
 * assets can be added or removed until the status changes.
 */
export const LOCKED_PROJECT_STATUSES: ProjectStatus[] = [
  ProjectStatus.CANCELLED,
  ProjectStatus.COMPLETED,
  ProjectStatus.ON_HOLD,
  ProjectStatus.ARCHIVED,
];

/**
 * Only ACTIVE projects can receive progress updates.
 * All other statuses are treated as read-only for progress tracking.
 */
export const PROGRESS_UPDATABLE_PROJECT_STATUSES: ProjectStatus[] = [
  ProjectStatus.ACTIVE,
];

/**
 * Throws BadRequestException if the project status prevents modifications.
 * Call this at the start of any assignment write use case.
 */
export function assertProjectIsEditable(project: {
  id: string;
  name?: string;
  status: ProjectStatus;
}): void {
  if (LOCKED_PROJECT_STATUSES.includes(project.status)) {
    const label = project.name ? `"${project.name}"` : project.id;
    throw new BadRequestException(
      `Project ${label} is locked (status: ${project.status}). ` +
        `Change the project status to ACTIVE, PLANNING, or DRAFT before modifying assignments.`,
    );
  }
}

/**
 * Throws BadRequestException if progress update is attempted on non-updatable status.
 */
export function assertProjectAllowsProgressUpdate(project: {
  id: string;
  name?: string;
  status: ProjectStatus;
}): void {
  if (!PROGRESS_UPDATABLE_PROJECT_STATUSES.includes(project.status)) {
    const label = project.name ? `"${project.name}"` : project.id;
    throw new BadRequestException(
      `Project ${label} cannot be updated while status is ${project.status}. ` +
        `Change status to ACTIVE first.`,
    );
  }
}
