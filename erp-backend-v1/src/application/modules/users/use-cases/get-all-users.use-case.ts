import { Injectable, Inject } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { IUserRepository, USER_REPOSITORY } from '../repositories';
import { UserFiltersDto, UsersPaginatedResponseDto } from '../dto';

@Injectable()
export class GetAllUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(filters: UserFiltersDto): Promise<UsersPaginatedResponseDto> {
    const { users, total } = await this.userRepository.findAll(filters);
    const data = users.map((u) => u.toResponse());
    return new UsersPaginatedResponseDto(
      data,
      filters.page!,
      filters.pageSize!,
      total,
    );
  }
}
