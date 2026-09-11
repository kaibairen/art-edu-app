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
