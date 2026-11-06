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
}

export const DEMO_USERS: DemoUser[] = [
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

export const GROUP_COLOR: Record<DemoUser["group"], string> = {
  dan: "bg-green-ink",
  khupho: "bg-amber-ink",
  phong: "bg-brand",
  vanphong: "bg-brand-ink",
  lanhdao: "bg-red",
  quantri: "bg-muted",
};

export interface NavItem {
  href: string;
  label: string;
}

/** Các mục quản trị — mỗi mục là một trang, hiện ở thanh bên của quản trị viên. */
export const ADMIN_SECTIONS = [
  { id: "users", label: "Người dùng" },
  { id: "roles", label: "Vai trò và phân quyền" },
  { id: "assign", label: "Phân công" },
  { id: "delegate", label: "Ủy quyền" },
  { id: "topics", label: "Chuyên đề và định tuyến" },
  { id: "wards", label: "Khu phố" },
  { id: "holidays", label: "Ngày nghỉ" },
  { id: "log", label: "Nhật ký truy cập" },
] as const;
export type AdminSection = (typeof ADMIN_SECTIONS)[number]["id"];

const NAV: Record<Role, NavItem[]> = {
  citizen: [
    { href: "/dan", label: "Phản ánh của tôi" },
    { href: "/dan/gui", label: "Gửi phản ánh" },
    { href: "/tra-cuu", label: "Tra cứu bằng mã" },
  ],
  kp: [
    { href: "/khu-pho", label: "Khu phố của tôi" },
    { href: "/dan/gui", label: "Gửi hộ người dân" },
  ],
  canbo: [{ href: "/hop-viec", label: "Hộp việc" }],
  truongphong: [
    { href: "/phong", label: "Phòng của tôi" },
    { href: "/dashboard", label: "Dashboard phòng" },
  ],
  dieuphoi: [
    { href: "/dieu-phoi", label: "Hàng chờ điều phối" },
    { href: "/tat-ca", label: "Tất cả phản ánh" },
  ],
  phochutich: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/tat-ca", label: "Tất cả phản ánh" },
  ],
  chutich: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/tat-ca", label: "Tất cả phản ánh" },
    { href: "/luong-kin", label: "Luồng kín" },
  ],
  admin: ADMIN_SECTIONS.map((t) => ({ href: `/quan-tri/${t.id}`, label: t.label })),
};

export function navFor(role: Role): NavItem[] {
  return NAV[role];
}

export function homeFor(role: Role): string {
  return NAV[role][0].href;
}

export function userFor(role: Role): DemoUser {
  const user = DEMO_USERS.find((u) => u.role === role);
  if (!user) throw new Error(`Unknown role ${role}`);
  return user;
}
