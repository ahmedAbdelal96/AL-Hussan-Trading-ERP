import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';

/**
 * Resolves employees in a site through project assignments only.
 * Payroll in this system is project-driven, so site scope is derived
 * from projects belonging to that site.
 */
export async function resolveEmployeeIdsBySiteThroughProjects(
  prisma: PrismaService,
  siteId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<string[]> {
  const assignments = await prisma.projectEmployee.findMany({
    where: {
      project: { siteId, deletedAt: null },
      assignedDate: { lte: periodEnd },
      OR: [{ endDate: null }, { endDate: { gte: periodStart } }],
    },
    select: { employeeId: true },
  });

  return Array.from(new Set(assignments.map((a) => a.employeeId)));
}
