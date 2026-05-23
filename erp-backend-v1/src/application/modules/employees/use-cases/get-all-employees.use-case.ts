import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IEmployeeRepository } from '../repositories';
import { EMPLOYEE_REPOSITORY } from '../repositories';
import { EmployeeFiltersDto, EmployeesPaginatedResponseDto } from '../dto';

@Injectable()
export class GetAllEmployeesUseCase {
  private readonly logger = new Logger(GetAllEmployeesUseCase.name);

  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: IEmployeeRepository,
  ) {}

  async execute(
    filters: EmployeeFiltersDto,
  ): Promise<EmployeesPaginatedResponseDto> {
    this.logger.log(`📋 Received filters: ${JSON.stringify(filters)}`);

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;

    this.logger.log(`📄 Using page=${page}, pageSize=${pageSize}`);

    const { employees, total } = await this.employeeRepository.findAll(filters);

    this.logger.log(
      `✅ Found ${total} total employees, returning ${employees.length} for current page`,
    );

    const data = employees.map((emp) => emp.toResponse());
    return new EmployeesPaginatedResponseDto(data, page, pageSize, total);
  }
}
