import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { IAssetRepository, ASSET_REPOSITORY } from '../repositories';
import { CreateMaintenanceRequestDto } from '../dto';
import { assertAssetCanHaveMaintenance } from './asset-status.guard';

@Injectable()
export class CreateMaintenanceRequestUseCase {
  constructor(
    @Inject(ASSET_REPOSITORY)
    private readonly assetRepository: IAssetRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(CreateMaintenanceRequestUseCase.name);
  }

  async execute(
    assetId: string,
    dto: CreateMaintenanceRequestDto,
    userId: string,
  ) {
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundException(
        this.i18n.t('assets.maintenance.assetNotFound', {
          args: { id: assetId },
        }),
      );
    }
    assertAssetCanHaveMaintenance(asset);

    const request = await this.assetRepository.createMaintenanceRequest(
      assetId,
      dto,
      userId,
    );

    this.logger.log(`Maintenance request created for asset ${assetId}`);

    return {
      id: request.id,
      assetId: request.assetId,
      title: request.title,
      maintenanceType: request.maintenanceType,
      priority: request.priority,
      status: request.status,
      description: request.description,
      scheduledDate: request.scheduledDate,
      estimatedCost: request.estimatedCost
        ? Number(request.estimatedCost)
        : null,
      vendor: request.vendor,
      createdAt: request.createdAt,
    };
  }
}
