import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export enum DocumentTypeDto {
  ID_CARD = 'ID_CARD',
  PASSPORT = 'PASSPORT',
  DRIVER_LICENSE = 'DRIVER_LICENSE',
  CONTRACT = 'CONTRACT',
  CERTIFICATE = 'CERTIFICATE',
  INSURANCE = 'INSURANCE',
  REGISTRATION = 'REGISTRATION',
  PERMIT = 'PERMIT',
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  PHOTO = 'PHOTO',
  OTHER = 'OTHER',
}

/**
 * DTO for creating employee document when creating/updating employee
 * Represents uploaded files like ID, passport, certificates, etc.
 */
export class CreateEmployeeDocumentDto {
  @IsEnum(DocumentTypeDto)
  @IsNotEmpty()
  documentType: DocumentTypeDto;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  documentName: string;

  @IsDateString()
  @IsOptional()
  issueDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  // These will be set by the file upload handler
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
}
