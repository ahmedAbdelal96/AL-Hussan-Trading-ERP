import { ApiProperty } from '@nestjs/swagger';

export class AllowanceTypeStatisticsDto {
  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ example: 9 })
  active: number;

  @ApiProperty({ example: 3 })
  inactive: number;
}

export class EmployeeAllowanceStatisticsDto {
  @ApiProperty({ example: 120 })
  total: number;

  @ApiProperty({ example: 15 })
  pending: number;

  @ApiProperty({ example: 95 })
  approved: number;

  @ApiProperty({ example: 10 })
  rejected: number;
}

export class EmployeeDeductionStatisticsDto {
  @ApiProperty({ example: 85 })
  total: number;

  @ApiProperty({ example: 12 })
  pending: number;

  @ApiProperty({ example: 70 })
  approved: number;

  @ApiProperty({ example: 3 })
  rejected: number;
}

export class EmployeeLoanStatisticsDto {
  @ApiProperty({ example: 40 })
  total: number;

  @ApiProperty({ example: 6 })
  pending: number;

  @ApiProperty({ example: 22 })
  active: number;

  @ApiProperty({ example: 12 })
  completed: number;
}
