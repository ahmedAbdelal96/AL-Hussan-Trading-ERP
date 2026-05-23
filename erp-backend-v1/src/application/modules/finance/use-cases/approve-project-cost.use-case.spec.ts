import { ApproveProjectCostUseCase } from './approve-project-cost.use-case';
import type { IProjectCostRepository } from '../repositories';
import type { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';

type MockFn<T = unknown, A extends unknown[] = unknown[]> = jest.Mock<T, A>;

describe('ApproveProjectCostUseCase', () => {
  const makeUseCase = () => {
    const repository: Pick<IProjectCostRepository, 'approve'> = {
      approve: jest.fn(),
    };

    const logger: Pick<WinstonLoggerService, 'setContext' | 'log'> = {
      setContext: jest.fn(),
      log: jest.fn(),
    };

    const useCase = new ApproveProjectCostUseCase(
      repository as IProjectCostRepository,
      logger as WinstonLoggerService,
    );

    return { useCase, repository };
  };

  it('approves project cost using rowVersion and returns response', async () => {
    const { useCase, repository } = makeUseCase();

    (
      repository.approve as MockFn<
        Promise<Record<string, unknown>>,
        [string, string, string | undefined, number | undefined]
      >
    ).mockResolvedValue({
      id: 'cost-1',
      paymentStatus: 'APPROVED',
      approvedBy: 'manager-1',
      rowVersion: 4,
    });

    const result = await useCase.execute(
      'cost-1',
      { notes: 'approved', rowVersion: 3 },
      'manager-1',
    );

    expect(repository.approve).toHaveBeenCalledWith(
      'cost-1',
      'manager-1',
      'approved',
      3,
    );
    expect(result.id).toBe('cost-1');
  });
});
