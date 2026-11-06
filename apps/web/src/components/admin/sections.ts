// Cấu hình CRUD từng mục quản trị: cột bảng + trường form. Giá trị id được đổi sang tên qua `AdminOptions`.
import type { AdminEntity, AdminOptions, Row } from "@/api/admin";

export type FieldType = "text" | "password" | "number" | "date" | "checkbox" | "select";
export interface Opt {
  value: string;
  label: string;
}

export interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Chỉ có khi thêm mới (vd. mật khẩu ban đầu, tên đăng nhập). */
  createOnly?: boolean;
  /** Ô chọn: danh sách lựa chọn; `null` = cho phép để trống ("— Không —"). */
  options?: (o: AdminOptions) => Opt[];
  nullable?: boolean;
  /** Ô chọn mà giá trị là số (id). */
  numeric?: boolean;
}

export interface ColumnSpec {
  label: string;
  value: (r: Row, o: AdminOptions) => string;
}

export interface SectionSpec {
  entity: AdminEntity;
  /** Có cột active để khoá / mở (xoá mềm). */
  soft: boolean;
  columns: ColumnSpec[];
  fields: FieldSpec[];
  /** Người dùng: thêm nút đặt lại mật khẩu. */
  password?: boolean;
}

export const ROLE_LABEL: Record<string, string> = {
  citizen: "Người dân", kp: "Trưởng khu phố", canbo: "Cán bộ", truongphong: "Trưởng phòng",
  dieuphoi: "Điều phối viên", phochutich: "Phó Chủ tịch", chutich: "Chủ tịch", admin: "Quản trị",
};

const nameIn = (list: { id: number; name: string }[], id: unknown, empty = "—") => list.find((x) => x.id === id)?.name ?? empty;
const str = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));
const yes = (v: unknown) => (v ? "Có" : "");
const units = (o: AdminOptions) => o.units.map((u) => ({ value: String(u.id), label: u.name }));
const wards = (o: AdminOptions) => o.wards.filter((w) => w.active).map((w) => ({ value: String(w.id), label: w.name }));
const topics = (o: AdminOptions) => o.topics.filter((t) => t.active).map((t) => ({ value: String(t.id), label: t.name }));
const staff = (roles: string[]) => (o: AdminOptions) =>
  o.users.filter((u) => u.active && roles.includes(u.role)).map((u) => ({ value: String(u.id), label: u.name }));

export const SECTIONS: Record<"users" | "assign" | "delegate" | "topics" | "wards", SectionSpec> = {
  users: {
    entity: "users", soft: true, password: true,
    columns: [
      { label: "Tên đăng nhập", value: (r) => str(r["username"]) },
      { label: "Họ tên", value: (r) => str(r["name"]) },
      { label: "Chức danh", value: (r) => str(r["title"]) },
      { label: "Vai trò", value: (r, o) => nameIn(o.roles, r["roleId"]) },
      { label: "Đơn vị", value: (r, o) => nameIn(o.units, r["unitId"]) },
      { label: "Khu phố", value: (r, o) => nameIn(o.wards, r["wardId"]) },
      { label: "SĐT", value: (r) => str(r["phone"]) },
    ],
    fields: [
      { key: "username", label: "Tên đăng nhập", type: "text", required: true },
      { key: "password", label: "Mật khẩu ban đầu", type: "password", required: true, createOnly: true },
      { key: "name", label: "Họ tên", type: "text", required: true },
      { key: "title", label: "Chức danh", type: "text", required: true },
      { key: "roleId", label: "Vai trò", type: "select", required: true, numeric: true, options: (o) => o.roles.map((r) => ({ value: String(r.id), label: r.name })) },
      { key: "unitId", label: "Đơn vị", type: "select", nullable: true, numeric: true, options: units },
      { key: "wardId", label: "Khu phố (trưởng KP)", type: "select", nullable: true, numeric: true, options: wards },
      { key: "phone", label: "Số điện thoại", type: "text" },
    ],
  },
  topics: {
    entity: "topics", soft: true,
    columns: [
      { label: "Chuyên đề", value: (r) => str(r["name"]) },
      { label: "Đơn vị chủ trì", value: (r, o) => nameIn(o.units, r["defaultUnitId"], "Hàng chờ điều phối") },
      { label: "Hạn (ngày LV)", value: (r) => str(r["slaDays"]) },
      { label: "Khẩn", value: (r) => yes(r["urgent"]) },
      { label: "Luồng kín", value: (r) => yes(r["sensitive"]) },
      { label: "Cờ", value: (r) => str(r["flag"]) },
    ],
    fields: [
      { key: "name", label: "Tên chuyên đề", type: "text", required: true },
      { key: "defaultUnitId", label: "Đơn vị chủ trì (trống = hàng chờ điều phối)", type: "select", nullable: true, numeric: true, options: units },
      { key: "slaDays", label: "Hạn xử lý (ngày làm việc)", type: "number", required: true },
      { key: "urgent", label: "Khẩn (hạn 1 ngày)", type: "checkbox" },
      { key: "sensitive", label: "Luồng kín (chỉ Chủ tịch)", type: "checkbox" },
      { key: "flag", label: "Cờ ghi chú", type: "text" },
    ],
  },
  wards: {
    entity: "wards", soft: true,
    columns: [
      { label: "Khu phố", value: (r) => str(r["name"]) },
      { label: "Trưởng khu phố", value: (r, o) => o.users.find((u) => u.role === "kp" && u.wardId === r["id"] && u.active)?.name ?? "Chưa phân công" },
    ],
    fields: [{ key: "name", label: "Tên khu phố", type: "text", required: true }],
  },
  assign: {
    entity: "assignments", soft: true,
    columns: [
      { label: "Cán bộ", value: (r, o) => nameIn(o.users, r["userId"]) },
      { label: "Đơn vị", value: (r, o) => nameIn(o.units, r["unitId"]) },
      { label: "Chuyên đề", value: (r, o) => nameIn(o.topics, r["topicId"]) },
      { label: "Địa bàn", value: (r, o) => nameIn(o.wards, r["wardId"], "Toàn phường") },
      { label: "Từ ngày", value: (r) => str(r["fromDate"]) },
      { label: "Đến ngày", value: (r) => str(r["toDate"]) },
    ],
    fields: [
      { key: "userId", label: "Cán bộ", type: "select", required: true, numeric: true, options: staff(["canbo"]) },
      { key: "unitId", label: "Đơn vị", type: "select", required: true, numeric: true, options: units },
      { key: "topicId", label: "Chuyên đề", type: "select", required: true, numeric: true, options: topics },
      { key: "wardId", label: "Địa bàn (trống = toàn phường)", type: "select", nullable: true, numeric: true, options: wards },
      { key: "fromDate", label: "Từ ngày", type: "date", required: true },
      { key: "toDate", label: "Đến ngày (trống = không thời hạn)", type: "date" },
    ],
  },
  delegate: {
    entity: "delegations", soft: true,
    columns: [
      { label: "Người ủy quyền", value: (r, o) => nameIn(o.users, r["fromUserId"]) },
      { label: "Người nhận", value: (r, o) => nameIn(o.users, r["toUserId"]) },
      { label: "Bắt đầu", value: (r) => str(r["startDate"]) },
      { label: "Kết thúc", value: (r) => str(r["endDate"]) },
      { label: "Ghi chú", value: (r) => str(r["note"]) },
    ],
    fields: [
      { key: "fromUserId", label: "Người ủy quyền", type: "select", required: true, numeric: true, options: staff(["canbo", "truongphong", "dieuphoi", "phochutich", "chutich"]) },
      { key: "toUserId", label: "Người nhận", type: "select", required: true, numeric: true, options: staff(["canbo", "truongphong", "dieuphoi", "phochutich", "chutich"]) },
      { key: "startDate", label: "Bắt đầu", type: "date", required: true },
      { key: "endDate", label: "Kết thúc", type: "date", required: true },
      { key: "note", label: "Ghi chú", type: "text" },
    ],
  },
};
