import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { IEmployeeRepository } from '../repositories';
import { EMPLOYEE_REPOSITORY } from '../repositories';
import { EmployeeResponseDto } from '../dto';

@Injectable()
export class GetEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: IEmployeeRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(id: string): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundException(this.i18n.t('employees.get.notFound'));
    }
    return employee.toResponse();
  }
}
