import { CostCategoryEntity } from '../entities';
import {
  CreateCostCategoryDto,
  UpdateCostCategoryDto,
  CostCategoryFiltersDto,
} from '../dto';

/**
 * Result type for paginated cost category list
 */
export interface CostCategoryListResult {
  data: CostCategoryEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Abstract repository interface for Cost Category operations
 * Defines all database operations for cost categories
 */
export abstract class ICostCategoryRepository {
  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new cost category
   * @param data - Cost category creation data
   * @returns Created cost category entity
   */
  abstract create(data: CreateCostCategoryDto): Promise<CostCategoryEntity>;

  /**
   * Find cost category by ID
   * @param id - Cost category UUID
   * @param includeRelations - Whether to include parent and children
   * @returns Cost category entity or null if not found
   */
  abstract findById(
    id: string,
    includeRelations?: boolean,
  ): Promise<CostCategoryEntity | null>;

  /**
   * Find all cost categories with optional filtering and pagination
   * @param filters - Filter and pagination options
   * @returns Paginated list of cost categories
   */
  abstract findAll(
    filters: CostCategoryFiltersDto,
  ): Promise<CostCategoryListResult>;

  /**
   * Update cost category
   * @param id - Cost category UUID
   * @param data - Update data
   * @returns Updated cost category entity
   */
  abstract update(
    id: string,
    data: UpdateCostCategoryDto,
  ): Promise<CostCategoryEntity>;

  /**
   * Delete cost category
   * Note: Will fail if category has associated costs
   * @param id - Cost category UUID
   */
  abstract delete(id: string, rowVersion?: number): Promise<void>;

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  /**
   * Find cost category by name
   * @param name - Category name
   * @returns Cost category entity or null
   */
  abstract findByName(name: string): Promise<CostCategoryEntity | null>;

  /**
   * Get all root categories (categories without parent)
   * @returns Array of root category entities
   */
  abstract findRootCategories(): Promise<CostCategoryEntity[]>;

  /**
   * Get children categories of a parent category
   * @param parentId - Parent category UUID
   * @returns Array of child category entities
   */
  abstract findChildren(parentId: string): Promise<CostCategoryEntity[]>;

  /**
   * Check if category has associated costs
   * @param id - Cost category UUID
   * @returns True if category has costs
   */
  abstract hasCosts(id: string): Promise<boolean>;

  /**
   * Check if category has children
   * @param id - Cost category UUID
   * @returns True if category has children
   */
  abstract hasChildren(id: string): Promise<boolean>;

  /**
   * Get category hierarchy (full tree structure)
   * @param rootId - Optional root category ID to start from
   * @returns Array of categories with nested children
   */
  abstract getCategoryHierarchy(rootId?: string): Promise<CostCategoryEntity[]>;
}

/**
 * Dependency injection token for Cost Category Repository
 */
export const COST_CATEGORY_REPOSITORY = Symbol('COST_CATEGORY_REPOSITORY');
