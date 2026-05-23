import { Injectable, Inject } from '@nestjs/common';
import { EMPLOYEE_ALLOWANCE_REPOSITORY } from '../repositories';
import type { IEmployeeAllowanceRepository } from '../repositories';
import { EmployeeAllowanceStatisticsDto } from '../dto';
import { EmployeeAllowanceFiltersDto } from '../dto/employee-allowance-filters.dto';

@Injectable()
export class GetEmployeeAllowanceStatisticsUseCase {
  constructor(
    @Inject(EMPLOYEE_ALLOWANCE_REPOSITORY)
    private readonly employeeAllowanceRepository: IEmployeeAllowanceRepository,
  ) {}

  async execute(
    filters: Partial<EmployeeAllowanceFiltersDto>,
  ): Promise<EmployeeAllowanceStatisticsDto> {
    return this.employeeAllowanceRepository.getStatistics({
      employeeId: filters.employeeId,
      allowanceTypeId: filters.allowanceTypeId,
      frequency: filters.frequency,
    });
  }
}
