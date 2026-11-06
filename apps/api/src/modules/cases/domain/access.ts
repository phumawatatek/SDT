// Quy tắc xem — PHASE1_SPEC §2. Bản UI dùng để mô phỏng; BE phải kiểm tra lại ở server.
import type { CaseRow } from "./case.js";
import type { DemoUser } from "./roles.js";

/** Cán bộ được phân công chuyên đề của vụ, trên toàn phường hoặc đúng khu phố của vụ. */
function isAssigned(user: DemoUser, c: CaseRow): boolean {
  if (user.assignments) return user.assignments.some((a) => a.topic === c.topic && (!a.ward || a.ward === c.ward));
  return (user.topics ?? []).includes(c.topic);
}

/** Xem theo phạm vi của vai trò; luồng kín cần quyền riêng (trừ người gửi xem vụ của mình). */
export function canView(user: DemoUser, c: CaseRow): boolean {
  if (c.sensitive && user.scope !== "own" && !user.perms.includes("xem_luong_kin")) return false;
  switch (user.scope) {
    case "own": return c.sender === user.name;
    case "ward": return c.ward === user.ward;
    case "assigned": return c.unit === user.unit && isAssigned(user, c);
    case "unit": return c.unit === user.unit;
    case "all": return true;
    case "none": return false;
  }
}

/** Danh tính người gửi: cần quyền xem danh tính, hoặc người dân đã đồng ý cho trưởng KP xem. Quản trị không bao giờ. */
export function canSeeIdentity(user: DemoUser, c: CaseRow): boolean {
  if (user.scope === "none") return false;
  if (user.perms.includes("xem_danh_tinh")) return true;
  return user.role === "kp" && c.consentShowKp;
}

/** Người dân không thấy tên cán bộ xử lý luồng kín. */
export function handlerVisible(user: DemoUser, c: CaseRow): boolean {
  return !(user.role === "citizen" && c.sensitive);
}

export function visibleCases(user: DemoUser, all: CaseRow[]): CaseRow[] {
  return all.filter((c) => canView(user, c));
}
