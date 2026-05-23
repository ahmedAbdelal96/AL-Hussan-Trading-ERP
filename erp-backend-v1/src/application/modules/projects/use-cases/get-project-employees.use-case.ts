import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { ProjectEmployeeResponseDto } from '../dto/project-employee-response.dto';

@Injectable()
export class GetProjectEmployeesUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    projectId: string,
    activeOnly = true,
  ): Promise<ProjectEmployeeResponseDto[]> {
    const assignments = await this.prisma.projectEmployee.findMany({
      where: {
        projectId,
        ...(activeOnly && { isActive: true }),
      },
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
      orderBy: [{ isActive: 'desc' }, { assignedDate: 'desc' }],
    });

    return assignments.map((a) => ({
      id: a.id,
      projectId: a.projectId,
      employeeId: a.employeeId,
      employeeName: `${a.employee.firstName} ${a.employee.lastName}`,
      employeeNumber: a.employee.employeeNumber,
      department: a.employee.department?.nameEn ?? null,
      position: a.employee.position?.nameEn ?? null,
      role: a.role ?? null,
      percentage: a.percentage !== null ? Number(a.percentage) : null,
      assignedDate: a.assignedDate,
      endDate: a.endDate ?? null,
      isActive: a.isActive,
      notes: a.notes ?? null,
      createdAt: a.createdAt,
    }));
  }
}
