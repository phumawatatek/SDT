// Chuyển trạng thái theo thao tác — SYSTEM_SPEC §4, §6. Hàm thuần: server áp kết quả vào DB và ghi NhatKyXuLy.
import type { CaseRow } from "./case.js";
import { addWorkdays } from "./deadline.js";
import type { CaseStatus } from "./status.js";

/** Mỗi lần duyệt gia hạn cộng thêm số ngày làm việc này (giả định, xem questions.md). */
export const EXTENSION_WORKDAYS = 5;
/** Vụ mở lại có hạn mới ngắn hơn (SYSTEM_SPEC S10). */
export const REOPEN_WORKDAYS = 5;

export interface ActionInput {
  reason?: string;
  /** Tên phòng (giao phòng) hoặc tên cán bộ (giao cán bộ). */
  target?: string;
}

export interface CasePatch {
  status?: CaseStatus;
  unit?: string | null;
  handler?: string | null;
  received?: boolean;
  reopened?: boolean;
  extensionRound?: number | null;
  resumeStatus?: CaseStatus | null;
  dueAt?: string;
  closedOnTime?: boolean;
  rating?: "hai_long" | "khong_hai_long";
  addReworkStep?: boolean;
}

export interface Transition {
  patch: CasePatch;
  event: string;
}

const resume = (c: CaseRow & { resumeStatus?: CaseStatus | null }): CaseStatus => c.resumeStatus ?? "dang_xu_ly";

/** Kết quả chuyển trạng thái. `undefined` = thao tác không đổi dữ liệu vụ ở đây (ví dụ ghi chú KP). */
export function transition(
  c: CaseRow & { resumeStatus?: CaseStatus | null }, actionId: string, input: ActionInput, actor: string, today: string,
): Transition | undefined {
  const t = (event: string, patch: CasePatch): Transition => ({ event, patch });
  switch (actionId) {
    case "giao_phong": return t(`Giao ${input.target}`, { status: "da_giao", unit: input.target, handler: null });
    case "chuyen_co_quan": return t("Chuyển cơ quan khác", { status: "chuyen_co_quan_khac" });
    case "chuyen_khieu_nai": return t("Chuyển luồng khiếu nại, tố cáo", { status: "chuyen_khieu_nai" });
    case "gop_trung": return t("Gộp trùng", { status: "khong_xu_ly" });
    case "khong_xu_ly": return t("Không xử lý", { status: "khong_xu_ly" });
    case "chap_nhan_chuyen":
      return t("Chấp nhận đề nghị chuyển, trả về điều phối", { status: "cho_dieu_phoi", unit: null, handler: null, resumeStatus: null });
    case "tu_choi_chuyen": return t("Từ chối đề nghị chuyển", { status: c.resumeStatus ?? "da_giao", resumeStatus: null });
    case "giao_can_bo": return t(`Giao cán bộ ${input.target}`, { handler: input.target });
    case "giao_lai": return t(`Giao lại cán bộ ${input.target}`, { handler: input.target, received: true });
    case "nhan_viec": return t("Nhận xử lý", { status: "dang_xu_ly", handler: actor, received: true });
    case "de_nghi_chuyen": return t("Đề nghị chuyển", { status: "de_nghi_chuyen", resumeStatus: c.status });
    case "gui_ket_qua": return t("Gửi kết quả chờ duyệt", { status: "cho_duyet_ket_qua", resumeStatus: c.status });
    case "hoi_bo_sung": return t("Yêu cầu người dân bổ sung", { status: "cho_bo_sung", resumeStatus: c.status });
    case "rut": return t("Người dân rút phản ánh", { status: "da_rut" });
    case "bo_sung": return t("Người dân bổ sung thông tin", { status: resume(c), resumeStatus: null });
    case "xin_gia_han":
      return t("Đề nghị gia hạn", { status: "de_nghi_gia_han", extensionRound: (c.extensionRound ?? 0) + 1, resumeStatus: c.status });
    case "duyet_gia_han": case "duyet_gia_han_2": case "duyet_gia_han_ct":
      return t(`Duyệt gia hạn lần ${c.extensionRound ?? 1}`, {
        status: resume(c), resumeStatus: null, dueAt: addWorkdays(c.dueAt, EXTENSION_WORKDAYS),
      });
    case "tu_choi_gia_han": {
      const prev = (c.extensionRound ?? 1) - 1;
      return t("Từ chối gia hạn", { status: resume(c), resumeStatus: null, extensionRound: prev > 0 ? prev : null });
    }
    case "duyet_ket_qua":
      return t("Duyệt kết quả", { status: "da_giai_quyet", resumeStatus: null, closedOnTime: today <= c.dueAt });
    case "tra_lai": return t("Trả lại kết quả", { status: resume(c), resumeStatus: null });
    case "danh_gia": return t("Người dân hài lòng, đóng phản ánh", { status: "da_dong", rating: "hai_long" });
    case "khong_hai_long": return t("Người dân không hài lòng, đóng phản ánh", { status: "da_dong", rating: "khong_hai_long" });
    case "mo_lai":
      return t("Người dân mở lại", {
        status: "mo_lai", reopened: true, rating: "khong_hai_long", dueAt: addWorkdays(today, REOPEN_WORKDAYS), addReworkStep: true,
      });
    default: return undefined;
  }
}
