/**
 * ============================================================================
 * GET AGE & EXPERIENCE ANALYSIS USE CASE
 * ============================================================================
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import {
  AgeExperienceFiltersDto,
  AgeExperienceResponseDto,
  AgeGroupItemDto,
  ExperienceRangeItemDto,
  DepartmentAgeExperienceDto,
} from '../dto';

@Injectable()
export class GetAgeExperienceUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    filters: AgeExperienceFiltersDto,
  ): Promise<AgeExperienceResponseDto> {
    // Build where clause
    const where: Record<string, unknown> = {};

    if (filters.department) {
      where.department = filters.department;
    }

    if (filters.employmentType) {
      where.employmentType = filters.employmentType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    // Date filtering
    if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);

      where.hireDate = { lte: endDate };
      where.OR = [
        { terminationDate: null },
        { terminationDate: { gte: startDate } },
      ];
    }

    // Get all employees with necessary fields
    const employees = await this.prisma.employee.findMany({
      where,
      select: {
        id: true,
        dateOfBirth: true,
        hireDate: true,
        gender: true,
        department: { select: { nameEn: true } },
      },
    });

    const now = new Date();

    // Calculate ages and tenures
    const employeeData = employees
      .filter((e) => e.dateOfBirth)
      .map((e) => {
        const dob = new Date(e.dateOfBirth!);
        const age = Math.floor(
          (now.getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365),
        );

        const hireDate = new Date(e.hireDate);
        const tenure =
          (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

        return {
          ...e,
          age,
          tenure,
        };
      })
      .filter((e) => {
        // Apply age filters
        if (filters.minAge && e.age < filters.minAge) return false;
        if (filters.maxAge && e.age > filters.maxAge) return false;

        // Apply experience filters
        if (filters.minExperience && e.tenure < filters.minExperience)
          return false;
        if (filters.maxExperience && e.tenure > filters.maxExperience)
          return false;

        return true;
      });

    const totalEmployees = employeeData.length;

    // AGE GROUP BREAKDOWN
    const ageRanges = [
      { range: '18-25', min: 18, max: 25 },
      { range: '26-35', min: 26, max: 35 },
      { range: '36-45', min: 36, max: 45 },
      { range: '46-55', min: 46, max: 55 },
      { range: '56+', min: 56, max: 999 },
    ];

    const ageGroups: AgeGroupItemDto[] = ageRanges.map(
      ({ range, min, max }) => {
        const inRange = employeeData.filter(
          (e) => e.age >= min && e.age <= max,
        );
        const maleCount = inRange.filter((e) => e.gender === 'MALE').length;
        const femaleCount = inRange.filter((e) => e.gender === 'FEMALE').length;
        const avgAge =
          inRange.length > 0
            ? inRange.reduce((sum, e) => sum + e.age, 0) / inRange.length
            : 0;

        return {
          ageRange: range,
          employeeCount: inRange.length,
          percentage:
            totalEmployees > 0 ? (inRange.length / totalEmployees) * 100 : 0,
          avgAge: parseFloat(avgAge.toFixed(1)),
          maleCount,
          femaleCount,
        };
      },
    );

    // EXPERIENCE RANGE BREAKDOWN
    const expRanges = [
      { range: '0-1 years', min: 0, max: 1 },
      { range: '1-3 years', min: 1, max: 3 },
      { range: '3-5 years', min: 3, max: 5 },
      { range: '5-10 years', min: 5, max: 10 },
      { range: '10+ years', min: 10, max: 999 },
    ];

    const experienceRanges: ExperienceRangeItemDto[] = expRanges.map(
      ({ range, min, max }) => {
        const inRange = employeeData.filter(
          (e) => e.tenure >= min && e.tenure < max,
        );
        const avgTenure =
          inRange.length > 0
            ? inRange.reduce((sum, e) => sum + e.tenure, 0) / inRange.length
            : 0;
        const avgAge =
          inRange.length > 0
            ? inRange.reduce((sum, e) => sum + e.age, 0) / inRange.length
            : 0;

        return {
          experienceRange: range,
          employeeCount: inRange.length,
          percentage:
            totalEmployees > 0 ? (inRange.length / totalEmployees) * 100 : 0,
          avgTenure: parseFloat(avgTenure.toFixed(2)),
          avgAge: parseFloat(avgAge.toFixed(1)),
        };
      },
    );

    // DEPARTMENT SUMMARY
    type EmployeeWithMetrics = {
      department?: { nameEn: string | null } | null;
      age: number;
      tenure: number;
    };

    const deptMap = new Map<string, EmployeeWithMetrics[]>();
    employeeData.forEach((e) => {
      const dept = e.department?.nameEn || 'Unknown';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, []);
      }
      deptMap.get(dept)!.push(e);
    });

    const departmentSummary: DepartmentAgeExperienceDto[] = Array.from(
      deptMap.entries(),
    ).map(([department, emps]) => {
      const ages = emps.map((e) => e.age);
      const tenures = emps.map((e) => e.tenure);

      const avgAge =
        ages.length > 0 ? ages.reduce((sum, a) => sum + a, 0) / ages.length : 0;
      const avgTenure =
        tenures.length > 0
          ? tenures.reduce((sum, t) => sum + t, 0) / tenures.length
          : 0;
      const minAge = ages.length > 0 ? Math.min(...ages) : 0;
      const maxAge = ages.length > 0 ? Math.max(...ages) : 0;

      return {
        department,
        employeeCount: emps.length,
        avgAge: parseFloat(avgAge.toFixed(1)),
        avgTenure: parseFloat(avgTenure.toFixed(2)),
        minAge,
        maxAge,
      };
    });

    // OVERALL STATISTICS
    const allAges = employeeData.map((e) => e.age);
    const allTenures = employeeData.map((e) => e.tenure);

    const avgAge =
      allAges.length > 0
        ? allAges.reduce((sum, a) => sum + a, 0) / allAges.length
        : 0;
    const avgTenure =
      allTenures.length > 0
        ? allTenures.reduce((sum, t) => sum + t, 0) / allTenures.length
        : 0;

    const sortedAges = [...allAges].sort((a, b) => a - b);
    const medianAge =
      sortedAges.length > 0
        ? sortedAges.length % 2 === 0
          ? (sortedAges[sortedAges.length / 2 - 1] +
              sortedAges[sortedAges.length / 2]) /
            2
          : sortedAges[Math.floor(sortedAges.length / 2)]
        : 0;

    const minAge = allAges.length > 0 ? Math.min(...allAges) : 0;
    const maxAge = allAges.length > 0 ? Math.max(...allAges) : 0;

    const under30 = employeeData.filter((e) => e.age < 30).length;
    const age30to45 = employeeData.filter(
      (e) => e.age >= 30 && e.age <= 45,
    ).length;
    const over45 = employeeData.filter((e) => e.age > 45).length;

    return {
      ageGroups,
      experienceRanges,
      departmentSummary,
      totalEmployees,
      avgAge: parseFloat(avgAge.toFixed(1)),
      avgTenure: parseFloat(avgTenure.toFixed(2)),
      medianAge: parseFloat(medianAge.toFixed(1)),
      minAge,
      maxAge,
      under30Count: under30,
      age30to45Count: age30to45,
      over45Count: over45,
      month: filters.month || undefined,
      year: filters.year || undefined,
      generatedAt: new Date(),
    };
  }
}
