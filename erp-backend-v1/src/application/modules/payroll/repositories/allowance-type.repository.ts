import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { IAllowanceTypeRepository } from './index';
import { AllowanceTypeEntity } from '../entities';
import {
  CreateAllowanceTypeDto,
  UpdateAllowanceTypeDto,
  AllowanceTypeFiltersDto,
} from '../dto';

/**
 * Allowance Type Repository Implementation
 * Handles all database operations for allowance type master data
 *
 * Features:
 * - CRUD operations with validation
 * - Active/Inactive status management
 * - Name-based lookups
 * - Duplicate name prevention
 */
@Injectable()
export class AllowanceTypeRepository implements IAllowanceTypeRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(AllowanceTypeRepository.name);
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Create a new allowance type
   */
  async create(
    data: CreateAllowanceTypeDto,
    userId: string,
  ): Promise<AllowanceTypeEntity> {
    try {
      // Check for duplicate name
      const existing = await this.prisma.allowanceType.findUnique({
        where: { name: data.name },
      });

      if (existing) {
        throw new ConflictException(
          `Allowance type with name "${data.name}" already exists`,
        );
      }

      const allowanceType = await this.prisma.allowanceType.create({
        data: {
          name: data.name,
          description: data.description,
          defaultAmount:
            data.defaultAmount !== undefined
              ? new Prisma.Decimal(data.defaultAmount)
              : null,
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdBy: userId,
        },
      });

      this.logger.log(
        `Allowance type created: ${allowanceType.id} - ${allowanceType.name}`,
      );
      return this.mapToEntity(allowanceType);
    } catch (error) {
      this.logger.error(`Failed to create allowance type: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find allowance type by ID
   */
  async findById(id: string): Promise<AllowanceTypeEntity | null> {
    const allowanceType = await this.prisma.allowanceType.findUnique({
      where: { id },
    });

    return allowanceType ? this.mapToEntity(allowanceType) : null;
  }

  /**
   * Find all allowance types with filtering and pagination
   */
  async findAll(filters: AllowanceTypeFiltersDto): Promise<{
    data: AllowanceTypeEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { search, isActive, page, limit, sortBy, sortOrder } = filters;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) where.isActive = isActive;

    // Calculate pagination
    const finalPage = page || 1;
    const finalLimit = limit || 10;
    const finalSortBy = sortBy || 'name';
    const finalSortOrder = sortOrder || 'asc';
    const skip = (finalPage - 1) * finalLimit;

    // Execute queries
    const [allowanceTypes, total] = await Promise.all([
      this.prisma.allowanceType.findMany({
        where,
        skip,
        take: finalLimit,
        orderBy: { [finalSortBy]: finalSortOrder },
      }),
      this.prisma.allowanceType.count({ where }),
    ]);

    return {
      data: allowanceTypes.map((type) => this.mapToEntity(type)),
      total,
      page: finalPage,
      limit: finalLimit,
      totalPages: Math.ceil(total / finalLimit),
    };
  }

  /**
   * Update allowance type
   */
  async update(
    id: string,
    data: UpdateAllowanceTypeDto,
  ): Promise<AllowanceTypeEntity> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new NotFoundException(`Allowance type with ID ${id} not found`);
      }

      // Check for duplicate name if name is being updated
      if (data.name && data.name !== existing.name) {
        const duplicate = await this.prisma.allowanceType.findUnique({
          where: { name: data.name },
        });

        if (duplicate) {
          throw new ConflictException(
            `Allowance type with name "${data.name}" already exists`,
          );
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined)
        updateData.description = data.description;
      if (data.defaultAmount !== undefined) {
        updateData.defaultAmount = new Prisma.Decimal(data.defaultAmount);
      }
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      updateData.rowVersion = { increment: 1 };

      const expectedRowVersion = data.rowVersion;
      let updated: any;

      if (expectedRowVersion !== undefined) {
        const result = await this.prisma.allowanceType.updateMany({
          where: { id, rowVersion: expectedRowVersion },
          data: updateData,
        });

        if (result.count === 0) {
          throw new ConflictException(
            'This record was modified by another user. Please refresh and retry.',
          );
        }

        updated = await this.prisma.allowanceType.findUniqueOrThrow({
          where: { id },
        });
      } else {
        updated = await this.prisma.allowanceType.update({
          where: { id },
          data: updateData,
        });
      }

      this.logger.log(`Allowance type updated: ${id}`);
      return this.mapToEntity(updated);
    } catch (error) {
      this.logger.error(`Failed to update allowance type: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete allowance type
   */
  async delete(id: string, rowVersion?: number): Promise<void> {
    try {
      const allowanceType = await this.findById(id);
      if (!allowanceType) {
        throw new NotFoundException(`Allowance type with ID ${id} not found`);
      }

      // Check if allowance type is used by any employee allowances
      const usageCount = await this.prisma.employeeAllowance.count({
        where: { allowanceTypeId: id },
      });

      if (usageCount > 0) {
        throw new ConflictException(
          `Cannot delete allowance type as it is used by ${usageCount} employee allowance(s)`,
        );
      }

      if (typeof rowVersion === 'number') {
        const result = await this.prisma.allowanceType.deleteMany({
          where: { id, rowVersion },
        });
        if (result.count === 0) {
          throw new ConflictException(
            'Allowance type was modified by another user. Refresh and try again.',
          );
        }
      } else {
        await this.prisma.allowanceType.delete({
          where: { id },
        });
      }

      this.logger.log(`Allowance type deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete allowance type: ${error.message}`);
      throw error;
    }
  }

  // ============================================================================
  // QUERY OPERATIONS
  // ============================================================================

  /**
   * Find all active allowance types
   */
  async findAllActive(): Promise<AllowanceTypeEntity[]> {
    const allowanceTypes = await this.prisma.allowanceType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return allowanceTypes.map((type) => this.mapToEntity(type));
  }

  /**
   * Find allowance type by name
   */
  async findByName(name: string): Promise<AllowanceTypeEntity | null> {
    const allowanceType = await this.prisma.allowanceType.findUnique({
      where: { name },
    });

    return allowanceType ? this.mapToEntity(allowanceType) : null;
  }

  /**
   * Get aggregated allowance-type statistics for list KPI cards.
   * Pagination-independent by design.
   */
  async getStatistics(filters?: { search?: string }): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const where: Prisma.AllowanceTypeWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [total, active] = await Promise.all([
      this.prisma.allowanceType.count({ where }),
      this.prisma.allowanceType.count({
        where: { ...where, isActive: true },
      }),
    ]);

    return {
      total,
      active,
      inactive: Math.max(total - active, 0),
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Map Prisma object to Entity
   */
  private mapToEntity(prismaType: any): AllowanceTypeEntity {
    return new AllowanceTypeEntity({
      id: prismaType.id,
      name: prismaType.name,
      description: prismaType.description,
      defaultAmount:
        prismaType.defaultAmount !== null &&
        prismaType.defaultAmount !== undefined
          ? Number(prismaType.defaultAmount)
          : undefined,
      isActive: prismaType.isActive,
      rowVersion: prismaType.rowVersion,
      createdAt: prismaType.createdAt,
      updatedAt: prismaType.updatedAt,
    });
  }
}
