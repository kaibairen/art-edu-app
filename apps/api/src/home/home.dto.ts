import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { COURSE_SUMMARY_MAX_LENGTH } from '@art-edu/shared';

export class CreateCarouselDto {
  @IsString()
  @MaxLength(500)
  imageUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subtitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkUrl?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class UpdateCarouselDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subtitle?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  linkUrl?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class CreateFeaturedArtworkDto {
  @IsString()
  @MaxLength(500)
  imageUrl!: string;

  @IsString()
  @MaxLength(80)
  title!: string;

  @IsString()
  @MaxLength(40)
  studentDisplayName!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateFeaturedArtworkDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  studentDisplayName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class CreateCourseDto {
  @IsString()
  @MaxLength(80)
  title!: string;

  @IsString()
  @MaxLength(COURSE_SUMMARY_MAX_LENGTH)
  summary!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(COURSE_SUMMARY_MAX_LENGTH)
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
