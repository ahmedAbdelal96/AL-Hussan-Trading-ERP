import { Injectable, Inject } from '@nestjs/common';
import type { IPositionRepository } from '../../repositories';
import { POSITION_REPOSITORY } from '../../repositories';
import {
  PositionFiltersDto,
  PositionsPaginatedResponseDto,
  PositionResponseDto,
} from '../../dto';

@Injectable()
export class GetAllPositionsUseCase {
  constructor(
    @Inject(POSITION_REPOSITORY)
    private positionRepository: IPositionRepository,
  ) {}

  async execute(
    filters: PositionFiltersDto,
  ): Promise<PositionsPaginatedResponseDto> {
    return this.positionRepository.findAll(filters);
  }
}

@Injectable()
export class GetActivePositionsUseCase {
  constructor(
    @Inject(POSITION_REPOSITORY)
    private positionRepository: IPositionRepository,
  ) {}

  async execute(departmentId?: string): Promise<PositionResponseDto[]> {
    return this.positionRepository.findAllActive(departmentId);
  }
}
