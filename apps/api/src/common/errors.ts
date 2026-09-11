import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@art-edu/shared';

export class ApiException extends HttpException {
  readonly errorCode: ErrorCode;
  readonly details?: unknown;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    details?: unknown,
  ) {
    super({ code, message, ...(details !== undefined ? { details } : {}) }, status);
    this.errorCode = code;
    this.details = details;
  }
}

export const Errors = {
  unauthorized: (message = '未登录或登录已失效') =>
    new ApiException(HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED', message),
  forbidden: (message = '当前角色无权访问该接口') =>
    new ApiException(HttpStatus.FORBIDDEN, 'FORBIDDEN', message),
  validation: (message = '请求参数不正确', details?: unknown) =>
    new ApiException(HttpStatus.BAD_REQUEST, 'VALIDATION_ERROR', message, details),
  notFound: (message = '资源不存在') =>
    new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', message),
  cannotView: () =>
    new ApiException(HttpStatus.NOT_FOUND, 'NOT_FOUND', '无法查看'),
  accountDisabled: () =>
    new ApiException(
      HttpStatus.FORBIDDEN,
      'ACCOUNT_DISABLED',
      '账号已停用，请联系机构管理员',
    ),
  conflictPhone: () =>
    new ApiException(HttpStatus.CONFLICT, 'CONFLICT_PHONE', '手机号已被使用'),
  conflictBinding: () =>
    new ApiException(HttpStatus.CONFLICT, 'CONFLICT_BINDING', '已绑定'),
  conflictStudentHasArtwork: () =>
    new ApiException(
      HttpStatus.CONFLICT,
      'CONFLICT_STUDENT_HAS_ARTWORK',
      '该学员已有作品，仅支持归档',
    ),
  logoNotConfigured: () =>
    new ApiException(
      HttpStatus.BAD_REQUEST,
      'LOGO_NOT_CONFIGURED',
      '请联系机构配置 LOGO',
    ),
  uploadTooLarge: () =>
    new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, 'UPLOAD_TOO_LARGE', '文件过大'),
  unsupportedMedia: () =>
    new ApiException(
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      'UNSUPPORTED_MEDIA',
      '不支持的图片类型',
    ),
  rateLimited: () =>
    new ApiException(
      HttpStatus.TOO_MANY_REQUESTS,
      'RATE_LIMITED',
      '请求过于频繁，请稍后再试',
    ),
  internal: (message = '服务器内部错误') =>
    new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, 'INTERNAL', message),
};

export const LOGIN_BAD_CREDENTIALS = '手机号或密码不正确';
