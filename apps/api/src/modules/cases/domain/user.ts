import type { DemoUser, Role } from "./roles.js";

/** Người dùng đã đăng nhập, dựng lại từ DB mỗi request. */
export interface AppUser extends DemoUser {
  id: number;
  /** Người đang ủy quyền cho mình (còn hiệu lực hôm nay) — được thao tác thay họ. Không ủy quyền dây chuyền. */
  actingFor?: AppUser[];
}

export const GROUP: Record<Role, DemoUser["group"]> = {
  citizen: "dan", kp: "khupho", canbo: "phong", truongphong: "phong",
  dieuphoi: "vanphong", phochutich: "lanhdao", chutich: "lanhdao", admin: "quantri",
};

/** Các danh tính được dùng để kiểm quyền: chính mình trước, rồi người ủy quyền. */
export const identitiesOf = (u: AppUser): AppUser[] => [u, ...(u.actingFor ?? [])];

/** Tên ghi lịch sử: "A (thay mặt B)" khi thao tác bằng quyền ủy quyền. */
export const actorLabel = (self: AppUser, as: AppUser): string => (as.id === self.id ? self.name : `${self.name} (thay mặt ${as.name})`);
