import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto, EmployeeStatusDto } from './create-employee.dto';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsSaudiPhone } from '../validators';
import { normalizePhoneNumber } from '../validators/saudi-phone.validator';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @IsString()
  @IsOptional()
  nationalId?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? (normalizePhoneNumber(value) ?? value) : value,
  )
  @IsSaudiPhone()
  phone?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string | null;

  /**
   * Override the inherited default from CreateEmployeeDto.
   * Without this, class-transformer would assign status = ACTIVE
   * on every update request that omits the status field, triggering
   * an invalid TERMINATED → ACTIVE transition error.
   */
  @IsEnum(EmployeeStatusDto)
  @IsOptional()
  override status?: EmployeeStatusDto; // no default!

  @IsInt()
  @Min(1)
  @IsOptional()
  version?: number;

  // Alias for consistency with other modules that use rowVersion.
  @IsInt()
  @Min(1)
  @IsOptional()
  rowVersion?: number;
}
