import { RejectProjectCostUseCase } from './reject-project-cost.use-case';
import type { IProjectCostRepository } from '../repositories';
import type { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';

type MockFn<T = unknown, A extends unknown[] = unknown[]> = jest.Mock<T, A>;

describe('RejectProjectCostUseCase', () => {
  const makeUseCase = () => {
    const repository: Pick<IProjectCostRepository, 'reject'> = {
      reject: jest.fn(),
    };

    const logger: Pick<WinstonLoggerService, 'setContext' | 'log'> = {
      setContext: jest.fn(),
      log: jest.fn(),
    };

    const useCase = new RejectProjectCostUseCase(
      repository as IProjectCostRepository,
      logger as WinstonLoggerService,
    );

    return { useCase, repository };
  };

  it('rejects project cost with reason and rowVersion', async () => {
    const { useCase, repository } = makeUseCase();

    (
      repository.reject as MockFn<
        Promise<Record<string, unknown>>,
        [string, string, string, number | undefined]
      >
    ).mockResolvedValue({
      id: 'cost-1',
      paymentStatus: 'REJECTED',
      rejectedReason: 'Budget exceeded',
      rowVersion: 7,
    });

    const result = await useCase.execute(
      'cost-1',
      { rejectedReason: 'Budget exceeded', rowVersion: 6 },
      'manager-2',
    );

    expect(repository.reject).toHaveBeenCalledWith(
      'cost-1',
      'manager-2',
      'Budget exceeded',
      6,
    );
    expect(result.paymentStatus).toBe('REJECTED');
  });
});
