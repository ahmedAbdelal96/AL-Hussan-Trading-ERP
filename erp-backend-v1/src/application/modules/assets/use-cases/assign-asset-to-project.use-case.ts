import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { WinstonLoggerService } from '../../../../infrastructure/logger/winston-logger.service';
import { IAssetRepository, ASSET_REPOSITORY } from '../repositories';
import { AssignAssetToProjectDto } from '../dto';

@Injectable()
export class AssignAssetToProjectUseCase {
  constructor(
    @Inject(ASSET_REPOSITORY)
    private readonly assetRepository: IAssetRepository,
    private readonly logger: WinstonLoggerService,
    private readonly i18n: I18nService,
  ) {
    this.logger.setContext(AssignAssetToProjectUseCase.name);
  }

  async execute(assetId: string, dto: AssignAssetToProjectDto, userId: string) {
    const asset = await this.assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundException(
        this.i18n.t('assets.get.notFound', { args: { id: assetId } }),
      );
    }

    if (!asset.isAvailable()) {
      throw new BadRequestException(
        this.i18n.t('assets.assign.toProject.notAvailable'),
      );
    }

    const currentAssignment =
      await this.assetRepository.getCurrentProjectAssignment(assetId);
    if (currentAssignment) {
      throw new BadRequestException(
        this.i18n.t('assets.assign.toProject.alreadyAssigned'),
      );
    }

    const assignment = await this.assetRepository.assignToProject(
      assetId,
      dto,
      userId,
    );

    this.logger.log(`Asset ${assetId} assigned to project ${dto.projectId}`);

    return {
      id: assignment.id,
      assetId: assignment.assetId,
      projectId: assignment.projectId,
      assignedDate: assignment.assignedDate,
      location: assignment.location,
      status: assignment.status,
      notes: assignment.notes,
    };
  }
}
