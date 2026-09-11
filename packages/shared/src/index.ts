export const ROLES = ['admin', 'teacher', 'parent'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ['active', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const STUDENT_STATUSES = ['active', 'archived'] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const POSTER_TEMPLATE_KEYS = ['simple', 'frame', 'magazine'] as const;
export type PosterTemplateKey = (typeof POSTER_TEMPLATE_KEYS)[number];

export const WATERMARK_POSITIONS = [
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight',
  'center',
] as const;
export type WatermarkPosition = (typeof WATERMARK_POSITIONS)[number];

/** @deprecated P1 起首页拆成轮播 / 优秀作品 / 课程三块，不再用通用 type。 */
export const HOME_CONTENT_TYPES = [
  'banner',
  'announcement',
  'about',
  'course',
] as const;
export type HomeContentType = (typeof HOME_CONTENT_TYPES)[number];

/** 公开优秀作品卡允许字段。禁止 commentText / 点评 / 私人档案。 */
export const PUBLIC_FEATURED_ARTWORK_FIELDS = [
  'id',
  'imageUrl',
  'title',
  'studentDisplayName',
] as const;

export const COURSE_SUMMARY_MAX_LENGTH = 200;

export const ERROR_CODES = [
  'UNAUTHORIZED',
  'FORBIDDEN',
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'ACCOUNT_DISABLED',
  'CONFLICT_PHONE',
  'CONFLICT_BINDING',
  'CONFLICT_STUDENT_HAS_ARTWORK',
  'LOGO_NOT_CONFIGURED',
  'UPLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA',
  'RATE_LIMITED',
  'INTERNAL',
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  role: Role;
  displayName: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthMe {
  id: string;
  phone: string;
  role: Role;
  displayName: string;
  status: UserStatus;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface PageQuery {
  cursor?: string;
  limit?: number;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface AccountDto {
  id: string;
  phone: string;
  role: Role;
  displayName: string;
  status: UserStatus;
  classNames: string[];
  createdAt: string;
}

export interface StudentDto {
  id: string;
  name: string;
  className: string | null;
  note: string | null;
  boundParentCount?: number;
  status: StudentStatus;
}

export interface BindingDto {
  id: string;
  parentId: string;
  studentId: string;
  createdAt: string;
}

export interface ArtworkDto {
  id: string;
  studentId: string;
  studentName: string;
  title: string | null;
  createdAt: string;
  imageUrl: string;
  thumbUrl: string;
  commentText: string | null;
  courseTheme: string | null;
}

export interface BrandTemplateDto {
  id: string;
  key: PosterTemplateKey;
  enabled: boolean;
  previewUrl?: string | null;
  name: string;
}

export interface BrandConfigDto {
  orgName?: string | null;
  logoUrl?: string | null;
  watermarkText?: string | null;
  watermarkOpacity: number;
  watermarkPosition: WatermarkPosition;
  templates: BrandTemplateDto[];
}

export interface PosterPreviewDto {
  previewUrl: string;
  templateKey: PosterTemplateKey;
}

export interface PosterDownloadDto {
  downloadUrl: string;
  templateKey: PosterTemplateKey;
}

export interface OrgSettingDto {
  orgName: string | null;
  logoUrl: string | null;
  watermarkText: string | null;
}

export interface PublicHomeBrandDto {
  orgName: string | null;
  logoUrl: string | null;
}

export interface PublicCarouselDto {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  linkUrl: string | null;
  sortOrder: number;
}

/** 公开优秀作品卡。仅此四字段，不得含 commentText。 */
export interface PublicFeaturedArtworkDto {
  id: string;
  imageUrl: string;
  title: string;
  studentDisplayName: string;
}

/** 公开课程。仅 title + summary + 可选封面，无长文 body。 */
export interface PublicCourseDto {
  id: string;
  title: string;
  summary: string;
  coverUrl: string | null;
}

export interface PublicHomeDto {
  brand: PublicHomeBrandDto;
  carousels: PublicCarouselDto[];
  featuredArtworks: PublicFeaturedArtworkDto[];
  courses: PublicCourseDto[];
}

export interface AdminCarouselDto extends PublicCarouselDto {
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFeaturedArtworkDto extends PublicFeaturedArtworkDto {
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCourseDto extends PublicCourseDto {
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}
