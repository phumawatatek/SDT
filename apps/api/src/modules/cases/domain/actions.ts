// Khung "Việc cần làm" — thao tác theo vai trò và trạng thái (PHASE1_SPEC §1–3).
import type { CaseRow } from "./case.js";
import type { DemoUser } from "./roles.js";
import { isOpenStatus } from "./status.js";

export type ActionKind = "primary" | "success" | "danger" | "normal";

export interface CaseAction {
  id: string;
  label: string;
  kind: ActionKind;
  needsReason: boolean;
  /** Thao tác cần chọn đích: phòng (giao phòng) hoặc cán bộ (giao cán bộ). */
  target?: "unit" | "handler";
  disabledReason?: string;
}

const a = (id: string, label: string, kind: ActionKind, needsReason = false, target?: CaseAction["target"]): CaseAction =>
  ({ id, label, kind, needsReason, ...(target ? { target } : {}) });

/** Trạng thái cán bộ đang làm việc trên vụ (S4 Đang xử lý, S10 Mở lại). */
const WORKING = ["dang_xu_ly", "mo_lai"];

export function canSubmitResult(c: CaseRow): string | undefined {
  const missing = c.steps.filter((s) => s.required && !s.done);
  if (missing.length > 0) return `Chưa xong bước bắt buộc: ${missing.map((s) => s.name).join(", ")}`;
  if (c.photosAfter < 1) return "Cần ít nhất 1 ảnh sau xử lý";
  return undefined;
}

function coordinatorActions(c: CaseRow): CaseAction[] {
  if (c.status === "de_nghi_chuyen") {
    return [a("chap_nhan_chuyen", "Chấp nhận chuyển, điều phối lại", "primary"), a("tu_choi_chuyen", "Từ chối đề nghị chuyển", "danger", true)];
  }
  if (c.status !== "cho_dieu_phoi") return [];
  return [
    a("giao_phong", "Giao phòng", "primary", false, "unit"),
    a("chuyen_co_quan", "Chuyển cơ quan khác", "normal", true),
    a("chuyen_khieu_nai", "Chuyển khiếu nại, tố cáo", "normal", true),
    a("gop_trung", "Gộp trùng", "normal", true),
    a("khong_xu_ly", "Không xử lý", "danger", true),
  ];
}

function headActions(c: CaseRow): CaseAction[] {
  if (c.status === "da_giao") return [a("giao_can_bo", "Giao cán bộ", "primary", false, "handler")];
  if (WORKING.includes(c.status)) return [a("giao_lai", "Giao lại cán bộ", "normal", true, "handler")];
  if (c.status === "cho_duyet_ket_qua") {
    return [a("duyet_ket_qua", "Duyệt kết quả", "success"), a("tra_lai", "Trả lại kết quả", "danger", true)];
  }
  if (c.status === "de_nghi_gia_han" && c.extensionRound === 1) {
    return [a("duyet_gia_han", "Duyệt gia hạn lần 1", "success"), a("tu_choi_gia_han", "Từ chối gia hạn", "danger", true)];
  }
  return [];
}

/** Cửa sổ đề nghị chuyển: 60 phút sau khi nhận, quá thì nút tự ẩn. */
export const TRANSFER_WINDOW_MIN = 60;

function handlerActions(c: CaseRow, isMine: boolean): CaseAction[] {
  if (c.status === "da_giao") {
    // Không thao tác trên việc đã giao cho người khác.
    if (c.handler !== "—" && !isMine) return [];
    return [a("nhan_viec", "Nhận việc", "primary"), a("de_nghi_chuyen", "Đề nghị chuyển", "normal", true)];
  }
  if (!WORKING.includes(c.status) || !isMine) return [];
  const submit = { ...a("gui_ket_qua", "Gửi kết quả", "primary"), disabledReason: canSubmitResult(c) };
  const inWindow = (c.receivedMinutesAgo ?? Infinity) < TRANSFER_WINDOW_MIN;
  const transfer = inWindow ? [a("de_nghi_chuyen", "Đề nghị chuyển", "normal", true)] : [];
  // Gia hạn tối đa 2 lần (lần 1 trưởng phòng, lần 2 lãnh đạo phường).
  const extend = (c.extensionRound ?? 0) < 2 ? [a("xin_gia_han", "Xin gia hạn", "normal", true)] : [];
  return [submit, a("hoi_bo_sung", "Hỏi người dân bổ sung", "normal", true), ...extend, ...transfer];
}

/** Người dân được sửa / rút khi phường chưa có cán bộ nhận việc (chưa giao cán bộ, không phải luồng kín). */
export function citizenCanAmend(c: CaseRow): boolean {
  return !c.sensitive && (c.status === "moi_tiep_nhan" || c.status === "cho_dieu_phoi" || (c.status === "da_giao" && (!c.handler || c.handler === "—")));
}

function citizenActions(c: CaseRow): CaseAction[] {
  if (citizenCanAmend(c)) return [a("sua_noi_dung", "Sửa nội dung", "normal"), a("rut", "Rút phản ánh", "danger", true)];
  if (c.status === "cho_bo_sung") return [a("bo_sung", "Gửi thông tin bổ sung", "primary", true)];
  if (c.status === "da_giai_quyet") {
    // Mở lại 1 lần; đã mở lại rồi thì chỉ còn đánh giá không hài lòng.
    const unhappy = c.reopened ? a("khong_hai_long", "Không hài lòng", "danger", true) : a("mo_lai", "Không hài lòng, mở lại", "danger", true);
    return [a("danh_gia", "Hài lòng, đóng phản ánh", "primary"), unhappy];
  }
  return [];
}

/** Quyền ứng với thao tác (mặc định trùng id thao tác). */
const PERM_OF: Record<string, string> = { khong_hai_long: "mo_lai" };

/**
 * Thao tác người dùng làm được trên vụ: mỗi nhóm thao tác chỉ xét khi đúng ngữ cảnh (phòng mình, việc của mình,
 * vụ mình gửi...), rồi lọc theo quyền của vai trò (RBAC). Điều kiện trạng thái vẫn do quy trình quyết định.
 */
export function actionsFor(user: DemoUser, c: CaseRow): CaseAction[] {
  const has = (p: string) => user.perms.includes(p);
  const allowed = (list: CaseAction[]) => list.filter((x) => has(PERM_OF[x.id] ?? x.id));
  const mine = c.handler === user.name;
  const handler = c.sensitive
    ? (has("xu_ly_luong_kin") ? handlerActions(c, true) : [])
    : (mine || c.unit === user.unit ? handlerActions(c, mine) : []);
  const list = [
    ...coordinatorActions(c),
    ...(!c.sensitive && c.unit === user.unit ? headActions(c) : []),
    ...handler,
  ];
  const out = allowed(list);
  if (c.sensitive && c.status === "cho_duyet_ket_qua" && has("duyet_luong_kin")) out.push(a("duyet_ket_qua", "Duyệt kết quả", "success"));
  if (c.status === "de_nghi_gia_han" && has("duyet_gia_han_ct")) out.push(a("duyet_gia_han_ct", "Duyệt gia hạn", "success"));
  if (c.status === "de_nghi_gia_han" && c.extensionRound === 2 && has("duyet_gia_han_2") && (user.units ?? []).includes(c.unit)) {
    out.push(a("duyet_gia_han_2", "Duyệt gia hạn lần 2", "success"));
  }
  if (isOpenStatus(c.status) && has("ghi_chu")) out.push(a("ghi_chu", c.kpNote ? "Sửa ghi chú xác minh" : "Ghi chú xác minh", "primary"));
  if (c.sender === user.name) out.push(...allowed(citizenActions(c)));
  return out.filter((x, i) => out.findIndex((y) => y.id === x.id) === i);
}

/** Dòng chờ cho người dân: ngôn ngữ đời thường, không tên cán bộ, không trạng thái nội bộ. */
export function citizenWaitingText(c: CaseRow): string {
  switch (c.status) {
    case "cho_bo_sung": return "Phường đang chờ bạn bổ sung thông tin";
    case "da_giai_quyet": return "Phường đã có kết quả, mời bạn đánh giá";
    case "da_dong": case "chuyen_co_quan_khac": case "khong_xu_ly": case "chuyen_khieu_nai":
      return "Phản ánh đã kết thúc";
    case "da_rut": return "Bạn đã rút phản ánh này";
    default: return "Phường đang xử lý phản ánh của bạn";
  }
}

export function waitingText(c: CaseRow): string {
  switch (c.status) {
    case "moi_tiep_nhan": return "Hệ thống đang phân loại, định tuyến";
    case "cho_dieu_phoi": return "Đang chờ điều phối viên giao phòng";
    case "de_nghi_chuyen": return "Đang chờ điều phối viên xử lý đề nghị chuyển";
    case "mo_lai": return `Người dân mở lại, đang chờ ${c.handler} xử lý lại`;
    case "da_giao": return `Đang chờ ${c.unit} nhận việc`;
    case "dang_xu_ly": return `Đang chờ ${c.handler} xử lý`;
    case "cho_bo_sung": return "Đang chờ người dân bổ sung thông tin";
    case "de_nghi_gia_han":
      return c.extensionRound === 2 ? "Đang chờ Phó Chủ tịch duyệt gia hạn lần 2" : "Đang chờ trưởng phòng duyệt gia hạn";
    case "cho_duyet_ket_qua": return "Đang chờ trưởng phòng duyệt kết quả";
    case "da_giai_quyet": return "Đang chờ người dân đánh giá";
    default: return "Phản ánh đã kết thúc";
  }
}
