import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiPropertyOptional({ example: '+201234567890' })
  phone: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'users/123/profile.jpg' })
  profilePicture?: string | null;

  @ApiProperty({ example: false })
  isLocked: boolean;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  lastLoginAt: Date | null;

  @ApiPropertyOptional({ example: '192.168.1.1' })
  lastLoginIp: string | null;

  @ApiProperty({ example: 0 })
  failedLoginAttempts: number;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  lastFailedLoginAt: Date | null;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  lockedUntil: Date | null;

  @ApiProperty({ example: false })
  permanentlyLocked: boolean;

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  permanentlyLockedAt: Date | null;

  @ApiProperty({ example: 0 })
  unlockAttemptCount: number;

  @ApiProperty({ example: 1 })
  tokenVersion: number;

  @ApiProperty({ example: 1 })
  rowVersion: number;

  @ApiPropertyOptional({
    example: ['ADMIN', 'MANAGER'],
    type: [String],
  })
  roles?: string[];

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  deletedAt?: Date | null;

  @ApiPropertyOptional({ example: 'uuid' })
  deletedBy?: string | null;

  @ApiPropertyOptional({
    type: () => UserResponseDto,
    description: 'User who deleted this user',
  })
  deletedByUser?: UserResponseDto | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updatedAt: Date;
}
