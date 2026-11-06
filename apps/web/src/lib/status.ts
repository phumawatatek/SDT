// 14 trạng thái nội bộ theo SYSTEM_SPEC §4 (S1–S14), nhãn người dân 8 loại. Đã chốt 2026-11-06.

export type BadgeTone = "amber" | "blue" | "green" | "gray";

export type CaseStatus =
  | "moi_tiep_nhan"
  | "cho_dieu_phoi"
  | "da_giao"
  | "dang_xu_ly"
  | "cho_bo_sung"
  | "de_nghi_chuyen"
  | "de_nghi_gia_han"
  | "cho_duyet_ket_qua"
  | "da_giai_quyet"
  | "mo_lai"
  | "da_dong"
  | "chuyen_co_quan_khac"
  | "khong_xu_ly"
  | "da_rut"
  | "chuyen_khieu_nai";

interface StatusMeta {
  staffLabel: string;
  citizenLabel: string;
  tone: BadgeTone;
  clockPaused: boolean;
}

export const STATUS_META: Record<CaseStatus, StatusMeta> = {
  moi_tiep_nhan: { staffLabel: "Mới tiếp nhận", citizenLabel: "Đã tiếp nhận", tone: "amber", clockPaused: false },
  cho_dieu_phoi: { staffLabel: "Chờ điều phối", citizenLabel: "Đã tiếp nhận", tone: "amber", clockPaused: false },
  da_giao: { staffLabel: "Đã giao, chờ nhận", citizenLabel: "Đã chuyển đơn vị", tone: "blue", clockPaused: false },
  dang_xu_ly: { staffLabel: "Đang xử lý", citizenLabel: "Đang xử lý", tone: "blue", clockPaused: false },
  cho_bo_sung: { staffLabel: "Chờ người dân bổ sung", citizenLabel: "Cần bạn bổ sung", tone: "amber", clockPaused: true },
  de_nghi_chuyen: { staffLabel: "Đề nghị chuyển", citizenLabel: "Đang xử lý", tone: "amber", clockPaused: false },
  de_nghi_gia_han: { staffLabel: "Đề nghị gia hạn", citizenLabel: "Đang xử lý", tone: "amber", clockPaused: false },
  cho_duyet_ket_qua: { staffLabel: "Chờ duyệt kết quả", citizenLabel: "Đang xử lý", tone: "blue", clockPaused: false },
  da_giai_quyet: { staffLabel: "Đã giải quyết", citizenLabel: "Đã có kết quả", tone: "green", clockPaused: true },
  mo_lai: { staffLabel: "Mở lại", citizenLabel: "Đã mở lại", tone: "amber", clockPaused: false },
  da_dong: { staffLabel: "Đã đóng", citizenLabel: "Đã đóng", tone: "green", clockPaused: true },
  chuyen_co_quan_khac: { staffLabel: "Đã chuyển cơ quan khác", citizenLabel: "Đã chuyển cơ quan khác", tone: "gray", clockPaused: true },
  da_rut: { staffLabel: "Người dân đã rút", citizenLabel: "Đã rút", tone: "gray", clockPaused: true },
  khong_xu_ly: { staffLabel: "Từ chối / gộp trùng", citizenLabel: "Không xử lý", tone: "gray", clockPaused: true },
  chuyen_khieu_nai: {
    staffLabel: "Chuyển luồng khiếu nại, tố cáo",
    citizenLabel: "Đã chuyển xử lý theo quy định",
    tone: "gray",
    clockPaused: true,
  },
};

/** Trạng thái còn mở (đồng hồ chạy hoặc chờ người dân). */
export const OPEN_STATUSES: readonly CaseStatus[] = [
  "moi_tiep_nhan", "cho_dieu_phoi", "da_giao", "dang_xu_ly", "cho_bo_sung", "de_nghi_chuyen",
  "de_nghi_gia_han", "cho_duyet_ket_qua", "mo_lai",
];

export const isOpenStatus = (s: CaseStatus): boolean => OPEN_STATUSES.includes(s);

export type Audience = "staff" | "citizen";

export function statusLabel(status: CaseStatus, audience: Audience): string {
  const meta = STATUS_META[status];
  return audience === "citizen" ? meta.citizenLabel : meta.staffLabel;
}

/** Che SĐT trong danh sách: 0904123843 → 0904***843 (PHASE1_SPEC §2). */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return "***";
  return `${digits.slice(0, 4)}***${digits.slice(-3)}`;
}
