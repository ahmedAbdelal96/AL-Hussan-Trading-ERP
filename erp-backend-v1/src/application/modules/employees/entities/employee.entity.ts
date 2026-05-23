/**
 * Employee Entity
 * Core entity representing an employee in the system
 */

import { buildPublicUploadsUrl } from '../../../../shared/utils/public-asset-url.util';

export type EmploymentType =
  | 'PERMANENT'
  | 'CONTRACT'
  | 'TEMPORARY'
  | 'PART_TIME'
  | 'FULL_TIME'
  | 'FREELANCE'
  | 'CONSULTANT'
  | 'INTERN'
  | 'TRAINEE'
  | 'SEASONAL'
  | 'ON_CALL'
  | 'PROBATION'
  | 'REMOTE';
export type EmployeeStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ON_LEAVE'
  | 'SUSPENDED'
  | 'TERMINATED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

type EmployeeEntityInput = Omit<
  Partial<EmployeeEntity>,
  'baseSalary' | 'contracts' | 'documents'
> & {
  baseSalary?: unknown;
  contracts?: Array<Record<string, unknown>>;
  documents?: Array<Record<string, unknown>>;
  version?: number;
  rowVersion?: number;
  department?: { nameAr?: string | null; nameEn?: string | null } | null;
  position?: { nameAr?: string | null; nameEn?: string | null } | null;
};

export class EmployeeEntity {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  nationalId: string;
  employeeNumber: string;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  dateOfBirth: Date | null;
  gender: Gender | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  departmentId: string | null;
  departmentName: string | null;
  positionId: string | null;
  positionName: string | null;
  hireDate: Date;
  terminationDate: Date | null;
  terminationReason: string | null;
  rehireDate: Date | null;
  rehireReason: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelation: string | null;
  profilePicture: string | null;
  notes: string | null;
  contracts?: Array<Record<string, unknown>>; // Employment contracts
  documents?: Array<Record<string, unknown>>; // Employee documents

  // Salary fields (denormalized for performance)
  baseSalary: number | null;
  currency: string | null;
  lastSalaryUpdate: Date | null;
  lastSalaryUpdateBy: string | null;

  // Optimistic locking version
  version: number;
  // Alias for consistency across modules
  rowVersion: number;

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string | null;

  constructor(partial: EmployeeEntityInput) {
    Object.assign(this, partial);

    // Convert Prisma Decimal to number for baseSalary
    if (partial.baseSalary !== null && partial.baseSalary !== undefined) {
      this.baseSalary = Number(partial.baseSalary);
    }

    // Keep both field names available in responses during transition.
    this.rowVersion =
      partial.rowVersion ?? partial.version ?? this.rowVersion ?? 1;
    this.version = partial.version ?? partial.rowVersion ?? this.version ?? 1;

    // Map department/position relation names (when included via Prisma include)
    if (partial.department && typeof partial.department === 'object') {
      this.departmentName =
        partial.department.nameAr ?? partial.department.nameEn ?? null;
    } else {
      this.departmentName = this.departmentName ?? null;
    }
    if (partial.position && typeof partial.position === 'object') {
      this.positionName =
        partial.position.nameAr ?? partial.position.nameEn ?? null;
    } else {
      this.positionName = this.positionName ?? null;
    }
  }

  /**
   * Get employee full name
   */
  getFullName(): string {
    const parts = [this.firstName, this.middleName, this.lastName].filter(
      Boolean,
    );
    return parts.join(' ');
  }

  /**
   * Check if employee is active
   */
  isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  /**
   * Check if employee is terminated
   */
  isTerminated(): boolean {
    return this.status === 'TERMINATED';
  }

  /**
   * Get employment duration in days
   */
  getEmploymentDuration(): number {
    const endDate = this.terminationDate || new Date();
    const startDate = this.hireDate;
    const diff = endDate.getTime() - startDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Get profile picture full URL
   */
  getProfilePictureUrl(): string | null {
    return buildPublicUploadsUrl(this.profilePicture);
  }

  /**
   * Convert to safe response object
   */
  toResponse() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      middleName: this.middleName,
      fullName: this.getFullName(),
      nationalId: this.nationalId,
      employeeNumber: this.employeeNumber,
      email: this.email,
      phone: this.phone,
      alternatePhone: this.alternatePhone,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      nationality: this.nationality,
      address: this.address,
      city: this.city,
      state: this.state,
      postalCode: this.postalCode,
      country: this.country,
      employmentType: this.employmentType,
      status: this.status,
      departmentId: this.departmentId,
      departmentName: this.departmentName,
      positionId: this.positionId,
      positionName: this.positionName,
      hireDate: this.hireDate,
      terminationDate: this.terminationDate,
      terminationReason: this.terminationReason,
      rehireDate: this.rehireDate ?? null,
      rehireReason: this.rehireReason ?? null,
      emergencyContactName: this.emergencyContactName,
      emergencyContactPhone: this.emergencyContactPhone,
      emergencyContactRelation: this.emergencyContactRelation,
      profilePicture: this.getProfilePictureUrl(),
      notes: this.notes,
      // Salary fields
      baseSalary: this.baseSalary,
      currency: this.currency,
      lastSalaryUpdate: this.lastSalaryUpdate,
      lastSalaryUpdateBy: this.lastSalaryUpdateBy,
      version: this.version,
      rowVersion: this.rowVersion,
      contracts: this.contracts?.map((contract) => ({
        id: String(contract.id),
        contractType: String(contract.contractType),
        startDate: contract.startDate as Date,
        endDate: (contract.endDate as Date | null) ?? null,
        isRenewable: Boolean(contract.isRenewable),
        positionId: (contract.positionId as string | null) ?? null,
        departmentId: (contract.departmentId as string | null) ?? null,
        baseSalary: Number(contract.baseSalary ?? 0),
        contractTerms: (contract.contractTerms as string | null) ?? null,
        filePath: (contract.filePath as string | null) ?? null,
        isActive: Boolean(contract.isActive),
        createdAt: contract.createdAt as Date,
        updatedAt: contract.updatedAt as Date,
      })),
      documents: this.documents?.map((doc) => ({
        id: String(doc.id),
        documentType: String(doc.documentType),
        documentName: String(doc.documentName),
        filePath: String(doc.filePath),
        fileSize: Number(doc.fileSize ?? 0),
        mimeType: String(doc.mimeType),
        issueDate: (doc.issueDate as Date | null) ?? null,
        expiryDate: (doc.expiryDate as Date | null) ?? null,
        notes: (doc.notes as string | null) ?? null,
        uploadedBy: String(doc.uploadedBy),
        createdAt: doc.createdAt as Date,
        updatedAt: doc.updatedAt as Date,
      })),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
