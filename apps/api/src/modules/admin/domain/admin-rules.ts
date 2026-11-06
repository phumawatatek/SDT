// Quy tắc dữ liệu quản trị — hàm thuần, trả thông báo lỗi hoặc undefined.
import type { Role } from "../../cases/domain/roles.js";

export interface UserShape {
  role: Role;
  unitId?: number | null;
  wardId?: number | null;
}

/** Vai trò cần đơn vị / khu phố đi kèm. */
export function checkUser(u: UserShape): string | undefined {
  if ((u.role === "canbo" || u.role === "truongphong") && !u.unitId) return "Cán bộ, trưởng phòng cần đơn vị";
  if (u.role === "kp" && !u.wardId) return "Trưởng khu phố cần khu phố";
  return undefined;
}

/** Quản trị viên không tự khoá hay xoá chính mình (tránh mất quyền quản trị). */
export function checkNotSelf(actorId: number, targetId: number, change: { active?: boolean; deleting?: boolean; role?: Role }): string | undefined {
  if (actorId !== targetId) return undefined;
  if (change.deleting || change.active === false) return "Không thể khoá hoặc xoá tài khoản đang đăng nhập";
  if (change.role && change.role !== "admin") return "Không thể tự bỏ vai trò quản trị";
  return undefined;
}

export function checkRange(from: string, to: string | null | undefined, label: string): string | undefined {
  return to && to < from ? `${label}: ngày kết thúc phải sau ngày bắt đầu` : undefined;
}

export interface DelegationShape {
  fromUserId: number;
  toUserId: number;
  startDate: string;
  endDate: string;
}

export function checkDelegation(d: DelegationShape): string | undefined {
  if (d.fromUserId === d.toUserId) return "Không tự ủy quyền cho chính mình";
  return checkRange(d.startDate, d.endDate, "Ủy quyền");
}
