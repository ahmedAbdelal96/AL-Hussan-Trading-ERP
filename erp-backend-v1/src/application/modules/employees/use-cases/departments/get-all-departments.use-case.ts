import { Injectable, Inject } from '@nestjs/common';
import type { IDepartmentRepository } from '../../repositories';
import { DEPARTMENT_REPOSITORY } from '../../repositories';
import {
  DepartmentFiltersDto,
  DepartmentsPaginatedResponseDto,
  DepartmentResponseDto,
} from '../../dto';

@Injectable()
export class GetAllDepartmentsUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: IDepartmentRepository,
  ) {}

  async execute(
    filters: DepartmentFiltersDto,
  ): Promise<DepartmentsPaginatedResponseDto> {
    return this.departmentRepository.findAll(filters);
  }
}

@Injectable()
export class GetActiveDepartmentsUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: IDepartmentRepository,
  ) {}

  async execute(): Promise<DepartmentResponseDto[]> {
    return this.departmentRepository.findAllActive();
  }
}
