import {
  Injectable,
  Inject,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { IEmployeeRepository } from '../repositories';
import { EMPLOYEE_REPOSITORY } from '../repositories';
import {
  BulkCreateEmployeesDto,
  EmployeeResponseDto,
  CreateEmployeeDto,
} from '../dto';
import { GenerateEmployeeNumberUseCase } from './generate-employee-number.use-case';

@Injectable()
export class BulkCreateEmployeesUseCase {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: IEmployeeRepository,
    private generateEmployeeNumber: GenerateEmployeeNumberUseCase,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    data: BulkCreateEmployeesDto,
    createdBy: string,
  ): Promise<EmployeeResponseDto[]> {
    const { employees } = data;

    // Validate uniqueness within the batch
    const nationalIds = employees.map((e) => e.nationalId);
    const emails = employees.filter((e) => e.email).map((e) => e.email!);

    // Check for duplicates within batch
    const duplicateNationalIds = nationalIds.filter(
      (id, index) => nationalIds.indexOf(id) !== index,
    );
    if (duplicateNationalIds.length > 0) {
      throw new BadRequestException(
        this.i18n.t('employees.bulk.duplicateNationalIds', {
          args: { ids: duplicateNationalIds.join(', ') },
        }),
      );
    }

    const duplicateEmails = emails.filter(
      (email, index) => emails.indexOf(email) !== index,
    );
    if (duplicateEmails.length > 0) {
      throw new BadRequestException(
        this.i18n.t('employees.bulk.duplicateEmails', {
          args: { emails: duplicateEmails.join(', ') },
        }),
      );
    }

    // Check against existing records
    for (const employee of employees) {
      const nationalIdExists = await this.employeeRepository.existsByNationalId(
        employee.nationalId,
      );
      if (nationalIdExists) {
        throw new ConflictException(
          this.i18n.t('employees.bulk.nationalIdExists', {
            args: { id: employee.nationalId },
          }),
        );
      }

      if (employee.email) {
        const emailExists = await this.employeeRepository.existsByEmail(
          employee.email,
        );
        if (emailExists) {
          throw new ConflictException(
            this.i18n.t('employees.bulk.emailExists', {
              args: { email: employee.email },
            }),
          );
        }
      }
    }

    // Generate employee numbers for all
    const employeesWithNumbers: Array<{
      data: CreateEmployeeDto;
      employeeNumber: string;
    }> = [];
    for (const employee of employees) {
      const employeeNumber = await this.generateEmployeeNumber.execute();
      employeesWithNumbers.push({ data: employee, employeeNumber });
    }

    // Create all employees
    const createdEmployees = await this.employeeRepository.bulkCreate(
      employeesWithNumbers,
      createdBy,
    );

    return createdEmployees.map((emp) => emp.toResponse());
  }
}
