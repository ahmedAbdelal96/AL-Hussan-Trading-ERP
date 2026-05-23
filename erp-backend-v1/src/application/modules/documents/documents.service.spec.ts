import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import type { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import type { StorageService } from '../../../infrastructure/storage/storage.service';

type MockFn<T = unknown> = jest.Mock<Promise<T>, []>;

interface PrismaMock {
  employee: { findUnique: MockFn };
  project: { findUnique: MockFn };
  asset: { findUnique: MockFn };
  maintenanceRequest: { findUnique: MockFn };
  employeeDocument: { findUnique: MockFn };
  projectDocument: { findUnique: MockFn };
  assetDocument: { findUnique: MockFn };
  maintenanceDocument: { findUnique: MockFn };
}

describe('DocumentsService - Entity Code Resolution', () => {
  const makeService = (prismaOverrides: Partial<PrismaMock> = {}) => {
    const prisma: PrismaMock = {
      employee: { findUnique: jest.fn() },
      project: { findUnique: jest.fn() },
      asset: { findUnique: jest.fn() },
      maintenanceRequest: { findUnique: jest.fn() },
      employeeDocument: { findUnique: jest.fn() },
      projectDocument: { findUnique: jest.fn() },
      assetDocument: { findUnique: jest.fn() },
      maintenanceDocument: { findUnique: jest.fn() },
      ...prismaOverrides,
    };

    const storage = {} as StorageService;
    return {
      service: new DocumentsService(
        prisma as unknown as PrismaService,
        storage,
      ),
      prisma,
    };
  };

  it('resolves employee code from employeeNumber', async () => {
    const { service, prisma } = makeService();
    prisma.employee.findUnique.mockResolvedValue({
      employeeNumber: 'EMP-2026-0001',
      deletedAt: null,
    });

    await expect(
      service.resolveEntityCode('employee', 'emp-id-1'),
    ).resolves.toBe('EMP-2026-0001');
  });

  it('throws NotFoundException when entity is soft-deleted', async () => {
    const { service, prisma } = makeService();
    prisma.employee.findUnique.mockResolvedValue({
      employeeNumber: 'EMP-2026-0002',
      deletedAt: new Date(),
    });

    await expect(
      service.resolveEntityCode('employees', 'emp-id-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException for unsupported entity type', async () => {
    const { service } = makeService();

    await expect(
      service.resolveEntityCode('unknown-entity', 'x'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resolves code by document id for project documents', async () => {
    const { service, prisma } = makeService();
    prisma.projectDocument.findUnique.mockResolvedValue({
      projectId: 'prj-id-9',
    });
    prisma.project.findUnique.mockResolvedValue({
      projectCode: 'PRJ-0099',
      deletedAt: null,
    });

    await expect(
      service.resolveEntityCodeByDocument('projects', 'doc-id-1'),
    ).resolves.toBe('PRJ-0099');
  });

  it('throws NotFoundException when document does not exist', async () => {
    const { service, prisma } = makeService();
    prisma.assetDocument.findUnique.mockResolvedValue(null);

    await expect(
      service.resolveEntityCodeByDocument('asset', 'missing-doc'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
