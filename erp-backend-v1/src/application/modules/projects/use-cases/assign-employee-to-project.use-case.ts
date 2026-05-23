import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { AssignEmployeeToProjectDto } from '../dto/assign-employee-to-project.dto';
import { ProjectEmployeeResponseDto } from '../dto/project-employee-response.dto';
import { assertProjectIsEditable } from './project-status.guard';

@Injectable()
export class AssignEmployeeToProjectUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(AssignEmployeeToProjectUseCase.name);
  }

  async execute(
    projectId: string,
    dto: AssignEmployeeToProjectDto,
    userId: string,
  ): Promise<ProjectEmployeeResponseDto> {
    // Verify project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, status: true },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }
    assertProjectIsEditable(project);

    // Verify employee exists
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeNumber: true,
        department: { select: { nameAr: true, nameEn: true } },
        position: { select: { nameAr: true, nameEn: true } },
      },
    });
    if (!employee) {
      throw new NotFoundException(`Employee ${dto.employeeId} not found`);
    }

    const assignedDate = dto.assignedDate
      ? new Date(dto.assignedDate)
      : new Date();

    // Check for duplicate active assignment (same project + employee)
    const existingActive = await this.prisma.projectEmployee.findFirst({
      where: { projectId, employeeId: dto.employeeId, isActive: true },
    });
    if (existingActive) {
      throw new BadRequestException(
        `Employee ${employee.employeeNumber} is already assigned to this project`,
      );
    }

    // If percentage provided, validate that adding it won't exceed 100% for this employee
    if (dto.percentage !== undefined && dto.percentage !== null) {
      await this.validatePercentageSum(
        dto.employeeId,
        dto.percentage,
        null, // no existing assignment to exclude
      );
    }

    const assignment = await this.prisma.projectEmployee.create({
      data: {
        projectId,
        employeeId: dto.employeeId,
        role: dto.role ?? null,
        percentage: dto.percentage ?? null,
        assignedDate,
        isActive: true,
        assignedBy: userId,
        notes: dto.notes ?? null,
      },
    });

    this.logger.log(
      `Employee ${employee.employeeNumber} assigned to project ${projectId} ` +
        (dto.percentage
          ? `with ${dto.percentage}% salary allocation`
          : `as overhead`),
    );

    return this.mapToDto(assignment, employee);
  }

  /**
   * Validates that the sum of active percentages for an employee won't exceed 100%.
   * Excludes a specific assignment ID (for updates).
   */
  async validatePercentageSum(
    employeeId: string,
    newPercentage: number,
    excludeAssignmentId: string | null,
  ): Promise<void> {
    const activeAssignments = await this.prisma.projectEmployee.findMany({
      where: {
        employeeId,
        isActive: true,
        percentage: { not: null },
        ...(excludeAssignmentId && { id: { not: excludeAssignmentId } }),
      },
      select: { percentage: true, projectId: true },
    });

    const currentTotal = activeAssignments.reduce(
      (sum, a) => sum + Number(a.percentage),
      0,
    );
    const newTotal = currentTotal + newPercentage;

    if (newTotal > 100.01) {
      throw new BadRequestException(
        `Cannot assign ${newPercentage}% to this employee. ` +
          `Current total active allocation: ${currentTotal.toFixed(2)}%. ` +
          `Adding this would result in ${newTotal.toFixed(2)}%, which exceeds 100%.`,
      );
    }
  }

  private mapToDto(assignment: any, employee: any): ProjectEmployeeResponseDto {
    return {
      id: assignment.id,
      projectId: assignment.projectId,
      employeeId: assignment.employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      employeeNumber: employee.employeeNumber,
      department:
        employee.department?.nameAr ?? employee.department?.nameEn ?? null,
      position: employee.position?.nameAr ?? employee.position?.nameEn ?? null,
      role: assignment.role ?? null,
      percentage:
        assignment.percentage !== null ? Number(assignment.percentage) : null,
      assignedDate: assignment.assignedDate,
      endDate: assignment.endDate ?? null,
      isActive: assignment.isActive,
      notes: assignment.notes ?? null,
      createdAt: assignment.createdAt,
    };
  }
}
