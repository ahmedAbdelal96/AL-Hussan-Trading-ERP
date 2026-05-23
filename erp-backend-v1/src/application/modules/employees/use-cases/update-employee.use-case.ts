import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { IEmployeeRepository } from '../repositories';
import { EMPLOYEE_REPOSITORY } from '../repositories';
import { UpdateEmployeeDto, EmployeeResponseDto } from '../dto';
import { assertEmployeeStatusTransitionIsValid } from './employee-status-transition.guard';
import { EmployeeStatus } from '@prisma/client';

@Injectable()
export class UpdateEmployeeUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: IEmployeeRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    id: string,
    data: UpdateEmployeeDto,
    updatedBy: string,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundException(this.i18n.t('employees.update.notFound'));
    }

    // TERMINATED employees are read-only — only the rehire workflow can change them
    if (employee.status === EmployeeStatus.TERMINATED) {
      throw new BadRequestException(
        'Cannot update a terminated employee. Use the rehire workflow to reactivate this employee.',
      );
    }

    // Check if national ID is being changed and already exists
    if (data.nationalId && data.nationalId !== employee.nationalId) {
      const nationalIdExists = await this.employeeRepository.existsByNationalId(
        data.nationalId,
        id,
      );
      if (nationalIdExists) {
        throw new ConflictException(
          this.i18n.t('employees.update.nationalIdExists'),
        );
      }
    }

    // Check if email is being changed and already exists
    if (data.email && data.email !== employee.email) {
      const emailExists = await this.employeeRepository.existsByEmail(
        data.email,
        id,
      );
      if (emailExists) {
        throw new ConflictException(
          this.i18n.t('employees.update.emailExists'),
        );
      }
    }

    // Validate status transition if status is being changed
    const nextStatus = data.status as EmployeeStatus | undefined;
    if (nextStatus && String(nextStatus) !== String(employee.status)) {
      assertEmployeeStatusTransitionIsValid(
        employee.status as EmployeeStatus,
        nextStatus,
      );
    }

    const updatedEmployee = await this.employeeRepository.update(
      id,
      data,
      updatedBy,
    );
    return updatedEmployee.toResponse();
  }
}
