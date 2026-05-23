import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import type { IDepartmentRepository } from '../../repositories';
import { DEPARTMENT_REPOSITORY } from '../../repositories';
import { DepartmentResponseDto } from '../../dto';

@Injectable()
export class DeleteDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: IDepartmentRepository,
    private prisma: PrismaService,
  ) {}

  async execute(
    id: string,
    rowVersion?: number,
  ): Promise<{ message: string; department: DepartmentResponseDto }> {
    const existing = await this.departmentRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }

    // Check if department has employees
    const employeeCount = await this.prisma.employee.count({
      where: { departmentId: id },
    });
    if (employeeCount > 0) {
      throw new ConflictException(
        `Cannot delete department "${existing.nameEn}" because it has ${employeeCount} employee(s) assigned`,
      );
    }

    const deleted = await this.departmentRepository.delete(id, rowVersion);
    return { message: 'Department deleted successfully', department: deleted };
  }
}
