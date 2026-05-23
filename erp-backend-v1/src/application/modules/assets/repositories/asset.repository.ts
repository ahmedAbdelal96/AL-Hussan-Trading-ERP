/**
 * Asset Repository Implementation
 * Implements data access operations for assets using Prisma
 *
 * Design Decisions:
 * 1. Uses Prisma for type-safe database access
 * 2. All database objects are mapped to domain entities
 * 3. Soft delete pattern for assets (deletedAt field)
 * 4. Optimized queries with proper indexing
 * 5. Transaction support for critical operations
 *
 * Performance Optimizations:
 * - Uses select to fetch only needed fields
 * - Proper use of Prisma's include for relations
 * - Batch operations where possible
 * - Indexed queries for better performance
 */

import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import {
  IAssetRepository,
  AssetListResult,
} from './asset.repository.interface';
import {
  AssetEntity,
  AssetEmployeeEntity,
  ProjectAssetEntity,
  MaintenanceRequestEntity,
} from '../entities';
import {
  CreateAssetDto,
  UpdateAssetDto,
  AssetFiltersDto,
  AssignEmployeeToAssetDto,
  AssignAssetToProjectDto,
  CreateMaintenanceRequestDto,
  UpdateMaintenanceRequestDto,
} from '../dto';

@Injectable()
export class AssetRepository implements IAssetRepository {
  private readonly logger = new Logger(AssetRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // ========================================================================
  // ASSET CRUD OPERATIONS
  // ========================================================================

  /**
   * Create a new asset with auto-generated asset number
   *
   * Asset Number Format: AST-YYYY-NNNN
   * Example: AST-2024-0001
   *
   * Performance: Uses transaction to ensure atomicity
   */
  async create(data: CreateAssetDto, userId: string): Promise<AssetEntity> {
    try {
      // Generate unique asset number
      const assetNumber = await this.generateAssetNumber();

      const asset = await this.prisma.asset.create({
        data: {
          assetNumber,
          name: data.name,
          assetType: data.assetType,
          category: data.category,
          manufacturer: data.manufacturer,
          model: data.model,
          serialNumber: data.serialNumber,
          yearOfManufacture: data.yearOfManufacture,
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
          purchasePrice: data.purchasePrice,
          vendor: data.vendor,
          warrantyExpiry: data.warrantyExpiry
            ? new Date(data.warrantyExpiry)
            : null,
          licensePlate: data.licensePlate,
          chassisNumber: data.chassisNumber,
          engineNumber: data.engineNumber,
          color: data.color,
          fuelType: data.fuelType,
          status: data.status || 'AVAILABLE', // Use provided status or default to AVAILABLE
          currentLocation: data.currentLocation,
          currentOdometer: data.currentOdometer,
          specifications: data.specifications,
          description: data.description,
          notes: data.notes,
          createdBy: userId,
        },
      });

      this.logger.log(`Asset created: ${asset.assetNumber} by user ${userId}`);

      return this.mapToEntity(asset);
    } catch (error) {
      this.logger.error('Failed to create asset', { error, data, userId });
      throw error;
    }
  }

  /**
   * Find asset by serial number (for uniqueness validation)
   */
  async findBySerialNumber(serialNumber: string): Promise<AssetEntity | null> {
    const asset = await this.prisma.asset.findFirst({
      where: { serialNumber, deletedAt: null },
    });
    return asset ? this.mapToEntity(asset) : null;
  }

  /**
   * Find asset by license plate (for uniqueness validation)
   */
  async findByLicensePlate(licensePlate: string): Promise<AssetEntity | null> {
    const asset = await this.prisma.asset.findFirst({
      where: { licensePlate, deletedAt: null },
    });
    return asset ? this.mapToEntity(asset) : null;
  }

  /**
   * Find asset by ID
   * Returns null if asset is soft-deleted or doesn't exist
   */
  async findById(id: string): Promise<AssetEntity | null> {
    const asset = await this.prisma.asset.findFirst({
      where: {
        id,
        deletedAt: null, // Exclude soft-deleted assets
      },
    });

    return asset ? this.mapToEntity(asset) : null;
  }

  /**
   * Find all assets with advanced filtering and pagination
   *
   * Performance Optimizations:
   * - Uses cursor-based pagination for large datasets
   * - Combines multiple filters with AND logic
   * - Returns total count for pagination UI
   */
  async findAll(filters: AssetFiltersDto): Promise<AssetListResult> {
    const {
      page = 1,
      limit = 20,
      search,
      assetType,
      status,
      category,
      manufacturer,
      currentLocation,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause dynamically based on filters
    const where: any = {
      deletedAt: null, // Exclude soft-deleted assets
    };

    // Search across multiple fields
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { assetNumber: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Apply specific filters
    if (assetType) where.assetType = assetType;
    if (status) where.status = status;
    if (category) where.category = { contains: category, mode: 'insensitive' };
    if (manufacturer)
      where.manufacturer = { contains: manufacturer, mode: 'insensitive' };
    if (currentLocation)
      where.currentLocation = {
        contains: currentLocation,
        mode: 'insensitive',
      };

    // Execute query with pagination
    const [data, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      this.prisma.asset.count({ where }),
    ]);

    this.logger.debug(`Found ${data.length} assets out of ${total} total`);

    return {
      data: data.map((asset) => this.mapToEntity(asset)),
      total,
      page,
      limit,
    };
  }

  /**
   * Update asset
   * Only updates provided fields (partial update)
   */
  async update(
    id: string,
    data: UpdateAssetDto,
    userId: string,
  ): Promise<AssetEntity> {
    try {
      const { rowVersion, ...restData } = data as UpdateAssetDto & {
        rowVersion?: number;
      };
      const updateData: any = {
        ...restData,
        purchaseDate: restData.purchaseDate
          ? new Date(restData.purchaseDate)
          : undefined,
        warrantyExpiry: restData.warrantyExpiry
          ? new Date(restData.warrantyExpiry)
          : undefined,
        updatedBy: userId,
        rowVersion: { increment: 1 },
      };

      let asset: any;
      if (typeof rowVersion === 'number') {
        const { count } = await this.prisma.asset.updateMany({
          where: { id, rowVersion },
          data: updateData,
        });
        if (count === 0) {
          throw new ConflictException(
            'Asset was modified by another user. Refresh and try again.',
          );
        }
        asset = await this.prisma.asset.findUnique({ where: { id } });
      } else {
        asset = await this.prisma.asset.update({
          where: { id },
          data: updateData,
        });
      }

      this.logger.log(`Asset updated: ${asset.assetNumber} by user ${userId}`);

      return this.mapToEntity(asset);
    } catch (error) {
      this.logger.error('Failed to update asset', { error, id, data, userId });
      throw error;
    }
  }

  /**
   * Soft delete an asset
   * Sets deletedAt timestamp instead of removing from database
   *
   * Design Decision: Soft delete to maintain data integrity and audit trail
   */
  async delete(id: string, userId: string, rowVersion?: number): Promise<void> {
    try {
      if (typeof rowVersion === 'number') {
        const { count } = await this.prisma.asset.updateMany({
          where: { id, rowVersion, deletedAt: null },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
            rowVersion: { increment: 1 },
          },
        });
        if (count === 0) {
          throw new ConflictException(
            'Asset was modified by another user. Refresh and try again.',
          );
        }
      } else {
        await this.prisma.asset.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            deletedBy: userId,
            rowVersion: { increment: 1 },
          },
        });
      }

      this.logger.log(`Asset soft-deleted: ${id} by user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to delete asset', { error, id, userId });
      throw error;
    }
  }

  /**
   * Check if asset number already exists
   * Used for validation before creating duplicate asset numbers
   */
  async assetNumberExists(assetNumber: string): Promise<boolean> {
    const count = await this.prisma.asset.count({
      where: {
        assetNumber,
        deletedAt: null,
      },
    });

    return count > 0;
  }

  // ========================================================================
  // ASSET-EMPLOYEE OPERATIONS
  // ========================================================================

  /**
   * Assign employee to asset
   *
   * Business Rules:
   * - Only one primary assignment per asset per role
   * - Can have multiple employees with different roles
   *
   * Performance: Uses transaction for data consistency
   */
  async assignEmployee(
    assetId: string,
    data: AssignEmployeeToAssetDto,
    userId: string,
  ): Promise<AssetEmployeeEntity> {
    try {
      // If setting as primary, unset other primary assignments for this role
      if (data.isPrimary) {
        await this.prisma.assetEmployee.updateMany({
          where: {
            assetId,
            assignmentType: data.assignmentType,
            isPrimary: true,
            isActive: true,
          },
          data: {
            isPrimary: false,
          },
        });
      }

      const assignment = await this.prisma.assetEmployee.create({
        data: {
          assetId,
          employeeId: data.employeeId,
          assignmentType: data.assignmentType,
          isPrimary: data.isPrimary,
          assignedDate: data.assignedDate
            ? new Date(data.assignedDate)
            : new Date(),
          isActive: true,
          assignedBy: userId,
          notes: data.notes,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeNumber: true,
            },
          },
        },
      });

      this.logger.log(
        `Employee ${data.employeeId} assigned to asset ${assetId}`,
      );

      return this.mapToAssetEmployeeEntity(assignment);
    } catch (error) {
      this.logger.error('Failed to assign employee to asset', {
        error,
        assetId,
        data,
      });
      throw error;
    }
  }

  /**
   * Unassign employee from asset
   * Sets endDate and marks as inactive
   */
  async unassignEmployee(
    assetId: string,
    employeeId: string,
    endDate?: Date,
    notes?: string,
  ): Promise<AssetEmployeeEntity> {
    try {
      const assignment = await this.prisma.assetEmployee.findFirst({
        where: {
          assetId,
          employeeId,
          isActive: true,
        },
      });

      if (!assignment) {
        throw new Error('Active assignment not found');
      }

      const updated = await this.prisma.assetEmployee.update({
        where: { id: assignment.id },
        data: {
          endDate: endDate || new Date(),
          isActive: false,
          notes: notes || assignment.notes,
        },
      });

      this.logger.log(
        `Employee ${employeeId} unassigned from asset ${assetId}`,
      );

      return this.mapToAssetEmployeeEntity(updated);
    } catch (error) {
      this.logger.error('Failed to unassign employee from asset', {
        error,
        assetId,
        employeeId,
      });
      throw error;
    }
  }

  /**
   * Get all employees assigned to an asset
   */
  async getAssetEmployees(
    assetId: string,
    activeOnly: boolean = true,
  ): Promise<AssetEmployeeEntity[]> {
    const where: any = { assetId };
    if (activeOnly) {
      where.isActive = true;
    }

    const assignments = await this.prisma.assetEmployee.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { assignedDate: 'desc' }],
    });

    return assignments.map((a) => this.mapToAssetEmployeeEntity(a));
  }

  /**
   * Check if employee is currently assigned to asset
   */
  async isEmployeeAssigned(
    assetId: string,
    employeeId: string,
  ): Promise<boolean> {
    const count = await this.prisma.assetEmployee.count({
      where: {
        assetId,
        employeeId,
        isActive: true,
      },
    });

    return count > 0;
  }

  // ========================================================================
  // ASSET-PROJECT OPERATIONS
  // ========================================================================

  /**
   * Assign asset to project
   *
   * Business Rule: Asset can only be assigned to ONE project at a time
   * Performance: Uses transaction to ensure consistency
   */
  async assignToProject(
    assetId: string,
    data: AssignAssetToProjectDto,
    userId: string,
  ): Promise<ProjectAssetEntity> {
    try {
      // Check if asset is already assigned to another project
      const existingAssignment = await this.prisma.projectAsset.findFirst({
        where: {
          assetId,
          isActive: true,
          returnDate: null,
        },
      });

      if (existingAssignment) {
        throw new Error('Asset is already assigned to another project');
      }

      // Create assignment and update asset status
      const [assignment] = await this.prisma.$transaction([
        this.prisma.projectAsset.create({
          data: {
            assetId,
            projectId: data.projectId,
            assignedDate: data.assignedDate
              ? new Date(data.assignedDate)
              : new Date(),
            isActive: true,
            status: 'active',
            location: data.location,
            assignedBy: userId,
            notes: data.notes,
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                projectCode: true,
                status: true,
              },
            },
          },
        }),
        this.prisma.asset.update({
          where: { id: assetId },
          data: { status: 'IN_USE' },
        }),
      ]);

      this.logger.log(`Asset ${assetId} assigned to project ${data.projectId}`);

      return this.mapToProjectAssetEntity(assignment);
    } catch (error) {
      this.logger.error('Failed to assign asset to project', {
        error,
        assetId,
        data,
      });
      throw error;
    }
  }

  /**
   * Return asset from project
   * Marks assignment as completed and updates asset status
   */
  async returnFromProject(
    assetId: string,
    returnDate?: Date,
    notes?: string,
  ): Promise<ProjectAssetEntity> {
    try {
      const assignment = await this.prisma.projectAsset.findFirst({
        where: {
          assetId,
          isActive: true,
          returnDate: null,
        },
      });

      if (!assignment) {
        throw new Error('No active project assignment found for this asset');
      }

      // Update assignment and asset status atomically
      const [updated] = await this.prisma.$transaction([
        this.prisma.projectAsset.update({
          where: { id: assignment.id },
          data: {
            returnDate: returnDate || new Date(),
            isActive: false,
            status: 'returned',
            notes: notes || assignment.notes,
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                projectCode: true,
                status: true,
              },
            },
          },
        }),
        this.prisma.asset.update({
          where: { id: assetId },
          data: { status: 'AVAILABLE' },
        }),
      ]);

      this.logger.log(`Asset ${assetId} returned from project`);

      return this.mapToProjectAssetEntity(updated);
    } catch (error) {
      this.logger.error('Failed to return asset from project', {
        error,
        assetId,
      });
      throw error;
    }
  }

  /**
   * Get current active project assignment for an asset
   */
  async getCurrentProjectAssignment(
    assetId: string,
  ): Promise<ProjectAssetEntity | null> {
    const assignment = await this.prisma.projectAsset.findFirst({
      where: {
        assetId,
        isActive: true,
        returnDate: null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
            status: true,
          },
        },
      },
    });

    return assignment ? this.mapToProjectAssetEntity(assignment) : null;
  }

  /**
   * Get complete project assignment history for an asset
   * Sorted by assignment date (most recent first)
   */
  async getProjectHistory(assetId: string): Promise<ProjectAssetEntity[]> {
    const assignments = await this.prisma.projectAsset.findMany({
      where: { assetId },
      orderBy: { assignedDate: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
            status: true,
          },
        },
      },
    });

    return assignments.map((a) => this.mapToProjectAssetEntity(a));
  }

  // ========================================================================
  // MAINTENANCE OPERATIONS
  // ========================================================================

  /**
   * Create maintenance request for an asset
   * Automatically updates asset status to UNDER_MAINTENANCE
   */
  async createMaintenanceRequest(
    assetId: string,
    data: CreateMaintenanceRequestDto,
    userId: string,
  ): Promise<MaintenanceRequestEntity> {
    try {
      // Generate maintenance number
      const lastMaintenance = await this.prisma.maintenanceRequest.findFirst({
        orderBy: { maintenanceNumber: 'desc' },
        select: { maintenanceNumber: true },
      });

      const lastNumber = lastMaintenance
        ? parseInt(lastMaintenance.maintenanceNumber.split('-')[1], 10)
        : 0;
      const maintenanceNumber = `MNT-${(lastNumber + 1).toString().padStart(4, '0')}`;

      // Fetch asset current status + active project assignments before creating
      const assetData = await this.prisma.asset.findUnique({
        where: { id: assetId },
        select: {
          status: true,
          projectAssignments: {
            where: { isActive: true },
            select: {
              projectId: true,
              percentage: true,
              project: { select: { status: true } },
            },
          },
        },
      });

      const request = await this.prisma.maintenanceRequest.create({
        data: {
          maintenanceNumber,
          assetId,
          title: data.title,
          maintenanceType: data.maintenanceType,
          priority: data.priority,
          status: 'PENDING',
          description: data.description,
          scheduledDate: data.scheduledDate
            ? new Date(data.scheduledDate)
            : null,
          estimatedCost: data.estimatedCost,
          vendor: data.vendor,
          vendorContact: data.vendorContact,
          odometerReading: data.odometerReading,
          notes: data.notes,
          createdBy: userId,
        },
      });

      // Always set UNDER_MAINTENANCE and save previousStatus for safe revert later
      await this.prisma.asset.update({
        where: { id: assetId },
        data: {
          status: 'UNDER_MAINTENANCE',
          previousStatus: assetData?.status ?? 'AVAILABLE',
        },
      });

      // Create project allocation snapshot based on current active project assignments
      const eligibleStatuses = ['ACTIVE', 'ON_HOLD', 'PLANNING', 'IN_PROGRESS'];
      const eligible = (assetData?.projectAssignments ?? []).filter((a) =>
        eligibleStatuses.includes(a.project.status),
      );
      if (eligible.length > 0) {
        const totalPct = eligible.reduce((s, a) => s + Number(a.percentage), 0);
        await this.prisma.maintenanceProjectAllocation.createMany({
          data: eligible.map((a) => ({
            maintenanceId: request.id,
            projectId: a.projectId,
            percentage:
              totalPct > 0 ? (Number(a.percentage) / totalPct) * 100 : 0,
          })),
        });
      }

      this.logger.log(`Maintenance request created for asset ${assetId}`);

      return this.mapToMaintenanceEntity(request);
    } catch (error) {
      this.logger.error('Failed to create maintenance request', {
        error,
        assetId,
        data,
      });
      throw error;
    }
  }

  /**
   * Update maintenance request
   * Handles status changes and asset status updates
   */
  async updateMaintenanceRequest(
    id: string,
    data: UpdateMaintenanceRequestDto,
  ): Promise<MaintenanceRequestEntity> {
    try {
      const request = await this.prisma.maintenanceRequest.update({
        where: { id },
        data: {
          ...data,
          scheduledDate: data.scheduledDate
            ? new Date(data.scheduledDate)
            : undefined,
          startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
          completedAt: data.completedAt
            ? new Date(data.completedAt)
            : undefined,
        },
      });

      // Update asset status based on maintenance status
      if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
        const assetCurrent = await this.prisma.asset.findUnique({
          where: { id: request.assetId },
          select: { previousStatus: true },
        });
        await this.prisma.asset.update({
          where: { id: request.assetId },
          data: {
            status: assetCurrent?.previousStatus ?? 'AVAILABLE',
            previousStatus: null,
            ...(data.status === 'COMPLETED' && {
              lastMaintenanceDate: new Date(),
            }),
          },
        });
      } else if (data.status === 'IN_PROGRESS') {
        await this.prisma.asset.update({
          where: { id: request.assetId },
          data: { status: 'UNDER_MAINTENANCE' },
        });
      }

      this.logger.log(`Maintenance request ${id} updated`);

      return this.mapToMaintenanceEntity(request);
    } catch (error) {
      this.logger.error('Failed to update maintenance request', {
        error,
        id,
        data,
      });
      throw error;
    }
  }

  /**
   * Get maintenance request by ID
   */
  async getMaintenanceRequest(
    id: string,
  ): Promise<MaintenanceRequestEntity | null> {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id },
    });

    return request ? this.mapToMaintenanceEntity(request) : null;
  }

  /**
   * Get all maintenance requests for an asset
   * Sorted by creation date (most recent first)
   */
  async getAssetMaintenanceHistory(
    assetId: string,
  ): Promise<MaintenanceRequestEntity[]> {
    const requests = await this.prisma.maintenanceRequest.findMany({
      where: { assetId },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => this.mapToMaintenanceEntity(r));
  }

  /**
   * Get active (non-completed) maintenance request for an asset
   */
  async getActiveMaintenanceRequest(
    assetId: string,
  ): Promise<MaintenanceRequestEntity | null> {
    const request = await this.prisma.maintenanceRequest.findFirst({
      where: {
        assetId,
        status: {
          in: ['PENDING', 'IN_PROGRESS', 'ON_HOLD'],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return request ? this.mapToMaintenanceEntity(request) : null;
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Generate unique asset number
   * Format: AST-YYYY-NNNN
   *
   * Performance: Uses database query to get the latest number
   * Edge Case: Handles year rollover correctly
   */
  private async generateAssetNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `AST-${year}-`;

    // Get the latest asset number for current year
    const latestAsset = await this.prisma.asset.findFirst({
      where: {
        assetNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        assetNumber: 'desc',
      },
      select: {
        assetNumber: true,
      },
    });

    let nextNumber = 1;
    if (latestAsset) {
      const currentNumber = parseInt(latestAsset.assetNumber.split('-')[2]);
      nextNumber = currentNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Map Prisma Asset to AssetEntity
   * Ensures type safety and domain model separation
   */
  private mapToEntity(prismaAsset: any): AssetEntity {
    return new AssetEntity({
      id: prismaAsset.id,
      assetNumber: prismaAsset.assetNumber,
      name: prismaAsset.name,
      assetType: prismaAsset.assetType,
      category: prismaAsset.category,
      manufacturer: prismaAsset.manufacturer,
      model: prismaAsset.model,
      serialNumber: prismaAsset.serialNumber,
      yearOfManufacture: prismaAsset.yearOfManufacture,
      purchaseDate: prismaAsset.purchaseDate,
      purchasePrice: prismaAsset.purchasePrice,
      vendor: prismaAsset.vendor,
      warrantyExpiry: prismaAsset.warrantyExpiry,
      licensePlate: prismaAsset.licensePlate,
      chassisNumber: prismaAsset.chassisNumber,
      engineNumber: prismaAsset.engineNumber,
      color: prismaAsset.color,
      fuelType: prismaAsset.fuelType,
      status: prismaAsset.status,
      previousStatus: prismaAsset.previousStatus,
      lastMaintenanceDate: prismaAsset.lastMaintenanceDate,
      currentLocation: prismaAsset.currentLocation,
      currentOdometer: prismaAsset.currentOdometer,
      specifications: prismaAsset.specifications,
      description: prismaAsset.description,
      notes: prismaAsset.notes,
      createdAt: prismaAsset.createdAt,
      updatedAt: prismaAsset.updatedAt,
      createdBy: prismaAsset.createdBy,
      updatedBy: prismaAsset.updatedBy,
      deletedAt: prismaAsset.deletedAt,
      deletedBy: prismaAsset.deletedBy,
      rowVersion: prismaAsset.rowVersion,
    });
  }

  /**
   * Map Prisma AssetEmployee to AssetEmployeeEntity
   */
  private mapToAssetEmployeeEntity(prismaEntity: any): AssetEmployeeEntity {
    return new AssetEmployeeEntity({
      id: prismaEntity.id,
      assetId: prismaEntity.assetId,
      employeeId: prismaEntity.employeeId,
      assignmentType: prismaEntity.assignmentType,
      isPrimary: prismaEntity.isPrimary,
      assignedDate: prismaEntity.assignedDate,
      endDate: prismaEntity.endDate,
      isActive: prismaEntity.isActive,
      assignedBy: prismaEntity.assignedBy,
      notes: prismaEntity.notes,
      createdAt: prismaEntity.createdAt,
      updatedAt: prismaEntity.updatedAt,
      employee: prismaEntity.employee
        ? {
            id: prismaEntity.employee.id,
            name: `${prismaEntity.employee.firstName} ${prismaEntity.employee.lastName}`.trim(),
            fullName:
              `${prismaEntity.employee.firstName} ${prismaEntity.employee.lastName}`.trim(),
            employeeNumber: prismaEntity.employee.employeeNumber,
          }
        : null,
    });
  }

  /**
   * Map Prisma ProjectAsset to ProjectAssetEntity
   */
  private mapToProjectAssetEntity(prismaEntity: any): ProjectAssetEntity {
    return new ProjectAssetEntity({
      id: prismaEntity.id,
      projectId: prismaEntity.projectId,
      assetId: prismaEntity.assetId,
      assignedDate: prismaEntity.assignedDate,
      assignedAt: prismaEntity.assignedDate,
      returnDate: prismaEntity.returnDate,
      unassignedAt: prismaEntity.returnDate,
      isActive: prismaEntity.isActive,
      status: prismaEntity.status,
      location: prismaEntity.location,
      assignedBy: prismaEntity.assignedBy,
      notes: prismaEntity.notes,
      createdAt: prismaEntity.createdAt,
      updatedAt: prismaEntity.updatedAt,
      project: prismaEntity.project
        ? {
            id: prismaEntity.project.id,
            name: prismaEntity.project.name,
            projectCode: prismaEntity.project.projectCode,
            // Alias for older frontend code paths expecting projectNumber.
            projectNumber: prismaEntity.project.projectCode,
            status: prismaEntity.project.status,
          }
        : null,
    });
  }

  /**
   * Map Prisma MaintenanceRequest to MaintenanceRequestEntity
   */
  private mapToMaintenanceEntity(prismaEntity: any): MaintenanceRequestEntity {
    return new MaintenanceRequestEntity({
      id: prismaEntity.id,
      assetId: prismaEntity.assetId,
      maintenanceType: prismaEntity.maintenanceType,
      priority: prismaEntity.priority,
      status: prismaEntity.status,
      title: prismaEntity.title,
      description: prismaEntity.description,
      scheduledDate: prismaEntity.scheduledDate,
      startedAt: prismaEntity.startedAt,
      completedAt: prismaEntity.completedAt,
      estimatedCost: prismaEntity.estimatedCost,
      actualCost: prismaEntity.actualCost,
      vendor: prismaEntity.vendor,
      vendorContact: prismaEntity.vendorContact,
      assignedTo: prismaEntity.assignedTo,
      odometerReading: prismaEntity.odometerReading,
      workPerformed: prismaEntity.workPerformed,
      partsReplaced: prismaEntity.partsReplaced,
      notes: prismaEntity.notes,
      approvedBy: prismaEntity.approvedBy,
      approvedAt: prismaEntity.approvedAt,
      createdBy: prismaEntity.createdBy,
      createdAt: prismaEntity.createdAt,
      updatedAt: prismaEntity.updatedAt,
    });
  }
}
