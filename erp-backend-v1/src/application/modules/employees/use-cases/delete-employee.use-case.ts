import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { IEmployeeRepository } from '../repositories';
import { EMPLOYEE_REPOSITORY } from '../repositories';

@Injectable()
export class DeleteEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: IEmployeeRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    id: string,
    deletedBy: string,
    rowVersion?: number,
  ): Promise<void> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundException(this.i18n.t('employees.delete.notFound'));
    }

    await this.employeeRepository.delete(id, deletedBy, rowVersion);
  }
}
