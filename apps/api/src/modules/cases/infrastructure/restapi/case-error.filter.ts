import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import { CaseError, type CaseErrorCode } from "../../application/case-errors.js";

const STATUS: Record<CaseErrorCode, number> = {
  NOT_FOUND: HttpStatus.NOT_FOUND,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  INVALID: HttpStatus.UNPROCESSABLE_ENTITY,
  CONFLICT: HttpStatus.CONFLICT,
};

interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

/** Đổi lỗi nghiệp vụ cases sang HTTP với thân `{ code, message }`. */
@Catch(CaseError)
export class CaseErrorFilter implements ExceptionFilter {
  catch(e: CaseError, host: ArgumentsHost) {
    host.switchToHttp().getResponse<JsonResponse>().status(STATUS[e.code]).json({ code: e.code, message: e.message });
  }
}
