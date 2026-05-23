import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../repositories';
import { UserStatisticsDto } from '../dto/user-statistics.dto';

@Injectable()
export class GetUsersStatisticsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(): Promise<UserStatisticsDto> {
    return this.userRepository.getStatistics();
  }
}
