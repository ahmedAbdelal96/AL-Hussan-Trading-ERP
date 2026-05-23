import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IsUUID, IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { ProjectAssetResponseDto } from './get-project-assets.use-case';
import { assertProjectIsEditable } from './project-status.guard';

export class AssignAssetToProjectFromProjectDto {
  @ApiProperty({ description: 'Asset ID to assign', example: 'uuid' })
  @IsUUID()
  assetId: string;

  @ApiPropertyOptional({ description: 'Assignment location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    description: 'Assigned date (ISO)',
    example: '2026-02-23',
  })
  @IsDateString()
  @IsOptional()
  assignedDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

@Injectable()
export class AssignAssetToProjectUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(AssignAssetToProjectUseCase.name);
  }

  async execute(
    projectId: string,
    dto: AssignAssetToProjectFromProjectDto,
    userId: string,
  ): Promise<ProjectAssetResponseDto> {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, status: true },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    assertProjectIsEditable(project);

    // Verify asset exists
    const asset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId, deletedAt: null },
      select: {
        id: true,
        assetNumber: true,
        name: true,
        assetType: true,
        status: true,
      },
    });
    if (!asset) throw new NotFoundException(`Asset ${dto.assetId} not found`);

    // Check asset is not already actively assigned to this project
    const existing = await this.prisma.projectAsset.findFirst({
      where: { projectId, assetId: dto.assetId, isActive: true },
    });
    if (existing) {
      throw new BadRequestException(
        `Asset ${asset.assetNumber} is already assigned to this project`,
      );
    }

    // Check asset is not already assigned to another active project
    const otherProject = await this.prisma.projectAsset.findFirst({
      where: { assetId: dto.assetId, isActive: true, returnDate: null },
    });
    if (otherProject) {
      // Auto-heal: if the asset status is AVAILABLE but stale active records exist,
      // deactivate them (data inconsistency) and proceed.
      if (asset.status === 'AVAILABLE') {
        this.logger.warn(
          `Auto-healing stale project_assets records for asset ${asset.assetNumber} (status=AVAILABLE but active assignments exist)`,
        );
        await this.prisma.projectAsset.updateMany({
          where: { assetId: dto.assetId, isActive: true, returnDate: null },
          data: { isActive: false, returnDate: new Date() },
        });
      } else {
        throw new BadRequestException(
          `Asset ${asset.assetNumber} is already assigned to another active project`,
        );
      }
    }

    const assignedDate = dto.assignedDate
      ? new Date(dto.assignedDate)
      : new Date();

    const [assignment] = await this.prisma.$transaction([
      this.prisma.projectAsset.create({
        data: {
          projectId,
          assetId: dto.assetId,
          assignedDate,
          isActive: true,
          status: 'active',
          location: dto.location ?? null,
          assignedBy: userId,
          notes: dto.notes ?? null,
          percentage: 100,
        },
      }),
      this.prisma.asset.update({
        where: { id: dto.assetId },
        data: { status: 'IN_USE' },
      }),
    ]);

    this.logger.log(`Asset ${dto.assetId} assigned to project ${projectId}`);

    return {
      id: assignment.id,
      projectId: assignment.projectId,
      assetId: assignment.assetId,
      assetNumber: asset.assetNumber,
      assetName: asset.name,
      assetType: asset.assetType,
      status: assignment.status,
      percentage: Number(assignment.percentage),
      assignedDate: assignment.assignedDate,
      returnDate: null,
      isActive: true,
      location: assignment.location ?? null,
      notes: assignment.notes ?? null,
    };
  }
}
