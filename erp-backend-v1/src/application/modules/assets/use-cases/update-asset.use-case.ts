/**
 * Update Asset Use Case
 */

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { IAssetRepository, ASSET_REPOSITORY } from '../repositories';
import { UpdateAssetDto, AssetResponseDto } from '../dto';
import { assertAssetIsEditable } from './asset-status.guard';

@Injectable()
export class UpdateAssetUseCase {
  constructor(
    @Inject(ASSET_REPOSITORY)
    private readonly assetRepository: IAssetRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(UpdateAssetUseCase.name);
  }

  async execute(
    id: string,
    dto: UpdateAssetDto,
    userId: string,
  ): Promise<AssetResponseDto> {
    const existing = await this.assetRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(
        this.i18n.t('assets.update.notFound', { args: { id } }),
      );
    }
    assertAssetIsEditable(existing);

    const asset = await this.assetRepository.update(id, dto, userId);

    return {
      id: asset.id,
      assetNumber: asset.assetNumber,
      name: asset.name,
      assetType: asset.assetType,
      category: asset.category,
      manufacturer: asset.manufacturer,
      model: asset.model,
      serialNumber: asset.serialNumber,
      yearOfManufacture: asset.yearOfManufacture,
      purchaseDate: asset.purchaseDate,
      purchasePrice: asset.purchasePrice ? Number(asset.purchasePrice) : null,
      vendor: asset.vendor,
      warrantyExpiry: asset.warrantyExpiry,
      licensePlate: asset.licensePlate,
      chassisNumber: asset.chassisNumber,
      engineNumber: asset.engineNumber,
      color: asset.color,
      fuelType: asset.fuelType,
      status: asset.status,
      currentLocation: asset.currentLocation,
      currentOdometer: asset.currentOdometer,
      specifications: asset.specifications,
      description: asset.description,
      notes: asset.notes,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
      createdBy: asset.createdBy,
      updatedBy: asset.updatedBy,
      rowVersion: asset.rowVersion,
    };
  }
}
