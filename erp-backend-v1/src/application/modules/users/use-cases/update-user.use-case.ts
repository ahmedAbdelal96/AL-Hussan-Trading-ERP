import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../repositories';
import { UpdateUserDto, UserResponseDto } from '../dto';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    private readonly i18n: I18nService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    id: string,
    data: UpdateUserDto,
    updatedBy: string,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id, false);
    if (!user) throw new NotFoundException(this.i18n.t('users.get.notFound'));
    if (data.email && data.email !== user.email) {
      const exists = await this.userRepository.existsByEmail(data.email);
      if (exists)
        throw new ConflictException(this.i18n.t('users.update.emailExists'));
    }
    if (data.isActive === false && id === updatedBy) {
      throw new ForbiddenException(
        this.i18n.t('users.update.cannotDeactivateOwn'),
      );
    }
    const { roleIds, ...userData } = data;
    await this.userRepository.update(id, userData);

    // Sync roles if roleIds is explicitly provided
    if (roleIds !== undefined) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      if (roleIds.length > 0) {
        await this.prisma.userRole.createMany({
          data: roleIds.map((roleId) => ({
            userId: id,
            roleId,
            grantedBy: updatedBy,
            isActive: true,
          })),
        });
      }
    }

    const updated = await this.userRepository.findById(id, true);
    return updated!.toResponse();
  }
}
