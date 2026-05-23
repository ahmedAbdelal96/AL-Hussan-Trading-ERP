import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { IDepartmentRepository } from '../../repositories';
import { DEPARTMENT_REPOSITORY } from '../../repositories';
import { UpdateDepartmentDto, DepartmentResponseDto } from '../../dto';

@Injectable()
export class UpdateDepartmentUseCase {
  constructor(
    @Inject(DEPARTMENT_REPOSITORY)
    private departmentRepository: IDepartmentRepository,
  ) {}

  async execute(
    id: string,
    data: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    const existing = await this.departmentRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Department with ID "${id}" not found`);
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.departmentRepository.existsByCode(
        data.code,
        id,
      );
      if (codeExists) {
        throw new ConflictException(
          `Department with code "${data.code}" already exists`,
        );
      }
    }

    return this.departmentRepository.update(id, data);
  }
}
