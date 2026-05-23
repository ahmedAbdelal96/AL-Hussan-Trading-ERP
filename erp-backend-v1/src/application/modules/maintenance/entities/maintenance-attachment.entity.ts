/**
 * MaintenanceAttachment Entity
 * Domain entity representing a file attachment for a maintenance request
 */
export class MaintenanceAttachmentEntity {
  id: string;
  maintenanceId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string | null;
  uploadedBy: string;
  uploadedAt: Date;

  constructor(partial: Partial<MaintenanceAttachmentEntity>) {
    Object.assign(this, partial);
  }
}
