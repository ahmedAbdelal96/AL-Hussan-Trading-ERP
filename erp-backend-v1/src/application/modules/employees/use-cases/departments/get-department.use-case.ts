import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IDepartmentRepository } from '../../repositories';
import { DEPARTMENT_REPOSITORY } from '../../repositories';
import { DepartmentResponseDto } from '../../dto';

@Injectable()
export class GetDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: IDepartmentRepository,
  ) {}

  async execute(id: string): Promise<DepartmentResponseDto> {
    const dept = await this.departmentRepository.findById(id);
    if (!dept) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }
    return dept;
  }
}
