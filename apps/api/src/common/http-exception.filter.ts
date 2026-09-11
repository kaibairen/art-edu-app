import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '@art-edu/shared';
import { ApiException } from './errors';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const mapped = this.map(exception);
    if (mapped.status >= 500) {
      this.logger.error(exception);
    }
    res.status(mapped.status).json({
      code: mapped.code,
      message: mapped.message,
      ...(mapped.details !== undefined ? { details: mapped.details } : {}),
    });
  }

  private map(exception: unknown): {
    status: number;
    code: ErrorCode;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof ApiException) {
      return {
        status: exception.getStatus(),
        code: exception.errorCode,
        message: exception.message,
        details: exception.details,
      };
    }

    if (this.isMulterLimit(exception)) {
      return {
        status: HttpStatus.PAYLOAD_TOO_LARGE,
        code: 'UPLOAD_TOO_LARGE',
        message: '文件过大',
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message = this.httpMessage(body, exception.message);
      const details = this.httpDetails(body);
      return {
        status,
        code: this.codeForStatus(status),
        message,
        details,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL',
      message: '服务器内部错误',
    };
  }

  private codeForStatus(status: number): ErrorCode {
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 404) return 'NOT_FOUND';
    if (status === 409) return 'CONFLICT_PHONE';
    if (status === 413) return 'UPLOAD_TOO_LARGE';
    if (status === 415) return 'UNSUPPORTED_MEDIA';
    if (status === 429) return 'RATE_LIMITED';
    if (status >= 500) return 'INTERNAL';
    return 'VALIDATION_ERROR';
  }

  private httpMessage(body: string | object, fallback: string): string {
    if (typeof body === 'string') return body;
    if (body && typeof body === 'object' && 'message' in body) {
      const msg = (body as { message: unknown }).message;
      if (Array.isArray(msg)) return '请求参数不正确';
      if (typeof msg === 'string') return msg;
    }
    return fallback;
  }

  private httpDetails(body: string | object): unknown {
    if (typeof body === 'object' && body && 'message' in body) {
      const msg = (body as { message: unknown }).message;
      if (Array.isArray(msg)) return msg;
    }
    return undefined;
  }

  private isMulterLimit(exception: unknown): boolean {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'code' in exception &&
      (exception as { code?: string }).code === 'LIMIT_FILE_SIZE'
    );
  }
}
