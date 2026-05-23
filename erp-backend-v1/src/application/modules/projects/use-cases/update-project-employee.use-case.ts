import { Injectable, NotFoundException } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { UpdateProjectEmployeeDto } from '../dto/update-project-employee.dto';
import { ProjectEmployeeResponseDto } from '../dto/project-employee-response.dto';
import { AssignEmployeeToProjectUseCase } from './assign-employee-to-project.use-case';
import { assertProjectIsEditable } from './project-status.guard';

@Injectable()
export class UpdateProjectEmployeeUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
    private readonly assignUseCase: AssignEmployeeToProjectUseCase,
  ) {
    this.logger.setContext(UpdateProjectEmployeeUseCase.name);
  }

  async execute(
    projectId: string,
    assignmentId: string,
    dto: UpdateProjectEmployeeDto,
  ): Promise<ProjectEmployeeResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, status: true },
    });

    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    assertProjectIsEditable(project);

    const existing = await this.prisma.projectEmployee.findFirst({
      where: { id: assignmentId, projectId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            department: { select: { nameEn: true } },
            position: { select: { nameEn: true } },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Assignment ${assignmentId} not found for project ${projectId}`,
      );
    }

    // Validate percentage sum if changing percentage
    if (dto.percentage !== undefined && dto.percentage !== null) {
      await this.assignUseCase.validatePercentageSum(
        existing.employeeId,
        dto.percentage,
        assignmentId,
      );
    }

    const updated = await this.prisma.projectEmployee.update({
      where: { id: assignmentId },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.percentage !== undefined && { percentage: dto.percentage }),
        ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    this.logger.log(
      `Updated assignment ${assignmentId} for employee ${existing.employee.employeeNumber}`,
    );

    return {
      id: updated.id,
      projectId: updated.projectId,
      employeeId: updated.employeeId,
      employeeName: `${existing.employee.firstName} ${existing.employee.lastName}`,
      employeeNumber: existing.employee.employeeNumber,
      department: existing.employee.department?.nameEn ?? null,
      position: existing.employee.position?.nameEn ?? null,
      role: updated.role ?? null,
      percentage:
        updated.percentage !== null ? Number(updated.percentage) : null,
      assignedDate: updated.assignedDate,
      endDate: updated.endDate ?? null,
      isActive: updated.isActive,
      notes: updated.notes ?? null,
      createdAt: updated.createdAt,
    };
  }
}
