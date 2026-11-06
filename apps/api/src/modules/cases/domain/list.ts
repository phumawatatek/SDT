import { canSeeIdentity } from "./access.js";
import type { CaseRow } from "./case.js";
import type { DemoUser } from "./roles.js";
import { matchesQuery } from "./text.js";

export const HIDDEN = "Đã ẩn";

/** Tìm kiếm có trúng nhờ tên/SĐT người gửi không — cần ghi nhật ký truy cập. */
export function hitByIdentity(user: DemoUser, c: CaseRow, q: string): boolean {
  if (!q.trim() || !canSeeIdentity(user, c)) return false;
  const base = [c.code, c.title, c.content, c.topic, c.ward, c.address, c.unit];
  return !matchesQuery(base, q) && matchesQuery([...base, c.sender, c.phone], q);
}
