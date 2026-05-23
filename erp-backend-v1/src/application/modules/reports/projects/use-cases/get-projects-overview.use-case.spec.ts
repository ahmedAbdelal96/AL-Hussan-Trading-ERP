import { ProjectStatus } from '@prisma/client';
import { GetProjectsOverviewUseCase } from './get-projects-overview.use-case';
import type { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import type { BaseReportService } from '../../services/base-report.service';

type MockFn<T = unknown, A extends unknown[] = unknown[]> = jest.Mock<T, A>;

interface PrismaMock {
  project: {
    findMany: MockFn<Promise<Array<Record<string, unknown>>>, [unknown]>;
  };
  cost: {
    aggregate: MockFn<Promise<{ _sum: { amount: number | null } }>, [unknown]>;
  };
  costAllocation: {
    aggregate: MockFn<
      Promise<{ _sum: { allocatedAmount: number | null } }>,
      [unknown]
    >;
  };
}

describe('GetProjectsOverviewUseCase', () => {
  const makeUseCase = () => {
    const prisma: PrismaMock = {
      project: {
        findMany: jest.fn(),
      },
      cost: {
        aggregate: jest.fn(),
      },
      costAllocation: {
        aggregate: jest.fn(),
      },
    };

    const baseReportService: Pick<
      BaseReportService,
      'roundNumber' | 'calculatePercentage'
    > = {
      roundNumber: jest.fn(),
      calculatePercentage: jest.fn(),
    };

    const useCase = new GetProjectsOverviewUseCase(
      prisma as unknown as PrismaService,
      baseReportService as BaseReportService,
    );

    return { useCase, prisma, baseReportService };
  };

  it('returns projects overview KPIs with budget and completion metrics', async () => {
    const { useCase, prisma, baseReportService } = makeUseCase();

    (
      baseReportService.roundNumber as MockFn<number, [number]>
    ).mockImplementation((value) => Number(value.toFixed(2)));
    (
      baseReportService.calculatePercentage as MockFn<number, [number, number]>
    ).mockImplementation((part, total) =>
      total === 0 ? 0 : Number(((part / total) * 100).toFixed(2)),
    );

    prisma.project.findMany
      // first call: main projects list
      .mockResolvedValueOnce([
        {
          id: 'p1',
          status: ProjectStatus.ACTIVE,
          budget: 1000,
          completionPercentage: 40,
          createdAt: new Date('2026-03-01'),
        },
        {
          id: 'p2',
          status: ProjectStatus.COMPLETED,
          budget: 2000,
          completionPercentage: 100,
          createdAt: new Date('2026-03-02'),
        },
      ])
      // second call: getTotalCosts -> fetch project ids
      .mockResolvedValueOnce([{ id: 'p1' }, { id: 'p2' }]);

    prisma.cost.aggregate.mockResolvedValue({
      _sum: { amount: 1200 },
    });
    prisma.costAllocation.aggregate.mockResolvedValue({
      _sum: { allocatedAmount: 300 },
    });

    const result = await useCase.execute({
      month: 3,
      year: 2026,
      includeComparison: false,
      includeCostBreakdown: false,
    });

    expect(result.totalProjects).toBe(2);
    expect(result.activeProjects).toBe(1);
    expect(result.completedProjects).toBe(1);
    expect(result.totalBudget).toBe(3000);
    expect(result.totalActualCost).toBe(1500);
    expect(result.budgetVariance).toBe(1500);
    expect(result.budgetUtilization).toBe(50);
    expect(result.avgCompletion).toBe(70);
    expect(result.completionRate).toBe(50);
    expect(result.currency).toBe('SAR');
  });
});
