import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LoanRepaymentSource, LoanStatus } from '@prisma/client';
import { PayLoanInstallmentUseCase } from './pay-loan-installment.use-case';
import type { IEmployeeLoanRepository } from '../repositories';
import type { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';

type MockFn<T = unknown, A extends unknown[] = unknown[]> = jest.Mock<T, A>;

describe('PayLoanInstallmentUseCase', () => {
  const makeUseCase = () => {
    const employeeLoanRepository: Pick<
      IEmployeeLoanRepository,
      'findById' | 'payInstallment'
    > = {
      findById: jest.fn(),
      payInstallment: jest.fn(),
    };

    const logger: Pick<WinstonLoggerService, 'setContext' | 'log'> = {
      setContext: jest.fn(),
      log: jest.fn(),
    };

    const useCase = new PayLoanInstallmentUseCase(
      employeeLoanRepository as IEmployeeLoanRepository,
      logger as WinstonLoggerService,
    );

    return { useCase, employeeLoanRepository };
  };

  it('throws NotFoundException when loan does not exist', async () => {
    const { useCase, employeeLoanRepository } = makeUseCase();
    (
      employeeLoanRepository.findById as MockFn<Promise<null>, [string]>
    ).mockResolvedValue(null);

    await expect(
      useCase.execute('loan-1', {}, 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException when loan status is not APPROVED', async () => {
    const { useCase, employeeLoanRepository } = makeUseCase();
    (
      employeeLoanRepository.findById as MockFn<
        Promise<{
          status: LoanStatus;
          paidInstallments: number;
          installments: number;
        }>,
        [string]
      >
    ).mockResolvedValue({
      status: LoanStatus.PENDING,
      paidInstallments: 0,
      installments: 12,
    });

    await expect(
      useCase.execute('loan-1', {}, 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('passes MANUAL repayment source to repository payInstallment', async () => {
    const { useCase, employeeLoanRepository } = makeUseCase();
    (
      employeeLoanRepository.findById as MockFn<
        Promise<{
          status: LoanStatus;
          paidInstallments: number;
          installments: number;
        }>,
        [string]
      >
    ).mockResolvedValue({
      status: LoanStatus.APPROVED,
      paidInstallments: 1,
      installments: 12,
    });

    (
      employeeLoanRepository.payInstallment as MockFn<
        Promise<{ paidInstallments: number; installments: number }>,
        [string, string, Date, number | undefined, LoanRepaymentSource]
      >
    ).mockResolvedValue({
      paidInstallments: 2,
      installments: 12,
    });

    await useCase.execute(
      'loan-1',
      { deductionDate: '2026-03-31', rowVersion: 3 },
      'user-1',
    );

    expect(employeeLoanRepository.payInstallment).toHaveBeenCalledWith(
      'loan-1',
      'user-1',
      expect.any(Date),
      3,
      LoanRepaymentSource.MANUAL,
    );
  });
});
