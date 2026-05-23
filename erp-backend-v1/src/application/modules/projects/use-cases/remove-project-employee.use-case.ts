import { Injectable, NotFoundException } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { assertProjectIsEditable } from './project-status.guard';

@Injectable()
export class RemoveProjectEmployeeUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(RemoveProjectEmployeeUseCase.name);
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

    const existing = await this.prisma.projectEmployee.findFirst({
      where: { id: assignmentId, projectId },
      select: { id: true, employeeId: true, isActive: true },
    });

    if (!existing) {
      throw new NotFoundException(
        `Assignment ${assignmentId} not found for project ${projectId}`,
      );
    }

    // Soft-deactivate instead of hard delete
    await this.prisma.projectEmployee.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        endDate: new Date(),
        percentage: null, // clear percentage so it doesn't count in allocations
      },
    });

    this.logger.log(
      `Assignment ${assignmentId} deactivated from project ${projectId}`,
    );

    return { message: 'Employee removed from project successfully' };
  }
}
