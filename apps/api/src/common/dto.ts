import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  POSTER_TEMPLATE_KEYS,
  WATERMARK_POSITIONS,
} from '@art-edu/shared';
import { Role, StudentStatus, UserStatus, WatermarkPosition } from '@prisma/client';

export class LoginDto {
  @IsString()
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}

export class PageQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class CreateAccountDto {
  @IsString()
  phone!: string;

  @IsString()
  displayName!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  classNames?: string[];
}

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  classNames?: string[];
}

export class UpdateAccountStatusDto {
  @IsEnum(UserStatus)
  status!: UserStatus;
}

export class CreateStudentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsString()
  gender?: string;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(StudentStatus)
  status?: StudentStatus;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsString()
  gender?: string;
}

export class CreateBindingDto {
  @IsString()
  parentId!: string;

  @IsString()
  studentId!: string;
}

export class BrandTemplatePatchDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  orgName?: string;

  @IsOptional()
  @IsString()
  watermarkText?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  watermarkOpacity?: number;

  @IsOptional()
  @IsEnum(WatermarkPosition)
  watermarkPosition?: WatermarkPosition;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrandTemplatePatchDto)
  templates?: BrandTemplatePatchDto[];
}

export class HomeContentDto {
  @IsString()
  type!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class CommentDto {
  @IsString()
  text!: string;
}

export class GeneratePosterDto {
  @IsString()
  templateKey!: string;
}

export const ALLOWED_TEMPLATE_KEYS = POSTER_TEMPLATE_KEYS;
export const ALLOWED_WATERMARK_POSITIONS = WATERMARK_POSITIONS;
