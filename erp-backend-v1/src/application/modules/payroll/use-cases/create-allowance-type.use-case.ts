/**
 * Create Allowance Type Use Case
 * Business logic for creating a new allowance type
 */

import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  ALLOWANCE_TYPE_REPOSITORY,
  type IAllowanceTypeRepository,
} from '../repositories';
import { CreateAllowanceTypeDto } from '../dto';
import { AllowanceTypeEntity } from '../entities';

@Injectable()
export class CreateAllowanceTypeUseCase {
  constructor(
    @Inject(ALLOWANCE_TYPE_REPOSITORY)
    private readonly allowanceTypeRepository: IAllowanceTypeRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(CreateAllowanceTypeUseCase.name);
  }

  async execute(
    dto: CreateAllowanceTypeDto,
    userId: string,
  ): Promise<AllowanceTypeEntity> {
    this.logger.log(`Creating allowance type: ${dto.name}`);

    try {
      // Check name uniqueness
      const existing = await this.allowanceTypeRepository.findByName(dto.name);
      if (existing) {
        throw new ConflictException(
          this.i18n.t('payroll.allowance.typeExists', {
            args: { name: dto.name },
          }),
        );
      }

      // Create allowance type
      const allowanceType = await this.allowanceTypeRepository.create(
        dto,
        userId,
      );

      this.logger.log(
        `Allowance type created successfully with ID: ${allowanceType.id}`,
      );

      return allowanceType;
    } catch (error) {
      this.logger.log(`Failed to create allowance type: ${error.message}`);
      throw error;
    }
  }
}
