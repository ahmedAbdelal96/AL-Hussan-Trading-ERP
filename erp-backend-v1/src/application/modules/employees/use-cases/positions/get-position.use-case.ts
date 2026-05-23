import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IPositionRepository } from '../../repositories';
import { POSITION_REPOSITORY } from '../../repositories';
import { PositionResponseDto } from '../../dto';

@Injectable()
export class GetPositionUseCase {
  constructor(
    @Inject(POSITION_REPOSITORY)
    private positionRepository: IPositionRepository,
  ) {}

  async execute(id: string): Promise<PositionResponseDto> {
    const pos = await this.positionRepository.findById(id);
    if (!pos) {
      throw new NotFoundException(`Position with ID "${id}" not found`);
    }
    return pos;
  }
}
