/**
 * Sites Module Types & Interfaces
 * Type definitions for the Sites module based on backend DTOs and Entity
 *
 * A site represents a construction location where projects are executed.
 * Sites have detailed location information, GPS coordinates, contact details,
 * and operational status tracking.
 */

// ============= Enums =============

/**
 * Site operational status
 */
export enum SiteStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  UNDER_PREPARATION = "UNDER_PREPARATION",
  CLOSED = "CLOSED",
}

// ============= Entity Interface =============

/**
 * Site Entity - matches backend entity structure
 */
export interface SiteEntity {
  id: string;
  name: string;
  code: string;
  description: string | null;
  descriptionAr: string | null;
  address: string;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  status: SiteStatus;
  area: number | null; // in square meters
  capacity: number | null; // max workers capacity
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  notes: string | null;
  rowVersion: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  deletedAt?: string | null; // Present in soft-delete endpoints
  fullLocation?: string; // Computed field
  mapUrl?: string | null; // Computed field
  projects?: Array<{
    id: string;
    name: string;
    status?: string;
    budget?: number | null;
    actualCost?: number | null;
    completionPercentage?: number | null;
  }>;
}

// ============= Create DTO =============

/**
 * Create Site DTO - data required to create a new site
 */
export interface CreateSiteDto {
  name: string;
  code?: string; // Auto-generated if not provided
  description?: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string; // Default: 'المملكه العربيه السعوديه'
  latitude?: number;
  longitude?: number;
  status?: SiteStatus; // Default: ACTIVE
  area?: number;
  capacity?: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  rowVersion?: number;
}

// ============= Update DTO =============

/**
 * Update Site DTO - partial data to update existing site
 */
export interface UpdateSiteDto {
  name?: string;
  code?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  status?: SiteStatus;
  area?: number;
  capacity?: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  rowVersion?: number;
}

// ============= Filters DTO =============

/**
 * Site Filters DTO - filtering and pagination options
 */
export interface SiteFiltersDto {
  page?: number;
  pageSize?: number;
  search?: string; // Search in name, code, address
  status?: SiteStatus;
  city?: string;
  state?: string;
  country?: string;
  code?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ============= Bulk Create DTO =============

/**
 * Bulk Create Sites DTO - create multiple sites at once
 */
export interface BulkCreateSitesDto {
  sites: CreateSiteDto[];
}

// ============= Paginated Response =============

/**
 * Paginated Sites Response - matches backend pagination structure
 */
export interface PaginatedSitesResponse {
  data: SiteEntity[];
  meta: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// ============= Statistics Types =============

export interface GeographicDistribution {
  name: string;
  count: number;
  percentage: number;
}

export interface SitesStats {
  // General Stats
  totalSites: number;
  activeSites: number;
  inactiveSites: number;
  underPreparation: number;
  closedSites: number;

  // Geographic Distribution
  byCity: GeographicDistribution[];
  byState: GeographicDistribution[];
}

// ============= Helper Functions =============

/**
 * Get site status badge color variant
 */
export const getSiteStatusColor = (status: SiteStatus): string => {
  const colors: Record<SiteStatus, string> = {
    [SiteStatus.ACTIVE]: "success",
    [SiteStatus.INACTIVE]: "secondary",
    [SiteStatus.UNDER_PREPARATION]: "warning",
    [SiteStatus.CLOSED]: "destructive",
  };
  return colors[status];
};

/**
 * Get site status display label
 */
export const getSiteStatusLabel = (status: SiteStatus): string => {
  const labels: Record<SiteStatus, string> = {
    [SiteStatus.ACTIVE]: "نشط",
    [SiteStatus.INACTIVE]: "غير نشط",
    [SiteStatus.UNDER_PREPARATION]: "تحت التجهيز",
    [SiteStatus.CLOSED]: "مغلق",
  };
  return labels[status];
};

/**
 * Get full location string
 */
export const getSiteFullLocation = (
  site: SiteEntity | CreateSiteDto | UpdateSiteDto,
): string => {
  const parts = [
    "address" in site ? site.address : "",
    "city" in site ? site.city : "",
    "state" in site ? site.state : "",
    "country" in site ? site.country : "",
  ].filter(Boolean);
  return parts.join(", ");
};

/**
 * Check if site has GPS coordinates
 */
export const siteHasCoordinates = (
  site: SiteEntity | CreateSiteDto,
): boolean => {
  return (
    site.latitude !== null &&
    site.latitude !== undefined &&
    site.longitude !== null &&
    site.longitude !== undefined
  );
};

/**
 * Get Google Maps URL for site
 */
export const getSiteMapUrl = (
  site: SiteEntity | CreateSiteDto,
): string | null => {
  if (!siteHasCoordinates(site)) return null;
  return `https://www.google.com/maps?q=${site.latitude},${site.longitude}`;
};

/**
 * Format area for display (with unit)
 */
export const formatSiteArea = (area: number | null): string => {
  if (!area) return "-";
  return `${area.toLocaleString()} م²`;
};

/**
 * Format capacity for display
 */
export const formatSiteCapacity = (capacity: number | null): string => {
  if (!capacity) return "-";
  return `${capacity.toLocaleString()} عامل`;
};

/**
 * Validate international phone number format
 */
export const isValidSaudiPhone = (phone: string): boolean => {
  return /^(?:\+?[1-9]\d{7,14}|0\d{7,14})$/.test(phone);
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string | null): string => {
  if (!phone) return "-";
  return phone.replace(/[\s\-()]/g, "");
};
