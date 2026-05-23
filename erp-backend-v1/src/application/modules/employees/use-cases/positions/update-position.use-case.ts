import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import type { IPositionRepository } from '../../repositories';
import { POSITION_REPOSITORY } from '../../repositories';
import { UpdatePositionDto, PositionResponseDto } from '../../dto';

@Injectable()
export class UpdatePositionUseCase {
  constructor(
    @Inject(POSITION_REPOSITORY)
    private positionRepository: IPositionRepository,
  ) {}

  async execute(
    id: string,
    data: UpdatePositionDto,
  ): Promise<PositionResponseDto> {
    const existing = await this.positionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Position with ID "${id}" not found`);
    }
    if (data.code && data.code !== existing.code) {
      const codeExists = await this.positionRepository.existsByCode(
        data.code,
        id,
      );
      if (codeExists) {
        throw new ConflictException(
          `Position with code "${data.code}" already exists`,
        );
      }
    }
    return this.positionRepository.update(id, data);
  }
}
