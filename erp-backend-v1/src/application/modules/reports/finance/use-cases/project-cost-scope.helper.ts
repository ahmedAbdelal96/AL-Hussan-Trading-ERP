import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import { CostType, PaymentStatus, Prisma } from '@prisma/client';

export interface ProjectScopedCostRow {
  id: string;
  amount: number;
  amountBeforeTax: number;
  taxAmount: number;
  taxRate: number;
  paymentStatus: PaymentStatus;
  costType: CostType;
  categoryId: string | null;
  transactionDate: Date;
  createdAt: Date;
  description: string;
  invoiceNumber: string | null;
  projectName: string | null;
  creatorName: string | null;
}

interface FetchProjectScopedCostsOptions {
  includeCreatorName?: boolean;
  includeProjectName?: boolean;
}

/**
 * Returns a normalized cost stream for one project:
 * - direct costs (`cost.projectId = projectId`)
 * - allocated shares (`costAllocation.projectId = projectId`) using allocatedAmount
 *
 * This avoids double counting allocated costs when project-specific reports are requested.
 */
export async function fetchProjectScopedCosts(
  prisma: PrismaService,
  projectId: string,
  where: Prisma.CostWhereInput,
  options: FetchProjectScopedCostsOptions = {},
): Promise<ProjectScopedCostRow[]> {
  const round2 = (value: number): number => Math.round(value * 100) / 100;
  const directCosts = await prisma.cost.findMany({
    where: { ...where, projectId },
    select: {
      id: true,
      amount: true,
      amountBeforeTax: true,
      taxAmount: true,
      taxRate: true,
      paymentStatus: true,
      costType: true,
      categoryId: true,
      transactionDate: true,
      createdAt: true,
      description: true,
      invoiceNumber: true,
      project: options.includeProjectName
        ? {
            select: { name: true },
          }
        : false,
      creator: options.includeCreatorName
        ? {
            select: { firstName: true, lastName: true },
          }
        : false,
    },
  });

  const allocatedCosts = await prisma.costAllocation.findMany({
    where: {
      projectId,
      cost: {
        ...where,
        projectId: null,
        isAllocated: true,
      },
    },
    select: {
      costId: true,
      allocatedAmount: true,
      project: options.includeProjectName
        ? {
            select: { name: true },
          }
        : false,
      cost: {
        select: {
          paymentStatus: true,
          taxRate: true,
          costType: true,
          categoryId: true,
          transactionDate: true,
          createdAt: true,
          description: true,
          invoiceNumber: true,
          creator: options.includeCreatorName
            ? {
                select: { firstName: true, lastName: true },
              }
            : false,
        },
      },
    },
  });

  const directRows: ProjectScopedCostRow[] = directCosts.map((cost) => ({
    id: cost.id,
    amount: Number(cost.amount),
    amountBeforeTax: Number(cost.amountBeforeTax || 0),
    taxAmount: Number(cost.taxAmount || 0),
    taxRate: Number(cost.taxRate || 0),
    paymentStatus: cost.paymentStatus,
    costType: cost.costType,
    categoryId: cost.categoryId,
    transactionDate: cost.transactionDate,
    createdAt: cost.createdAt,
    description: cost.description,
    invoiceNumber: cost.invoiceNumber,
    projectName:
      options.includeProjectName && cost.project ? cost.project.name : null,
    creatorName:
      options.includeCreatorName && cost.creator
        ? `${cost.creator.firstName} ${cost.creator.lastName}`
        : null,
  }));

  const allocatedRows: ProjectScopedCostRow[] = allocatedCosts.map((alloc) => ({
    // For allocated costs, derive this project's tax split from allocated amount + original tax rate.
    id: alloc.costId,
    amount: Number(alloc.allocatedAmount),
    amountBeforeTax: round2(
      Number(alloc.allocatedAmount) /
        (1 + Number(alloc.cost.taxRate || 0) / 100),
    ),
    taxAmount: round2(
      Number(alloc.allocatedAmount) -
        Number(alloc.allocatedAmount) /
          (1 + Number(alloc.cost.taxRate || 0) / 100),
    ),
    taxRate: Number(alloc.cost.taxRate || 0),
    paymentStatus: alloc.cost.paymentStatus,
    costType: alloc.cost.costType,
    categoryId: alloc.cost.categoryId,
    transactionDate: alloc.cost.transactionDate,
    createdAt: alloc.cost.createdAt,
    description: alloc.cost.description,
    invoiceNumber: alloc.cost.invoiceNumber,
    projectName:
      options.includeProjectName && alloc.project ? alloc.project.name : null,
    creatorName:
      options.includeCreatorName && alloc.cost.creator
        ? `${alloc.cost.creator.firstName} ${alloc.cost.creator.lastName}`
        : null,
  }));

  return [...directRows, ...allocatedRows];
}
