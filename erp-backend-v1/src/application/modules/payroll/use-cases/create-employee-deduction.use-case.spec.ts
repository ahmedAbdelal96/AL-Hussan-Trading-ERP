import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeductionType, EmployeeStatus } from '@prisma/client';
import { CreateEmployeeDeductionUseCase } from './create-employee-deduction.use-case';
import type { IEmployeeDeductionRepository } from '../repositories';
import type { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import type { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import type { I18nService } from 'nestjs-i18n';

type MockFn<T = unknown, A extends unknown[] = unknown[]> = jest.Mock<T, A>;

describe('CreateEmployeeDeductionUseCase', () => {
  const makeUseCase = () => {
    const employeeDeductionRepository: Pick<
      IEmployeeDeductionRepository,
      'create'
    > = {
      create: jest.fn(),
    };

    const prisma = {
      employee: {
        findUnique: jest.fn(),
      },
    } as unknown as PrismaService;

    const logger: Pick<WinstonLoggerService, 'setContext' | 'log'> = {
      setContext: jest.fn(),
      log: jest.fn(),
    };

    const i18n: Pick<I18nService, 't'> = {
      t: jest.fn((key: string) => key),
    };

    const useCase = new CreateEmployeeDeductionUseCase(
      employeeDeductionRepository as IEmployeeDeductionRepository,
      logger as WinstonLoggerService,
      i18n as I18nService,
      prisma,
    );

    return { useCase, employeeDeductionRepository, prisma };
  };

  it('throws NotFoundException when employee does not exist', async () => {
    const { useCase, prisma } = makeUseCase();
    (
      prisma.employee.findUnique as MockFn<Promise<null>, [unknown]>
    ).mockResolvedValue(null);

    await expect(
      useCase.execute(
        {
          employeeId: 'emp-1',
          deductionType: DeductionType.OTHER,
          amount: 100,
          deductionDate: '2026-03-01',
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects manual LOAN_REPAYMENT creation to keep loan as source of truth', async () => {
    const { useCase, prisma } = makeUseCase();
    (
      prisma.employee.findUnique as MockFn<
        Promise<{ id: string; employeeNumber: string; status: EmployeeStatus }>,
        [unknown]
      >
    ).mockResolvedValue({
      id: 'emp-1',
      employeeNumber: 'EMP-1',
      status: EmployeeStatus.ACTIVE,
    });

    await expect(
      useCase.execute(
        {
          employeeId: 'emp-1',
          deductionType: DeductionType.LOAN_REPAYMENT,
          amount: 500,
          deductionDate: '2026-03-01',
          loanId: 'loan-1',
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
