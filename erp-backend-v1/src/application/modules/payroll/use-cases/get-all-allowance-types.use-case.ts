/**
 * Get All Allowance Types Use Case
 * Business logic for retrieving all allowance types with filters
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  ALLOWANCE_TYPE_REPOSITORY,
  type IAllowanceTypeRepository,
} from '../repositories';
import { AllowanceTypeFiltersDto } from '../dto';
import { AllowanceTypeEntity } from '../entities';

@Injectable()
export class GetAllAllowanceTypesUseCase {
  constructor(
    @Inject(ALLOWANCE_TYPE_REPOSITORY)
    private readonly allowanceTypeRepository: IAllowanceTypeRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetAllAllowanceTypesUseCase.name);
  }

  async execute(filters: AllowanceTypeFiltersDto): Promise<{
    data: AllowanceTypeEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log('Fetching all allowance types with filters');

    const result = await this.allowanceTypeRepository.findAll(filters);

    return result;
  }
}
