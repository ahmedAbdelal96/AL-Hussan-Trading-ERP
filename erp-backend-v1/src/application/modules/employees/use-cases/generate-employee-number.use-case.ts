import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IEmployeeRepository } from '../repositories';
import { EMPLOYEE_REPOSITORY } from '../repositories';

/**
 * Generates unique employee numbers in format: EMP-XXXXX
 * Example: EMP-00001, EMP-00002, EMP-00003
 * Sequential numbering without year separation
 */
@Injectable()
export class GenerateEmployeeNumberUseCase {
  private readonly logger = new Logger(GenerateEmployeeNumberUseCase.name);

  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private employeeRepository: IEmployeeRepository,
  ) {}

  async execute(): Promise<string> {
    const start = Date.now();
    this.logger.log('⏳ Fetching last employee number...');

    // Get the last employee number (no year filtering)
    const lastEmployeeNumber =
      await this.employeeRepository.getLastEmployeeNumber(0);

    this.logger.log(
      `✅ Last employee number fetched in ${Date.now() - start}ms: ${lastEmployeeNumber || 'none'}`,
    );

    let nextNumber = 1;

    if (lastEmployeeNumber) {
      // Extract the number part from EMP-XXXXX
      const parts = lastEmployeeNumber.split('-');
      if (parts.length === 2) {
        const currentNumber = parseInt(parts[1], 10);
        nextNumber = currentNumber + 1;
      }
    }

    // Format: EMP-XXXXX (e.g., EMP-00001, EMP-00002)
    const employeeNumber = `EMP-${String(nextNumber).padStart(5, '0')}`;
    this.logger.log(`Generated number: ${employeeNumber}`);

    // Ensure uniqueness (in case of race conditions)
    const checkStart = Date.now();
    const exists =
      await this.employeeRepository.existsByEmployeeNumber(employeeNumber);
    this.logger.log(
      `✅ Uniqueness check completed in ${Date.now() - checkStart}ms: ${exists ? 'EXISTS (will retry)' : 'unique'}`,
    );

    if (exists) {
      this.logger.warn('⚠️  Number already exists, generating new one...');
      // If somehow exists, try again with next number
      return this.execute();
    }

    this.logger.log(`🎉 Final employee number: ${employeeNumber}`);
    return employeeNumber;
  }
}
