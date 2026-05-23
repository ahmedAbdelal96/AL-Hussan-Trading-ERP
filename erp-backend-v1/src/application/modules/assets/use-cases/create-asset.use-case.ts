/**
 * Create Asset Use Case
 * Business logic for creating a new asset
 */

import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { IAssetRepository, ASSET_REPOSITORY } from '../repositories';
import { CreateAssetDto, AssetResponseDto } from '../dto';

function toErrorTrace(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}

@Injectable()
export class CreateAssetUseCase {
  constructor(
    @Inject(ASSET_REPOSITORY)
    private readonly assetRepository: IAssetRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(CreateAssetUseCase.name);
  }

  async execute(
    dto: CreateAssetDto,
    userId: string,
  ): Promise<AssetResponseDto> {
    this.logger.log(`Creating new asset: ${dto.name}`);

    try {
      // Validate unique constraints
      if (dto.serialNumber) {
        const exists = await this.checkSerialNumberExists(dto.serialNumber);
        if (exists) {
          throw new ConflictException(
            this.i18n.t('assets.create.serialNumberExists', {
              args: { number: dto.serialNumber },
            }),
          );
        }
      }

      if (dto.licensePlate) {
        const exists = await this.checkLicensePlateExists(dto.licensePlate);
        if (exists) {
          throw new ConflictException(
            this.i18n.t('assets.create.licensePlateExists', {
              args: { plate: dto.licensePlate },
            }),
          );
        }
      }

      // Create asset
      const asset = await this.assetRepository.create(dto, userId);

      this.logger.log(`Asset created successfully: ${asset.assetNumber}`);

      return this.mapToResponseDto(asset);
    } catch (error) {
      this.logger.error('Failed to create asset', toErrorTrace(error));
      throw error;
    }
  }

  private async checkSerialNumberExists(
    serialNumber: string,
  ): Promise<boolean> {
    const asset = await this.assetRepository.findBySerialNumber(serialNumber);
    return !!asset;
  }

  private async checkLicensePlateExists(
    licensePlate: string,
  ): Promise<boolean> {
    const asset = await this.assetRepository.findByLicensePlate(licensePlate);
    return !!asset;
  }

  private mapToResponseDto(asset: any): AssetResponseDto {
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
