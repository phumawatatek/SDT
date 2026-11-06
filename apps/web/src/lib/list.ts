import type { CaseRow } from "@/lib/case";
import { canSeeIdentity, handlerVisible } from "./access";
import { deadlineState, DEADLINE_LABEL } from "./deadline";
import type { DemoUser } from "./roles";
import { maskPhone, statusLabel } from "./status";
import { fold, matchesQuery } from "./text";

export type ColumnKey =
  | "code" | "sender" | "phone" | "title" | "topic" | "ward"
  | "submittedAt" | "unit" | "handler" | "dueAt" | "status";

export const COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: "code", label: "Mã" },
  { key: "sender", label: "Người gửi" },
  { key: "phone", label: "Điện thoại" },
  { key: "title", label: "Nội dung" },
  { key: "topic", label: "Chuyên đề" },
  { key: "ward", label: "Khu phố" },
  { key: "submittedAt", label: "Ngày gửi" },
  { key: "unit", label: "Đơn vị" },
  { key: "handler", label: "Người xử lý" },
  { key: "dueAt", label: "Hạn" },
  { key: "status", label: "Trạng thái" },
];

export const HIDDEN = "Đã ẩn";

/** Giá trị hiển thị của một ô — đã áp quy tắc che danh tính và SĐT. */
export function cellText(user: DemoUser, c: CaseRow, key: ColumnKey): string {
  switch (key) {
    case "sender": return canSeeIdentity(user, c) ? c.sender : HIDDEN;
    case "phone": return canSeeIdentity(user, c) ? maskPhone(c.phone) : HIDDEN;
    case "handler": return handlerVisible(user, c) ? c.handler : HIDDEN;
    case "unit": return user.role === "citizen" && c.sensitive ? "UBND phường" : c.unit;
    case "status": return statusLabel(c.status, user.role === "citizen" ? "citizen" : "staff");
    case "dueAt": {
      const s = deadlineState(c.status, c.dueAt);
      return s === "none" ? "—" : `${c.dueAt} ${DEADLINE_LABEL[s]}`;
    }
    default: return c[key];
  }
}

export type SortDir = "asc" | "desc";
export interface ListQuery {
  q: string;
  filters: Partial<Record<ColumnKey, string>>;
  sort?: { key: ColumnKey; dir: SortDir };
}

/** Trường dùng cho ô tìm kiếm: không cho dò người gửi khi vai trò không được xem danh tính. */
function searchFields(user: DemoUser, c: CaseRow): string[] {
  const base = [c.code, c.title, c.content, c.topic, c.ward, c.address, c.unit];
  return canSeeIdentity(user, c) ? [...base, c.sender, c.phone] : base;
}

/** Tìm kiếm có trúng nhờ tên/SĐT người gửi không — cần ghi nhật ký truy cập. */
export function hitByIdentity(user: DemoUser, c: CaseRow, q: string): boolean {
  if (!q.trim() || !canSeeIdentity(user, c)) return false;
  const base = [c.code, c.title, c.content, c.topic, c.ward, c.address, c.unit];
  return !matchesQuery(base, q) && matchesQuery([...base, c.sender, c.phone], q);
}

export function applyQuery(user: DemoUser, rows: CaseRow[], query: ListQuery): CaseRow[] {
  const filtered = rows.filter((c) => {
    if (!matchesQuery(searchFields(user, c), query.q)) return false;
    return Object.entries(query.filters).every(([k, v]) => !v || fold(cellText(user, c, k as ColumnKey)).includes(fold(v)));
  });
  const { sort } = query;
  if (!sort) return filtered;
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...filtered].sort((x, y) => sign * cellText(user, x, sort.key).localeCompare(cellText(user, y, sort.key), "vi"));
}
