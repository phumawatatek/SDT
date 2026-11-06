// Quy tắc xem — PHASE1_SPEC §2. Bản UI dùng để mô phỏng; BE phải kiểm tra lại ở server.
import type { CaseRow } from "@/lib/case";
import type { DemoUser } from "./roles";

/** Cán bộ được phân công chuyên đề của vụ, trên toàn phường hoặc đúng khu phố của vụ. */
function isAssigned(user: DemoUser, c: CaseRow): boolean {
  if (user.assignments) return user.assignments.some((a) => a.topic === c.topic && (!a.ward || a.ward === c.ward));
  return (user.topics ?? []).includes(c.topic);
}

export function canView(user: DemoUser, c: CaseRow): boolean {
  switch (user.role) {
    case "citizen":
      return c.sender === user.name;
    case "kp":
      return c.ward === user.ward && !c.sensitive;
    case "canbo":
      return c.unit === user.unit && !c.sensitive && isAssigned(user, c);
    case "truongphong":
      return c.unit === user.unit && !c.sensitive;
    case "dieuphoi":
    case "phochutich":
      return !c.sensitive;
    case "chutich":
      return true;
    case "admin":
      return false;
  }
}

/** Trưởng KP không thấy danh tính trừ khi người dân đồng ý. */
export function canSeeIdentity(user: DemoUser, c: CaseRow): boolean {
  if (user.role === "kp") return c.consentShowKp;
  if (user.role === "admin") return false;
  return true;
}

/** Người dân không thấy tên cán bộ xử lý luồng kín. */
export function handlerVisible(user: DemoUser, c: CaseRow): boolean {
  return !(user.role === "citizen" && c.sensitive);
}

export function visibleCases(user: DemoUser, all: CaseRow[]): CaseRow[] {
  return all.filter((c) => canView(user, c));
}
