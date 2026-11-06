import type { CaseStatus } from "@/lib/status";

export const STEPS = ["Tiếp nhận", "Giao", "Xử lý", "Duyệt", "Có kết quả", "Đóng"] as const;

const CURRENT: Record<CaseStatus, number> = {
  moi_tiep_nhan: 0,
  cho_dieu_phoi: 1,
  da_giao: 1,
  dang_xu_ly: 2,
  cho_bo_sung: 2,
  de_nghi_chuyen: 2,
  de_nghi_gia_han: 2,
  mo_lai: 2,
  cho_duyet_ket_qua: 3,
  da_giai_quyet: 4,
  da_dong: 6,
  chuyen_co_quan_khac: 6,
  khong_xu_ly: 6,
  da_rut: 6,
  chuyen_khieu_nai: 6,
};

export function stepIndex(status: CaseStatus): number {
  return CURRENT[status];
}

/** Thanh 6 bước: Xong, đang làm, chưa tới (PHASE1_SPEC §12). */
export function StepBar({ status }: { status: CaseStatus }) {
  const current = stepIndex(status);
  return (
    <ol className="flex gap-1" aria-label="Tiến độ xử lý">
      {STEPS.map((name, i) => {
        const state = i < current ? "Xong" : i === current ? "Đang làm" : "Chưa tới";
        const tone = i < current ? "bg-brand text-white" : i === current ? "bg-gold text-ink" : "bg-line-2 text-muted";
        return (
          <li key={name} className={`flex-1 rounded-group px-2 py-1 text-center text-[12px] ${tone}`}>
            <span>{name}</span>
            <span className="sr-only"> — {state}</span>
          </li>
        );
      })}
    </ol>
  );
}
