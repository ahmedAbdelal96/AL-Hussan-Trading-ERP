import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { IEmployeeRepository } from '../repositories';
import { EMPLOYEE_REPOSITORY } from '../repositories';
import { RehireEmployeeDto, EmployeeResponseDto } from '../dto';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { EmployeeEntity } from '../entities/employee.entity';
import { EmployeeStatus } from '@prisma/client';

@Injectable()
export class RehireEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: IEmployeeRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    id: string,
    dto: RehireEmployeeDto,
    updatedBy: string,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    if (employee.status !== EmployeeStatus.TERMINATED) {
      throw new BadRequestException(
        `Cannot rehire employee with status "${employee.status}". Only TERMINATED employees can be rehired.`,
      );
    }

    const rehireDate = new Date(dto.rehireDate);

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        status: EmployeeStatus.ACTIVE,
        terminationDate: null,
        terminationReason: null,
        rehireDate,
        rehireReason: dto.rehireReason ?? null,
        ...(dto.departmentId !== undefined && {
          departmentId: dto.departmentId,
        }),
        ...(dto.positionId !== undefined && { positionId: dto.positionId }),
        ...(dto.baseSalary !== undefined && {
          baseSalary: dto.baseSalary,
          lastSalaryUpdate: new Date(),
          lastSalaryUpdateBy: updatedBy,
        }),
        updatedBy,
        version: { increment: 1 },
      },
      include: {
        department: { select: { nameAr: true, nameEn: true } },
        position: { select: { nameAr: true, nameEn: true } },
      },
    });

    return new EmployeeEntity(updated).toResponse() as EmployeeResponseDto;
  }
}
