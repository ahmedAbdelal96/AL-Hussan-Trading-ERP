/**
 * Get All Assets Use Case
 */

import { Injectable, Inject } from '@nestjs/common';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { IAssetRepository, ASSET_REPOSITORY } from '../repositories';
import { AssetFiltersDto, AssetListResponseDto } from '../dto';

@Injectable()
export class GetAllAssetsUseCase {
  constructor(
    @Inject(ASSET_REPOSITORY)
    private readonly assetRepository: IAssetRepository,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext(GetAllAssetsUseCase.name);
  }

  async execute(filters: AssetFiltersDto): Promise<AssetListResponseDto> {
    const result = await this.assetRepository.findAll(filters);

    return {
      data: result.data.map((asset) => ({
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
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
