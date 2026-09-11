import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';

export class LoginDto {
  @IsString()
  account!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class CreateUserDto {
  @IsString()
  phone!: string;

  @IsString()
  name!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsEmail()
  email?: string;
}

export class CreateStudentDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class BindDto {
  @IsString()
  userId!: string;

  @IsString()
  studentId!: string;
}

export class UpdateSettingDto {
  @IsOptional()
  @IsString()
  orgName?: string;

  @IsOptional()
  @IsString()
  watermarkText?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
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

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class CommentDto {
  @IsOptional()
  @IsString()
  textComment?: string;

  @IsOptional()
  @IsString()
  theme?: string;
}

export class GeneratePosterDto {
  @IsString()
  templateKey!: string;
}
