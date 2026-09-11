/**
 * P0 稳定错误码。HTTP 层成功时直接返回资源；失败体为 `{ code, message, details? }`。
 * 越权读统一 404 + `NOT_FOUND`，message 为「无法查看」（不泄露资源是否存在）。
 */
export const API_ERROR_CODES = [
  'NOT_FOUND',
  'UNAUTHORIZED',
  'VALIDATION_ERROR',
  'INVALID_CREDENTIALS',
  'TOKEN_EXPIRED',
  'ACCOUNT_DISABLED',
  'CONFLICT_BINDING',
  'CONFLICT_STUDENT_HAS_ARTWORK',
  'LOGO_NOT_CONFIGURED',
  'UNSUPPORTED_TEMPLATE',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** 越权读（家长看未绑定孩子等）对外文案。 */
export const FORBIDDEN_READ_MESSAGE = '无法查看' as const;

/** CONFLICT_BINDING 定稿文案。 */
export const CONFLICT_BINDING_MESSAGE = '已绑定' as const;

/**
 * 与 `docs/contracts/openapi-p0.yaml` 对齐的定稿错误码常量。
 *
 * - `CONFLICT_BINDING`：409，「已绑定」
 * - `CONFLICT_STUDENT_HAS_ARTWORK`：409（学员有作品不可删，改 `Student.status`）
 * - `ACCOUNT_DISABLED`：登录 403；已签发 Token 再访问 → 401 `UNAUTHORIZED`
 */
export const API_ERROR_DEFS = {
  CONFLICT_BINDING: {
    code: 'CONFLICT_BINDING',
    status: 409,
    message: CONFLICT_BINDING_MESSAGE,
  },
  CONFLICT_STUDENT_HAS_ARTWORK: {
    code: 'CONFLICT_STUDENT_HAS_ARTWORK',
    status: 409,
  },
  ACCOUNT_DISABLED: {
    code: 'ACCOUNT_DISABLED',
    status: 403,
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    status: 401,
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    status: 404,
    message: FORBIDDEN_READ_MESSAGE,
  },
} as const;

/** 登录时账号停用：403 + ACCOUNT_DISABLED。 */
export const ACCOUNT_DISABLED_ON_LOGIN = API_ERROR_DEFS.ACCOUNT_DISABLED;

/** 停用前已签发的 Token：401 + UNAUTHORIZED（不再回 ACCOUNT_DISABLED）。 */
export const ACCOUNT_DISABLED_ISSUED_TOKEN = API_ERROR_DEFS.UNAUTHORIZED;
