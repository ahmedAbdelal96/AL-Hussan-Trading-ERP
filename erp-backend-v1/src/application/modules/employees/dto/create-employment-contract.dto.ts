import {
  IsString,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsUUID,
  IsNumber,
  IsNotEmpty,
  MaxLength,
  Min,
} from 'class-validator';

export enum EmploymentContractTypeDto {
  PERMANENT = 'PERMANENT',
  CONTRACT = 'CONTRACT',
  FREELANCE = 'FREELANCE',
  PART_TIME = 'PART_TIME',
}

/**
 * DTO for creating employment contract when creating/updating employee
 * Contract is mandatory for all employees
 */
export class CreateEmploymentContractDto {
  @IsEnum(EmploymentContractTypeDto)
  @IsNotEmpty()
  contractType: EmploymentContractTypeDto;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isRenewable?: boolean = false;

  @IsUUID()
  @IsOptional()
  positionId?: string;

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  baseSalary: number;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  contractTerms?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
