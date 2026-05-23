import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNotEmpty,
  IsUUID,
  MinLength,
  MaxLength,
  ValidateNested,
  IsArray,
  IsNumber,
  Min,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { IsSaudiNationalId, IsSaudiPhone } from '../validators';
import { normalizePhoneNumber } from '../validators/saudi-phone.validator';
import { CreateEmploymentContractDto } from './create-employment-contract.dto';
import { CreateEmployeeDocumentDto } from './create-employee-document.dto';

export enum EmploymentTypeDto {
  FREELANCE = 'FREELANCE', // External labor
  PART_TIME = 'PART_TIME', // Part-time
  CONTRACT = 'CONTRACT', // Company sponsorship
}

export enum EmployeeStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

export enum GenderDto {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  // ⚠️ DEPRECATED: Not used in simplified UI (can be added via edit if needed)
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  @IsSaudiNationalId()
  nationalId: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? (normalizePhoneNumber(value) ?? value) : value,
  )
  @IsSaudiPhone()
  phone?: string;

  // ⚠️ DEPRECATED: Not used in simplified UI
  @IsString()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? (normalizePhoneNumber(value) ?? value) : value,
  )
  @IsSaudiPhone()
  alternatePhone?: string;

  // ⚠️ DEPRECATED: Not used in simplified UI
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsEnum(GenderDto)
  @IsOptional()
  gender?: GenderDto;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  nationality?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  address?: string;

  // ⚠️ DEPRECATED: Not used in simplified UI
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  // ⚠️ DEPRECATED: Not used in simplified UI
  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  // ⚠️ DEPRECATED: Not used in simplified UI
  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @IsEnum(EmploymentTypeDto)
  @IsNotEmpty()
  employmentType: EmploymentTypeDto;

  @IsEnum(EmployeeStatusDto)
  @IsOptional()
  status?: EmployeeStatusDto = EmployeeStatusDto.ACTIVE;

  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @IsUUID()
  @IsOptional()
  positionId?: string;

  @IsDateString()
  @IsNotEmpty()
  hireDate: string;

  // Salary Information (Optional - can be set later)
  @IsNumber()
  @Min(0)
  @IsOptional()
  baseSalary?: number;

  @IsString()
  @IsOptional()
  @MaxLength(3) // ISO 4217 currency code (e.g., SAR, USD)
  @IsIn(['SAR'])
  currency?: string;

  @IsDateString()
  @IsOptional()
  terminationDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  terminationReason?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? (normalizePhoneNumber(value) ?? value) : value,
  )
  @IsSaudiPhone()
  emergencyContactPhone?: string;

  // ⚠️ DEPRECATED: Not used in simplified UI
  @IsString()
  @IsOptional()
  @MaxLength(50)
  emergencyContactRelation?: string;

  // ⚠️ DEPRECATED: Not used in simplified UI (can be added via edit)
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;

  // Employment Contract (Optional - can be added later or uploaded as document)
  @ValidateNested()
  @Type(() => CreateEmploymentContractDto)
  @IsOptional()
  employmentContract?: CreateEmploymentContractDto;

  // Employee Documents (Optional - can upload contract image, ID, etc.)
  @ValidateNested({ each: true })
  @Type(() => CreateEmployeeDocumentDto)
  @IsArray()
  @IsOptional()
  documents?: CreateEmployeeDocumentDto[];
}
