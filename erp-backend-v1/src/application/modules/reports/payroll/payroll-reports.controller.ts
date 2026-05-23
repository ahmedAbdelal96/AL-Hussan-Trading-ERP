import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../auth/decorators/auth.decorator';
import {
  GetPayrollOverviewUseCase,
  GetPayrollByDepartmentUseCase,
  GetPayrollBySiteUseCase,
  GetSalaryComponentsUseCase,
  GetAllowancesReportUseCase,
  GetDeductionsLoansUseCase,
  GetPayrollTrendUseCase,
  GetPayrollComparisonUseCase,
} from './use-cases';
import {
  PayrollOverviewFiltersDto,
  PayrollByDepartmentFiltersDto,
  PayrollBySiteFiltersDto,
  SalaryComponentsFiltersDto,
  AllowancesReportFiltersDto,
  DeductionsLoansFiltersDto,
  PayrollTrendFiltersDto,
  PayrollComparisonFiltersDto,
} from './dto';
import {
  PayrollOverviewDocs,
  PayrollByDepartmentDocs,
  PayrollBySiteDocs,
  SalaryComponentsDocs,
  AllowancesReportDocs,
  DeductionsLoansReportDocs,
  PayrollTrendDocs,
  PayrollComparisonDocs,
} from './decorators';

@ApiTags('Reports - Payroll')
@Controller('reports/payroll')
export class PayrollReportsController {
  constructor(
    private readonly getPayrollOverviewUseCase: GetPayrollOverviewUseCase,
    private readonly getPayrollByDepartmentUseCase: GetPayrollByDepartmentUseCase,
    private readonly getPayrollBySiteUseCase: GetPayrollBySiteUseCase,
    private readonly getSalaryComponentsUseCase: GetSalaryComponentsUseCase,
    private readonly getAllowancesReportUseCase: GetAllowancesReportUseCase,
    private readonly getDeductionsLoansUseCase: GetDeductionsLoansUseCase,
    private readonly getPayrollTrendUseCase: GetPayrollTrendUseCase,
    private readonly getPayrollComparisonUseCase: GetPayrollComparisonUseCase,
  ) {}

  @Get('overview')
  @Auth({ permissions: ['report:payroll'] })
  @PayrollOverviewDocs()
  async getOverview(@Query() filters: PayrollOverviewFiltersDto) {
    return this.getPayrollOverviewUseCase.execute(filters);
  }

  @Get('by-department')
  @Auth({ permissions: ['report:payroll'] })
  @PayrollByDepartmentDocs()
  async getByDepartment(@Query() filters: PayrollByDepartmentFiltersDto) {
    return this.getPayrollByDepartmentUseCase.execute(filters);
  }

  @Get('by-site')
  @Auth({ permissions: ['report:payroll'] })
  @PayrollBySiteDocs()
  async getBySite(@Query() filters: PayrollBySiteFiltersDto) {
    return this.getPayrollBySiteUseCase.execute(filters);
  }

  @Get('salary-components')
  @Auth({ permissions: ['report:payroll'] })
  @SalaryComponentsDocs()
  async getSalaryComponents(@Query() filters: SalaryComponentsFiltersDto) {
    return this.getSalaryComponentsUseCase.execute(filters);
  }

  @Get('allowances')
  @Auth({ permissions: ['report:payroll'] })
  @AllowancesReportDocs()
  async getAllowances(@Query() filters: AllowancesReportFiltersDto) {
    return this.getAllowancesReportUseCase.execute(filters);
  }

  @Get('deductions-loans')
  @Auth({ permissions: ['report:payroll'] })
  @DeductionsLoansReportDocs()
  async getDeductionsLoans(@Query() filters: DeductionsLoansFiltersDto) {
    return this.getDeductionsLoansUseCase.execute(filters);
  }

  @Get('trend')
  @Auth({ permissions: ['report:payroll'] })
  @PayrollTrendDocs()
  async getTrend(@Query() filters: PayrollTrendFiltersDto) {
    return this.getPayrollTrendUseCase.execute(filters);
  }

  @Get('comparison')
  @Auth({ permissions: ['report:payroll'] })
  @PayrollComparisonDocs()
  async getComparison(@Query() filters: PayrollComparisonFiltersDto) {
    return this.getPayrollComparisonUseCase.execute(filters);
  }
}
