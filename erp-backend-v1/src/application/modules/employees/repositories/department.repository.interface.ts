import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentFiltersDto,
  DepartmentResponseDto,
  DepartmentsPaginatedResponseDto,
} from '../dto';

export const DEPARTMENT_REPOSITORY = 'DEPARTMENT_REPOSITORY';

export interface IDepartmentRepository {
  create(data: CreateDepartmentDto): Promise<DepartmentResponseDto>;
  findAll(
    filters: DepartmentFiltersDto,
  ): Promise<DepartmentsPaginatedResponseDto>;
  findAllActive(): Promise<DepartmentResponseDto[]>;
  findById(id: string): Promise<DepartmentResponseDto | null>;
  findByCode(code: string): Promise<DepartmentResponseDto | null>;
  update(id: string, data: UpdateDepartmentDto): Promise<DepartmentResponseDto>;
  delete(id: string, rowVersion?: number): Promise<DepartmentResponseDto>;
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
}
