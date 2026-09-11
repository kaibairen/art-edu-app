import type { ApiErrorBody, ErrorCode } from '@art-edu/shared';

export class AdminApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode | string;
  readonly details?: unknown;

  constructor(
    status: number,
    body: { code?: string; message?: string; details?: unknown },
  ) {
    super(body.message || '请求失败');
    this.name = 'AdminApiError';
    this.status = status;
    this.code = (body.code as ErrorCode | undefined) ?? 'INTERNAL';
    this.details = body.details;
  }
}

export function toAdminApiError(err: unknown): AdminApiError {
  if (err instanceof AdminApiError) return err;
  const axiosLike = err as {
    response?: { status?: number; data?: { code?: string; message?: string; details?: unknown } };
    message?: string;
  };
  const status = axiosLike.response?.status ?? 0;
  const data = axiosLike.response?.data;
  if (data && (data.code || data.message)) {
    return new AdminApiError(status, data);
  }
  return new AdminApiError(status, { message: axiosLike.message || '网络错误' });
}

export function errorMessage(err: unknown, fallback = '操作失败'): string {
  return toAdminApiError(err).message || fallback;
}
