import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { UpdateProjectCostUseCase } from './update-project-cost.use-case';
import { ProjectCostEntity } from '../entities/project-cost.entity';
import type { IProjectCostRepository } from '../repositories';
import type { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';

type MockFn<T = unknown, A extends unknown[] = unknown[]> = jest.Mock<T, A>;

describe('UpdateProjectCostUseCase', () => {
  const makeUseCase = () => {
    const repository: Pick<IProjectCostRepository, 'findById' | 'update'> = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const logger: Pick<WinstonLoggerService, 'setContext' | 'log'> = {
      setContext: jest.fn(),
      log: jest.fn(),
    };

    const useCase = new UpdateProjectCostUseCase(
      repository as IProjectCostRepository,
      logger as WinstonLoggerService,
    );

    return { useCase, repository };
  };

  it('throws NotFoundException when cost does not exist', async () => {
    const { useCase, repository } = makeUseCase();
    (repository.findById as MockFn<Promise<null>, [string]>).mockResolvedValue(
      null,
    );

    await expect(
      useCase.execute('missing-cost', { description: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException when cost is immutable (PAID)', async () => {
    const { useCase, repository } = makeUseCase();
    (
      repository.findById as MockFn<Promise<ProjectCostEntity>, [string]>
    ).mockResolvedValue(
      new ProjectCostEntity({
        id: 'cost-1',
        amount: 1000,
        currency: 'SAR',
        costType: 'MATERIAL',
        transactionDate: new Date(),
        description: 'locked cost',
        paymentStatus: PaymentStatus.PAID,
        isAllocated: false,
        createdBy: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
        rowVersion: 2,
      }),
    );

    await expect(
      useCase.execute('cost-1', { description: 'try update' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates editable cost and returns repository result', async () => {
    const { useCase, repository } = makeUseCase();
    (
      repository.findById as MockFn<Promise<ProjectCostEntity>, [string]>
    ).mockResolvedValue(
      new ProjectCostEntity({
        id: 'cost-2',
        amount: 2000,
        currency: 'SAR',
        costType: 'MATERIAL',
        transactionDate: new Date(),
        description: 'editable cost',
        paymentStatus: PaymentStatus.PENDING,
        isAllocated: false,
        createdBy: 'u1',
        createdAt: new Date(),
        updatedAt: new Date(),
        rowVersion: 4,
      }),
    );
    (
      repository.update as MockFn<
        Promise<Record<string, unknown>>,
        [string, Record<string, unknown>]
      >
    ).mockResolvedValue({
      id: 'cost-2',
      description: 'updated',
      rowVersion: 5,
    });

    const result = await useCase.execute('cost-2', {
      description: 'updated',
      rowVersion: 4,
    });

    expect(repository.update).toHaveBeenCalledWith('cost-2', {
      description: 'updated',
      rowVersion: 4,
    });
    expect(result.id).toBe('cost-2');
  });
});
