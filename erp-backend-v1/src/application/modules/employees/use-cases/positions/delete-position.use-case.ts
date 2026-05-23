import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../infrastructure/database/prisma/prisma.service';
import type { IPositionRepository } from '../../repositories';
import { POSITION_REPOSITORY } from '../../repositories';
import { PositionResponseDto } from '../../dto';

@Injectable()
export class DeletePositionUseCase {
  constructor(
    @Inject(POSITION_REPOSITORY)
    private positionRepository: IPositionRepository,
    private prisma: PrismaService,
  ) {}

  async execute(
    id: string,
    rowVersion?: number,
  ): Promise<{ message: string; position: PositionResponseDto }> {
    const existing = await this.positionRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Position with ID "${id}" not found`);
    }
    const employeeCount = await this.prisma.employee.count({
      where: { positionId: id },
    });
    if (employeeCount > 0) {
      throw new ConflictException(
        `Cannot delete position "${existing.nameEn}" because it has ${employeeCount} employee(s) assigned`,
      );
    }
    const deleted = await this.positionRepository.delete(id, rowVersion);
    return { message: 'Position deleted successfully', position: deleted };
  }
}
