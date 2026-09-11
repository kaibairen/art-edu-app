import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ApiExceptionFilter } from './common/http-exception.filter';
import { Errors } from './common/errors';

export function applyAppDefaults(app: INestApplication, prefix = 'api/v1') {
  app.setGlobalPrefix(prefix);
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      exceptionFactory: (errors) =>
        Errors.validation(
          '请求参数不正确',
          errors.map((e) => ({
            field: e.property,
            constraints: e.constraints,
          })),
        ),
    }),
  );
}
