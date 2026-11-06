// Seed dữ liệu dev từ src/seed/data. Xóa sạch rồi nạp lại. Chặn chạy ở production.
import bcrypt from "bcryptjs";
import "../shared/env.js";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as s from "../shared/persistence/schema.js";
import { DEMO_USERS } from "../modules/cases/domain/roles.js";
import { checkRole, DEFAULT_ROLES } from "../modules/rbac/domain/permissions.js";
import { DELEGATIONS, HOLIDAY_LIST, TOPICS, WARDS } from "./data/admin.js";
import { MOCK_CASES } from "./data/cases.js";

if (process.env.NODE_ENV === "production") throw new Error("Không seed ở production");
const password = process.env.SEED_PASSWORD;
if (!password) throw new Error("Thiếu SEED_PASSWORD trong apps/api/.env");

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle(client, { schema: s, casing: "snake_case" });

const UNITS: { name: string; kind: (typeof s.unitKind.enumValues)[number] }[] = [
  { name: "Phòng KT-HT-ĐT", kind: "phong" }, { name: "Phòng VH-XH", kind: "phong" },
  { name: "Công an phường", kind: "lien_thong" }, { name: "Văn phòng HĐND-UBND", kind: "van_phong" },
  { name: "Chủ tịch phường", kind: "lanh_dao" }, { name: "Ngoài phường", kind: "ngoai" },
];
const EXTRA_STAFF = [
  { name: "Nguyễn Hữu Phúc", unit: "Phòng KT-HT-ĐT", topics: ["Đô thị – Xây dựng"] },
  { name: "Mai Anh Tuấn", unit: "Phòng VH-XH", topics: ["Văn hóa – Xã hội"] },
  { name: "Võ Hải", unit: "Công an phường", topics: ["An ninh – Trật tự"] },
];
/** Vai trò tùy biến mẫu cho demo (admin tạo thêm trên nền loại gốc) + tài khoản gán sẵn. */
const DEMO_ROLES: { name: string; kind: "canbo" | "truongphong" | "phochutich"; scope: "unit" | "all"; perms: string[];
  user: { username: string; name: string; title: string; unit: string | null } }[] = [
  { name: "Phó trưởng phòng", kind: "truongphong", scope: "unit",
    perms: ["giao_can_bo", "giao_lai", "duyet_ket_qua", "tra_lai", "xem_danh_tinh"],
    user: { username: "photruongphong", name: "Lê Thị Thu", title: "Phó trưởng phòng KT-HT-ĐT", unit: "Phòng KT-HT-ĐT" } },
  { name: "Cán bộ tổng hợp phòng", kind: "canbo", scope: "unit",
    perms: ["nhan_viec", "gui_ket_qua", "hoi_bo_sung", "xin_gia_han", "de_nghi_chuyen", "xem_danh_tinh"],
    user: { username: "tonghop", name: "Đặng Minh Khoa", title: "Cán bộ tổng hợp Phòng KT-HT-ĐT", unit: "Phòng KT-HT-ĐT" } },
  { name: "Giám sát (chỉ xem)", kind: "phochutich", scope: "all", perms: [],
    user: { username: "giamsat", name: "Trịnh Văn Bình", title: "Thanh tra phường", unit: null } },
];
/** Tên đăng nhập dev = vai trò (canbo, dieuphoi...); cán bộ phụ: canbo2, canbo3... */
const username = (role: string, extra: number) => (extra ? `${role}${extra + 1}` : role);

async function main() {
  await db.execute(sql`TRUNCATE holidays, delegations, assignments, access_log, case_events, kp_notes, attachments, case_steps, case_senders, cases,
    user_block_units, user_topics, role_audit, users, role_permissions, roles, topics, wards, units RESTART IDENTITY CASCADE`);
  const roleRows = await db.insert(s.roles).values(Object.entries(DEFAULT_ROLES).map(([kind, r]) => ({
    name: r.name, kind: kind as keyof typeof DEFAULT_ROLES, scope: r.scope, system: true,
  }))).returning();
  await db.insert(s.rolePermissions).values(roleRows.flatMap((r) => DEFAULT_ROLES[r.kind].perms.map((perm) => ({ roleId: r.id, perm }))));
  const roleId = (kind: string) => roleRows.find((r) => r.kind === kind)!.id;
  const unitRows = await db.insert(s.units).values(UNITS).returning();
  const unitId = (n: string) => unitRows.find((u) => u.name === n)?.id ?? null;
  const wardRows = await db.insert(s.wards).values(WARDS.map((w) => ({ name: w.name }))).returning();
  const wardId = (n: string) => wardRows.find((w) => w.name === n)!.id;
  const topicRows = await db.insert(s.topics).values(TOPICS.map((t) => ({
    name: t.name, defaultUnitId: unitId(t.unit), flag: t.flag ?? null,
    sensitive: t.name === "Phản ánh về cán bộ", urgent: t.name === "An ninh – Trật tự",
  }))).returning();
  const topicId = (n: string) => topicRows.find((t) => t.name === n)!.id;

  const hash = await bcrypt.hash(password!, 10);
  const people = [
    ...DEMO_USERS.map((u) => ({ ...u, staffUnit: u.unit, extra: 0 })),
    ...EXTRA_STAFF.map((u, i) => ({ ...u, extra: i + 1, role: "canbo" as const, title: `Cán bộ ${u.unit}`, staffUnit: u.unit, ward: undefined, units: undefined })),
  ];
  for (const p of people) {
    const [row] = await db.insert(s.users).values({
      username: username(p.role, p.extra), passwordHash: hash, name: p.name, title: p.title,
      phone: MOCK_CASES.find((c) => c.sender === p.name)?.phone ?? null,
      role: p.role, roleId: roleId(p.role), unitId: p.staffUnit ? unitId(p.staffUnit) : null, wardId: p.ward ? wardId(p.ward) : null,
    }).returning();
    if (!row) throw new Error(`Không tạo được ${p.name}`);
    // Phân công toàn phường từ đầu năm cho mỗi chuyên đề của cán bộ.
    for (const t of p.topics ?? []) {
      await db.insert(s.assignments).values({ userId: row.id, unitId: unitId(p.staffUnit!)!, topicId: topicId(t), fromDate: "2026-01-01" });
    }
    for (const u of p.units ?? []) await db.insert(s.userBlockUnits).values({ userId: row.id, unitId: unitId(u)! });
  }
  for (const d of DEMO_ROLES) {
    const bad = checkRole(d.kind, d.scope, d.perms);
    if (bad) throw new Error(`Vai trò mẫu "${d.name}" sai: ${bad}`);
    const [r] = await db.insert(s.roles).values({ name: d.name, kind: d.kind, scope: d.scope, system: false }).returning();
    if (d.perms.length) await db.insert(s.rolePermissions).values(d.perms.map((perm) => ({ roleId: r!.id, perm })));
    await db.insert(s.users).values({ username: d.user.username, passwordHash: hash, name: d.user.name, title: d.user.title,
      role: d.kind, roleId: r!.id, unitId: d.user.unit ? unitId(d.user.unit) : null, wardId: null });
  }
  const userRows = await db.select().from(s.users);
  const userId = (n: string) => userRows.find((u) => u.name === n)?.id ?? null;
  const kpId = userId("Đỗ Thị Lan")!;
  await db.insert(s.holidays).values(HOLIDAY_LIST);
  await db.insert(s.delegations).values(DELEGATIONS.map((d) => ({ fromUserId: userId(d.from)!, toUserId: userId(d.to)!, startDate: d.start, endDate: d.end })));

  for (const c of MOCK_CASES) {
    const submitted = new Date(`${c.submittedAt}T08:12:00+07:00`);
    const received = c.receivedMinutesAgo !== undefined ? new Date(Date.now() - c.receivedMinutesAgo * 60_000)
      : c.handler !== "—" && c.status !== "da_giao" ? new Date(`${c.submittedAt}T14:05:00+07:00`) : null;
    const [row] = await db.insert(s.cases).values({
      code: c.code, title: c.title, content: c.content, topicId: topicId(c.topic), wardId: wardId(c.ward), address: c.address,
      coords: c.coords, channel: c.channel, urgent: c.urgent, sensitive: c.sensitive, status: c.status,
      unitId: c.unit === "—" ? null : unitId(c.unit), handlerId: c.handler === "—" ? null : userId(c.handler),
      submittedAt: submitted, dueAt: c.dueAt, receivedAt: received, reopened: c.reopened, extensionRound: c.extensionRound ?? null,
      resumeStatus: c.status === "de_nghi_gia_han" ? "dang_xu_ly" : null,
      closedOnTime: c.closedOnTime ?? null, result: c.result ?? null, rating: c.rating ?? null,
    }).returning();
    if (!row) throw new Error(`Không tạo được ${c.code}`);
    await db.insert(s.caseSenders).values({
      caseId: row.id, name: c.sender, phone: c.phone, userId: userId(c.sender), consentShowKp: c.consentShowKp,
      enteredById: c.channel === "Gửi hộ" ? kpId : null,
    });
    await db.insert(s.caseSteps).values(c.steps.map((st, i) => ({
      caseId: row.id, ord: i, name: st.name, required: st.required, done: st.done, skippedReason: st.skippedReason ?? null,
    })));
    const photos = [...Array(c.photosBefore).fill("truoc"), ...Array(c.photosAfter).fill("sau")] as ("truoc" | "sau")[];
    if (photos.length) await db.insert(s.attachments).values(photos.map((k, i) => ({ caseId: row.id, kind: k, url: `/placeholder/${k}-${i + 1}.jpg` })));
    if (c.kpNote) await db.insert(s.kpNotes).values({ caseId: row.id, text: c.kpNote.text, shared: c.kpNote.shared, authorId: kpId });
    await db.insert(s.caseEvents).values(c.history.map((h) => ({
      caseId: row.id, at: new Date(`${h.at.replace(" ", "T")}:00+07:00`), actorId: userId(h.actor), actorName: h.actor,
      action: h.action, reason: h.reason ?? null,
    })));
  }
  console.log(`Seed xong: ${userRows.length} tài khoản, ${MOCK_CASES.length} phản ánh.`);
  console.table(userRows.map((u) => ({ username: u.username, role: u.role, name: u.name })));
}

main().finally(() => client.end());
