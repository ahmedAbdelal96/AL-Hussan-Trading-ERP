import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  ICostCategoryRepository,
  CostCategoryListResult,
} from './cost-category.repository.interface';
import { CostCategoryEntity } from '../entities';
import {
  CreateCostCategoryDto,
  UpdateCostCategoryDto,
  CostCategoryFiltersDto,
} from '../dto';

/**
 * Cost Category Repository Implementation
 * Handles all database operations for cost categories
 *
 * Features:
 * - Full CRUD operations
 * - Hierarchical category support
 * - Validation to prevent orphaned costs
 * - Comprehensive error handling
 */
@Injectable()
export class CostCategoryRepository implements ICostCategoryRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(CostCategoryRepository.name);
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new cost category
   * Validates unique name constraint and parent existence
   */
  async create(data: CreateCostCategoryDto): Promise<CostCategoryEntity> {
    try {
      // Check if name already exists
      const existing = await this.prisma.costCategory.findUnique({
        where: { name: data.name },
      });

      if (existing) {
        throw new ConflictException(
          `Cost category with name "${data.name}" already exists`,
        );
      }

      // If parentId provided, validate parent exists
      if (data.parentId) {
        const parent = await this.prisma.costCategory.findUnique({
          where: { id: data.parentId },
        });

        if (!parent) {
          throw new NotFoundException(
            `Parent category with ID ${data.parentId} not found`,
          );
        }
      }

      const category = await this.prisma.costCategory.create({
        data: {
          name: data.name,
          description: data.description,
          parentId: data.parentId,
          isActive: data.isActive ?? true,
        },
        include: {
          parent: true,
          children: true,
        },
      });

      this.logger.log(`Cost category created: ${category.name}`);
      return this.mapToEntity(category);
    } catch (error) {
      this.logger.error(`Failed to create cost category: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find cost category by ID
   */
  async findById(
    id: string,
    includeRelations: boolean = false,
  ): Promise<CostCategoryEntity | null> {
    const category = await this.prisma.costCategory.findUnique({
      where: { id },
      include: includeRelations
        ? {
            parent: true,
            children: true,
            _count: {
              select: { costs: true, children: true },
            },
          }
        : undefined,
    });

    return category ? this.mapToEntity(category) : null;
  }

  /**
   * Find all cost categories with filtering and pagination
   */
  async findAll(
    filters: CostCategoryFiltersDto,
  ): Promise<CostCategoryListResult> {
    const {
      search,
      parentId,
      isActive,
      rootOnly,
      includeChildren,
      page,
      limit,
      sortBy,
      sortOrder,
    } = filters;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    if (rootOnly) {
      where.parentId = null;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Calculate pagination
    const finalPage = page || 1;
    const finalLimit = limit || 10;
    const finalSortBy = sortBy || 'name';
    const finalSortOrder = sortOrder || 'asc';
    const skip = (finalPage - 1) * finalLimit;

    // Execute queries
    const [categories, total] = await Promise.all([
      this.prisma.costCategory.findMany({
        where,
        skip,
        take: finalLimit,
        orderBy: { [finalSortBy]: finalSortOrder },
        include: includeChildren
          ? {
              parent: true,
              children: true,
              _count: {
                select: { costs: true, children: true },
              },
            }
          : undefined,
      }),
      this.prisma.costCategory.count({ where }),
    ]);

    return {
      data: categories.map((cat) => this.mapToEntity(cat)),
      total,
      page: finalPage,
      limit: finalLimit,
      totalPages: Math.ceil(total / finalLimit),
    };
  }

  /**
   * Update cost category
   */
  async update(
    id: string,
    data: UpdateCostCategoryDto,
  ): Promise<CostCategoryEntity> {
    try {
      // Check if category exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new NotFoundException(`Cost category with ID ${id} not found`);
      }

      // If updating name, check for duplicates
      if (data.name && data.name !== existing.name) {
        const duplicate = await this.prisma.costCategory.findUnique({
          where: { name: data.name },
        });

        if (duplicate) {
          throw new ConflictException(
            `Cost category with name "${data.name}" already exists`,
          );
        }
      }

      // If updating parentId, validate parent exists and prevent circular reference
      if (data.parentId !== undefined) {
        if (data.parentId === id) {
          throw new ConflictException('Category cannot be its own parent');
        }

        if (data.parentId) {
          const parent = await this.prisma.costCategory.findUnique({
            where: { id: data.parentId },
          });

          if (!parent) {
            throw new NotFoundException(
              `Parent category with ID ${data.parentId} not found`,
            );
          }

          // Check if new parent is a descendant (would create circular reference)
          const isDescendant = await this.isDescendant(id, data.parentId);
          if (isDescendant) {
            throw new ConflictException(
              'Cannot set a descendant category as parent (circular reference)',
            );
          }
        }
      }

      const updateData = {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        isActive: data.isActive,
        rowVersion: { increment: 1 },
      };

      let updated: any;
      if (typeof data.rowVersion === 'number') {
        const { count } = await this.prisma.costCategory.updateMany({
          where: { id, rowVersion: data.rowVersion },
          data: updateData,
        });
        if (count === 0) {
          throw new ConflictException(
            'Cost category was modified by another user. Refresh and try again.',
          );
        }
        updated = await this.prisma.costCategory.findUnique({
          where: { id },
          include: {
            parent: true,
            children: true,
          },
        });
      } else {
        updated = await this.prisma.costCategory.update({
          where: { id },
          data: updateData,
          include: {
            parent: true,
            children: true,
          },
        });
      }
      if (!updated) {
        throw new NotFoundException(`Cost category with ID ${id} not found`);
      }

      this.logger.log(`Cost category updated: ${updated.name}`);
      return this.mapToEntity(updated);
    } catch (error) {
      this.logger.error(`Failed to update cost category: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete cost category
   * Prevents deletion if category has associated costs or children
   */
  async delete(id: string, rowVersion?: number): Promise<void> {
    try {
      const category = await this.findById(id);
      if (!category) {
        throw new NotFoundException(`Cost category with ID ${id} not found`);
      }

      // Check if category has associated costs
      const costsCount = await this.prisma.cost.count({
        where: { categoryId: id },
      });

      if (costsCount > 0) {
        throw new ConflictException(
          `Cannot delete category with ${costsCount} associated costs`,
        );
      }

      // Check if category has children
      const childrenCount = await this.prisma.costCategory.count({
        where: { parentId: id },
      });

      if (childrenCount > 0) {
        throw new ConflictException(
          `Cannot delete category with ${childrenCount} sub-categories`,
        );
      }

      if (typeof rowVersion === 'number') {
        const result = await this.prisma.costCategory.deleteMany({
          where: { id, rowVersion },
        });
        if (result.count === 0) {
          throw new ConflictException(
            'Cost category was modified by another user. Refresh and try again.',
          );
        }
      } else {
        await this.prisma.costCategory.delete({
          where: { id },
        });
      }

      this.logger.log(`Cost category deleted: ${category.name}`);
    } catch (error) {
      this.logger.error(`Failed to delete cost category: ${error.message}`);
      throw error;
    }
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  async findByName(name: string): Promise<CostCategoryEntity | null> {
    const category = await this.prisma.costCategory.findUnique({
      where: { name },
    });
    return category ? this.mapToEntity(category) : null;
  }

  async findRootCategories(): Promise<CostCategoryEntity[]> {
    const categories = await this.prisma.costCategory.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: {
        children: true,
        _count: {
          select: { costs: true, children: true },
        },
      },
    });
    return categories.map((cat) => this.mapToEntity(cat));
  }

  async findChildren(parentId: string): Promise<CostCategoryEntity[]> {
    const categories = await this.prisma.costCategory.findMany({
      where: { parentId },
      orderBy: { name: 'asc' },
      include: {
        children: true,
        _count: {
          select: { costs: true, children: true },
        },
      },
    });
    return categories.map((cat) => this.mapToEntity(cat));
  }

  async hasCosts(id: string): Promise<boolean> {
    const count = await this.prisma.cost.count({
      where: { categoryId: id },
    });
    return count > 0;
  }

  async hasChildren(id: string): Promise<boolean> {
    const count = await this.prisma.costCategory.count({
      where: { parentId: id },
    });
    return count > 0;
  }

  async getCategoryHierarchy(rootId?: string): Promise<CostCategoryEntity[]> {
    const where = rootId ? { id: rootId } : { parentId: null };

    const categories = await this.prisma.costCategory.findMany({
      where,
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true, // 3 levels deep
              },
            },
          },
        },
        _count: {
          select: { costs: true, children: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((cat) => this.mapToEntity(cat));
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check if potentialChild is a descendant of potentialParent
   * Used to prevent circular references
   */
  private async isDescendant(
    potentialParent: string,
    potentialChild: string,
  ): Promise<boolean> {
    let current = await this.prisma.costCategory.findUnique({
      where: { id: potentialChild },
      select: { parentId: true },
    });

    while (current?.parentId) {
      if (current.parentId === potentialParent) {
        return true;
      }
      current = await this.prisma.costCategory.findUnique({
        where: { id: current.parentId },
        select: { parentId: true },
      });
    }

    return false;
  }

  /**
   * Map Prisma object to Entity
   */
  private mapToEntity(prismaCategory: any): CostCategoryEntity {
    return new CostCategoryEntity({
      id: prismaCategory.id,
      name: prismaCategory.name,
      description: prismaCategory.description,
      parentId: prismaCategory.parentId,
      isActive: prismaCategory.isActive,
      rowVersion: prismaCategory.rowVersion,
      createdAt: prismaCategory.createdAt,
      updatedAt: prismaCategory.updatedAt,
      parent: prismaCategory.parent
        ? this.mapToEntity(prismaCategory.parent)
        : undefined,
      children: prismaCategory.children
        ? prismaCategory.children.map((child: any) => this.mapToEntity(child))
        : undefined,
    });
  }
}
