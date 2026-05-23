import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../repositories';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    id: string,
    deletedBy: string,
    rowVersion?: number,
  ): Promise<void> {
    const user = await this.userRepository.findById(id, true);
    if (!user) throw new NotFoundException(this.i18n.t('users.get.notFound'));
    if (id === deletedBy)
      throw new ForbiddenException(this.i18n.t('users.delete.cannotDeleteOwn'));
    if (user.roles?.includes('SUPERADMIN'))
      throw new ForbiddenException(
        this.i18n.t('users.delete.cannotDeleteSuperadmin'),
      );
    await this.userRepository.delete(id, deletedBy, rowVersion);
  }
}
