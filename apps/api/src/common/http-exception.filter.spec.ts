import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Errors } from './errors';
import { ApiExceptionFilter } from './http-exception.filter';

describe('ApiExceptionFilter', () => {
  const filter = new ApiExceptionFilter();

  function invoke(exception: unknown) {
    let payload: unknown;
    let status = 0;
    const res = {
      status(code: number) {
        status = code;
        return this;
      },
      json(body: unknown) {
        payload = body;
        return body;
      },
    };
    const host = {
      switchToHttp: () => ({ getResponse: () => res }),
    } as ArgumentsHost;
    filter.catch(exception, host);
    return { status, payload };
  }

  it('keeps contract error shape', () => {
    const { status, payload } = invoke(Errors.cannotView());
    expect(status).toBe(404);
    expect(payload).toEqual({ code: 'NOT_FOUND', message: '无法查看' });
  });

  it('maps Nest unauthorized to UNAUTHORIZED', () => {
    const { status, payload } = invoke(
      new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED),
    );
    expect(status).toBe(401);
    expect((payload as { code: string }).code).toBe('UNAUTHORIZED');
  });

  it('maps unknown errors to INTERNAL', () => {
    const { status, payload } = invoke(new Error('boom'));
    expect(status).toBe(500);
    expect(payload).toEqual({ code: 'INTERNAL', message: '服务器内部错误' });
  });
});
