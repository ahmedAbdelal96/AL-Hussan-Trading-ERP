import {
  CreatePositionDto,
  UpdatePositionDto,
  PositionFiltersDto,
  PositionResponseDto,
  PositionsPaginatedResponseDto,
} from '../dto';

export const POSITION_REPOSITORY = 'POSITION_REPOSITORY';

export interface IPositionRepository {
  create(data: CreatePositionDto): Promise<PositionResponseDto>;
  findAll(filters: PositionFiltersDto): Promise<PositionsPaginatedResponseDto>;
  findAllActive(departmentId?: string): Promise<PositionResponseDto[]>;
  findById(id: string): Promise<PositionResponseDto | null>;
  findByCode(code: string): Promise<PositionResponseDto | null>;
  update(id: string, data: UpdatePositionDto): Promise<PositionResponseDto>;
  delete(id: string, rowVersion?: number): Promise<PositionResponseDto>;
  existsByCode(code: string, excludeId?: string): Promise<boolean>;
}
