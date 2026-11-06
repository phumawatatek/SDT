// Mô hình dữ liệu — SYSTEM_SPEC §8 (rút gọn cho Giai đoạn 1).
// Danh tính người gửi tách bảng case_senders; nhật ký xử lý và nhật ký truy cập chỉ ghi thêm.
import {
  boolean, date, integer, pgEnum, pgTable, primaryKey, serial, smallint, text, timestamp, uniqueIndex,
} from "drizzle-orm/pg-core";

export const caseStatus = pgEnum("case_status", [
  "moi_tiep_nhan", "cho_dieu_phoi", "da_giao", "dang_xu_ly", "cho_bo_sung", "de_nghi_chuyen", "de_nghi_gia_han",
  "cho_duyet_ket_qua", "da_giai_quyet", "mo_lai", "chuyen_co_quan_khac", "khong_xu_ly",
  "da_rut", "chuyen_khieu_nai", "da_dong",
]);
export const userRole = pgEnum("user_role", ["citizen", "kp", "canbo", "truongphong", "dieuphoi", "phochutich", "chutich", "admin"]);
export const roleScope = pgEnum("role_scope", ["own", "ward", "assigned", "unit", "all", "none"]);
export const unitKind = pgEnum("unit_kind", ["phong", "van_phong", "lien_thong", "ngoai", "lanh_dao"]);
export const channel = pgEnum("case_channel", ["Zalo", "Web", "Gửi hộ"]);
export const attachmentKind = pgEnum("attachment_kind", ["truoc", "sau", "bo_sung"]);
export const rating = pgEnum("case_rating", ["hai_long", "khong_hai_long"]);

export const units = pgTable("units", {
  id: serial().primaryKey(),
  name: text().notNull().unique(),
  kind: unitKind().notNull(),
});

export const wards = pgTable("wards", {
  id: serial().primaryKey(),
  name: text().notNull().unique(),
  active: boolean().notNull().default(true),
});

export const topics = pgTable("topics", {
  id: serial().primaryKey(),
  name: text().notNull().unique(),
  /** null = vào hàng chờ điều phối. */
  defaultUnitId: integer().references(() => units.id),
  sensitive: boolean().notNull().default(false),
  urgent: boolean().notNull().default(false),
  flag: text(),
  slaDays: smallint().notNull().default(10),
  active: boolean().notNull().default(true),
});

/** Vai trò (RBAC): `kind` = loại gốc quyết định giao diện + hồ sơ; quyền và phạm vi do quản trị cấu hình. */
export const roles = pgTable("roles", {
  id: serial().primaryKey(),
  name: text().notNull().unique(),
  kind: userRole().notNull(),
  scope: roleScope().notNull(),
  /** 8 vai trò gốc: không xoá, không đổi loại. */
  system: boolean().notNull().default(false),
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: integer().notNull().references(() => roles.id, { onDelete: "cascade" }),
  perm: text().notNull(),
}, (t) => [primaryKey({ columns: [t.roleId, t.perm] })]);

export const users = pgTable("users", {
  id: serial().primaryKey(),
  username: text().notNull().unique(),
  passwordHash: text().notNull(),
  name: text().notNull(),
  title: text().notNull(),
  phone: text(),
  /** Loại vai trò (= roles.kind), giữ để lọc nhanh; luôn đồng bộ với role_id. */
  role: userRole().notNull(),
  roleId: integer().notNull().references(() => roles.id),
  unitId: integer().references(() => units.id),
  wardId: integer().references(() => wards.id),
  active: boolean().notNull().default(true),
});

/** Phân công: cán bộ × đơn vị × chuyên đề × địa bàn (null = toàn phường), có thời hạn. Cho phép kiêm nhiệm nhiều dòng. */
export const assignments = pgTable("assignments", {
  id: serial().primaryKey(),
  userId: integer().notNull().references(() => users.id),
  unitId: integer().notNull().references(() => units.id),
  topicId: integer().notNull().references(() => topics.id),
  wardId: integer().references(() => wards.id),
  fromDate: date({ mode: "string" }).notNull(),
  toDate: date({ mode: "string" }),
  active: boolean().notNull().default(true),
});

/** Ủy quyền: người nhận thao tác thay người ủy quyền trong khoảng ngày. */
export const delegations = pgTable("delegations", {
  id: serial().primaryKey(),
  fromUserId: integer().notNull().references(() => users.id),
  toUserId: integer().notNull().references(() => users.id),
  startDate: date({ mode: "string" }).notNull(),
  endDate: date({ mode: "string" }).notNull(),
  note: text(),
  active: boolean().notNull().default(true),
});

/** Ngày nghỉ lễ — không tính vào hạn xử lý. */
export const holidays = pgTable("holidays", {
  date: date({ mode: "string" }).primaryKey(),
  name: text().notNull(),
});

/** (Cũ) Chuyên đề cán bộ — thay bằng `assignments`; giữ bảng để không mất dữ liệu, không còn đọc. */
export const userTopics = pgTable("user_topics", {
  userId: integer().notNull().references(() => users.id),
  topicId: integer().notNull().references(() => topics.id),
}, (t) => [primaryKey({ columns: [t.userId, t.topicId] })]);

/** Khối đơn vị Phó Chủ tịch phụ trách. */
export const userBlockUnits = pgTable("user_block_units", {
  userId: integer().notNull().references(() => users.id),
  unitId: integer().notNull().references(() => units.id),
}, (t) => [primaryKey({ columns: [t.userId, t.unitId] })]);

export const cases = pgTable("cases", {
  id: serial().primaryKey(),
  code: text().notNull(),
  title: text().notNull(),
  content: text().notNull(),
  topicId: integer().notNull().references(() => topics.id),
  wardId: integer().notNull().references(() => wards.id),
  address: text().notNull(),
  coords: text().notNull().default(""),
  channel: channel().notNull(),
  urgent: boolean().notNull().default(false),
  sensitive: boolean().notNull().default(false),
  status: caseStatus().notNull(),
  unitId: integer().references(() => units.id),
  handlerId: integer().references(() => users.id),
  submittedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  dueAt: date({ mode: "string" }).notNull(),
  /** Lúc cán bộ nhận việc — mốc cửa sổ đề nghị chuyển 60 phút. */
  receivedAt: timestamp({ withTimezone: true }),
  reopened: boolean().notNull().default(false),
  extensionRound: smallint(),
  /** Trạng thái trước khi đề nghị chuyển/gia hạn — để trả về khi bị từ chối. */
  resumeStatus: caseStatus(),
  closedOnTime: boolean(),
  result: text(),
  rating: rating(),
  mergedIntoId: integer(),
}, (t) => [uniqueIndex("cases_code_idx").on(t.code)]);

/** Danh tính người gửi — bảng tách, chỉ đọc qua lớp kiểm quyền (canSeeIdentity). */
export const caseSenders = pgTable("case_senders", {
  caseId: integer().primaryKey().references(() => cases.id),
  name: text().notNull(),
  phone: text().notNull(),
  userId: integer().references(() => users.id),
  enteredById: integer().references(() => users.id),
  consentShowKp: boolean().notNull().default(false),
});

export const caseSteps = pgTable("case_steps", {
  id: serial().primaryKey(),
  caseId: integer().notNull().references(() => cases.id),
  ord: smallint().notNull(),
  name: text().notNull(),
  required: boolean().notNull(),
  done: boolean().notNull().default(false),
  skippedReason: text(),
});

export const attachments = pgTable("attachments", {
  id: serial().primaryKey(),
  caseId: integer().notNull().references(() => cases.id),
  kind: attachmentKind().notNull(),
  url: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const kpNotes = pgTable("kp_notes", {
  caseId: integer().primaryKey().references(() => cases.id),
  text: text().notNull(),
  shared: boolean().notNull().default(false),
  authorId: integer().notNull().references(() => users.id),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** NhatKyXuLy — chỉ ghi thêm. */
export const caseEvents = pgTable("case_events", {
  id: serial().primaryKey(),
  caseId: integer().notNull().references(() => cases.id),
  at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  actorId: integer().references(() => users.id),
  actorName: text().notNull(),
  action: text().notNull(),
  fromStatus: caseStatus(),
  toStatus: caseStatus(),
  reason: text(),
});

/** NhatKyTruyCap — Luật 91/2025; chỉ ghi thêm. */
export const accessLog = pgTable("access_log", {
  id: serial().primaryKey(),
  userId: integer().notNull().references(() => users.id),
  caseCode: text().notNull(),
  action: text().notNull(),
  at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** Nhật ký đổi phân quyền — chỉ ghi thêm. */
export const roleAudit = pgTable("role_audit", {
  id: serial().primaryKey(),
  at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  actorId: integer().notNull().references(() => users.id),
  roleName: text().notNull(),
  change: text().notNull(),
});
