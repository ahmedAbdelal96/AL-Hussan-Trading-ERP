import { IsInt, Min, Max, IsOptional, IsArray, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class PreviewPayrollDto {
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  payPeriodMonth: number;

  @IsInt()
  @Min(2000)
  @Type(() => Number)
  payPeriodYear: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  employeeIds?: string[];
}

export interface PreviewEmployeePayroll {
  employeeId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  department: string;
  baseSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  foodAllowance: number;
  otherAllowances: number;
  totalAllowances: number;
  grossSalary: number;
  insuranceDeduction: number;
  taxDeduction: number;
  loanDeduction: number;
  absenceDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  error?: string;
}

export interface PreviewPayrollResponseDto {
  alreadyProcessed: boolean;
  totalEmployees: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;
  employees: PreviewEmployeePayroll[];
  errors?: { employeeId: string; employeeName: string; error: string }[];
}
