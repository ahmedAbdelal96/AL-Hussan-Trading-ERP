/**
 * Departments & Positions Types
 * Type definitions for the new structured department/position system
 */

// ============= Department Types =============

export interface DepartmentEntity {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  description?: string | null;
  isActive: boolean;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentDto {
  code: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateDepartmentDto {
  code?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  isActive?: boolean;
  rowVersion?: number;
}

export interface DepartmentFiltersDto {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}

export interface PaginatedDepartmentsResponse {
  data: DepartmentEntity[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============= Position Types =============

export interface PositionEntity {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  description?: string | null;
  isActive: boolean;
  departmentId?: string | null;
  departmentNameEn?: string | null;
  departmentNameAr?: string | null;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePositionDto {
  code: string;
  nameAr: string;
  nameEn: string;
  description?: string;
  isActive?: boolean;
  departmentId?: string;
}

export interface UpdatePositionDto {
  code?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  isActive?: boolean;
  departmentId?: string | null;
  rowVersion?: number;
}

export interface PositionFiltersDto {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  departmentId?: string;
}

export interface PaginatedPositionsResponse {
  data: PositionEntity[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
