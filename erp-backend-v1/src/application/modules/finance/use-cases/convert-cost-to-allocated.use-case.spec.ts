import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import type { PrismaService } from 'src/infrastructure/database/prisma/prisma.service';
import { ConvertCostToAllocatedUseCase } from './convert-cost-to-allocated.use-case';
import type { IProjectCostRepository } from '../repositories';
import type { CostAllocationRepository } from '../repositories/cost-allocation.repository';
import type { CostAllocationValidatorService } from '../services/cost-allocation-validator.service';
import type { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';

type MockFn<T = unknown, A extends unknown[] = unknown[]> = jest.Mock<T, A>;

interface PrismaMock {
  project: {
    findMany: MockFn<Promise<Array<{ id: string; name: string }>>, [unknown]>;
  };
  $transaction: MockFn<
    Promise<void>,
    [
      (tx: {
        cost: { updateMany: MockFn<Promise<{ count: number }>, [unknown]> };
      }) => Promise<void>,
    ]
  >;
}

describe('ConvertCostToAllocatedUseCase', () => {
  const makeUseCase = () => {
    const costRepository: Pick<IProjectCostRepository, 'findById'> = {
      findById: jest.fn(),
    };

    const allocationRepository: Pick<
      CostAllocationRepository,
      'createMany' | 'findByCostId' | 'getStatistics'
    > = {
      createMany: jest.fn(),
      findByCostId: jest.fn(),
      getStatistics: jest.fn(),
    };

    const validator: Pick<
      CostAllocationValidatorService,
      | 'validateAllocations'
      | 'logValidationResult'
      | 'calculateAmountsFromPercentages'
      | 'calculatePercentagesFromAmounts'
    > = {
      validateAllocations: jest.fn(),
      logValidationResult: jest.fn(),
      calculateAmountsFromPercentages: jest.fn(),
      calculatePercentagesFromAmounts: jest.fn(),
    };

    const prisma: PrismaMock = {
      project: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const logger: Pick<WinstonLoggerService, 'setContext' | 'log'> = {
      setContext: jest.fn(),
      log: jest.fn(),
    };

    const useCase = new ConvertCostToAllocatedUseCase(
      costRepository as IProjectCostRepository,
      allocationRepository as CostAllocationRepository,
      validator as CostAllocationValidatorService,
      logger as WinstonLoggerService,
      prisma as unknown as PrismaService,
    );

    return {
      useCase,
      costRepository,
      allocationRepository,
      validator,
      prisma,
    };
  };

  it('throws NotFoundException when cost does not exist', async () => {
    const { useCase, costRepository } = makeUseCase();
    (
      costRepository.findById as MockFn<Promise<null>, [string, boolean]>
    ).mockResolvedValue(null);

    await expect(
      useCase.execute('cost-1', [{ projectId: 'p1', percentage: 100 }]),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException when cost is already allocated', async () => {
    const { useCase, costRepository } = makeUseCase();
    (
      costRepository.findById as MockFn<
        Promise<Record<string, unknown>>,
        [string, boolean]
      >
    ).mockResolvedValue({
      id: 'cost-1',
      isAllocated: true,
      paymentStatus: PaymentStatus.PENDING,
      amount: 1000,
      projectId: 'project-1',
    });

    await expect(
      useCase.execute('cost-1', [{ projectId: 'p1', percentage: 100 }]),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('converts cost to allocated and returns allocation response', async () => {
    const { useCase, costRepository, validator, prisma, allocationRepository } =
      makeUseCase();

    (
      costRepository.findById as MockFn<
        Promise<Record<string, unknown>>,
        [string, boolean]
      >
    ).mockResolvedValue({
      id: 'cost-1',
      isAllocated: false,
      paymentStatus: PaymentStatus.PENDING,
      amount: 1000,
      projectId: 'project-1',
    });

    (
      validator.validateAllocations as MockFn<
        { isValid: boolean; errors: string[] },
        [Array<Record<string, unknown>>, number]
      >
    ).mockReturnValue({ isValid: true, errors: [] });
    (
      validator.calculateAmountsFromPercentages as MockFn<
        Array<{ projectId: string; amount: number; percentage: number }>,
        [Array<Record<string, unknown>>, number]
      >
    ).mockReturnValue([
      { projectId: 'p1', amount: 600, percentage: 60 },
      { projectId: 'p2', amount: 400, percentage: 40 },
    ]);

    prisma.project.findMany.mockResolvedValue([
      { id: 'p1', name: 'Project A' },
      { id: 'p2', name: 'Project B' },
    ]);

    const tx = {
      cost: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    prisma.$transaction.mockImplementation(async (cb) => cb(tx));

    (
      allocationRepository.createMany as MockFn<
        Promise<Array<Record<string, unknown>>>,
        [string, Array<Record<string, unknown>>, unknown]
      >
    ).mockResolvedValue([]);
    (
      allocationRepository.findByCostId as MockFn<
        Promise<Array<Record<string, unknown>>>,
        [string, unknown, boolean]
      >
    ).mockResolvedValue([
      {
        id: 'a1',
        costId: 'cost-1',
        projectId: 'p1',
        allocatedAmount: 600,
        percentage: 60,
        notes: null,
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-01'),
        project: { id: 'p1', name: 'Project A' },
      },
      {
        id: 'a2',
        costId: 'cost-1',
        projectId: 'p2',
        allocatedAmount: 400,
        percentage: 40,
        notes: null,
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-01'),
        project: { id: 'p2', name: 'Project B' },
      },
    ]);
    (
      allocationRepository.getStatistics as MockFn<
        Promise<{ totalPercentage: number }>,
        [string]
      >
    ).mockResolvedValue({ totalPercentage: 100 });

    const result = await useCase.execute(
      'cost-1',
      [
        { projectId: 'p1', percentage: 60 },
        { projectId: 'p2', percentage: 40 },
      ],
      5,
    );

    expect(result.costId).toBe('cost-1');
    expect(result.projectCount).toBe(2);
    expect(result.isValid).toBe(true);
    expect(tx.cost.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'cost-1', rowVersion: 5 }),
      }),
    );
  });

  it('throws ConflictException when transaction update affects zero rows', async () => {
    const { useCase, costRepository, validator, prisma } = makeUseCase();

    (
      costRepository.findById as MockFn<
        Promise<Record<string, unknown>>,
        [string, boolean]
      >
    ).mockResolvedValue({
      id: 'cost-1',
      isAllocated: false,
      paymentStatus: PaymentStatus.PENDING,
      amount: 1000,
      projectId: 'project-1',
    });

    (
      validator.validateAllocations as MockFn<
        { isValid: boolean; errors: string[] },
        [Array<Record<string, unknown>>, number]
      >
    ).mockReturnValue({ isValid: true, errors: [] });
    (
      validator.calculateAmountsFromPercentages as MockFn<
        Array<{ projectId: string; amount: number; percentage: number }>,
        [Array<Record<string, unknown>>, number]
      >
    ).mockReturnValue([
      { projectId: 'p1', amount: 600, percentage: 60 },
      { projectId: 'p2', amount: 400, percentage: 40 },
    ]);
    prisma.project.findMany.mockResolvedValue([
      { id: 'p1', name: 'Project A' },
      { id: 'p2', name: 'Project B' },
    ]);

    const tx = {
      cost: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    prisma.$transaction.mockImplementation(async (cb) => cb(tx));

    await expect(
      useCase.execute('cost-1', [
        { projectId: 'p1', percentage: 60 },
        { projectId: 'p2', percentage: 40 },
      ]),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
