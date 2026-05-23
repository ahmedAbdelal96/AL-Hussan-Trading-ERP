import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
  IsUrl,
  ValidateIf,
  IsEmail,
} from 'class-validator';

export enum SiteStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  UNDER_PREPARATION = 'UNDER_PREPARATION',
  CLOSED = 'CLOSED',
}

export class CreateSiteDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @Matches(/^[A-Z0-9-]+$/, {
    message:
      'Site code must contain only uppercase letters, numbers, and hyphens',
  })
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string = 'المملكه العربيه السعوديه';

  @IsString()
  @IsOptional()
  @ValidateIf((o) => o.googleMapsLink && o.googleMapsLink.trim() !== '')
  @IsUrl({}, { message: 'Google Maps link must be a valid URL' })
  googleMapsLink?: string;

  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsEnum(SiteStatusDto)
  @IsOptional()
  status?: SiteStatusDto = SiteStatusDto.ACTIVE;

  @IsNumber()
  @IsOptional()
  @Min(0)
  area?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  contactPerson?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  contactPhone?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  contactEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
