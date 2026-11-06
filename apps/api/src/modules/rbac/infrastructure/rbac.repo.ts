import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { asc, count, desc, eq } from "drizzle-orm";
import { DB, type Db } from "../../../shared/persistence/db.js";
import { roleAudit, rolePermissions, roles, users } from "../../../shared/persistence/schema.js";
import { mapDbError } from "../../admin/infrastructure/admin.repo.js";
import type { Role } from "../../cases/domain/roles.js";
import { checkRole, missingRequired, PERMISSIONS, SCOPE_LABEL, type Scope } from "../domain/permissions.js";

export interface RoleInput {
  name: string;
  kind: Role;
  scope: Scope;
  perms: string[];
}

const reject = (msg: string | undefined) => {
  if (msg) throw new UnprocessableEntityException({ code: "INVALID", message: msg });
};
const labelOf = (id: string) => PERMISSIONS.find((p) => p.id === id)?.label ?? id;

/** Mô tả thay đổi quyền cho nhật ký: "+Giao phòng; -Gộp trùng; phạm vi: A → B". */
export function describeChange(before: { name: string; scope: Scope; perms: string[] }, after: { name: string; scope: Scope; perms: string[] }): string {
  const parts: string[] = [];
  if (before.name !== after.name) parts.push(`đổi tên: ${before.name} → ${after.name}`);
  if (before.scope !== after.scope) parts.push(`phạm vi: ${SCOPE_LABEL[before.scope]} → ${SCOPE_LABEL[after.scope]}`);
  const added = after.perms.filter((p) => !before.perms.includes(p)).map((p) => `+${labelOf(p)}`);
  const removed = before.perms.filter((p) => !after.perms.includes(p)).map((p) => `-${labelOf(p)}`);
  if (added.length || removed.length) parts.push([...added, ...removed].join(", "));
  return parts.join("; ");
}

/** Vai trò & phân quyền: đọc, tạo, sửa, xoá; mọi thay đổi ghi nhật ký trong cùng giao dịch. */
@Injectable()
export class RbacRepo {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** Danh sách vai trò kèm quyền, số người dùng đang hoạt động, và cảnh báo quy trình thiếu người. */
  async overview() {
    const [rows, perms, counts] = await Promise.all([
      this.db.select().from(roles).orderBy(asc(roles.id)),
      this.db.select().from(rolePermissions),
      this.db.select({ roleId: users.roleId, n: count() }).from(users).where(eq(users.active, true)).groupBy(users.roleId),
    ]);
    const list = rows.map((r) => ({
      ...r,
      perms: perms.filter((p) => p.roleId === r.id).map((p) => p.perm),
      activeUsers: counts.find((c) => c.roleId === r.id)?.n ?? 0,
    }));
    const held = list.filter((r) => r.activeUsers > 0).flatMap((r) => r.perms);
    return { roles: list, warnings: missingRequired(held) };
  }

  private async load(id: number) {
    const [r] = await this.db.select().from(roles).where(eq(roles.id, id)).limit(1);
    if (!r) throw new NotFoundException({ code: "NOT_FOUND", message: "Không tìm thấy vai trò" });
    const perms = await this.db.select({ perm: rolePermissions.perm }).from(rolePermissions).where(eq(rolePermissions.roleId, id));
    return { ...r, perms: perms.map((p) => p.perm) };
  }

  async create(actorId: number, d: RoleInput): Promise<{ id: number }> {
    const perms = [...new Set(d.perms)];
    reject(checkRole(d.kind, d.scope, perms));
    try {
      return await this.db.transaction(async (tx) => {
        const [row] = await tx.insert(roles).values({ name: d.name.trim(), kind: d.kind, scope: d.scope }).returning({ id: roles.id });
        if (perms.length) await tx.insert(rolePermissions).values(perms.map((perm) => ({ roleId: row!.id, perm })));
        const change = describeChange({ name: d.name.trim(), scope: d.scope, perms: [] }, { name: d.name.trim(), scope: d.scope, perms });
        await tx.insert(roleAudit).values({ actorId, roleName: d.name.trim(), change: `Tạo vai trò (phạm vi ${SCOPE_LABEL[d.scope]}). ${change}` });
        return { id: row!.id };
      });
    } catch (e) {
      return mapDbError(e);
    }
  }

  async update(actorId: number, id: number, d: Partial<Omit<RoleInput, "kind">>): Promise<void> {
    const cur = await this.load(id);
    const next = { name: d.name?.trim() ?? cur.name, scope: d.scope ?? cur.scope, perms: d.perms ? [...new Set(d.perms)] : cur.perms };
    reject(checkRole(cur.kind, next.scope, next.perms));
    const change = describeChange(cur, next);
    if (!change) return;
    try {
      await this.db.transaction(async (tx) => {
        await tx.update(roles).set({ name: next.name, scope: next.scope }).where(eq(roles.id, id));
        await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, id));
        if (next.perms.length) await tx.insert(rolePermissions).values(next.perms.map((perm) => ({ roleId: id, perm })));
        await tx.insert(roleAudit).values({ actorId, roleName: next.name, change });
      });
    } catch (e) {
      mapDbError(e);
    }
  }

  /** Xoá vai trò tự tạo chưa gán cho ai. Vai trò gốc không xoá được. */
  async remove(actorId: number, id: number): Promise<void> {
    const cur = await this.load(id);
    reject(cur.system ? "Vai trò gốc không xoá được, chỉ sửa quyền" : undefined);
    try {
      await this.db.transaction(async (tx) => {
        await tx.insert(roleAudit).values({ actorId, roleName: cur.name, change: "Xoá vai trò" });
        await tx.delete(roles).where(eq(roles.id, id));
      });
    } catch (e) {
      mapDbError(e);
    }
  }

  audit(limit: number) {
    return this.db.select({ at: roleAudit.at, actor: users.name, role: roleAudit.roleName, change: roleAudit.change })
      .from(roleAudit).innerJoin(users, eq(users.id, roleAudit.actorId)).orderBy(desc(roleAudit.at), desc(roleAudit.id)).limit(limit);
  }
}
