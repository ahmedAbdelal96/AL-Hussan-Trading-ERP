import { PartialType } from '@nestjs/swagger';
import { CreateDepartmentDto } from './create-department.dto';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}
