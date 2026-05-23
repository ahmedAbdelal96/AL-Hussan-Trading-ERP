import { ApiProperty } from '@nestjs/swagger';

export class UserStatisticsDto {
  @ApiProperty({ example: 120 })
  total: number;

  @ApiProperty({ example: 95 })
  active: number;

  @ApiProperty({ example: 20 })
  inactive: number;

  @ApiProperty({ example: 5 })
  locked: number;
}
