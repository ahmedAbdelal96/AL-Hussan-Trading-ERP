import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../repositories';
import { UserResponseDto } from '../dto';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id, true);
    if (!user) throw new NotFoundException(this.i18n.t('users.get.notFound'));
    return user.toResponse();
  }
}
