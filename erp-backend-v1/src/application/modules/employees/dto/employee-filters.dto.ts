import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { EmploymentTypeDto, EmployeeStatusDto } from './create-employee.dto';

export class EmployeeFiltersDto extends PaginationQueryDto {
  @IsEnum(EmploymentTypeDto)
  @IsOptional()
  employmentType?: EmploymentTypeDto;

  @IsEnum(EmployeeStatusDto)
  @IsOptional()
  status?: EmployeeStatusDto;

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsUUID()
  @IsOptional()
  positionId?: string;

  @IsString()
  @IsOptional()
  nationality?: string;

  @IsString()
  @IsOptional()
  country?: string;
}
