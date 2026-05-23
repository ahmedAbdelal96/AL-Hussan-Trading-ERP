import { Injectable, Inject, ConflictException } from '@nestjs/common';
import type { IDepartmentRepository } from '../../repositories';
import { DEPARTMENT_REPOSITORY } from '../../repositories';
import { CreateDepartmentDto, DepartmentResponseDto } from '../../dto';

@Injectable()
export class CreateDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: IDepartmentRepository,
  ) {}

  async execute(data: CreateDepartmentDto): Promise<DepartmentResponseDto> {
    const exists = await this.departmentRepository.existsByCode(data.code);
    if (exists) {
      throw new ConflictException(
        `Department with code "${data.code}" already exists`,
      );
    }
    return this.departmentRepository.create(data);
  }
}
