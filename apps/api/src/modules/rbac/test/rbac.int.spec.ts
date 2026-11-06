// Test tích hợp phân quyền RBAC trên Postgres thật (`pnpm test:int`). Không có DATABASE_URL thì bỏ qua.
import { ConflictException, UnprocessableEntityException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { after, before, describe, expect, it } from "../../../test/expect.js";
import { loadUser } from "../../../shared/auth/user-loader.js";
import { createDb, type Db } from "../../../shared/persistence/db.js";
import { rolePermissions, roles, users } from "../../../shared/persistence/schema.js";
import { CaseService } from "../../cases/application/case.service.js";
import { DrizzleCaseStore } from "../../cases/infrastructure/persistence/drizzle-case.store.js";
import { RbacRepo } from "../infrastructure/rbac.repo.js";

const url = process.env["DATABASE_URL"];

let conn: ReturnType<typeof createDb> | undefined;
let db: Db;
let repo: RbacRepo;
let svc: CaseService;

const idOf = async (username: string) => (await db.select({ id: users.id }).from(users).where(eq(users.username, username)))[0]!.id;
const roleOf = async (kind: "truongphong" | "admin" | "canbo") => (await db.select().from(roles).where(and(eq(roles.kind, kind), eq(roles.system, true))))[0]!;
const permsOf = async (roleId: number) => (await db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId))).map((p) => p.perm);
const errorOf = async (f: () => Promise<unknown>) => {
  try {
    await f();
    return undefined;
  } catch (e) {
    return e;
  }
};

describe("rbac (Postgres thật)", { skip: !url }, () => {
  let adminId: number;
  before(async () => {
    conn = createDb(url ?? "");
    db = conn.db;
    repo = new RbacRepo(db);
    svc = new CaseService(new DrizzleCaseStore(db));
    adminId = await idOf("admin");
  });
  after(async () => {
    await conn?.client.end();
  });

  it("user permissions come from the role in DB; removing one blocks the action server-side", async () => {
    const head = await roleOf("truongphong");
    const original = await permsOf(head.id);
    const me = (await loadUser(db, await idOf("truongphong")))!;
    expect(me.perms.includes("giao_can_bo")).toBe(true);
    const c = (await svc.list(me)).find((x) => x.actions.some((a) => a.id === "giao_can_bo"));
    expect(!!c, "có vụ chờ giao cán bộ").toBe(true);
    await repo.update(adminId, head.id, { perms: original.filter((p) => p !== "giao_can_bo") });
    try {
      const after = (await loadUser(db, await idOf("truongphong")))!;
      const view = (await svc.list(after)).find((x) => x.code === c!.code);
      expect(view?.actions.some((a) => a.id === "giao_can_bo")).toBe(false);
      const err = await errorOf(() => svc.perform(after, c!.code, { actionId: "giao_can_bo", target: "Trần Minh" }));
      expect((err as { code?: string })?.code).toBe("FORBIDDEN");
    } finally {
      await repo.update(adminId, head.id, { perms: original });
    }
    const log = await repo.audit(5);
    expect(log.some((l) => l.role === head.name && l.change.includes("-Giao cán bộ"))).toBe(true);
    expect(log.some((l) => l.role === head.name && l.change.includes("+Giao cán bộ"))).toBe(true);
  });

  it("custom role: own scope + permissions; cannot delete while assigned", async () => {
    const officerRole = await roleOf("canbo");
    const id = await idOf("canbo2");
    const before = await svc.list((await loadUser(db, id))!);
    const { id: roleId } = await repo.create(adminId, { name: "Cán bộ toàn phòng (thử)", kind: "canbo", scope: "unit", perms: ["nhan_viec", "gui_ket_qua"] });
    await db.update(users).set({ roleId }).where(eq(users.id, id));
    try {
      const me = (await loadUser(db, id))!;
      expect(me.scope).toBe("unit");
      const wide = await svc.list(me);
      expect(wide.length).toBeGreaterThan(before.length);
      expect(wide.every((c) => c.unit === me.unit)).toBe(true);
      expect(await errorOf(() => repo.remove(adminId, roleId)) instanceof ConflictException).toBe(true);
    } finally {
      await db.update(users).set({ roleId: officerRole.id }).where(eq(users.id, id));
    }
    await repo.remove(adminId, roleId);
    expect(await db.select().from(roles).where(eq(roles.id, roleId))).toHaveLength(0);
  });

  it("safety locks: system role not deletable, admin keeps role management, no case permissions for admin", async () => {
    const admin = await roleOf("admin");
    expect(await errorOf(() => repo.remove(adminId, admin.id)) instanceof UnprocessableEntityException).toBe(true);
    const perms = await permsOf(admin.id);
    expect(await errorOf(() => repo.update(adminId, admin.id, { perms: perms.filter((p) => p !== "admin.roles") })) instanceof UnprocessableEntityException).toBe(true);
    expect(await errorOf(() => repo.update(adminId, admin.id, { perms: [...perms, "giao_phong"] })) instanceof UnprocessableEntityException).toBe(true);
    expect((await permsOf(admin.id)).sort()).toEqual(perms.sort());
  });

  it("overview has no workflow warnings with default roles", async () => {
    const o = await repo.overview();
    expect(o.roles.filter((r) => r.system)).toHaveLength(8);
    expect(o.warnings).toEqual([]);
  });
});
