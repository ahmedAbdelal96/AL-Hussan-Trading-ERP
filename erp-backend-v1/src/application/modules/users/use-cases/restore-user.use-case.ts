/**
 * Restore User Use Case
 *
 * Restores a soft-deleted user account.
 *
 * Business Rules:
 * - User must be soft-deleted (deletedAt IS NOT NULL)
 * - Reactivates the user account (isActive = true)
 * - Clears deletion metadata
 * - Logs the restoration in audit trail
 * - Only SUPERADMIN can restore users
 *
 * Security Considerations:
 * - Validates user exists and is actually deleted
 * - Prevents restoration of permanently deleted users
 * - Tracks who performed the restoration
 *
 * @module RestoreUserUseCase
 */

import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { IUserRepository, USER_REPOSITORY } from '../repositories';
import { UserResponseDto } from '../dto';

@Injectable()
export class RestoreUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Execute the restore operation
   *
   * @param userId - UUID of the user to restore
   * @param restoredBy - UUID of the user performing the restoration
   * @returns The restored user data
   * @throws NotFoundException if user doesn't exist
   * @throws BadRequestException if user is not deleted
   */
  async execute(userId: string, restoredBy: string): Promise<UserResponseDto> {
    // Find the deleted user (including soft-deleted)
    const user = await this.userRepository.findDeletedById(userId);

    if (!user) {
      throw new NotFoundException(
        this.i18n.translate('user.errors.notFound', {
          args: { id: userId },
        }),
      );
    }

    // Verify user is actually deleted
    if (!user.deletedAt) {
      throw new BadRequestException(
        this.i18n.translate('user.errors.notDeleted', {
          args: { email: user.email },
        }),
      );
    }

    // Restore the user
    const restoredUser = await this.userRepository.restore(userId, restoredBy);

    return restoredUser.toResponse();
  }
}
