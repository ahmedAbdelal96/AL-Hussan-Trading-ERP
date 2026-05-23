import { ProjectCostEntity } from '../entities';
import {
  CreateProjectCostDto,
  UpdateProjectCostDto,
  ProjectCostFiltersDto,
  ProjectCostSummaryDto,
} from '../dto';
import { CostType, PaymentStatus } from '@prisma/client';

/**
 * Result type for paginated project cost list
 */
export interface ProjectCostListResult {
  data: ProjectCostEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Abstract repository interface for Project Cost operations
 * Defines all database operations for project costs
 */
export abstract class IProjectCostRepository {
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new project cost entry
   * @param data - Project cost creation data
   * @param userId - ID of user creating the cost
   * @returns Created project cost entity
   */
  abstract create(
    data: CreateProjectCostDto,
    userId: string,
  ): Promise<ProjectCostEntity>;

  /**
   * Find project cost by ID
   * @param id - Project cost UUID
   * @param includeRelations - Whether to include related entities
   * @returns Project cost entity or null if not found
   */
  abstract findById(
    id: string,
    includeRelations?: boolean,
  ): Promise<ProjectCostEntity | null>;

  /**
   * Find all project costs with optional filtering and pagination
   * @param filters - Filter and pagination options
   * @returns Paginated list of project costs
   */
  abstract findAll(
    filters: ProjectCostFiltersDto,
  ): Promise<ProjectCostListResult>;

  /**
   * Update project cost
   * @param id - Project cost UUID
   * @param data - Update data
   * @returns Updated project cost entity
   */
  abstract update(
    id: string,
    data: UpdateProjectCostDto,
  ): Promise<ProjectCostEntity>;

  /**
   * Delete project cost
   * Note: Only costs with PENDING status can be deleted
   * @param id - Project cost UUID
   */
  abstract delete(id: string, rowVersion?: number): Promise<void>;

  // ============================================================================
  // APPROVAL WORKFLOW OPERATIONS
  // ============================================================================

  /**
   * Approve a project cost
   * Changes status from PENDING to APPROVED
   * @param id - Project cost UUID
   * @param userId - ID of user approving
   * @param notes - Optional approval notes
   * @returns Updated project cost entity
   */
  abstract approve(
    id: string,
    userId: string,
    notes?: string,
    rowVersion?: number,
  ): Promise<ProjectCostEntity>;

  /**
   * Reject a project cost
   * Changes status from PENDING to REJECTED
   * @param id - Project cost UUID
   * @param userId - ID of user rejecting
   * @param reason - Reason for rejection
   * @returns Updated project cost entity
   */
  abstract reject(
    id: string,
    userId: string,
    reason: string,
    rowVersion?: number,
  ): Promise<ProjectCostEntity>;

  /**
   * Mark cost as paid
   * Changes status to PAID and records payment details
   * @param id - Project cost UUID
   * @param paidDate - Date payment was made
   * @param paymentMethod - Payment method used
   * @param paymentReference - Payment reference number
   * @returns Updated project cost entity
   */
  abstract markAsPaid(
    id: string,
    paidDate: Date,
    paymentMethod?: string,
    paymentReference?: string,
  ): Promise<ProjectCostEntity>;

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  /**
   * Get all costs for a specific project
   * @param projectId - Project UUID
   * @param filters - Optional additional filters
   * @returns List of project costs
   */
  abstract findByProject(
    projectId: string,
    filters?: Partial<ProjectCostFiltersDto>,
  ): Promise<ProjectCostEntity[]>;

  /**
   * Get cost summary/statistics for a project
   * Includes total costs, paid amounts, breakdowns by type and status
   * @param projectId - Project UUID
   * @returns Project cost summary
   */
  abstract getProjectSummary(projectId: string): Promise<ProjectCostSummaryDto>;

  /**
   * Get costs by reference (e.g., all costs linked to a specific employee or asset)
   * @param referenceType - Type of reference (Employee, Asset, etc.)
   * @param referenceId - UUID of referenced entity
   * @returns Array of project cost entities
   */
  abstract findByReference(
    referenceType: string,
    referenceId: string,
  ): Promise<ProjectCostEntity[]>;

  /**
   * Get pending costs (awaiting approval)
   * @param projectId - Optional project filter
   * @returns Array of pending project costs
   */
  abstract findPendingCosts(projectId?: string): Promise<ProjectCostEntity[]>;

  /**
   * Get overdue payments
   * Costs that are approved but not paid after a certain period
   * @param daysOverdue - Number of days past transaction date
   * @returns Array of overdue project costs
   */
  abstract findOverdueCosts(daysOverdue: number): Promise<ProjectCostEntity[]>;

  /**
   * Calculate total costs for a project by cost type
   * @param projectId - Project UUID
   * @returns Object with cost totals by type
   */
  abstract getTotalsByType(
    projectId: string,
  ): Promise<Record<CostType, number>>;

  /**
   * Calculate total costs for a project by payment status
   * @param projectId - Project UUID
   * @returns Object with cost totals by status
   */
  abstract getTotalsByStatus(
    projectId: string,
  ): Promise<Record<PaymentStatus, number>>;
}

/**
 * Dependency injection token for Project Cost Repository
 */
export const PROJECT_COST_REPOSITORY = Symbol('PROJECT_COST_REPOSITORY');
