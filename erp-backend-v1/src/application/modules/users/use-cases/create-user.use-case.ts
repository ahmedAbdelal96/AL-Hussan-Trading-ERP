import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../repositories';
import { CreateUserDto, UserResponseDto } from '../dto';
import { PasswordService } from '../../auth/services/password.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private userRepository: IUserRepository,
    private passwordService: PasswordService,
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    data: CreateUserDto,
    createdBy: string,
  ): Promise<UserResponseDto> {
    const exists = await this.userRepository.existsByEmail(data.email);
    if (exists)
      throw new ConflictException(this.i18n.t('users.create.emailExists'));

    const hashedPassword = await this.passwordService.hashPassword(
      data.password,
    );
    const user = await this.userRepository.create(data, hashedPassword);

    if (data.roleIds?.length) {
      await this.prisma.userRole.createMany({
        data: data.roleIds.map((roleId) => ({
          userId: user.id,
          roleId,
          grantedBy: createdBy,
          isActive: true,
        })),
      });
    }

    const userWithRoles = await this.userRepository.findById(user.id, true);
    return userWithRoles!.toResponse();
  }
}
