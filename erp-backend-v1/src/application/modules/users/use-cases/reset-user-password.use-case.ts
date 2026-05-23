import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { IUserRepository, USER_REPOSITORY } from '../repositories';
import { ResetPasswordDto } from '../dto';
import { PasswordService } from '../../auth/services/password.service';
import { PrismaService } from '../../../../infrastructure/database/prisma/prisma.service';

@Injectable()
export class ResetUserPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    private passwordService: PasswordService,
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async execute(
    userId: string,
    data: ResetPasswordDto,
    _resetBy: string,
  ): Promise<void> {
    void _resetBy;
    const user = await this.userRepository.findById(userId, false);
    if (!user) throw new NotFoundException(this.i18n.t('users.get.notFound'));
    const hashedPassword = await this.passwordService.hashPassword(
      data.newPassword,
    );
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  }
}
