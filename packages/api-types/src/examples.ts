import {
  ACCOUNT_DISABLED_ISSUED_TOKEN,
  ACCOUNT_DISABLED_ON_LOGIN,
  API_ERROR_DEFS,
  CONFLICT_BINDING_MESSAGE,
  FORBIDDEN_READ_MESSAGE,
} from './error-codes';
import type { ApiErrorBody } from './errors';
import type {
  Account,
  Artwork,
  ArtworkCursorPage,
  AuthUser,
  Binding,
  Brand,
  LoginResponse,
  PosterDownload,
  PosterPreview,
  Student,
} from './dto';

/** Mock / README 必须使用不同文件名，禁止 previewUrl === downloadUrl。 */
export const EXAMPLE_POSTER_PREVIEW_URL =
  'http://localhost:4010/files/posters/aw-demo-simple-preview.png';
export const EXAMPLE_POSTER_DOWNLOAD_URL =
  'http://localhost:4010/files/posters/aw-demo-simple.png';

/** 对齐 Nest toAccountDto：displayName / status / classNames。 */
export const EXAMPLE_ACCOUNT: Account = {
  id: 'acc-teacher',
  phone: '13800000001',
  email: null,
  displayName: '林老师',
  role: 'teacher',
  status: 'active',
  classNames: ['创意水彩班'],
  createdAt: '2026-09-01T00:00:00.000Z',
};

export const EXAMPLE_AUTH_USER: AuthUser = {
  id: 'acc-parent-a',
  phone: '13800000002',
  email: null,
  name: '家长A',
  role: 'parent',
  disabled: false,
};

export const EXAMPLE_LOGIN_RESPONSE: LoginResponse = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: EXAMPLE_AUTH_USER,
};

export const EXAMPLE_STUDENT: Student = {
  id: 'stu-xiaoming',
  name: '小明',
  birthday: '2016-03-12',
  gender: 'male',
  note: null,
  avatarUrl: null,
  status: 'active',
  createdAt: '2026-09-01T00:00:00.000Z',
  className: '创意水彩班',
};

export const EXAMPLE_ARTWORK: Artwork = {
  id: 'aw-demo',
  studentId: EXAMPLE_STUDENT.id,
  teacherId: 'acc-teacher',
  imageUrl: 'http://localhost:4010/files/artworks/aw-demo.jpg',
  theme: '春天的树',
  createdOn: '2026-09-10',
  comment: { text: '构图很稳，颜色再大胆一些。' },
  createdAt: '2026-09-10T08:00:00.000Z',
};

export const EXAMPLE_ARTWORK_PAGE: ArtworkCursorPage = {
  items: [EXAMPLE_ARTWORK],
  nextCursor: null,
};

export const EXAMPLE_POSTER_PREVIEW: PosterPreview = {
  templateKey: 'simple',
  previewUrl: EXAMPLE_POSTER_PREVIEW_URL,
};

export const EXAMPLE_POSTER_DOWNLOAD: PosterDownload = {
  templateKey: 'simple',
  downloadUrl: EXAMPLE_POSTER_DOWNLOAD_URL,
};

export const EXAMPLE_BRAND: Brand = {
  orgName: '美术教培机构',
  logoUrl: 'http://localhost:4010/files/branding/logo.png',
  watermarkText: '美术教培 · 作品水印',
  watermarkPosition: 'bottomRight',
};

export const EXAMPLE_BINDING: Binding = {
  id: 'bind-1',
  accountId: EXAMPLE_AUTH_USER.id,
  studentId: EXAMPLE_STUDENT.id,
  kind: 'parent',
  createdAt: '2026-09-01T00:00:00.000Z',
};

export const EXAMPLE_FORBIDDEN_READ: ApiErrorBody = {
  code: 'NOT_FOUND',
  message: FORBIDDEN_READ_MESSAGE,
};

export const EXAMPLE_ACCOUNT_DISABLED: ApiErrorBody = {
  code: ACCOUNT_DISABLED_ON_LOGIN.code,
  message: '账号已停用',
};

/** 停用前已签发 Token：401 UNAUTHORIZED，不是 ACCOUNT_DISABLED。 */
export const EXAMPLE_ACCOUNT_DISABLED_ISSUED_TOKEN: ApiErrorBody = {
  code: ACCOUNT_DISABLED_ISSUED_TOKEN.code,
  message: '未授权',
};

export const EXAMPLE_CONFLICT_BINDING: ApiErrorBody = {
  code: API_ERROR_DEFS.CONFLICT_BINDING.code,
  message: CONFLICT_BINDING_MESSAGE,
};

export const EXAMPLE_CONFLICT_STUDENT_HAS_ARTWORK: ApiErrorBody = {
  code: API_ERROR_DEFS.CONFLICT_STUDENT_HAS_ARTWORK.code,
  message: '学员仍有作品',
};

export const EXAMPLE_LOGO_NOT_CONFIGURED: ApiErrorBody = {
  code: 'LOGO_NOT_CONFIGURED',
  message: '尚未配置机构 LOGO',
};
