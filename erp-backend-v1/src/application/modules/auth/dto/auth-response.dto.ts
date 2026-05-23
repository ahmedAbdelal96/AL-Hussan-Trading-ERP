/**
 * Authentication Response DTOs
 * Standardized response formats for auth operations
 */

import { ApiProperty } from '@nestjs/swagger';

export class TokensDto {
  @ApiProperty({
    description: 'Access token (short-lived)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token (long-lived)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
    default: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Access token expiration time in seconds',
    example: 900,
  })
  expiresIn: number;
}

export class UserInfoDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'admin@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'User roles',
    example: ['ADMIN'],
    isArray: true,
  })
  roles: string[];

  @ApiProperty({
    description:
      'User effective permissions (resolved from roles + custom GRANT - custom REVOKE)',
    example: [
      'employee:read',
      'employee:write',
      'finance:read',
      'finance:approve',
    ],
    isArray: true,
  })
  permissions: string[];

  @ApiProperty({
    description: 'Account active status',
    example: true,
  })
  isActive: boolean;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'User information',
    type: UserInfoDto,
  })
  user: UserInfoDto;

  @ApiProperty({
    description: 'Authentication tokens',
    type: TokensDto,
  })
  tokens: TokensDto;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully',
  })
  message: string;
}
