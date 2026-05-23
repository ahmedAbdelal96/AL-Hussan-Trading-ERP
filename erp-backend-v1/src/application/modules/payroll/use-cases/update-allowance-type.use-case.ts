/**
 * Update Allowance Type Use Case
 * Business logic for updating an existing allowance type
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import {
  ALLOWANCE_TYPE_REPOSITORY,
  type IAllowanceTypeRepository,
} from '../repositories';
import { UpdateAllowanceTypeDto } from '../dto';
import { AllowanceTypeEntity } from '../entities';

@Injectable()
export class UpdateAllowanceTypeUseCase {
  constructor(
    @Inject(ALLOWANCE_TYPE_REPOSITORY)
    private readonly allowanceTypeRepository: IAllowanceTypeRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(UpdateAllowanceTypeUseCase.name);
  }

  async execute(
    id: string,
    dto: UpdateAllowanceTypeDto,
  ): Promise<AllowanceTypeEntity> {
    this.logger.log(`Updating allowance type with ID: ${id}`);

    try {
      // Check if allowance type exists
      const existing = await this.allowanceTypeRepository.findById(id);
      if (!existing) {
        throw new NotFoundException(`Allowance type with ID ${id} not found`);
      }

      // Check name uniqueness if name is being updated
      if (dto.name && dto.name !== existing.name) {
        const existingByName = await this.allowanceTypeRepository.findByName(
          dto.name,
        );
        if (existingByName) {
          throw new ConflictException(
            `Allowance type with name "${dto.name}" already exists`,
          );
        }
      }

      // Update allowance type
      const updated = await this.allowanceTypeRepository.update(id, dto);

      this.logger.log(`Allowance type updated successfully: ${id}`);

      return updated;
    } catch (error) {
      this.logger.log(`Failed to update allowance type: ${error.message}`);
      throw error;
    }
  }
}
