import { Injectable, Inject } from '@nestjs/common';
import { PAYSLIP_REPOSITORY, type IPayslipRepository } from '../repositories';
import { PayslipFiltersDto, PayslipStatisticsDto } from '../dto';

@Injectable()
export class GetPayslipStatisticsUseCase {
  constructor(
    @Inject(PAYSLIP_REPOSITORY)
    private readonly payslipRepository: IPayslipRepository,
  ) {}

  async execute(filters: PayslipFiltersDto): Promise<PayslipStatisticsDto> {
    return this.payslipRepository.getStatistics(filters);
  }
}
