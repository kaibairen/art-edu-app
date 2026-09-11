import { API_ERROR_CODES, type ApiErrorCode } from './error-codes';

/** 失败响应体。成功路径不包一层，直接返回资源。 */
export interface ApiErrorBody {
  code: ApiErrorCode | string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  readonly code: ApiErrorCode | string;
  readonly status: number;
  readonly details?: unknown;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.details = body.details;
    this.body = body;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isKnownCode(code: string): code is ApiErrorCode {
  return (API_ERROR_CODES as readonly string[]).includes(code);
}

/**
 * 把 HTTP 错误体映射为 {@link ApiError}。
 * 优先读 P0 `{ code, message, details? }`；兼容缺字段的 Mock / 网关响应。
 */
export function mapErrorBody(status: number, body: unknown): ApiError {
  if (isRecord(body) && typeof body.code === 'string') {
    const code = isKnownCode(body.code) ? body.code : body.code;
    const message =
      typeof body.message === 'string' && body.message.length > 0
        ? body.message
        : `请求失败（${status}）`;
    return new ApiError(status, {
      code,
      message,
      details: body.details,
    });
  }

  if (isRecord(body) && typeof body.message === 'string') {
    const fallbackCode: ApiErrorCode =
      status === 401
        ? 'UNAUTHORIZED'
        : status === 404
          ? 'NOT_FOUND'
          : 'VALIDATION_ERROR';
    return new ApiError(status, {
      code: fallbackCode,
      message: body.message,
      details: body,
    });
  }

  return new ApiError(status, {
    code: status === 401 ? 'UNAUTHORIZED' : 'VALIDATION_ERROR',
    message: `请求失败（${status}）`,
    details: body,
  });
}
