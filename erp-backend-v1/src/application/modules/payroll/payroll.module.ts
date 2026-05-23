import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../infrastructure/database/database.module';
import { LoggerModule } from '../../../infrastructure/logger/logger.module';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';

// Controllers
import { PayrollController } from './controllers/payroll.controller';

// Common Services
import { UserEnrichmentService } from '../../common/services/user-enrichment.service';

// Repositories
import { AllowanceTypeRepository } from './repositories/allowance-type.repository';
import { EmployeeAllowanceRepository } from './repositories/employee-allowance.repository';
import { EmployeeLoanRepository } from './repositories/employee-loan.repository';
import { EmployeeDeductionRepository } from './repositories/employee-deduction.repository';
import { PayslipRepository } from './repositories/payslip.repository';
import {
  ALLOWANCE_TYPE_REPOSITORY,
  EMPLOYEE_ALLOWANCE_REPOSITORY,
  EMPLOYEE_LOAN_REPOSITORY,
  EMPLOYEE_DEDUCTION_REPOSITORY,
  PAYSLIP_REPOSITORY,
} from './repositories';

// Use Cases
import {
  // Salary Management Use Cases
  UpdateEmployeeSalaryUseCase,
  GetEmployeeSalaryHistoryUseCase,
  GetEmployeeSalaryStatsUseCase,

  // Allowance Type Use Cases
  CreateAllowanceTypeUseCase,
  GetAllowanceTypeUseCase,
  GetAllAllowanceTypesUseCase,
  GetAllowanceTypeStatisticsUseCase,
  UpdateAllowanceTypeUseCase,
  DeleteAllowanceTypeUseCase,

  // Employee Allowance Use Cases
  CreateEmployeeAllowanceUseCase,
  GetEmployeeAllowanceUseCase,
  GetAllEmployeeAllowancesUseCase,
  UpdateEmployeeAllowanceUseCase,
  DeleteEmployeeAllowanceUseCase,
  ApproveEmployeeAllowanceUseCase,
  RejectEmployeeAllowanceUseCase,
  GetEmployeeActiveAllowancesUseCase,
  RestoreEmployeeAllowanceUseCase,
  ListDeletedEmployeeAllowancesUseCase,
  GetEmployeeAllowanceStatisticsUseCase,

  // Employee Loan Use Cases
  CreateEmployeeLoanUseCase,
  GetEmployeeLoanUseCase,
  GetAllEmployeeLoansUseCase,
  UpdateEmployeeLoanUseCase,
  DeleteEmployeeLoanUseCase,
  ApproveEmployeeLoanUseCase,
  RejectEmployeeLoanUseCase,
  PayLoanInstallmentUseCase,
  GetEmployeeActiveLoansUseCase,
  GetEmployeeLoanStatisticsUseCase,

  // Employee Deduction Use Cases
  CreateEmployeeDeductionUseCase,
  GetEmployeeDeductionUseCase,
  GetAllEmployeeDeductionsUseCase,
  UpdateEmployeeDeductionUseCase,
  DeleteEmployeeDeductionUseCase,
  ApproveEmployeeDeductionUseCase,
  RejectEmployeeDeductionUseCase,
  UnapproveEmployeeDeductionUseCase,
  RestoreEmployeeDeductionUseCase,
  ListDeletedEmployeeDeductionsUseCase,
  GetEmployeeDeductionsSummaryUseCase,
  GetEmployeeDeductionStatisticsUseCase,

  // Payroll Calculator
  PayrollCalculatorService,

  // Payslip Use Cases
  PreviewPayrollUseCase,
  ProcessPayrollUseCase,
  GetAllPayslipsUseCase,
  GetPayslipStatisticsUseCase,
  GetPayslipUseCase,
  GetEmployeePayslipsUseCase,
  UpdatePayslipPaymentUseCase,

  // Payroll Summary Use Cases
  GetEmployeePayrollSummaryUseCase,
  GetAllEmployeesPayrollSummaryUseCase,

  // Payroll Statistics Use Cases
  GetPayrollStatisticsUseCase,
} from './use-cases';

/**
 * Payroll Module
 *
 * Manages all payroll operations:
 * - Salary Structures (employee salary with effective dates)
 * - Allowance Types (flexible allowance catalog)
 * - Employee Allowances (individual allowances with approval workflow)
 * - Employee Loans (loan management with installment tracking)
 * - Employee Deductions (various deduction types)
 * - Payroll Summaries (comprehensive salary calculations)
 *
 * Permissions:
 * - payroll:salary:create
 * - payroll:salary:read
 * - payroll:salary:update
 * - payroll:salary:delete
 * - payroll:allowance-types:create
 * - payroll:allowance-types:read
 * - payroll:allowance-types:update
 * - payroll:allowance-types:delete
 * - payroll:allowances:create
 * - payroll:allowances:read
 * - payroll:allowances:update
 * - payroll:allowances:delete
 * - payroll:allowances:approve
 * - payroll:loans:create
 * - payroll:loans:read
 * - payroll:loans:update
 * - payroll:loans:delete
 * - payroll:loans:approve
 * - payroll:deductions:create
 * - payroll:deductions:read
 * - payroll:deductions:update
 * - payroll:deductions:delete
 */
@Module({
  imports: [DatabaseModule, LoggerModule, AuthModule, RbacModule],
  controllers: [PayrollController],
  providers: [
    // Common Services
    UserEnrichmentService,

    // Repositories
    {
      provide: ALLOWANCE_TYPE_REPOSITORY,
      useClass: AllowanceTypeRepository,
    },
    {
      provide: EMPLOYEE_ALLOWANCE_REPOSITORY,
      useClass: EmployeeAllowanceRepository,
    },
    {
      provide: EMPLOYEE_LOAN_REPOSITORY,
      useClass: EmployeeLoanRepository,
    },
    {
      provide: EMPLOYEE_DEDUCTION_REPOSITORY,
      useClass: EmployeeDeductionRepository,
    },
    {
      provide: PAYSLIP_REPOSITORY,
      useClass: PayslipRepository,
    },

    // Salary Management Use Cases
    UpdateEmployeeSalaryUseCase,
    GetEmployeeSalaryHistoryUseCase,
    GetEmployeeSalaryStatsUseCase,

    // Allowance Type Use Cases
    CreateAllowanceTypeUseCase,
    GetAllowanceTypeUseCase,
    GetAllAllowanceTypesUseCase,
    GetAllowanceTypeStatisticsUseCase,
    UpdateAllowanceTypeUseCase,
    DeleteAllowanceTypeUseCase,

    // Employee Allowance Use Cases
    CreateEmployeeAllowanceUseCase,
    GetEmployeeAllowanceUseCase,
    GetAllEmployeeAllowancesUseCase,
    UpdateEmployeeAllowanceUseCase,
    DeleteEmployeeAllowanceUseCase,
    ApproveEmployeeAllowanceUseCase,
    RejectEmployeeAllowanceUseCase,
    GetEmployeeActiveAllowancesUseCase,
    RestoreEmployeeAllowanceUseCase,
    ListDeletedEmployeeAllowancesUseCase,
    GetEmployeeAllowanceStatisticsUseCase,

    // Employee Loan Use Cases
    CreateEmployeeLoanUseCase,
    GetEmployeeLoanUseCase,
    GetAllEmployeeLoansUseCase,
    UpdateEmployeeLoanUseCase,
    DeleteEmployeeLoanUseCase,
    ApproveEmployeeLoanUseCase,
    RejectEmployeeLoanUseCase,
    PayLoanInstallmentUseCase,
    GetEmployeeActiveLoansUseCase,
    GetEmployeeLoanStatisticsUseCase,

    // Employee Deduction Use Cases
    CreateEmployeeDeductionUseCase,
    GetEmployeeDeductionUseCase,
    GetAllEmployeeDeductionsUseCase,
    UpdateEmployeeDeductionUseCase,
    DeleteEmployeeDeductionUseCase,
    ApproveEmployeeDeductionUseCase,
    RejectEmployeeDeductionUseCase,
    UnapproveEmployeeDeductionUseCase,
    RestoreEmployeeDeductionUseCase,
    ListDeletedEmployeeDeductionsUseCase,
    GetEmployeeDeductionsSummaryUseCase,
    GetEmployeeDeductionStatisticsUseCase,

    // Payroll Calculator
    PayrollCalculatorService,

    // Payslip Use Cases
    PreviewPayrollUseCase,
    ProcessPayrollUseCase,
    GetAllPayslipsUseCase,
    GetPayslipStatisticsUseCase,
    GetPayslipUseCase,
    GetEmployeePayslipsUseCase,
    UpdatePayslipPaymentUseCase,

    // Payroll Summary Use Cases
    GetEmployeePayrollSummaryUseCase,
    GetAllEmployeesPayrollSummaryUseCase,

    // Payroll Statistics Use Cases
    GetPayrollStatisticsUseCase,
  ],
  exports: [
    ALLOWANCE_TYPE_REPOSITORY,
    EMPLOYEE_ALLOWANCE_REPOSITORY,
    EMPLOYEE_LOAN_REPOSITORY,
    EMPLOYEE_DEDUCTION_REPOSITORY,
    PAYSLIP_REPOSITORY,
  ],
})
export class PayrollModule {}
