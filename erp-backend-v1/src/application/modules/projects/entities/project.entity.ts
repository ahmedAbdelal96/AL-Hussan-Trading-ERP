/**
 * Project Entity
 * Domain model for Project
 */

import { ProjectStatus, MediaCategory } from '@prisma/client';

export class ProjectEntity {
  id: string;
  projectCode: string;
  name: string;
  tenderNumber?: string | null;
  description?: string | null;

  // Client Information
  clientName?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;

  // Site reference
  siteId?: string | null;
  site?: {
    id: string;
    name: string;
    code: string;
    city: string;
    state?: string | null;
    status: string;
  } | null;

  // Location
  googleMapsLink?: string | null;

  // Location (legacy fields)
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  status: ProjectStatus;

  // Dates
  plannedStartDate?: Date | null;
  actualStartDate?: Date | null;
  plannedEndDate?: Date | null;
  actualEndDate?: Date | null;

  // Financials
  budget?: number | null;
  currency: string;

  // Progress Tracking
  completionPercentage: number;
  progressNotes?: string | null;
  lastProgressUpdate?: Date | null;

  // Manager
  managerId?: string | null;

  notes?: string | null;

  // Counts
  employeeCount?: number;

  // Soft delete
  deletedAt?: Date | null;
  deletedBy?: string | null;

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string | null;
  rowVersion: number;

  constructor(partial: Partial<ProjectEntity>) {
    Object.assign(this, partial);
  }
}

export class ProjectMediaEntity {
  id: string;
  projectId: string;

  // File information
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;

  // Media categorization
  category: MediaCategory;
  title?: string | null;
  description?: string | null;

  // GPS coordinates
  latitude?: number | null;
  longitude?: number | null;

  // Photo metadata
  capturedAt?: Date | null;

  // Order/sorting
  displayOrder?: number | null;

  // Soft delete
  deletedAt?: Date | null;
  deletedBy?: string | null;

  // Audit
  uploadedBy: string;
  uploadedAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ProjectMediaEntity>) {
    Object.assign(this, partial);
  }
}
