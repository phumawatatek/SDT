import { STATUS_META, type CaseStatus } from "./status";

/** Ngày cố định của dữ liệu mock — chỉ dùng trong test và seed. */
export const TODAY = "2026-11-06";

/** Hôm nay theo giờ Việt Nam (YYYY-MM-DD). */
export function todayVN(now = new Date()): string {
  return new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10);
}

/** Ngày nghỉ mặc định (dữ liệu mẫu); thực tế nạp từ DB bằng `setHolidays`. */
export const HOLIDAYS = ["2026-09-02", "2026-01-01"];
let holidaySet = new Set<string>(HOLIDAYS);

/** Thay danh sách ngày nghỉ (API nạp từ bảng holidays; web nhận từ API). */
export function setHolidays(dates: readonly string[]): void {
  holidaySet = new Set(dates);
}

export type DeadlineState = "ok" | "soon" | "overdue" | "paused" | "none";

export const DEADLINE_LABEL: Record<DeadlineState, string> = {
  ok: "Còn hạn",
  soon: "Sắp hết hạn",
  overdue: "Quá hạn",
  paused: "Tạm dừng",
  none: "—",
};

function isWorkday(d: Date): boolean {
  const day = d.getUTCDay();
  const iso = d.toISOString().slice(0, 10);
  return day !== 0 && day !== 6 && !holidaySet.has(iso);
}

/** Số ngày làm việc từ `from` đến `to` (âm nếu `to` đã qua). */
export function workdaysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`);
  const b = new Date(`${to}T00:00:00Z`);
  const sign = b >= a ? 1 : -1;
  const [start, end] = sign === 1 ? [a, b] : [b, a];
  let count = 0;
  for (const d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (isWorkday(d)) count++;
  }
  return sign * count;
}

/** Cộng n ngày làm việc vào ngày `from` (bỏ T7, CN, ngày lễ). */
export function addWorkdays(from: string, n: number): string {
  const d = new Date(`${from}T00:00:00Z`);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (isWorkday(d)) left--;
  }
  return d.toISOString().slice(0, 10);
}

const TERMINAL: CaseStatus[] = ["da_giai_quyet", "da_dong", "chuyen_co_quan_khac", "khong_xu_ly", "chuyen_khieu_nai", "da_rut"];

export function deadlineState(status: CaseStatus, dueAt: string, today = todayVN()): DeadlineState {
  if (TERMINAL.includes(status)) return "none";
  if (STATUS_META[status].clockPaused) return "paused";
  const left = workdaysBetween(today, dueAt);
  if (left < 0) return "overdue";
  if (left <= 2) return "soon";
  return "ok";
}

export function deadlineText(status: CaseStatus, dueAt: string, today = todayVN()): string {
  const state = deadlineState(status, dueAt, today);
  if (state === "none" || state === "paused") return DEADLINE_LABEL[state];
  const left = workdaysBetween(today, dueAt);
  return left < 0 ? `Quá ${-left} ngày làm việc` : `Còn ${left} ngày làm việc`;
}
