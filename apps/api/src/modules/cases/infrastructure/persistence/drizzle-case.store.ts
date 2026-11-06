import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq, gt, inArray, max, sql } from "drizzle-orm";
import { DB, type Db } from "../../../../shared/persistence/db.js";
import {
  accessLog, attachments, caseEvents, cases, caseSenders, caseSteps, holidays, kpNotes, topics, units, users, wards,
} from "../../../../shared/persistence/schema.js";
import type { CaseStore, ContentPatch, NewCase, StepOp, StoredCase, TopicInfo } from "../../application/case-store.port.js";
import type { AppUser } from "../../domain/user.js";
import type { CasePatch } from "../../domain/workflow.js";
import { loadCases, scopeWhere } from "./case-query.js";

const STEPS = [
  { name: "Kiểm tra hiện trường", required: true },
  { name: "Liên hệ người dân", required: false },
  { name: "Phối hợp đơn vị liên quan", required: false },
  { name: "Kiểm tra lại / kết luận", required: true },
];
const STEP_LABEL: Record<StepOp, string> = { done: "Xong bước", skip: "Bỏ qua bước", undo: "Hoàn tác bước" };

/** Cài đặt CaseStore bằng Drizzle + Postgres. */
@Injectable()
export class DrizzleCaseStore implements CaseStore {
  constructor(@Inject(DB) private readonly db: Db) {}

  async listScoped(u: AppUser) {
    const where = scopeWhere(u);
    return where === false ? [] : loadCases(this.db, where);
  }

  async findByCode(code: string) {
    const [c] = await loadCases(this.db, eq(cases.code, code));
    return c;
  }

  findByCodes(codes: string[]) {
    return loadCases(this.db, inArray(cases.code, codes));
  }

  private async idOf(table: typeof units | typeof users, name: string): Promise<number | null> {
    const [r] = await this.db.select({ id: table.id }).from(table).where(eq(table.name, name)).limit(1);
    return r?.id ?? null;
  }

  async unitExists(name: string) {
    return (await this.idOf(units, name)) !== null;
  }

  async isStaffOf(name: string, unit: string) {
    const [h] = await this.db.select({ role: users.role, unit: units.name }).from(users).leftJoin(units, eq(units.id, users.unitId))
      .where(and(eq(users.name, name), eq(users.active, true))).limit(1);
    return !!h && h.role === "canbo" && h.unit === unit;
  }

  async applyPatch(c: StoredCase, p: CasePatch, actor: AppUser, event: string, reason?: string) {
    const set: Partial<typeof cases.$inferInsert> = {};
    if (p.status) set.status = p.status;
    if (p.unit !== undefined) set.unitId = p.unit === null ? null : await this.idOf(units, p.unit);
    if (p.handler !== undefined) set.handlerId = p.handler === null ? null : await this.idOf(users, p.handler);
    if (p.received) set.receivedAt = new Date();
    if (p.reopened !== undefined) set.reopened = p.reopened;
    if (p.extensionRound !== undefined) set.extensionRound = p.extensionRound;
    if (p.resumeStatus !== undefined) set.resumeStatus = p.resumeStatus;
    if (p.dueAt) set.dueAt = p.dueAt;
    if (p.closedOnTime !== undefined) set.closedOnTime = p.closedOnTime;
    if (p.rating) set.rating = p.rating;
    return this.db.transaction(async (tx) => {
      // Khoá lạc quan: chỉ cập nhật nếu trạng thái chưa bị người khác đổi.
      const updated = await tx.update(cases).set(set).where(and(eq(cases.id, c.id), eq(cases.status, c.status))).returning({ id: cases.id });
      if (updated.length === 0) return false;
      if (p.addReworkStep) {
        const [m] = await tx.select({ ord: max(caseSteps.ord) }).from(caseSteps).where(eq(caseSteps.caseId, c.id));
        await tx.insert(caseSteps).values({ caseId: c.id, ord: (m?.ord ?? 0) + 1, name: "Xử lý lại", required: true });
      }
      await tx.insert(caseEvents).values({
        caseId: c.id, actorId: actor.id, actorName: actor.name, action: event, fromStatus: c.status, toStatus: p.status ?? c.status, reason,
      });
      return true;
    });
  }

  async updateContent(c: StoredCase, p: ContentPatch, actor: AppUser) {
    return this.db.transaction(async (tx) => {
      const updated = await tx.update(cases).set({ wardId: p.wardId, address: p.address, title: p.description.slice(0, 80), content: p.description })
        .where(and(eq(cases.id, c.id), eq(cases.status, c.status))).returning({ id: cases.id });
      if (updated.length === 0) return false;
      await tx.insert(caseEvents).values({ caseId: c.id, actorId: actor.id, actorName: actor.name, action: "Người dân sửa nội dung phản ánh", fromStatus: c.status, toStatus: c.status });
      return true;
    });
  }

  async saveNote(c: StoredCase, u: AppUser, text: string, shared: boolean) {
    await this.db.transaction(async (tx) => {
      await tx.insert(kpNotes).values({ caseId: c.id, text, shared, authorId: u.id })
        .onConflictDoUpdate({ target: kpNotes.caseId, set: { text, shared, authorId: u.id, updatedAt: new Date() } });
      await tx.insert(caseEvents).values({ caseId: c.id, actorId: u.id, actorName: u.name, action: "Ghi chú xác minh của trưởng khu phố" });
    });
  }

  async updateStep(c: StoredCase, u: AppUser, index: number, op: StepOp, reason?: string) {
    const set = op === "done" ? { done: true, skippedReason: null } : op === "skip" ? { done: false, skippedReason: reason ?? "" } : { done: false, skippedReason: null };
    await this.db.transaction(async (tx) => {
      await tx.update(caseSteps).set(set).where(and(eq(caseSteps.caseId, c.id), eq(caseSteps.ord, index)));
      await tx.insert(caseEvents).values({
        caseId: c.id, actorId: u.id, actorName: u.name, action: `${STEP_LABEL[op]}: ${c.steps[index]?.name ?? ""}`, reason: reason ?? null,
      });
    });
  }

  async addPhoto(c: StoredCase, kind: "sau") {
    await this.db.insert(attachments).values({ caseId: c.id, kind, url: `/placeholder/${kind}-${Date.now()}.jpg` });
  }

  async logAccess(userId: number, code: string, action: string, dedupeMs: number) {
    const since = new Date(Date.now() - dedupeMs);
    const dup = await this.db.select({ id: accessLog.id }).from(accessLog)
      .where(and(eq(accessLog.userId, userId), eq(accessLog.caseCode, code), eq(accessLog.action, action), gt(accessLog.at, since))).limit(1);
    if (dup.length === 0) await this.db.insert(accessLog).values({ userId, caseCode: code, action });
  }

  /** Danh mục giao việc: ai có quyền giao phòng thì có danh sách phòng; giao cán bộ thì có cán bộ phòng mình. */
  async directory(u: AppUser) {
    const out: { units: string[]; staffByUnit: Record<string, string[]> } = { units: [], staffByUnit: {} };
    if (u.perms.includes("giao_phong") || u.perms.includes("chap_nhan_chuyen")) {
      const rows = await this.db.select({ name: units.name }).from(units).where(inArray(units.kind, ["phong", "lien_thong", "van_phong"]));
      out.units = rows.map((r) => r.name);
    }
    if ((u.perms.includes("giao_can_bo") || u.perms.includes("giao_lai")) && u.unit) {
      const rows = await this.db.select({ name: users.name }).from(users).innerJoin(units, eq(units.id, users.unitId))
        .where(and(eq(units.name, u.unit), eq(users.role, "canbo"), eq(users.active, true)));
      out.staffByUnit = { [u.unit]: rows.map((r) => r.name) };
    }
    return out;
  }

  async topicByName(name: string): Promise<TopicInfo | undefined> {
    const [t] = await this.db.select().from(topics).where(and(eq(topics.name, name), eq(topics.active, true))).limit(1);
    return t;
  }

  async wardIdByName(name: string) {
    const [w] = await this.db.select({ id: wards.id }).from(wards).where(and(eq(wards.name, name), eq(wards.active, true))).limit(1);
    return w?.id;
  }

  async userIdByRole(role: "chutich") {
    const [u] = await this.db.select({ id: users.id }).from(users).where(and(eq(users.role, role), eq(users.active, true))).limit(1);
    return u?.id ?? null;
  }

  async phoneOf(userId: number) {
    const [u] = await this.db.select({ phone: users.phone }).from(users).where(eq(users.id, userId));
    return u?.phone ?? null;
  }

  async holidays() {
    return (await this.db.select({ date: holidays.date }).from(holidays).orderBy(asc(holidays.date))).map((h) => h.date);
  }

  async catalog() {
    const [t, w, h] = await Promise.all([
      this.db.select({ name: topics.name, urgent: topics.urgent }).from(topics).where(eq(topics.active, true)).orderBy(asc(topics.id)),
      this.db.select({ name: wards.name }).from(wards).where(eq(wards.active, true)).orderBy(asc(wards.id)),
      this.holidays(),
    ]);
    return { topics: t, wards: w.map((x) => x.name), holidays: h };
  }

  /** Mã tra cứu PA-yymm-nnnn kế tiếp trong tháng. */
  async nextCode(today: string) {
    const prefix = `PA-${today.slice(2, 4)}${today.slice(5, 7)}-`;
    const [r] = await this.db.select({ max: sql<string | null>`max(${cases.code})` }).from(cases).where(sql`${cases.code} like ${prefix + "%"}`);
    const n = r?.max ? Number(r.max.slice(-4)) + 1 : 1;
    return `${prefix}${String(n).padStart(4, "0")}`;
  }

  async create(n: NewCase) {
    await this.db.transaction(async (tx) => {
      const [c] = await tx.insert(cases).values({
        code: n.code, title: n.description.slice(0, 80), content: n.description, topicId: n.topicId, wardId: n.wardId, address: n.address,
        channel: n.onBehalf ? "Gửi hộ" : "Web", urgent: n.urgent, sensitive: n.sensitive, status: n.status,
        unitId: n.unitId, handlerId: n.handlerId, receivedAt: n.status === "dang_xu_ly" ? new Date() : null, dueAt: n.dueAt,
      }).returning({ id: cases.id });
      if (!c) throw new Error("Không tạo được phản ánh");
      await tx.insert(caseSenders).values({ caseId: c.id, ...n.sender });
      await tx.insert(caseSteps).values(STEPS.map((s, i) => ({ caseId: c.id, ord: i, ...s })));
      if (n.photos) {
        await tx.insert(attachments).values(Array.from({ length: n.photos }, (_, i) => ({ caseId: c.id, kind: "truoc" as const, url: `/placeholder/truoc-${i + 1}.jpg` })));
      }
      await tx.insert(caseEvents).values([
        { caseId: c.id, actorId: n.actor.id, actorName: n.onBehalf ? n.actor.name : "Hệ thống", action: "Tiếp nhận phản ánh, cấp mã", toStatus: "moi_tiep_nhan" },
        { caseId: c.id, actorName: "Hệ thống", action: n.status === "cho_dieu_phoi" ? "Chuyển hàng chờ điều phối" : "Tự định tuyến theo chuyên đề", fromStatus: "moi_tiep_nhan", toStatus: n.status },
      ]);
    });
  }
}
