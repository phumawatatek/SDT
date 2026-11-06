import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { asc, desc, eq, getTableColumns } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { DB, type Db } from "../../../shared/persistence/db.js";
import {
  accessLog, assignments, delegations, holidays, roles, topics, units, users, wards,
} from "../../../shared/persistence/schema.js";

export const hashPassword = (password: string) => bcrypt.hash(password, 10);

/** Bảng quản trị có khoá `id` và cột `active` (xoá mềm). */
export const ENTITIES = { users, topics, wards, assignments, delegations } as const;
export type Entity = keyof typeof ENTITIES;
type Table = PgTable & { id: PgColumn; active: PgColumn };

/** Lỗi Postgres (drizzle bọc trong `cause`). */
function pgCode(e: unknown): string | undefined {
  const err = e as { code?: unknown; cause?: { code?: unknown } };
  const code = err.code ?? err.cause?.code;
  return typeof code === "string" ? code : undefined;
}

/** Đổi lỗi ràng buộc DB thành 409 có thông báo dễ hiểu. */
export function mapDbError(e: unknown): never {
  const code = pgCode(e);
  if (code === "23503") throw new ConflictException({ code: "IN_USE", message: "Dữ liệu đã được dùng (gắn phản ánh, phân công hoặc lịch sử) — chỉ khoá được, không xoá được" });
  if (code === "23505") throw new ConflictException({ code: "DUPLICATE", message: "Đã tồn tại (trùng tên / tên đăng nhập / ngày)" });
  throw e;
}

/** Cột trả ra cho quản trị — không bao giờ gồm passwordHash. */
const userColumns = Object.fromEntries(Object.entries(getTableColumns(users)).filter(([k]) => k !== "passwordHash")) as Omit<ReturnType<typeof getTableColumns<typeof users>>, "passwordHash">;

@Injectable()
export class AdminRepo {
  constructor(@Inject(DB) private readonly db: Db) {}

  list(entity: Entity) {
    if (entity === "users") return this.db.select(userColumns).from(users).orderBy(asc(users.id));
    const t = ENTITIES[entity] as Table;
    return this.db.select().from(t).orderBy(asc(t.id));
  }

  async find(entity: Entity, id: number) {
    const t = ENTITIES[entity] as Table;
    const [row] = await this.db.select().from(t).where(eq(t.id, id)).limit(1);
    if (!row) throw new NotFoundException({ code: "NOT_FOUND", message: "Không tìm thấy" });
    return row as Record<string, unknown>;
  }

  async create(entity: Entity, values: Record<string, unknown>): Promise<{ id: number }> {
    const t = ENTITIES[entity] as Table;
    try {
      const [row] = await this.db.insert(t).values(values as never).returning({ id: t.id });
      return row as { id: number };
    } catch (e) {
      return mapDbError(e);
    }
  }

  async update(entity: Entity, id: number, values: Record<string, unknown>) {
    const t = ENTITIES[entity] as Table;
    if (Object.keys(values).length === 0) return;
    try {
      const rows = await this.db.update(t).set(values as never).where(eq(t.id, id)).returning({ id: t.id });
      if (rows.length === 0) throw new NotFoundException({ code: "NOT_FOUND", message: "Không tìm thấy" });
    } catch (e) {
      mapDbError(e);
    }
  }

  /** Xoá cứng — DB chặn nếu đã được tham chiếu (FK), khi đó báo 409 để quản trị khoá thay vì xoá. */
  async remove(entity: Entity, id: number) {
    const t = ENTITIES[entity] as Table;
    try {
      const rows = await this.db.delete(t).where(eq(t.id, id)).returning({ id: t.id });
      if (rows.length === 0) throw new NotFoundException({ code: "NOT_FOUND", message: "Không tìm thấy" });
    } catch (e) {
      mapDbError(e);
    }
  }

  async setPassword(id: number, password: string) {
    await this.update("users", id, { passwordHash: await hashPassword(password) });
  }

  holidays() {
    return this.db.select().from(holidays).orderBy(asc(holidays.date));
  }

  async addHoliday(date: string, name: string) {
    try {
      await this.db.insert(holidays).values({ date, name });
    } catch (e) {
      mapDbError(e);
    }
  }

  async removeHoliday(date: string) {
    const rows = await this.db.delete(holidays).where(eq(holidays.date, date)).returning({ date: holidays.date });
    if (rows.length === 0) throw new NotFoundException({ code: "NOT_FOUND", message: "Không tìm thấy ngày nghỉ" });
  }

  /** Danh mục cho ô chọn ở form quản trị. */
  async options() {
    const [u, t, w, us, r] = await Promise.all([
      this.db.select({ id: units.id, name: units.name, kind: units.kind }).from(units).orderBy(asc(units.id)),
      this.db.select({ id: topics.id, name: topics.name, active: topics.active }).from(topics).orderBy(asc(topics.id)),
      this.db.select({ id: wards.id, name: wards.name, active: wards.active }).from(wards).orderBy(asc(wards.id)),
      this.db.select({ id: users.id, name: users.name, role: users.role, roleId: users.roleId, unitId: users.unitId, wardId: users.wardId, active: users.active })
        .from(users).orderBy(asc(users.id)),
      this.db.select({ id: roles.id, name: roles.name, kind: roles.kind }).from(roles).orderBy(asc(roles.id)),
    ]);
    return { units: u, topics: t, wards: w, users: us, roles: r };
  }

  async roleKind(id: number) {
    const [r] = await this.db.select({ kind: roles.kind }).from(roles).where(eq(roles.id, id)).limit(1);
    return r?.kind;
  }

  accessLog(limit: number) {
    return this.db.select({ at: accessLog.at, user: users.name, role: users.title, caseCode: accessLog.caseCode, action: accessLog.action })
      .from(accessLog).innerJoin(users, eq(users.id, accessLog.userId)).orderBy(desc(accessLog.at)).limit(limit);
  }
}
