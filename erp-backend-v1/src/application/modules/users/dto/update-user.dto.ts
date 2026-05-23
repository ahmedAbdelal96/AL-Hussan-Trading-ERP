import {
  IsEmail,
  IsString,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsArray,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'newemail@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    description: 'User phone number',
    example: '+201234567890',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'User active status',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'User profile picture file path',
    example: 'users/123/profile.jpg',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  profilePicture?: string | null;

  @ApiPropertyOptional({
    description:
      'Array of role IDs to assign to the user (replaces existing roles)',
    example: ['uuid-role-1'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roleIds?: string[];

  @ApiPropertyOptional({
    description: 'Optimistic lock row version',
    example: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}
