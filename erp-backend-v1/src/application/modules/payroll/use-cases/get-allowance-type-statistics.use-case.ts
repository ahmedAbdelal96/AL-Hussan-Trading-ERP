import { Injectable, Inject } from '@nestjs/common';
import { ALLOWANCE_TYPE_REPOSITORY } from '../repositories';
import type { IAllowanceTypeRepository } from '../repositories';
import { AllowanceTypeStatisticsDto } from '../dto';

@Injectable()
export class GetAllowanceTypeStatisticsUseCase {
  constructor(
    @Inject(ALLOWANCE_TYPE_REPOSITORY)
    private readonly allowanceTypeRepository: IAllowanceTypeRepository,
  ) {}

  async execute(filters?: {
    search?: string;
  }): Promise<AllowanceTypeStatisticsDto> {
    return this.allowanceTypeRepository.getStatistics(filters);
  }
}
