import { Injectable, Inject } from '@nestjs/common';
import { EMPLOYEE_DEDUCTION_REPOSITORY } from '../repositories';
import type { IEmployeeDeductionRepository } from '../repositories';
import { EmployeeDeductionStatisticsDto } from '../dto';
import { EmployeeDeductionFiltersDto } from '../dto/employee-deduction-filters.dto';

@Injectable()
export class GetEmployeeDeductionStatisticsUseCase {
  constructor(
    @Inject(EMPLOYEE_DEDUCTION_REPOSITORY)
    private readonly employeeDeductionRepository: IEmployeeDeductionRepository,
  ) {}

  async execute(
    filters: Partial<EmployeeDeductionFiltersDto>,
  ): Promise<EmployeeDeductionStatisticsDto> {
    return this.employeeDeductionRepository.getStatistics({
      employeeId: filters.employeeId,
      deductionType: filters.deductionType,
      loanId: filters.loanId,
    });
  }
}
