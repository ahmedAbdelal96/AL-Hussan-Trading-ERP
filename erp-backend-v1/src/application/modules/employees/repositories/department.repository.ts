import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { IDepartmentRepository } from './department.repository.interface';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentFiltersDto,
  DepartmentResponseDto,
  DepartmentsPaginatedResponseDto,
} from '../dto';

@Injectable()
export class DepartmentRepository implements IDepartmentRepository {
  constructor(private prisma: PrismaService) {}

  private toResponse(dept: any): DepartmentResponseDto {
    return {
      id: dept.id,
      code: dept.code,
      nameAr: dept.nameAr,
      nameEn: dept.nameEn,
      isActive: dept.isActive,
      createdAt: dept.createdAt,
      updatedAt: dept.updatedAt,
      rowVersion: dept.rowVersion,
      _count: dept._count,
    };
  }

  async create(data: CreateDepartmentDto): Promise<DepartmentResponseDto> {
    const dept = await this.prisma.department.create({
      data: {
        code: data.code,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        isActive: data.isActive ?? true,
      },
      include: { _count: { select: { employees: true, positions: true } } },
    });
    return this.toResponse(dept);
  }

  async findAll(
    filters: DepartmentFiltersDto,
  ): Promise<DepartmentsPaginatedResponseDto> {
    const { page = 1, pageSize = 50, search, isActive } = filters;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [departments, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { nameEn: 'asc' },
        include: { _count: { select: { employees: true, positions: true } } },
      }),
      this.prisma.department.count({ where }),
    ]);

    return {
      data: departments.map((d) => this.toResponse(d)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findAllActive(): Promise<DepartmentResponseDto[]> {
    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: { nameEn: 'asc' },
    });
    return departments.map((d) => this.toResponse(d));
  }

  async findById(id: string): Promise<DepartmentResponseDto | null> {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true, positions: true } } },
    });
    return dept ? this.toResponse(dept) : null;
  }

  async findByCode(code: string): Promise<DepartmentResponseDto | null> {
    const dept = await this.prisma.department.findUnique({
      where: { code },
      include: { _count: { select: { employees: true, positions: true } } },
    });
    return dept ? this.toResponse(dept) : null;
  }

  async update(
    id: string,
    data: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    const updateData: any = {
      ...(data.code !== undefined && { code: data.code }),
      ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
      ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      rowVersion: { increment: 1 },
    };

    if (typeof data.rowVersion === 'number') {
      const optimisticWhere: Prisma.DepartmentWhereInput = {
        id,
        rowVersion: data.rowVersion,
      };
      const result = await this.prisma.department.updateMany({
        where: optimisticWhere,
        data: updateData,
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Department was modified by another user. Please refresh and try again.',
        );
      }
    } else {
      await this.prisma.department.update({
        where: { id },
        data: updateData,
      });
    }

    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true, positions: true } } },
    });

    if (!dept) {
      throw new ConflictException('Department not found after update');
    }

    return this.toResponse(dept);
  }

  async delete(
    id: string,
    rowVersion?: number,
  ): Promise<DepartmentResponseDto> {
    if (typeof rowVersion === 'number') {
      const existing = await this.prisma.department.findUnique({
        where: { id },
        include: { _count: { select: { employees: true, positions: true } } },
      });
      const result = await this.prisma.department.deleteMany({
        where: { id, rowVersion },
      });
      if (result.count === 0) {
        throw new ConflictException(
          'Department was modified by another user. Please refresh and try again.',
        );
      }
      if (!existing) {
        throw new ConflictException('Department was deleted concurrently');
      }
      return this.toResponse(existing);
    }

    const dept = await this.prisma.department.delete({
      where: { id },
    });
    return this.toResponse(dept);
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const dept = await this.prisma.department.findFirst({
      where: {
        code,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return !!dept;
  }
}
