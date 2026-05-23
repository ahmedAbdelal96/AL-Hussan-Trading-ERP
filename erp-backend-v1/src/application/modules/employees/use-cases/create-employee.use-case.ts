import { Injectable, Inject, ConflictException, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import type { IEmployeeRepository } from '../repositories';
import { EMPLOYEE_REPOSITORY } from '../repositories';
import { CreateEmployeeDto, EmployeeResponseDto } from '../dto';
import { GenerateEmployeeNumberUseCase } from './generate-employee-number.use-case';

@Injectable()
export class CreateEmployeeUseCase {
  private readonly logger = new Logger(CreateEmployeeUseCase.name);

  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: IEmployeeRepository,
    private generateEmployeeNumber: GenerateEmployeeNumberUseCase,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    data: CreateEmployeeDto,
    createdBy: string,
  ): Promise<EmployeeResponseDto> {
    this.logger.log('🚀 Starting employee creation...');
    const startTime = Date.now();

    // Check if national ID already exists
    this.logger.log('⏳ Checking national ID...');
    const nationalIdExists = await this.employeeRepository.existsByNationalId(
      data.nationalId,
    );
    this.logger.log(
      `✅ National ID check completed in ${Date.now() - startTime}ms`,
    );

    if (nationalIdExists) {
      throw new ConflictException(
        this.i18n.t('employees.create.nationalIdExists'),
      );
    }

    // Check if email already exists (if provided)
    if (data.email) {
      this.logger.log('⏳ Checking email...');
      const emailCheckStart = Date.now();
      const emailExists = await this.employeeRepository.existsByEmail(
        data.email,
      );
      this.logger.log(
        `✅ Email check completed in ${Date.now() - emailCheckStart}ms`,
      );

      if (emailExists) {
        throw new ConflictException(
          this.i18n.t('employees.create.emailExists'),
        );
      }
    }

    // Generate unique employee number
    this.logger.log('⏳ Generating employee number...');
    const generateStart = Date.now();
    const employeeNumber = await this.generateEmployeeNumber.execute();
    this.logger.log(
      `✅ Employee number generated in ${Date.now() - generateStart}ms: ${employeeNumber}`,
    );

    // Create employee
    this.logger.log('⏳ Creating employee in database...');
    const createStart = Date.now();
    const employee = await this.employeeRepository.create(
      data,
      employeeNumber,
      createdBy,
    );
    this.logger.log(
      `✅ Employee created in database in ${Date.now() - createStart}ms`,
    );

    const totalTime = Date.now() - startTime;
    this.logger.log(`🎉 Employee creation completed in ${totalTime}ms`);

    return employee.toResponse();
  }
}
