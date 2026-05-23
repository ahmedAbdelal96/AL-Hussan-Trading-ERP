/**
 * Upload Document DTO
 * Handles file upload with metadata validation
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  ValidateIf,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { DocumentType } from '@prisma/client';

/**
 * Custom validator to ensure expiry date is after issue date
 */
function IsAfterIssueDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterIssueDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const objectWithIssueDate = args.object as { issueDate?: string };
          const issueDate = objectWithIssueDate.issueDate;

          // If no expiry date or no issue date, skip validation
          if (!value || !issueDate) {
            return true;
          }

          if (typeof value !== 'string') {
            return false;
          }

          const issue = new Date(issueDate);
          const expiry = new Date(value);
          if (Number.isNaN(issue.getTime()) || Number.isNaN(expiry.getTime())) {
            return false;
          }

          // Expiry must be after issue
          return expiry > issue;
        },
        defaultMessage() {
          return 'Expiry date must be after issue date';
        },
      },
    });
  };
}

/**
 * Custom validator to ensure issue date is not in the future
 */
function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (!value) {
            return true;
          }

          if (typeof value !== 'string') {
            return false;
          }

          const date = new Date(value);
          if (Number.isNaN(date.getTime())) {
            return false;
          }
          const today = new Date();
          today.setHours(23, 59, 59, 999);

          // Date must not be in the future
          return date <= today;
        },
        defaultMessage() {
          return 'Issue date cannot be in the future';
        },
      },
    });
  };
}

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Document type',
    enum: DocumentType,
    example: DocumentType.CONTRACT,
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType: DocumentType;

  @ApiProperty({
    description: 'Document name/description',
    example: 'Employment Contract',
  })
  @IsString()
  @IsNotEmpty()
  documentName: string;

  @ApiProperty({
    description: 'Issue date (optional) - cannot be in the future',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotFutureDate({ message: 'Issue date cannot be in the future' })
  issueDate?: string;

  @ApiProperty({
    description: 'Expiry date (optional) - must be after issue date',
    example: '2025-01-15',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.issueDate !== undefined)
  @IsAfterIssueDate({
    message: 'Expiry date must be after issue date',
  })
  expiryDate?: string;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
