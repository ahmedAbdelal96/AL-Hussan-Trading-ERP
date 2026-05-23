import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';

export interface ProjectAssetResponseDto {
  id: string;
  projectId: string;
  assetId: string;
  assetNumber: string;
  assetName: string;
  assetType: string;
  status: string;
  percentage: number;
  assignedDate: Date | string;
  returnDate: Date | string | null;
  isActive: boolean;
  location: string | null;
  notes: string | null;
}

@Injectable()
export class GetProjectAssetsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    projectId: string,
    activeOnly = true,
  ): Promise<ProjectAssetResponseDto[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const assignments = await this.prisma.projectAsset.findMany({
      where: {
        projectId,
        ...(activeOnly && { isActive: true }),
      },
      include: {
        asset: {
          select: {
            id: true,
            assetNumber: true,
            name: true,
            assetType: true,
            status: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { assignedDate: 'desc' }],
    });

    return assignments.map((a) => ({
      id: a.id,
      projectId: a.projectId,
      assetId: a.assetId,
      assetNumber: a.asset.assetNumber,
      assetName: a.asset.name,
      assetType: a.asset.assetType,
      status: a.status,
      percentage: Number(a.percentage),
      assignedDate: a.assignedDate,
      returnDate: a.returnDate ?? null,
      isActive: a.isActive,
      location: a.location ?? null,
      notes: a.notes ?? null,
    }));
  }
}
