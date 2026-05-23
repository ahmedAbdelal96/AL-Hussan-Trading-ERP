import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserFiltersDto } from '../dto/user-filters.dto';
import { calculateSkip } from '../../../common/dto';

/**
 * User Repository Interface
 * Defines contract for user data access
 */
export abstract class IUserRepository {
  abstract create(
    data: CreateUserDto,
    hashedPassword: string,
  ): Promise<UserEntity>;
  abstract findById(
    id: string,
    includeRoles?: boolean,
  ): Promise<UserEntity | null>;
  abstract findByEmail(
    email: string,
    includeRoles?: boolean,
  ): Promise<UserEntity | null>;
  abstract findAll(
    filters: UserFiltersDto,
  ): Promise<{ users: UserEntity[]; total: number }>;
  abstract findDeleted(
    filters: UserFiltersDto,
  ): Promise<{ users: UserEntity[]; total: number }>;
  abstract findDeletedById(id: string): Promise<UserEntity | null>;
  abstract update(id: string, data: UpdateUserDto): Promise<UserEntity>;
  abstract delete(
    id: string,
    deletedBy: string,
    rowVersion?: number,
  ): Promise<void>;
  abstract hardDelete(id: string): Promise<void>;
  abstract restore(id: string, restoredBy: string): Promise<UserEntity>;
  abstract getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    locked: number;
  }>;
  abstract count(): Promise<number>;
  abstract existsByEmail(email: string): Promise<boolean>;
}

/**
 * User Repository Implementation
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    private prisma: PrismaService,
    private logger: WinstonLoggerService,
  ) {}

  /**
   * Create new user
   */
  async create(
    data: CreateUserDto,
    hashedPassword: string,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
      },
      include: {
        userRoles: {
          where: { isActive: true },
          select: { role: { select: { name: true } } },
        },
      },
    });

    return this.mapToEntity(user);
  }

  /**
   * Find user by ID
   */
  async findById(
    id: string,
    includeRoles: boolean = false,
  ): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: includeRoles
        ? {
            userRoles: {
              where: { isActive: true },
              select: { role: { select: { name: true } } },
            },
          }
        : undefined,
    });

    return user ? this.mapToEntity(user) : null;
  }

  /**
   * Find user by email
   */
  async findByEmail(
    email: string,
    includeRoles: boolean = false,
  ): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: includeRoles
        ? {
            userRoles: {
              where: { isActive: true },
              select: { role: { select: { name: true } } },
            },
          }
        : undefined,
    });

    return user ? this.mapToEntity(user) : null;
  }

  /**
   * Find all users with filters and pagination
   */
  async findAll(
    filters: UserFiltersDto,
  ): Promise<{ users: UserEntity[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      isActive,
      roleId,
      roleName,
    } = filters;

    const skip = calculateSkip(page, pageSize);

    // Build where clause
    const where: any = {
      deletedAt: null, // Exclude soft-deleted users
    };

    // Filter by active status
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Search by email, firstName, or lastName
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by role
    if (roleId || roleName) {
      where.userRoles = {
        some: {
          isActive: true,
          ...(roleId && { roleId }),
          ...(roleName && { role: { name: roleName } }),
        },
      };
    }

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          userRoles: {
            where: { isActive: true },
            select: { role: { select: { name: true } } },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => this.mapToEntity(user)),
      total,
    };
  }

  /**
   * Find deleted users with filters and pagination
   *
   * Retrieves soft-deleted users for restoration purposes.
   * Ordered by deletion date (newest first).
   *
   * @param filters - Pagination and search filters
   * @returns Deleted users and total count
   */
  async findDeleted(
    filters: UserFiltersDto,
  ): Promise<{ users: UserEntity[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'deletedAt',
      sortOrder = 'desc',
      search,
    } = filters;

    const skip = calculateSkip(page, pageSize);

    // Build where clause - ONLY deleted users
    const where: any = {
      deletedAt: { not: null }, // Only soft-deleted users
    };

    // Search by email, firstName, or lastName
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          userRoles: {
            where: { isActive: true },
            select: { role: { select: { name: true } } },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Fetch deletedBy users separately
    const deletedByUserIds = users
      .map((u) => u.deletedBy)
      .filter((id): id is string => id !== null);

    const deletedByUsers =
      deletedByUserIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: deletedByUserIds } },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              rowVersion: true,
            },
          })
        : [];

    const deletedByUsersMap = new Map(deletedByUsers.map((u) => [u.id, u]));

    // Map users with deletedByUser
    const mappedUsers = users.map((user) => {
      const deletedByUser = user.deletedBy
        ? deletedByUsersMap.get(user.deletedBy)
        : undefined;
      return this.mapToEntity({ ...user, deletedByUser });
    });

    return {
      users: mappedUsers,
      total,
    };
  }

  /**
   * Find deleted user by ID
   *
   * @param id - User UUID
   * @returns User entity or null if not found or not deleted
   */
  async findDeletedById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        deletedAt: { not: null }, // Must be deleted
      },
      include: {
        userRoles: {
          where: { isActive: true },
          select: { role: { select: { name: true } } },
        },
      },
    });

    return user ? this.mapToEntity(user) : null;
  }

  /**
   * Update user
   */
  async update(id: string, data: UpdateUserDto): Promise<UserEntity> {
    const updateData: any = {};
    const expectedRowVersion =
      typeof data.rowVersion === 'number' ? data.rowVersion : undefined;

    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.profilePicture !== undefined)
      updateData.profilePicture = data.profilePicture;
    updateData.rowVersion = { increment: 1 };

    if (expectedRowVersion !== undefined) {
      const updated = await this.prisma.user.updateMany({
        where: { id, rowVersion: expectedRowVersion },
        data: updateData,
      });

      if (updated.count === 0) {
        throw new ConflictException(
          'Concurrent update detected. The record has been modified by another user.',
        );
      }
    } else {
      await this.prisma.user.update({
        where: { id },
        data: updateData,
      });
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      include: {
        userRoles: {
          where: { isActive: true },
          select: { role: { select: { name: true } } },
        },
      },
    });

    return this.mapToEntity(user);
  }

  /**
   * Soft delete user
   */
  async delete(
    id: string,
    deletedBy: string,
    rowVersion?: number,
  ): Promise<void> {
    if (typeof rowVersion === 'number') {
      const updated = await this.prisma.user.updateMany({
        where: { id, rowVersion, deletedAt: null },
        data: {
          deletedAt: new Date(),
          deletedBy,
          isActive: false,
          rowVersion: { increment: 1 },
        },
      });

      if (updated.count === 0) {
        throw new ConflictException(
          'Concurrent delete detected. The record has been modified by another user.',
        );
      }
      return;
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
        isActive: false,
        rowVersion: { increment: 1 },
      },
    });
  }

  /**
   * Hard delete user (permanent delete)
   *
   * Only deletes users that are already soft-deleted.
   */
  async hardDelete(id: string): Promise<void> {
    try {
      await this.prisma.user.deleteMany({
        where: {
          id,
          deletedAt: { not: null },
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Cannot delete user with associated records',
        );
      }

      throw error;
    }
  }

  /**
   * Restore soft-deleted user
   *
   * Reactivates a soft-deleted user account by:
   * - Clearing deletion metadata (deletedAt, deletedBy)
   * - Reactivating the account (isActive = true)
   * - Preserving all user data and roles
   *
   * @param id - User UUID to restore
   * @param restoredBy - UUID of user performing the restoration
   * @returns Restored user entity
   */
  async restore(id: string, restoredBy: string): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null, // Clear deletion timestamp
        deletedBy: null, // Clear deletion user reference
        isActive: true, // Reactivate the account
        updatedAt: new Date(), // Update modification timestamp
      },
      include: {
        userRoles: {
          where: { isActive: true },
          select: { role: { select: { name: true } } },
        },
      },
    });

    this.logger.log(`User restored: ${user.email} by ${restoredBy}`);
    return this.mapToEntity(user);
  }

  /**
   * Get aggregate user statistics for list KPI cards.
   * Counts are calculated across all non-deleted users and are intentionally
   * independent of pagination.
   */
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    locked: number;
  }> {
    const baseWhere: Prisma.UserWhereInput = { deletedAt: null };

    const [total, active, inactive, locked] = await Promise.all([
      this.prisma.user.count({ where: baseWhere }),
      this.prisma.user.count({
        where: {
          ...baseWhere,
          isActive: true,
          permanentlyLocked: false,
          lockedUntil: null,
        },
      }),
      this.prisma.user.count({
        where: {
          ...baseWhere,
          isActive: false,
        },
      }),
      this.prisma.user.count({
        where: {
          ...baseWhere,
          OR: [{ permanentlyLocked: true }, { lockedUntil: { not: null } }],
        },
      }),
    ]);

    return { total, active, inactive, locked };
  }

  /**
   * Count total users (excluding deleted)
   */
  async count(): Promise<number> {
    return this.prisma.user.count({
      where: { deletedAt: null },
    });
  }

  /**
   * Check if email exists
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
      },
    });
    return count > 0;
  }

  /**
   * Map Prisma user to UserEntity
   */
  private mapToEntity(prismaUser: any): UserEntity {
    const roles =
      prismaUser.userRoles?.map((ur: any) => ur.role.name) || undefined;

    // Map deletedByUser if exists
    const deletedByUser = prismaUser.deletedByUser
      ? new UserEntity({
          id: prismaUser.deletedByUser.id,
          email: prismaUser.deletedByUser.email,
          firstName: prismaUser.deletedByUser.firstName,
          lastName: prismaUser.deletedByUser.lastName,
          phone: null,
          isActive: true,
          lastLoginAt: null,
          lastLoginIp: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
          permanentlyLocked: false,
          rowVersion: prismaUser.deletedByUser.rowVersion ?? 1,
          deletedAt: null,
          deletedBy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      : undefined;

    return new UserEntity({
      id: prismaUser.id,
      email: prismaUser.email,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      phone: prismaUser.phone,
      isActive: prismaUser.isActive,
      profilePicture: prismaUser.profilePicture,
      lastLoginAt: prismaUser.lastLoginAt,
      lastLoginIp: prismaUser.lastLoginIp,
      failedLoginAttempts: prismaUser.failedLoginAttempts,
      lastFailedLoginAt: prismaUser.lastFailedLoginAt,
      lockedUntil: prismaUser.lockedUntil,
      permanentlyLocked: prismaUser.permanentlyLocked,
      permanentlyLockedAt: prismaUser.permanentlyLockedAt,
      unlockAttemptCount: prismaUser.unlockAttemptCount,
      tokenVersion: prismaUser.tokenVersion,
      rowVersion: prismaUser.rowVersion,
      deletedAt: prismaUser.deletedAt,
      deletedBy: prismaUser.deletedBy,
      deletedByUser,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      roles,
    });
  }
}

// Token for dependency injection
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
