import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { assertProjectIsEditable } from './project-status.guard';

@Injectable()
export class RemoveProjectAssetUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(RemoveProjectAssetUseCase.name);
  }

  async execute(
    projectId: string,
    assignmentId: string,
  ): Promise<{ message: string }> {
    // Verify project status
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, status: true },
    });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    assertProjectIsEditable(project);

    const assignment = await this.prisma.projectAsset.findFirst({
      where: { id: assignmentId, projectId },
      include: { asset: { select: { id: true, assetNumber: true } } },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Assignment ${assignmentId} not found for this project`,
      );
    }

    // Deactivate assignment and set return date
    await this.prisma.$transaction([
      this.prisma.projectAsset.update({
        where: { id: assignmentId },
        data: { isActive: false, returnDate: new Date() },
      }),
      // Set asset back to AVAILABLE only if it has no other active project assignments
      this.prisma.asset.updateMany({
        where: {
          id: assignment.assetId,
          projectAssignments: {
            none: {
              isActive: true,
              id: { not: assignmentId },
            },
          },
        },
        data: { status: 'AVAILABLE' },
      }),
    ]);

    this.logger.log(
      `Asset ${assignment.asset.assetNumber} removed from project ${projectId}`,
    );

    return { message: `Asset removed from project successfully` };
  }
}
