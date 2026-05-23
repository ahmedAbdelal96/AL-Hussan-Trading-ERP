/**
 * Projects Module Types
 *
 * Comprehensive type definitions for the Projects module including:
 * - ProjectStatus enum (8 statuses: DRAFT, PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED, ARCHIVED)
 * - MediaCategory enum (7 categories for project media)
 * - ProjectEntity with 30+ fields
 * - DTOs for CRUD operations
 * - Helper functions for status handling, progress, dates, budget formatting
 *
 * @module projects.types
 */

/**
 * Project Status Enum
 * Represents the current state of a project in its lifecycle
 */
export enum ProjectStatus {
  DRAFT = "DRAFT", // Initial state, not yet started
  PLANNING = "PLANNING", // Planning phase
  ACTIVE = "ACTIVE", // Currently in progress
  ON_HOLD = "ON_HOLD", // Temporarily paused
  COMPLETED = "COMPLETED", // Successfully completed
  CANCELLED = "CANCELLED", // Cancelled before completion
  ARCHIVED = "ARCHIVED", // Archived for historical reference
}

/**
 * Media Category Enum
 * Categories for project-related media files
 */
export enum MediaCategory {
  PROGRESS_PHOTO = "PROGRESS_PHOTO", // Progress photos
  PLAN = "PLAN", // Plans and blueprints
  REPORT = "REPORT", // Reports
  INVOICE = "INVOICE", // Invoices
  CONTRACT = "CONTRACT", // Contracts
  CERTIFICATE = "CERTIFICATE", // Certificates
  OTHER = "OTHER", // Other files
}

/**
 * Project Entity
 * Main interface representing a project with all its properties
 */
export interface ProjectEntity {
  // Core Identification
  id: string;
  projectCode: string;
  name: string;
  tenderNumber?: string | null;
  description?: string | null;

  // Client Information
  clientName?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;

  // Site Reference (optional relationship to Sites module)
  siteId?: string | null;

  // Location
  googleMapsLink?: string | null;

  // Location Information (legacy fields if not using siteId)
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  // Status
  status: ProjectStatus;

  // Date Timeline
  plannedStartDate?: Date | null;
  actualStartDate?: Date | null;
  plannedEndDate?: Date | null;
  actualEndDate?: Date | null;

  // Financial Information
  budget?: number | null;
  currency: string;

  // Progress Tracking
  completionPercentage?: number | null;
  progressNotes?: string | null;
  lastProgressUpdate?: Date | null;

  // Management
  managerId?: string | null;

  // Additional Notes
  notes?: string | null;

  // Soft Delete
  deletedAt?: Date | null;
  deletedBy?: string | null;

  // Audit Fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string | null;
  rowVersion: number;

  // Computed counts (returned by GET single project)
  employeeCount?: number;
}

/**
 * Create Project DTO
 * Data Transfer Object for creating a new project
 * Simplified for easier project creation
 */
export interface CreateProjectDto {
  name: string;
  tenderNumber?: string;
  description?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  siteId?: string;
  googleMapsLink?: string;
  status?: ProjectStatus;
  plannedStartDate?: string;
  actualStartDate?: string;
  budget?: number;
  managerId?: string;
  notes?: string;
}

/**
 * Update Project DTO
 * Data Transfer Object for updating an existing project
 */
export interface UpdateProjectDto {
  name?: string;
  tenderNumber?: string;
  description?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  siteId?: string;
  googleMapsLink?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  status?: ProjectStatus;
  plannedStartDate?: string;
  actualStartDate?: string;
  plannedEndDate?: string;
  actualEndDate?: string;
  budget?: number;
  currency?: string;
  managerId?: string;
  notes?: string;
  completionPercentage?: number;
  progressNotes?: string;
  lastProgressUpdate?: string;
  rowVersion?: number;
}

/**
 * Update Progress DTO
 * Specialized DTO for updating project progress
 */
export interface UpdateProgressDto {
  completionPercentage: number;
  progressNotes?: string;
}

/**
 * Project Filters DTO
 * Query parameters for filtering and searching projects
 */
export interface ProjectFiltersDto {
  page?: number;
  limit?: number; // Backend uses 'limit' not 'pageSize'
  search?: string;
  status?: ProjectStatus;
  siteId?: string;
  managerId?: string;
  clientName?: string;
  startDateFrom?: string;
  startDateTo?: string;
  minCompletion?: number;
  maxCompletion?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  includeDeleted?: boolean;
}

/**
 * Media Filters DTO
 * Query parameters for filtering project media
 */
export interface MediaFiltersDto {
  page?: number;
  limit?: number; // Backend uses 'limit' not 'pageSize'
  category?: MediaCategory;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Project Media Entity
 * Represents media files attached to a project
 */
export interface ProjectMediaEntity {
  id: string;
  projectId: string;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  category: MediaCategory;
  title?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  capturedAt?: Date | null;
  displayOrder?: number | null;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  uploadedBy: string;
  uploadedAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PROJECT EMPLOYEE ASSIGNMENT TYPES
// ============================================================================

export type AssignmentRole =
  | "MANAGER"
  | "SUPERVISOR"
  | "WORKER"
  | "TECHNICIAN"
  | "ENGINEER"
  | "FOREMAN"
  | "SAFETY_OFFICER"
  | "QUALITY_CONTROL"
  | "OTHER";

export interface ProjectEmployeeEntity {
  id: string;
  projectId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  department: string | null;
  position: string | null;
  role: AssignmentRole | null;
  /** Salary allocation %. null = overhead employee (no project allocation) */
  percentage: number | null;
  assignedDate: Date | string;
  endDate: Date | string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: Date | string;
}

export interface ProjectAssetEntity {
  id: string;
  projectId: string;
  assetId: string;
  assetNumber: string;
  assetName: string;
  assetType: string;
  status: string;
  percentage: number;
  assignedDate: Date | string;
  returnDate: Date | string | null;
  isActive: boolean;
  location: string | null;
  notes: string | null;
}

export interface AssignAssetFromProjectDto {
  assetId: string;
  assignedDate?: string;
  notes?: string;
}

export interface AssignEmployeeToProjectDto {
  employeeId: string;
  role?: AssignmentRole;
  percentage?: number;
  assignedDate?: string;
  notes?: string;
}

export interface UpdateProjectEmployeeDto {
  role?: AssignmentRole;
  percentage?: number;
  endDate?: string;
  isActive?: boolean;
  notes?: string;
}

/**
 * Paginated Projects Response
 * Response structure for paginated project lists
 */
export interface PaginatedProjectsResponse {
  data: ProjectEntity[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Paginated Media Response
 * Response structure for paginated media lists
 */
export interface PaginatedMediaResponse {
  data: ProjectMediaEntity[];
  total: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color class for project status badge
 * @param status - Project status
 * @returns Tailwind color class name
 */
export const getProjectStatusColor = (status: ProjectStatus): string => {
  const colorMap: Record<ProjectStatus, string> = {
    [ProjectStatus.DRAFT]: "gray",
    [ProjectStatus.PLANNING]: "blue",
    [ProjectStatus.ACTIVE]: "green",
    [ProjectStatus.ON_HOLD]: "yellow",
    [ProjectStatus.COMPLETED]: "emerald",
    [ProjectStatus.CANCELLED]: "red",
    [ProjectStatus.ARCHIVED]: "slate",
  };
  return colorMap[status] || "gray";
};

/**
 * Get translation key for project status label
 * @param status - Project status
 * @returns i18n translation key
 */
export const getProjectStatusLabel = (status: ProjectStatus): string => {
  return `projects.status.${status.toLowerCase()}`;
};

/**
 * Get color class for media category badge
 * @param category - Media category
 * @returns Tailwind color class name
 */
export const getMediaCategoryColor = (category: MediaCategory): string => {
  const colorMap: Record<MediaCategory, string> = {
    [MediaCategory.PROGRESS_PHOTO]: "blue",
    [MediaCategory.PLAN]: "purple",
    [MediaCategory.REPORT]: "orange",
    [MediaCategory.INVOICE]: "green",
    [MediaCategory.CONTRACT]: "red",
    [MediaCategory.CERTIFICATE]: "emerald",
    [MediaCategory.OTHER]: "gray",
  };
  return colorMap[category] || "gray";
};

/**
 * Get translation key for media category label
 * @param category - Media category
 * @returns i18n translation key
 */
export const getMediaCategoryLabel = (category: MediaCategory): string => {
  return `projects.mediaCategory.${category.toLowerCase()}`;
};

/**
 * Check if project has GPS coordinates
 * @param project - Project entity
 * @returns true if valid coordinates exist
 */
export const projectHasCoordinates = (project: ProjectEntity): boolean => {
  if (
    project.latitude === null ||
    project.latitude === undefined ||
    project.longitude === null ||
    project.longitude === undefined
  ) {
    return false;
  }

  return (
    project.latitude >= -90 &&
    project.latitude <= 90 &&
    project.longitude >= -180 &&
    project.longitude <= 180
  );
};

/**
 * Generate Google Maps URL for project location
 * @param project - Project entity
 * @returns Google Maps URL or null
 */
export const getProjectMapUrl = (project: ProjectEntity): string | null => {
  if (!projectHasCoordinates(project)) return null;
  return `https://www.google.com/maps?q=${project.latitude},${project.longitude}`;
};

import { CURRENCY, LOCALE } from "@/config/system.constants";

/**
 * Format budget with currency symbol
 * @param budget - Budget amount
 * @param currency - Currency code (default: system default)
 * @returns Formatted budget string
 */
export const formatBudget = (
  budget?: number | null,
  currency: string = CURRENCY.DEFAULT,
): string => {
  if (!budget) return "-";
  const formatted = new Intl.NumberFormat(LOCALE.DEFAULT_AR, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(budget);
  return `${formatted} ${currency}`;
};

/**
 * Calculate project duration in days
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Duration in days or null
 */
export const calculateProjectDuration = (
  startDate?: Date | null,
  endDate?: Date | null,
): number | null => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if project is overdue based on planned end date
 * @param project - Project entity
 * @returns true if project is overdue
 */
export const isProjectOverdue = (project: ProjectEntity): boolean => {
  if (!project.plannedEndDate) return false;
  if (project.status === ProjectStatus.COMPLETED) return false;
  if (project.status === ProjectStatus.CANCELLED) return false;
  if (project.status === ProjectStatus.ARCHIVED) return false;
  const today = new Date();
  const plannedEnd = new Date(project.plannedEndDate);
  return today > plannedEnd;
};

/**
 * Progress updates are only allowed for ACTIVE projects.
 * All other statuses are treated as read-only for progress tracking.
 */
export const canUpdateProjectProgress = (
  status: ProjectStatus | string | undefined | null,
): boolean => status === ProjectStatus.ACTIVE;

/**
 * Get progress status based on completion percentage
 * @param completionPercentage - Completion percentage (0-100)
 * @returns Progress status: 'not-started' | 'in-progress' | 'near-completion' | 'completed'
 */
export const getProgressStatus = (
  completionPercentage: number,
): "not-started" | "in-progress" | "near-completion" | "completed" => {
  if (completionPercentage === 0) return "not-started";
  if (completionPercentage >= 100) return "completed";
  if (completionPercentage >= 75) return "near-completion";
  return "in-progress";
};

/**
 * Get progress color based on completion percentage
 * @param completionPercentage - Completion percentage (0-100)
 * @returns Tailwind color class
 */
export const getProgressColor = (completionPercentage: number): string => {
  if (completionPercentage === 0) return "bg-[var(--icon-tertiary)]";
  if (completionPercentage >= 100) return "bg-green-500";
  if (completionPercentage >= 75) return "bg-blue-500";
  if (completionPercentage >= 50) return "bg-yellow-500";
  return "bg-orange-500";
};

/**
 * Format date to locale string
 * @param date - Date to format
 * @param locale - Locale (default: ar-SA)
 * @returns Formatted date string
 */
export const formatProjectDate = (
  date?: Date | null,
  locale: string = "ar-SA",
): string => {
  if (!date) return "-";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
};

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Validate email format
 * @param email - Email string
 * @returns true if valid email
 */
export const isValidEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * @param phone - Phone string
 * @returns true if valid phone
 */
const isValidSaudiPhone = (phone?: string | null): boolean => {
  if (!phone) return false;
  const phoneRegex = /^(?:\+?[1-9]\d{7,14}|0\d{7,14})$/;
  return phoneRegex.test(phone);
};

/**
 * Format phone number for display
 * @param phone - Phone string
 * @returns Formatted phone string
 */
const formatPhoneNumber = (phone?: string | null): string => {
  if (!phone) return "-";
  // Light normalization for display: keep E.164-like number without separators.
  return phone.replace(/[\s\-()]/g, "");
};

/**
 * Get project initials from name for avatar
 * @param name - Project name
 * @returns Initials (max 2 characters)
 */
export const getProjectInitials = (name: string): string => {
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

/**
 * Calculate days remaining until planned end date
 * @param plannedEndDate - Planned end date
 * @returns Days remaining (negative if overdue) or null
 */
export const getDaysRemaining = (
  plannedEndDate?: Date | null,
): number | null => {
  if (!plannedEndDate) return null;
  const today = new Date();
  const endDate = new Date(plannedEndDate);
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Get project health status based on progress and timeline
 * @param project - Project entity
 * @returns Health status: 'on-track' | 'at-risk' | 'delayed'
 */
export const getProjectHealth = (
  project: ProjectEntity,
): "on-track" | "at-risk" | "delayed" => {
  if (!project.plannedStartDate || !project.plannedEndDate) return "on-track";

  const today = new Date();
  const plannedStart = new Date(project.plannedStartDate);
  const plannedEnd = new Date(project.plannedEndDate);

  // If not started yet
  if (today < plannedStart) return "on-track";

  // Calculate expected progress based on timeline
  const totalDuration = plannedEnd.getTime() - plannedStart.getTime();
  const elapsed = today.getTime() - plannedStart.getTime();
  const expectedProgress = (elapsed / totalDuration) * 100;

  const actualProgress = project.completionPercentage ?? 0;
  const progressDiff = expectedProgress - actualProgress;

  // More than 15% behind schedule
  if (progressDiff > 15) return "delayed";

  // 5-15% behind schedule
  if (progressDiff > 5) return "at-risk";

  return "on-track";
};
