import type { CaseRow } from "@/lib/case";
import { deadlineState } from "./deadline";
import type { CaseStatus } from "./status";

/** 5 nhóm trạng thái dùng cho thẻ chỉ số và bộ lọc "Tất cả phản ánh". Giả định — chờ chốt định nghĩa. */
export type StatusGroup = "tat-ca" | "chua" | "dang" | "da" | "ket-thuc-khac";

export const GROUPS: { id: StatusGroup; label: string; statuses: CaseStatus[] | "all" }[] = [
  { id: "tat-ca", label: "Tổng tiếp nhận", statuses: "all" },
  { id: "da", label: "Đã giải quyết", statuses: ["da_giai_quyet", "da_dong"] },
  { id: "dang", label: "Đang giải quyết", statuses: ["dang_xu_ly", "cho_bo_sung", "de_nghi_chuyen", "de_nghi_gia_han", "cho_duyet_ket_qua", "mo_lai"] },
  { id: "chua", label: "Chưa giải quyết", statuses: ["moi_tiep_nhan", "cho_dieu_phoi", "da_giao"] },
  { id: "ket-thuc-khac", label: "Chuyển / không xử lý / rút", statuses: ["chuyen_co_quan_khac", "khong_xu_ly", "chuyen_khieu_nai", "da_rut"] },
];

export function inGroup(c: CaseRow, g: StatusGroup): boolean {
  const def = GROUPS.find((x) => x.id === g);
  return !def || def.statuses === "all" || def.statuses.includes(c.status);
}

export const isOverdue = (c: CaseRow) => deadlineState(c.status, c.dueAt) === "overdue";

export interface Kpi {
  id: string;
  label: string;
  value: number;
  delta: number;
  goodWhenUp: boolean;
  href: string;
}

// Chênh lệch so với kỳ trước: dữ liệu giả cố định cho demo.
const DELTA: Record<string, number> = { "tat-ca": 4, da: 2, dang: -1, chua: 1, "qua-han": 1 };

/** `scopeQs`: tham số phạm vi (vd. `&phong=...`) để link mở đúng danh sách. */
export function kpis(cases: CaseRow[], scopeQs = ""): Kpi[] {
  const card = (id: StatusGroup, label: string, goodWhenUp: boolean): Kpi => ({
    id, label, value: cases.filter((c) => inGroup(c, id)).length, delta: DELTA[id], goodWhenUp, href: `/tat-ca?nhom=${id}${scopeQs}`,
  });
  return [
    card("tat-ca", "Tổng tiếp nhận", true),
    card("da", "Đã giải quyết", true),
    card("dang", "Đang giải quyết", false),
    card("chua", "Chưa giải quyết", false),
    { id: "qua-han", label: "Đang quá hạn", value: cases.filter(isOverdue).length, delta: DELTA["qua-han"], goodWhenUp: false, href: `/tat-ca?qua-han=1${scopeQs}` },
  ];
}

export interface Quality {
  id: string;
  label: string;
  pct: number;
  target: number;
  higherIsBetter: boolean;
  basis: string;
}

/** Mục tiêu tạm: đúng hạn ≥ 90%, hài lòng ≥ 80%, mở lại ≤ 5% (chờ lãnh đạo chốt). */
export function quality(cases: CaseRow[]): Quality[] {
  const finished = cases.filter((c) => inGroup(c, "da"));
  const late = finished.filter((c) => c.closedOnTime === false).length;
  const rated = cases.filter((c) => c.rating);
  const happy = rated.filter((c) => c.rating === "hai_long").length;
  const reopened = cases.filter((c) => c.reopened).length;
  const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));
  return [
    { id: "dung-han", label: "Đúng hạn", pct: pct(finished.length - late, finished.length), target: 90, higherIsBetter: true, basis: `${finished.length} vụ đã giải quyết` },
    { id: "hai-long", label: "Hài lòng", pct: pct(happy, rated.length), target: 80, higherIsBetter: true, basis: `${rated.length} lượt đánh giá` },
    { id: "mo-lai", label: "Mở lại", pct: pct(reopened, cases.length), target: 5, higherIsBetter: false, basis: `${reopened}/${cases.length} vụ` },
  ];
}

export function countBy(cases: CaseRow[], key: "topic" | "unit"): [string, number][] {
  const m = new Map<string, number>();
  cases.forEach((c) => c[key] !== "—" && m.set(c[key], (m.get(c[key]) ?? 0) + 1));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export function unitResults(cases: CaseRow[]) {
  return countBy(cases, "unit").map(([unit, total]) => {
    const mine = cases.filter((c) => c.unit === unit);
    return { unit, total, done: mine.filter((c) => inGroup(c, "da")).length, overdue: mine.filter(isOverdue).length };
  });
}

/** Xu hướng 12 tháng (dữ liệu giả). */
export const TREND_12M: [string, number][] = [
  ["12/25", 31], ["01/26", 28], ["02/26", 22], ["03/26", 35], ["04/26", 40], ["05/26", 38],
  ["06/26", 44], ["07/26", 47], ["08/26", 41], ["09/26", 39], ["10/26", 52], ["11/26", 18],
];
