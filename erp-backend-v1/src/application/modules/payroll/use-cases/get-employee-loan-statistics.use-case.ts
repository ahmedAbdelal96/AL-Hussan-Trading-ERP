import { Injectable, Inject } from '@nestjs/common';
import { EMPLOYEE_LOAN_REPOSITORY } from '../repositories';
import type { IEmployeeLoanRepository } from '../repositories';
import { EmployeeLoanStatisticsDto } from '../dto';
import { EmployeeLoanFiltersDto } from '../dto/employee-loan-filters.dto';

@Injectable()
export class GetEmployeeLoanStatisticsUseCase {
  constructor(
    @Inject(EMPLOYEE_LOAN_REPOSITORY)
    private readonly employeeLoanRepository: IEmployeeLoanRepository,
  ) {}

  async execute(
    filters: Partial<EmployeeLoanFiltersDto>,
  ): Promise<EmployeeLoanStatisticsDto> {
    return this.employeeLoanRepository.getStatistics({
      employeeId: filters.employeeId,
    });
  }
}
