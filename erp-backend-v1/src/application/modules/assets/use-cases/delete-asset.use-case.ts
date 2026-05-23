import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { IAssetRepository, ASSET_REPOSITORY } from '../repositories';
import { MessageResponseDto } from '../dto';

@Injectable()
export class DeleteAssetUseCase {
  constructor(
    @Inject(ASSET_REPOSITORY)
    private readonly assetRepository: IAssetRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(DeleteAssetUseCase.name);
  }

  async execute(
    id: string,
    userId: string,
    rowVersion?: number,
  ): Promise<MessageResponseDto> {
    const asset = await this.assetRepository.findById(id);
    if (!asset) {
      throw new NotFoundException(
        this.i18n.t('assets.delete.notFound', { args: { id } }),
      );
    }

    if (asset.status === 'IN_USE') {
      throw new BadRequestException(this.i18n.t('assets.delete.inUse'));
    }

    if (asset.status === 'UNDER_MAINTENANCE') {
      throw new BadRequestException(
        this.i18n.t('assets.delete.underMaintenance'),
      );
    }

    await this.assetRepository.delete(id, userId, rowVersion);

    this.logger.log(`Asset deleted: ${id}`);

    return { message: 'Asset deleted successfully' };
  }
}
