/** Lỗi nghiệp vụ của module cases; filter ở infrastructure đổi sang mã HTTP. */
export type CaseErrorCode = "NOT_FOUND" | "FORBIDDEN" | "INVALID" | "CONFLICT";

export class CaseError extends Error {
  constructor(readonly code: CaseErrorCode, message: string) {
    super(message);
  }
}

export const notFound = () => new CaseError("NOT_FOUND", "Không tìm thấy phản ánh hoặc bạn không có quyền");
