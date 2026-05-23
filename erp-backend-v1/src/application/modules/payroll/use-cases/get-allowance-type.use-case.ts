/**
 * Get Allowance Type Use Case
 * Business logic for retrieving a single allowance type by ID
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  ALLOWANCE_TYPE_REPOSITORY,
  type IAllowanceTypeRepository,
} from '../repositories';
import { AllowanceTypeEntity } from '../entities';

@Injectable()
export class GetAllowanceTypeUseCase {
  constructor(
    @Inject(ALLOWANCE_TYPE_REPOSITORY)
    private readonly allowanceTypeRepository: IAllowanceTypeRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(GetAllowanceTypeUseCase.name);
  }

  async execute(id: string): Promise<AllowanceTypeEntity> {
    this.logger.log(`Fetching allowance type with ID: ${id}`);

    const allowanceType = await this.allowanceTypeRepository.findById(id);

    if (!allowanceType) {
      throw new NotFoundException(
        this.i18n.t('payroll.allowance.typeNotFound', { args: { id } }),
      );
    }

    return allowanceType;
  }
}
