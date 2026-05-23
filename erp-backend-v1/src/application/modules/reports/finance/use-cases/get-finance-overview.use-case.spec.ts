import { GetFinanceOverviewUseCase } from './get-finance-overview.use-case';
import type { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import type { BaseReportService } from '../../services/base-report.service';

type MockFn<T = unknown, A extends unknown[] = unknown[]> = jest.Mock<T, A>;

interface PrismaMock {
  cost: {
    aggregate: MockFn<Promise<any>, [unknown]>;
  };
}

describe('GetFinanceOverviewUseCase', () => {
  const makeUseCase = () => {
    const prisma: PrismaMock = {
      cost: {
        aggregate: jest.fn(),
      },
    };

    const baseReportService: Pick<
      BaseReportService,
      | 'applyDateRangeFilter'
      | 'calculatePercentage'
      | 'getMonthStart'
      | 'getMonthEnd'
    > = {
      applyDateRangeFilter: jest.fn(),
      calculatePercentage: jest.fn(),
      getMonthStart: jest.fn(),
      getMonthEnd: jest.fn(),
    };

    const useCase = new GetFinanceOverviewUseCase(
      prisma as unknown as PrismaService,
      baseReportService as BaseReportService,
    );

    return { useCase, prisma, baseReportService };
  };

  it('returns aggregated finance overview metrics in non-project mode', async () => {
    const { useCase, prisma, baseReportService } = makeUseCase();

    (
      baseReportService.applyDateRangeFilter as MockFn<
        Record<string, Date>,
        [string | undefined, string | undefined]
      >
    ).mockReturnValue({
      gte: new Date('2026-03-01T00:00:00.000Z'),
      lte: new Date('2026-03-31T23:59:59.999Z'),
    });
    (
      baseReportService.getMonthStart as MockFn<Date, [number]>
    ).mockImplementation((offset) =>
      offset === 0
        ? new Date('2026-03-01T00:00:00.000Z')
        : new Date('2026-02-01T00:00:00.000Z'),
    );
    (
      baseReportService.getMonthEnd as MockFn<Date, [number]>
    ).mockImplementation((offset) =>
      offset === 0
        ? new Date('2026-03-31T23:59:59.999Z')
        : new Date('2026-02-28T23:59:59.999Z'),
    );
    (
      baseReportService.calculatePercentage as MockFn<number, [number, number]>
    ).mockReturnValue(10);

    prisma.cost.aggregate
      .mockResolvedValueOnce({
        _sum: { amount: 10000 },
        _count: { id: 10 },
        _avg: { amount: 1000 },
      })
      .mockResolvedValueOnce({ _sum: { amount: 2000 }, _count: { id: 2 } }) // pending
      .mockResolvedValueOnce({ _sum: { amount: 3000 }, _count: { id: 3 } }) // approved
      .mockResolvedValueOnce({ _sum: { amount: 2500 }, _count: { id: 2 } }) // paid
      .mockResolvedValueOnce({ _sum: { amount: 500 }, _count: { id: 1 } }) // overdue
      .mockResolvedValueOnce({ _sum: { amount: 1000 }, _count: { id: 1 } }) // rejected
      .mockResolvedValueOnce({ _sum: { amount: 1000 }, _count: { id: 1 } }) // partially paid
      .mockResolvedValueOnce({ _sum: { amount: 4400 } }) // current month
      .mockResolvedValueOnce({ _sum: { amount: 4000 } }); // previous month

    const result = await useCase.execute({
      startDate: '2026-03-01',
      endDate: '2026-03-31',
    });

    expect(prisma.cost.aggregate).toHaveBeenCalledTimes(9);
    expect(result.totalCosts).toBe(10000);
    expect(result.totalCount).toBe(10);
    expect(result.averageCost).toBe(1000);
    expect(result.pendingAmount).toBe(2000);
    expect(result.approvedAmount).toBe(3000);
    expect(result.paidAmount).toBe(2500);
    expect(result.overdueAmount).toBe(500);
    expect(result.rejectedAmount).toBe(1000);
    expect(result.partiallyPaidAmount).toBe(1000);
    expect(result.monthGrowthRate).toBe(10);
    expect(result.currency).toBe('SAR');
  });
});
