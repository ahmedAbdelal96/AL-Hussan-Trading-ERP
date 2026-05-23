import { UpdateProgressUseCase } from './update-progress.use-case';
import type { IProjectRepository } from '../repositories';

type MockFn<T = unknown, A extends unknown[] = unknown[]> = jest.Mock<T, A>;

describe('UpdateProgressUseCase', () => {
  const makeUseCase = () => {
    const projectRepository: Pick<
      IProjectRepository,
      'findById' | 'updateProgress'
    > = {
      findById: jest.fn(),
      updateProgress: jest.fn(),
    };

    const useCase = new UpdateProgressUseCase(
      projectRepository as IProjectRepository,
    );

    return { useCase, projectRepository };
  };

  it('updates project progress and returns mapped response dto', async () => {
    const { useCase, projectRepository } = makeUseCase();

    (
      projectRepository.findById as MockFn<
        Promise<Record<string, unknown> | null>,
        [string]
      >
    ).mockResolvedValue({
      id: 'project-1',
      name: 'مشروع تجريبي',
      status: 'ACTIVE',
      deletedAt: null,
    });

    (
      projectRepository.updateProgress as MockFn<
        Promise<Record<string, unknown>>,
        [string, number, string | undefined, string]
      >
    ).mockResolvedValue({
      id: 'project-1',
      projectCode: 'PRJ-0001',
      name: 'مشروع تجريبي',
      tenderNumber: null,
      description: null,
      clientName: null,
      clientPhone: null,
      clientEmail: null,
      siteId: null,
      site: null,
      googleMapsLink: null,
      location: null,
      latitude: null,
      longitude: null,
      status: 'ACTIVE',
      plannedStartDate: null,
      actualStartDate: null,
      plannedEndDate: null,
      actualEndDate: null,
      budget: { toNumber: () => 1500000 },
      currency: 'SAR',
      completionPercentage: { toNumber: () => 45 },
      progressNotes: 'Updated based on latest site report',
      lastProgressUpdate: new Date('2026-03-05T08:00:00.000Z'),
      managerId: null,
      notes: null,
      deletedAt: null,
      deletedBy: null,
      createdAt: new Date('2026-01-01T08:00:00.000Z'),
      updatedAt: new Date('2026-03-05T08:00:00.000Z'),
      createdBy: 'user-a',
      updatedBy: 'user-b',
      employeeCount: 12,
      rowVersion: 3,
    });

    const result = await useCase.execute(
      'project-1',
      {
        completionPercentage: 45,
        progressNotes: 'Updated based on latest site report',
      },
      'user-b',
    );

    expect(projectRepository.findById).toHaveBeenCalledWith('project-1');
    expect(projectRepository.updateProgress).toHaveBeenCalledWith(
      'project-1',
      45,
      'Updated based on latest site report',
      'user-b',
    );
    expect(result.projectCode).toBe('PRJ-0001');
    expect(result.completionPercentage).toBe(45);
    expect(result.currency).toBe('SAR');
    expect(result.rowVersion).toBe(3);
  });

  it('rejects progress update when project status is CANCELLED', async () => {
    const { useCase, projectRepository } = makeUseCase();

    (
      projectRepository.findById as MockFn<
        Promise<Record<string, unknown> | null>,
        [string]
      >
    ).mockResolvedValue({
      id: 'project-1',
      name: 'مشروع ملغي',
      status: 'CANCELLED',
      deletedAt: null,
    });

    await expect(
      useCase.execute(
        'project-1',
        { completionPercentage: 10, progressNotes: 'test' },
        'user-b',
      ),
    ).rejects.toThrow(/cannot be updated while status is CANCELLED/i);

    expect(projectRepository.updateProgress).not.toHaveBeenCalled();
  });
});
