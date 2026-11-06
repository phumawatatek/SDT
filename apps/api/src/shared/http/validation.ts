import { BadRequestException, ValidationPipe, type ValidationError } from '@nestjs/common';

function flatten(errors: ValidationError[], parent = ''): string[] {
  return errors.flatMap((e) => {
    const path = parent ? `${parent}.${e.property}` : e.property;
    const own = Object.values(e.constraints ?? {}).map((m) => `${path}: ${m}`);
    return [...own, ...flatten(e.children ?? [], path)];
  });
}

/**
 * ValidationPipe dùng cho toàn app: kiểm DTO class (class-validator), đổi kiểu (class-transformer),
 * bỏ chặn trường lạ. Lỗi trả cùng dạng `{ code, message }` như lỗi domain.
 */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => new BadRequestException({ code: 'INVALID_REQUEST', message: flatten(errors).join('; ') }),
  });
}
