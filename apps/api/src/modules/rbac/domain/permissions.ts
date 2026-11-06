// Phân quyền RBAC: danh mục quyền (mỗi thao tác một quyền), phạm vi xem, quyền mặc định của 8 vai trò gốc
// và luật chốt an toàn. Quyết định: .docs/business/questions.md "Phân quyền RBAC (2026-11-06)".
import type { Role } from "../../cases/domain/roles.js";

export type Scope = "own" | "ward" | "assigned" | "unit" | "all" | "none";

export const SCOPE_LABEL: Record<Scope, string> = {
  own: "Phản ánh của chính mình",
  ward: "Trong khu phố phụ trách",
  assigned: "Theo phân công (phòng + chuyên đề + địa bàn)",
  unit: "Toàn bộ phòng",
  all: "Toàn phường",
  none: "Không xem phản ánh",
};

/** Phạm vi hợp lệ theo loại vai trò (loại quyết định giao diện và hồ sơ: đơn vị, khu phố). */
export const SCOPES_FOR_KIND: Record<Role, Scope[]> = {
  citizen: ["own"],
  kp: ["ward", "all"],
  canbo: ["assigned", "unit", "all"],
  truongphong: ["unit", "all"],
  dieuphoi: ["all"],
  phochutich: ["all"],
  chutich: ["all"],
  admin: ["none"],
};

export interface PermissionDef {
  id: string;
  label: string;
  group: string;
}

const P = (group: string, list: [string, string][]): PermissionDef[] => list.map(([id, label]) => ({ id, label, group }));

export const PERMISSIONS: PermissionDef[] = [
  ...P("Người dân", [
    ["gui_phan_anh", "Gửi phản ánh"], ["sua_noi_dung", "Sửa phản ánh (khi chưa có cán bộ nhận)"], ["rut", "Rút phản ánh"],
    ["bo_sung", "Gửi thông tin bổ sung"], ["danh_gia", "Hài lòng, đóng phản ánh"], ["mo_lai", "Không hài lòng / mở lại"],
  ]),
  ...P("Khu phố", [["ghi_chu", "Ghi chú xác minh"]]),
  ...P("Điều phối", [
    ["giao_phong", "Giao phòng"], ["chuyen_co_quan", "Chuyển cơ quan khác"], ["chuyen_khieu_nai", "Chuyển khiếu nại, tố cáo"],
    ["gop_trung", "Gộp trùng"], ["khong_xu_ly", "Không xử lý"], ["chap_nhan_chuyen", "Chấp nhận đề nghị chuyển"],
    ["tu_choi_chuyen", "Từ chối đề nghị chuyển"],
  ]),
  ...P("Trưởng phòng", [
    ["giao_can_bo", "Giao cán bộ"], ["giao_lai", "Giao lại cán bộ"], ["duyet_ket_qua", "Duyệt kết quả"], ["tra_lai", "Trả lại kết quả"],
    ["duyet_gia_han", "Duyệt gia hạn lần 1"], ["tu_choi_gia_han", "Từ chối gia hạn"],
  ]),
  ...P("Xử lý", [
    ["nhan_viec", "Nhận việc"], ["gui_ket_qua", "Làm bước, thêm ảnh, gửi kết quả"], ["hoi_bo_sung", "Hỏi người dân bổ sung"],
    ["xin_gia_han", "Xin gia hạn"], ["de_nghi_chuyen", "Đề nghị chuyển"],
  ]),
  ...P("Lãnh đạo", [
    ["duyet_gia_han_2", "Duyệt gia hạn lần 2 (khối phụ trách)"], ["duyet_gia_han_ct", "Duyệt gia hạn (mọi lần)"],
    ["xu_ly_luong_kin", "Tự xử lý phản ánh luồng kín"], ["duyet_luong_kin", "Duyệt kết quả luồng kín"],
  ]),
  ...P("Xem", [["xem_luong_kin", "Xem phản ánh luồng kín"], ["xem_danh_tinh", "Xem danh tính người gửi (không cần đồng ý)"]]),
  ...P("Quản trị", [
    ["admin.users", "Người dùng"], ["admin.roles", "Vai trò & phân quyền"], ["admin.topics", "Chuyên đề"], ["admin.wards", "Khu phố"],
    ["admin.assignments", "Phân công"], ["admin.delegations", "Ủy quyền"], ["admin.holidays", "Ngày nghỉ"], ["admin.log", "Nhật ký truy cập"],
  ]),
];

export const PERMISSION_IDS = new Set(PERMISSIONS.map((p) => p.id));
export const isAdminPerm = (id: string) => id.startsWith("admin.");

const HANDLER = ["nhan_viec", "gui_ket_qua", "hoi_bo_sung", "xin_gia_han", "de_nghi_chuyen"];
const ADMIN_ALL = PERMISSIONS.filter((p) => isAdminPerm(p.id)).map((p) => p.id);

/** Quyền + phạm vi mặc định của 8 vai trò gốc — đúng hành vi trước khi có RBAC. */
export const DEFAULT_ROLES: Record<Role, { name: string; scope: Scope; perms: string[] }> = {
  citizen: { name: "Người dân", scope: "own", perms: ["gui_phan_anh", "sua_noi_dung", "rut", "bo_sung", "danh_gia", "mo_lai", "xem_danh_tinh"] },
  kp: { name: "Trưởng khu phố", scope: "ward", perms: ["gui_phan_anh", "ghi_chu"] },
  canbo: { name: "Cán bộ", scope: "assigned", perms: [...HANDLER, "xem_danh_tinh"] },
  truongphong: { name: "Trưởng phòng", scope: "unit", perms: ["giao_can_bo", "giao_lai", "duyet_ket_qua", "tra_lai", "duyet_gia_han", "tu_choi_gia_han", "xem_danh_tinh"] },
  dieuphoi: { name: "Điều phối viên", scope: "all", perms: ["giao_phong", "chuyen_co_quan", "chuyen_khieu_nai", "gop_trung", "khong_xu_ly", "chap_nhan_chuyen", "tu_choi_chuyen", "xem_danh_tinh"] },
  phochutich: { name: "Phó Chủ tịch", scope: "all", perms: ["duyet_gia_han_2", "xem_danh_tinh"] },
  chutich: { name: "Chủ tịch", scope: "all", perms: ["xem_luong_kin", "xu_ly_luong_kin", "duyet_luong_kin", "duyet_gia_han_ct", ...HANDLER, "xem_danh_tinh"] },
  admin: { name: "Quản trị", scope: "none", perms: ADMIN_ALL },
};

/** Quyền vai trò admin luôn giữ (tránh tự khoá hệ thống). */
export const LOCKED_ADMIN_PERMS = ["admin.roles"];

/** Kiểm tra cấu hình một vai trò. Trả về lý do sai, hoặc undefined nếu hợp lệ. */
export function checkRole(kind: Role, scope: Scope, perms: string[]): string | undefined {
  const unknown = perms.find((p) => !PERMISSION_IDS.has(p));
  if (unknown) return `Quyền không tồn tại: ${unknown}`;
  if (!SCOPES_FOR_KIND[kind].includes(scope)) return `Phạm vi "${SCOPE_LABEL[scope]}" không dùng được cho loại vai trò này`;
  if (kind === "admin") {
    if (perms.some((p) => !isAdminPerm(p))) return "Vai trò quản trị không được nhận quyền nghiệp vụ phản ánh";
    const missing = LOCKED_ADMIN_PERMS.find((p) => !perms.includes(p));
    if (missing) return "Vai trò quản trị phải giữ quyền quản trị phân quyền";
  } else if (perms.some(isAdminPerm)) {
    return "Chỉ vai trò loại quản trị được nhận quyền quản trị";
  }
  return undefined;
}

/** Quyền bắt buộc để quy trình không bị kẹt — cảnh báo khi không vai trò nào (có người dùng đang hoạt động) giữ. */
export const REQUIRED_PERMS = [
  "gui_phan_anh", "giao_phong", "chap_nhan_chuyen", "giao_can_bo", "nhan_viec", "gui_ket_qua", "duyet_ket_qua",
  "duyet_gia_han", "danh_gia", "xem_luong_kin", "xu_ly_luong_kin", "duyet_luong_kin", "admin.roles",
];

/** Danh sách cảnh báo thiếu người cho quyền bắt buộc. `held` = quyền của các vai trò có người dùng đang hoạt động. */
export function missingRequired(held: Iterable<string>): string[] {
  const have = new Set(held);
  return REQUIRED_PERMS.filter((p) => !have.has(p)).map((p) => {
    const def = PERMISSIONS.find((x) => x.id === p)!;
    return `Không còn người dùng nào có quyền "${def.label}" (${def.group})`;
  });
}
