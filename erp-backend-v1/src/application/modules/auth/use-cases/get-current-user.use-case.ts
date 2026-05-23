/**
 * Get Current User Use Case
 * Business logic for retrieving authenticated user information
 */

import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import type { IAuthRepository } from '../repositories';
import { AUTH_REPOSITORY } from '../repositories';
import { UserInfoDto } from '../dto';
import { RedisCacheService } from '../../../../infrastructure/cache/redis-cache.service';
import { buildAuthMeCacheKey } from '../auth-cache.keys';

@Injectable()
export class GetCurrentUserUseCase {
  private static readonly CACHE_TTL_SECONDS = 30;

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly authRepository: IAuthRepository,
    private readonly cache: RedisCacheService,
  ) {}

  async execute(userId: string): Promise<UserInfoDto> {
    const cacheKey = buildAuthMeCacheKey(userId);
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        // 1. Get user with roles
        const user = await this.authRepository.findUserWithRoles(userId);

        if (!user) {
          throw new UnauthorizedException('User not found');
        }

        // 2. Return user info (include resolved permissions from DB)
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles || [],
          permissions: (user.permissions || []).map(
            (p) => `${p.resource}:${p.action}`,
          ),
          isActive: user.isActive,
        };
      },
      GetCurrentUserUseCase.CACHE_TTL_SECONDS,
    );
  }
}
