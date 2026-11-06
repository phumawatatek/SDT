import type { CaseRow } from "@/lib/case";
import { todayVN } from "./deadline";
import { inGroup, isOverdue, type StatusGroup } from "./stats";
import { STATUS_META, type CaseStatus } from "./status";

export interface AllFilter {
  group: StatusGroup;
  days: "" | "7" | "30" | "90";
  unit: string;
  topic: string;
  status: "" | CaseStatus;
  ward: string;
  overdueOnly: boolean;
  q: string;
}

export const EMPTY_FILTER: AllFilter = { group: "tat-ca", days: "", unit: "", topic: "", status: "", ward: "", overdueOnly: false, q: "" };

export function fromParams(p: URLSearchParams): AllFilter {
  return {
    ...EMPTY_FILTER,
    group: (p.get("nhom") as StatusGroup | null) ?? "tat-ca",
    unit: p.get("phong") ?? "",
    topic: p.get("chuyen-de") ?? "",
    overdueOnly: p.get("qua-han") === "1",
  };
}

function withinDays(c: CaseRow, days: string): boolean {
  if (!days) return true;
  const diff = (Date.parse(todayVN()) - Date.parse(c.submittedAt)) / 86_400_000;
  return diff <= Number(days);
}

/** Lọc trừ nhóm trạng thái (dùng để đếm số cho từng nhóm). Có từ khóa thì tìm trong mọi thời gian. */
export function baseFilter(c: CaseRow, f: AllFilter): boolean {
  return (
    (f.q.trim() !== "" || withinDays(c, f.days)) &&
    (!f.unit || c.unit === f.unit) &&
    (!f.topic || c.topic === f.topic) &&
    (!f.status || c.status === f.status) &&
    (!f.ward || c.ward === f.ward) &&
    (!f.overdueOnly || isOverdue(c))
  );
}

export function applyAll(cases: CaseRow[], f: AllFilter): CaseRow[] {
  return cases.filter((c) => baseFilter(c, f) && inGroup(c, f.group));
}

export function distinct(cases: CaseRow[], key: "unit" | "topic" | "ward"): string[] {
  return [...new Set(cases.map((c) => c[key]).filter((v) => v !== "—"))].sort((a, b) => a.localeCompare(b, "vi"));
}

/** Văn bản báo cáo theo bộ lọc, để sao chép gửi đi. */
export function reportText(rows: CaseRow[], f: AllFilter): string {
  const byStatus = new Map<string, number>();
  rows.forEach((c) => byStatus.set(STATUS_META[c.status].staffLabel, (byStatus.get(STATUS_META[c.status].staffLabel) ?? 0) + 1));
  const cond = [f.unit, f.topic, f.ward, f.days && `${f.days} ngày`, f.overdueOnly && "chỉ vụ quá hạn"].filter(Boolean).join(", ");
  const lines = [...byStatus.entries()].map(([s, n]) => `- ${s}: ${n}`);
  return [`BÁO CÁO PHẢN ÁNH KIẾN NGHỊ (tính đến ${todayVN()})`, `Điều kiện: ${cond || "toàn bộ"}`, `Tổng số: ${rows.length} phản ánh`, ...lines, `Quá hạn: ${rows.filter(isOverdue).length}`].join("\n");
}
