import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { IAssetRepository, ASSET_REPOSITORY } from '../repositories';
import { AssignEmployeeToAssetDto } from '../dto';
import { assertAssetIsAssignable } from './asset-status.guard';

@Injectable()
export class AssignEmployeeToAssetUseCase {
  constructor(
    @Inject(ASSET_REPOSITORY)
    private readonly assetRepository: IAssetRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(AssignEmployeeToAssetUseCase.name);
  }

  async execute(
    assetId: string,
    dto: AssignEmployeeToAssetDto,
    userId: string,
  ) {
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundException(
        this.i18n.t('assets.get.notFound', { args: { id: assetId } }),
      );
    }
    assertAssetIsAssignable(asset);

    const isAlreadyAssigned = await this.assetRepository.isEmployeeAssigned(
      assetId,
      dto.employeeId,
    );
    if (isAlreadyAssigned) {
      throw new ConflictException(
        this.i18n.t('assets.assign.toEmployee.alreadyAssigned'),
      );
    }

    const assignment = await this.assetRepository.assignEmployee(
      assetId,
      dto,
      userId,
    );

    this.logger.log(`Employee ${dto.employeeId} assigned to asset ${assetId}`);

    return {
      id: assignment.id,
      assetId: assignment.assetId,
      employeeId: assignment.employeeId,
      assignmentType: assignment.assignmentType,
      isPrimary: assignment.isPrimary,
      assignedDate: assignment.assignedDate,
      isActive: assignment.isActive,
      notes: assignment.notes,
    };
  }
}
