import type { ApiErrorCode } from './error-codes';

export const ROLES = ['admin', 'teacher', 'parent'] as const;
export type Role = (typeof ROLES)[number];

/** P0 海报模板。与一期 MVP 的 classic/gallery/festival 不是同一套枚举。 */
export const POSTER_TEMPLATE_KEYS = ['simple', 'frame', 'magazine'] as const;
export type PosterTemplateKey = (typeof POSTER_TEMPLATE_KEYS)[number];

/** 水印位置，JSON 字段必须 camelCase。 */
export const WATERMARK_POSITIONS = [
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight',
  'center',
] as const;
export type WatermarkPosition = (typeof WATERMARK_POSITIONS)[number];

export const BINDING_KINDS = ['parent', 'teacher'] as const;
export type BindingKind = (typeof BINDING_KINDS)[number];

/** 有作品的学员不可删（409 CONFLICT_STUDENT_HAS_ARTWORK），改为 archived。 */
export const STUDENT_STATUSES = ['active', 'archived'] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

/** 账号状态。与 Nest UserStatus / PATCH /admin/accounts/{id}/status 对齐。 */
export const USER_STATUSES = ['active', 'disabled'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface AuthUser {
  id: string;
  phone: string;
  email: string | null;
  name: string;
  role: Role;
  disabled: boolean;
}

export interface LoginRequest {
  account: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends TokenPair {
  user: AuthUser;
}

export interface RefreshRequest {
  refreshToken: string;
}

export type RefreshResponse = TokenPair;

export interface LogoutRequest {
  refreshToken?: string;
}

export interface LogoutResponse {
  ok: true;
}

export interface Account {
  id: string;
  phone: string;
  email?: string | null;
  displayName: string;
  role: Role;
  status: UserStatus;
  /** 教师负责班级；Nest 响应始终返回数组，非教师一般为 []。 */
  classNames?: string[];
  createdAt: string;
}

export interface CreateAccountRequest {
  phone: string;
  displayName: string;
  password: string;
  role: Exclude<Role, 'admin'>;
  email?: string;
  /** 仅教师生效；创建非教师账号时 Nest 会落成 []。 */
  classNames?: string[];
}

export interface UpdateAccountRequest {
  displayName?: string;
  email?: string | null;
  password?: string;
  /** 仅教师生效。停用账号请走 PATCH /admin/accounts/{id}/status。 */
  classNames?: string[];
}

export interface UpdateAccountStatusRequest {
  status: UserStatus;
}

export interface Student {
  id: string;
  name: string;
  birthday: string | null;
  gender: string | null;
  note: string | null;
  avatarUrl: string | null;
  status: StudentStatus;
  createdAt: string;
  /** 与教师 User.classNames[] 匹配。 */
  className?: string | null;
}

export interface CreateStudentRequest {
  name: string;
  birthday?: string;
  gender?: string;
  note?: string;
  avatarUrl?: string;
  status?: StudentStatus;
}

export interface UpdateStudentRequest {
  name?: string;
  birthday?: string | null;
  gender?: string | null;
  note?: string | null;
  avatarUrl?: string | null;
  status?: StudentStatus;
}

export interface ArtworkComment {
  text: string;
}

export interface Artwork {
  id: string;
  studentId: string;
  teacherId: string;
  imageUrl: string;
  theme: string;
  createdOn: string;
  comment: ArtworkComment | null;
  createdAt: string;
}

export interface ArtworkCursorPage {
  items: Artwork[];
  nextCursor: string | null;
}

export interface ArtworkCursorQuery {
  cursor?: string;
  limit?: number;
}

export interface CreateArtworkFields {
  theme: string;
  createdOn: string;
}

export interface CreateCommentRequest {
  text: string;
}

export interface GeneratePosterRequest {
  templateKey: PosterTemplateKey;
}

/**
 * POST /parent/artworks/{id}/posters/preview
 * 仅屏幕预览。切换模板只打本接口。
 */
export interface PosterPreview {
  templateKey: PosterTemplateKey;
  /**
   * 屏幕预览专用。禁止当作主按钮下载地址，也禁止与成片 URL 相同。
   *
   * @example http://localhost:4010/files/posters/aw-demo-simple-preview.png
   */
  previewUrl: string;
}

/**
 * POST /parent/artworks/{id}/posters
 * 正式成片。主按钮下载必须用本接口。
 */
export interface PosterDownload {
  templateKey: PosterTemplateKey;
  /**
   * 正式成片。禁止默认回退为 previewUrl，Mock 示例必须是不同文件
   *（如 `…-preview.png` vs `….png`）。
   *
   * @example http://localhost:4010/files/posters/aw-demo-simple.png
   */
  downloadUrl: string;
}

export interface Brand {
  orgName: string;
  logoUrl: string | null;
  watermarkText: string;
  watermarkPosition: WatermarkPosition;
}

export interface UpdateBrandRequest {
  orgName?: string;
  watermarkText?: string;
  watermarkPosition?: WatermarkPosition;
}

export interface Binding {
  id: string;
  accountId: string;
  studentId: string;
  kind: BindingKind;
  createdAt: string;
}

export interface CreateBindingRequest {
  accountId: string;
  studentId: string;
  kind: BindingKind;
}

export interface BindingQuery {
  accountId?: string;
  studentId?: string;
  kind?: BindingKind;
}

/** 客户端拼路径用的常量，不含 host。实际请求挂在 base `/api/v1` 下。 */
export const API_V1_PREFIX = '/api/v1' as const;

export const P0_PATHS = {
  login: '/auth/login',
  logout: '/auth/logout',
  me: '/auth/me',
  refresh: '/auth/refresh',
  brand: '/brand',
  parentChildren: '/parent/children',
  parentArtworks: (studentId: string) =>
    `/parent/children/${studentId}/artworks`,
  parentArtwork: (artworkId: string) => `/parent/artworks/${artworkId}`,
  parentPosterPreview: (artworkId: string) =>
    `/parent/artworks/${artworkId}/posters/preview`,
  parentPosterDownload: (artworkId: string) =>
    `/parent/artworks/${artworkId}/posters`,
  teacherStudents: '/teacher/students',
  teacherArtworks: (studentId: string) =>
    `/teacher/students/${studentId}/artworks`,
  teacherComments: (artworkId: string) =>
    `/teacher/artworks/${artworkId}/comments`,
  teacherPosterPreview: (artworkId: string) =>
    `/teacher/artworks/${artworkId}/posters/preview`,
  teacherPosterDownload: (artworkId: string) =>
    `/teacher/artworks/${artworkId}/posters`,
  adminAccounts: '/admin/accounts',
  adminAccount: (accountId: string) => `/admin/accounts/${accountId}`,
  adminAccountStatus: (accountId: string) =>
    `/admin/accounts/${accountId}/status`,
  adminStudents: '/admin/students',
  adminStudent: (studentId: string) => `/admin/students/${studentId}`,
  adminBindings: '/admin/bindings',
  adminBinding: (bindingId: string) => `/admin/bindings/${bindingId}`,
  adminBrand: '/admin/brand',
  adminBrandLogo: '/admin/brand/logo',
} as const;

export type P0ErrorCode = ApiErrorCode;

/** 公开优秀作品卡允许字段。禁止 commentText / 点评 / 私人档案。 */
export const PUBLIC_FEATURED_ARTWORK_FIELDS = [
  'id',
  'imageUrl',
  'title',
  'studentDisplayName',
] as const;

export const COURSE_SUMMARY_MAX_LENGTH = 200;

export interface PublicHomeBrand {
  orgName: string | null;
  logoUrl: string | null;
}

export interface PublicCarousel {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  linkUrl: string | null;
  sortOrder: number;
}

/** 公开优秀作品卡。仅此四字段。 */
export interface PublicFeaturedArtwork {
  id: string;
  imageUrl: string;
  title: string;
  studentDisplayName: string;
}

/** 公开课程。无长文 body。 */
export interface PublicCourse {
  id: string;
  title: string;
  summary: string;
  coverUrl: string | null;
}

export interface PublicHome {
  brand: PublicHomeBrand;
  carousels: PublicCarousel[];
  featuredArtworks: PublicFeaturedArtwork[];
  courses: PublicCourse[];
}

export interface AdminCarousel extends PublicCarousel {
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFeaturedArtwork extends PublicFeaturedArtwork {
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCourse extends PublicCourse {
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCarouselRequest {
  imageUrl: string;
  title?: string | null;
  subtitle?: string | null;
  linkUrl?: string | null;
  sortOrder?: number;
  enabled?: boolean;
}

export interface UpdateCarouselRequest {
  imageUrl?: string;
  title?: string | null;
  subtitle?: string | null;
  linkUrl?: string | null;
  sortOrder?: number;
  enabled?: boolean;
}

export interface CreateFeaturedArtworkRequest {
  imageUrl: string;
  title: string;
  studentDisplayName: string;
  sortOrder?: number;
  published?: boolean;
}

export interface UpdateFeaturedArtworkRequest {
  imageUrl?: string;
  title?: string;
  studentDisplayName?: string;
  sortOrder?: number;
  published?: boolean;
}

export interface CreateCourseRequest {
  title: string;
  summary: string;
  coverUrl?: string | null;
  sortOrder?: number;
  published?: boolean;
}

export interface UpdateCourseRequest {
  title?: string;
  summary?: string;
  coverUrl?: string | null;
  sortOrder?: number;
  published?: boolean;
}

export interface HomeAdminList<T> {
  items: T[];
}

/** US-P1-01 路径。公开读无鉴权；写接口仅 admin。 */
export const P1_HOME_PATHS = {
  publicHome: '/public/home',
  publicSettings: '/public/settings',
  adminCarousels: '/admin/home/carousels',
  adminCarousel: (id: string) => `/admin/home/carousels/${id}`,
  adminFeaturedArtworks: '/admin/home/featured-artworks',
  adminFeaturedArtwork: (id: string) => `/admin/home/featured-artworks/${id}`,
  adminCourses: '/admin/home/courses',
  adminCourse: (id: string) => `/admin/home/courses/${id}`,
} as const;
