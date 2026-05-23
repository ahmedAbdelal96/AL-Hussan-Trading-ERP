import {
  MaintenanceRequestEntity,
  MaintenanceAttachmentEntity,
} from '../entities';
import { MaintenanceFiltersDto } from '../dto';

/**
 * Repository token for dependency injection
 */
export const MAINTENANCE_REPOSITORY = 'MAINTENANCE_REPOSITORY';

/**
 * Interface for MaintenanceRepository
 * Defines contract for maintenance data access operations
 */
export abstract class IMaintenanceRepository {
  /**
   * Create a new maintenance request
   */
  abstract create(
    data: Partial<MaintenanceRequestEntity>,
    userId: string,
  ): Promise<MaintenanceRequestEntity>;

  /**
   * Find maintenance request by ID
   */
  abstract findById(id: string): Promise<MaintenanceRequestEntity | null>;

  /**
   * Find all maintenance requests with optional filters
   */
  abstract findAll(
    filters: MaintenanceFiltersDto,
  ): Promise<{ data: MaintenanceRequestEntity[]; total: number }>;

  /**
   * Update maintenance request
   */
  abstract update(
    id: string,
    data: Partial<MaintenanceRequestEntity>,
  ): Promise<MaintenanceRequestEntity>;

  /**
   * Delete maintenance request (soft delete)
   */
  abstract delete(
    id: string,
    userId: string,
    rowVersion?: number,
  ): Promise<void>;

  /**
   * Generate next maintenance number
   */
  abstract generateMaintenanceNumber(): Promise<string>;

  /**
   * Upload attachment for maintenance request
   */
  abstract uploadAttachment(
    maintenanceId: string,
    fileData: {
      fileName: string;
      filePath: string;
      fileSize: number;
      mimeType: string;
      description?: string;
    },
    userId: string,
  ): Promise<MaintenanceAttachmentEntity>;

  /**
   * Get attachments for maintenance request
   */
  abstract getAttachments(
    maintenanceId: string,
  ): Promise<MaintenanceAttachmentEntity[]>;

  /**
   * Delete attachment
   */
  abstract deleteAttachment(id: string): Promise<void>;

  /**
   * Count maintenance requests with filter
   */
  abstract count(filter: any): Promise<number>;

  /**
   * Group by for statistics
   */
  abstract groupBy(params: any): Promise<any[]>;

  /**
   * Find many with includes for complex queries
   */
  abstract findMany(params: any): Promise<any[]>;
}
