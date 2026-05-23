import { Injectable, Inject, ConflictException } from '@nestjs/common';
import type { IPositionRepository } from '../../repositories';
import { POSITION_REPOSITORY } from '../../repositories';
import { CreatePositionDto, PositionResponseDto } from '../../dto';

@Injectable()
export class CreatePositionUseCase {
  constructor(
    @Inject(POSITION_REPOSITORY)
    private positionRepository: IPositionRepository,
  ) {}

  async execute(data: CreatePositionDto): Promise<PositionResponseDto> {
    const exists = await this.positionRepository.existsByCode(data.code);
    if (exists) {
      throw new ConflictException(
        `Position with code "${data.code}" already exists`,
      );
    }
    return this.positionRepository.create(data);
  }
}
