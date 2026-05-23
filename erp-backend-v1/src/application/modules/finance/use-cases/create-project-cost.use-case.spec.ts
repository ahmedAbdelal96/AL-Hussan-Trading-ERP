import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import type { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { CreateProjectCostUseCase } from './create-project-cost.use-case';
import { ProjectCostEntity } from '../entities/project-cost.entity';
import type { IProjectCostRepository } from '../repositories';
import type { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';

type MockFn<T = unknown, A extends unknown[] = unknown[]> = jest.Mock<T, A>;

interface PrismaMock {
  project: {
    findUnique: MockFn<
      Promise<{ id: string; name: string; status: ProjectStatus } | null>,
      [unknown]
    >;
  };
}

describe('CreateProjectCostUseCase', () => {
  const makeUseCase = () => {
    const repository: Pick<IProjectCostRepository, 'create'> = {
      create: jest.fn(),
    };

    const logger: Pick<WinstonLoggerService, 'setContext' | 'log'> = {
      setContext: jest.fn(),
      log: jest.fn(),
    };

    const prisma: PrismaMock = {
      project: {
        findUnique: jest.fn(),
      },
    };

    const useCase = new CreateProjectCostUseCase(
      repository as IProjectCostRepository,
      logger as WinstonLoggerService,
      prisma as unknown as PrismaService,
    );

    return { useCase, repository, prisma };
  };

  it('throws NotFoundException when dto.projectId is provided but project is missing', async () => {
    const { useCase, prisma } = makeUseCase();
    prisma.project.findUnique.mockResolvedValue(null);

    await expect(
      useCase.execute(
        {
          projectId: 'project-404',
          costType: 'MATERIAL',
          amount: 1200,
          transactionDate: '2026-03-05',
          description: 'materials',
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException when project exists but is locked', async () => {
    const { useCase, prisma } = makeUseCase();
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      name: 'Locked Project',
      status: ProjectStatus.CANCELLED,
    });

    await expect(
      useCase.execute(
        {
          projectId: 'project-1',
          costType: 'MATERIAL',
          amount: 1200,
          transactionDate: '2026-03-05',
          description: 'materials',
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates cost and maps response fields for editable project', async () => {
    const { useCase, prisma, repository } = makeUseCase();
    prisma.project.findUnique.mockResolvedValue({
      id: 'project-1',
      name: 'Active Project',
      status: ProjectStatus.ACTIVE,
    });

    (
      repository.create as MockFn<
        Promise<ProjectCostEntity>,
        [Record<string, unknown>, string]
      >
    ).mockResolvedValue(
      new ProjectCostEntity({
        id: 'cost-100',
        projectId: 'project-1',
        isAllocated: false,
        costType: 'MATERIAL',
        amount: 1200,
        currency: 'SAR',
        transactionDate: new Date('2026-03-05T00:00:00.000Z'),
        description: 'materials',
        paymentStatus: 'PENDING',
        createdBy: 'user-1',
        createdAt: new Date('2026-03-05T01:00:00.000Z'),
        updatedAt: new Date('2026-03-05T01:00:00.000Z'),
        rowVersion: 1,
      }),
    );

    const result = await useCase.execute(
      {
        projectId: 'project-1',
        costType: 'MATERIAL',
        amount: 1200,
        transactionDate: '2026-03-05',
        description: 'materials',
      },
      'user-1',
    );

    expect(repository.create).toHaveBeenCalled();
    expect(result.id).toBe('cost-100');
    expect(result.projectId).toBe('project-1');
    expect(result.paymentStatus).toBe('PENDING');
    expect(result.rowVersion).toBe(1);
  });
});
