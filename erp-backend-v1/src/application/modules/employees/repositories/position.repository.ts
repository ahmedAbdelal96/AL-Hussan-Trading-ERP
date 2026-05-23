import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { IPositionRepository } from './position.repository.interface';
import {
  CreatePositionDto,
  UpdatePositionDto,
  PositionFiltersDto,
  PositionResponseDto,
  PositionsPaginatedResponseDto,
} from '../dto';

@Injectable()
export class PositionRepository implements IPositionRepository {
  constructor(private prisma: PrismaService) {}

  private toResponse(pos: any): PositionResponseDto {
    return {
      id: pos.id,
      code: pos.code,
      nameAr: pos.nameAr,
      nameEn: pos.nameEn,
      level: pos.level,
      departmentId: pos.departmentId ?? null,
      departmentNameEn: pos.department?.nameEn ?? null,
      departmentNameAr: pos.department?.nameAr ?? null,
      isActive: pos.isActive,
      createdAt: pos.createdAt,
      updatedAt: pos.updatedAt,
      rowVersion: pos.rowVersion,
      _count: pos._count,
    };
  }

  async create(data: CreatePositionDto): Promise<PositionResponseDto> {
    const pos = await this.prisma.position.create({
      data: {
        code: data.code,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        level: data.level,
        departmentId: data.departmentId ?? null,
        isActive: data.isActive ?? true,
      },
      include: {
        department: { select: { nameEn: true, nameAr: true } },
        _count: { select: { employees: true } },
      },
    });
    return this.toResponse(pos);
  }

  async findAll(
    filters: PositionFiltersDto,
  ): Promise<PositionsPaginatedResponseDto> {
    const { page = 1, pageSize = 50, search, departmentId, isActive } = filters;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== undefined) where.isActive = isActive;

    const [positions, total] = await Promise.all([
      this.prisma.position.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { nameEn: 'asc' },
        include: {
          department: { select: { nameEn: true, nameAr: true } },
          _count: { select: { employees: true } },
        },
      }),
      this.prisma.position.count({ where }),
    ]);

    return {
      data: positions.map((p) => this.toResponse(p)),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findAllActive(departmentId?: string): Promise<PositionResponseDto[]> {
    const positions = await this.prisma.position.findMany({
      where: {
        isActive: true,
        ...(departmentId && { departmentId }),
      },
      orderBy: { nameEn: 'asc' },
      include: { department: { select: { nameEn: true, nameAr: true } } },
    });
    return positions.map((p) => this.toResponse(p));
  }

  async findById(id: string): Promise<PositionResponseDto | null> {
    const pos = await this.prisma.position.findUnique({
      where: { id },
      include: {
        department: { select: { nameEn: true, nameAr: true } },
        _count: { select: { employees: true } },
      },
    });
    return pos ? this.toResponse(pos) : null;
  }

  async findByCode(code: string): Promise<PositionResponseDto | null> {
    const pos = await this.prisma.position.findUnique({
      where: { code },
      include: {
        department: { select: { nameEn: true, nameAr: true } },
        _count: { select: { employees: true } },
      },
    });
    return pos ? this.toResponse(pos) : null;
  }

  async update(
    id: string,
    data: UpdatePositionDto,
  ): Promise<PositionResponseDto> {
    const updateData: any = {
      ...(data.code !== undefined && { code: data.code }),
      ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
      ...(data.nameEn !== undefined && { nameEn: data.nameEn }),
      ...(data.level !== undefined && { level: data.level }),
      ...(data.departmentId !== undefined && {
        departmentId: data.departmentId,
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      rowVersion: { increment: 1 },
    };

    if (typeof data.rowVersion === 'number') {
      const optimisticWhere: Prisma.PositionWhereInput = {
        id,
        rowVersion: data.rowVersion,
      };
      const result = await this.prisma.position.updateMany({
        where: optimisticWhere,
        data: updateData,
      });

      if (result.count === 0) {
        throw new ConflictException(
          'Position was modified by another user. Please refresh and try again.',
        );
      }
    } else {
      await this.prisma.position.update({
        where: { id },
        data: updateData,
      });
    }

    const pos = await this.prisma.position.findUnique({
      where: { id },
      include: {
        department: { select: { nameEn: true, nameAr: true } },
        _count: { select: { employees: true } },
      },
    });

    if (!pos) {
      throw new ConflictException('Position not found after update');
    }

    return this.toResponse(pos);
  }

  async delete(id: string, rowVersion?: number): Promise<PositionResponseDto> {
    if (typeof rowVersion === 'number') {
      const existing = await this.prisma.position.findUnique({
        where: { id },
        include: {
          department: { select: { nameEn: true, nameAr: true } },
          _count: { select: { employees: true } },
        },
      });
      const result = await this.prisma.position.deleteMany({
        where: { id, rowVersion },
      });
      if (result.count === 0) {
        throw new ConflictException(
          'Position was modified by another user. Please refresh and try again.',
        );
      }
      if (!existing) {
        throw new ConflictException('Position was deleted concurrently');
      }
      return this.toResponse(existing);
    }

    const pos = await this.prisma.position.delete({ where: { id } });
    return this.toResponse(pos);
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const pos = await this.prisma.position.findFirst({
      where: { code, ...(excludeId && { id: { not: excludeId } }) },
    });
    return !!pos;
  }
}
