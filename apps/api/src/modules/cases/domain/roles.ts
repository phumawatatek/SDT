import { DEFAULT_ROLES, type Scope } from "../../rbac/domain/permissions.js";

export type Role = "citizen" | "kp" | "canbo" | "truongphong" | "dieuphoi" | "phochutich" | "chutich" | "admin";

export interface DemoUser {
  role: Role;
  name: string;
  title: string;
  unit?: string;
  ward?: string;
  topics?: string[];
  /** Phân công đang hiệu lực: chuyên đề + khu phố (không có = toàn phường). */
  assignments?: { topic: string; ward?: string }[];
  /** Khối đơn vị phụ trách (Phó Chủ tịch). */
  units?: string[];
  group: "dan" | "khupho" | "phong" | "vanphong" | "lanhdao" | "quantri";
  /** Quyền của vai trò (RBAC, nạp từ DB). `role` ở trên là loại vai trò: quyết định giao diện + hồ sơ. */
  perms: string[];
  scope: Scope;
}

type Profile = Omit<DemoUser, "perms" | "scope">;

const PROFILES: Profile[] = [
  { role: "citizen", name: "Nguyễn Văn An", title: "Người dân", group: "dan" },
  { role: "kp", name: "Đỗ Thị Lan", title: "Trưởng khu phố 3", ward: "Khu phố 3", group: "khupho" },
  {
    role: "canbo", name: "Trần Minh", title: "Cán bộ Phòng KT-HT-ĐT", unit: "Phòng KT-HT-ĐT",
    topics: ["Hạ tầng – Giao thông", "Môi trường", "Đô thị – Xây dựng"], group: "phong",
  },
  { role: "truongphong", name: "Lê Quang Huy", title: "Trưởng phòng KT-HT-ĐT", unit: "Phòng KT-HT-ĐT", group: "phong" },
  { role: "dieuphoi", name: "Phan Thu Hà", title: "Điều phối viên – Văn phòng", unit: "Văn phòng HĐND-UBND", group: "vanphong" },
  { role: "phochutich", name: "Vũ Đức Thắng", title: "Phó Chủ tịch phụ trách", units: ["Phòng KT-HT-ĐT", "Công an phường"], group: "lanhdao" },
  { role: "chutich", name: "Hoàng Văn Nam", title: "Chủ tịch UBND phường", group: "lanhdao" },
  { role: "admin", name: "Quản trị hệ thống", title: "Quản trị viên", group: "quantri" },
];

/** Người dùng mẫu với quyền mặc định của vai trò gốc. */
export const DEMO_USERS: DemoUser[] = PROFILES.map((p) => ({ ...p, perms: DEFAULT_ROLES[p.role].perms, scope: DEFAULT_ROLES[p.role].scope }));

export function userFor(role: Role): DemoUser {
  const user = DEMO_USERS.find((u) => u.role === role);
  if (!user) throw new Error(`Unknown role ${role}`);
  return user;
}
