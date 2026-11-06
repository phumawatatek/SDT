// Test tích hợp quản trị + ủy quyền + phân công trên Postgres thật (`pnpm test:int`). Không có DATABASE_URL thì bỏ qua.
import { ConflictException } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { after, before, describe, expect, it } from "../../../test/expect.js";
import { loadUser } from "../../../shared/auth/user-loader.js";
import { createDb, type Db } from "../../../shared/persistence/db.js";
import { assignments, cases, delegations, topics, users, wards } from "../../../shared/persistence/schema.js";
import { CaseService } from "../../cases/application/case.service.js";
import { SubmitService } from "../../cases/application/submit.service.js";
import { actionsFor } from "../../cases/domain/actions.js";
import { todayVN } from "../../cases/domain/deadline.js";
import type { AppUser } from "../../cases/domain/user.js";
import { DrizzleCaseStore } from "../../cases/infrastructure/persistence/drizzle-case.store.js";
import { AdminRepo } from "../infrastructure/admin.repo.js";

const url = process.env["DATABASE_URL"];

let conn: ReturnType<typeof createDb> | undefined;
let db: Db;
let repo: AdminRepo;
let svc: CaseService;
let store: DrizzleCaseStore;

const idOf = async (username: string) => (await db.select({ id: users.id }).from(users).where(eq(users.username, username)))[0]!.id;
const userOf = async (username: string): Promise<AppUser> => (await loadUser(db, await idOf(username)))!;

describe("admin (Postgres thật)", { skip: !url }, () => {
  before(() => {
    conn = createDb(url ?? "");
    db = conn.db;
    repo = new AdminRepo(db);
    store = new DrizzleCaseStore(db);
    svc = new CaseService(store);
  });
  after(async () => {
    await conn?.client.end();
  });

  it("delegate acts for delegator; history says 'thay mặt'", async () => {
    const today = todayVN();
    const [from, to] = [await idOf("truongphong"), await idOf("canbo2")];
    await db.insert(delegations).values({ fromUserId: from, toUserId: to, startDate: today, endDate: today });
    const me = await userOf("canbo2");
    expect(me.actingFor?.map((x) => x.name)).toEqual(["Lê Quang Huy"]);
    const head = me.actingFor![0]!;
    // Vụ chỉ trưởng phòng làm được (Phúc tự mình không có thao tác), thao tác không cần lý do / đích.
    const direct = (x: Parameters<typeof actionsFor>[1]) => actionsFor(head, x).find((a) => !a.needsReason && !a.target && !a.disabledReason);
    const all = await store.listScoped(head);
    const c = all.find((x) => direct(x) && actionsFor(me, x).length === 0);
    expect(!!c, "có vụ chỉ trưởng phòng thao tác được").toBe(true);
    const action = direct(c!)!;
    await svc.perform(me, c!.code, { actionId: action.id });
    expect((await store.findByCode(c!.code))?.history.at(-1)?.actor).toBe("Nguyễn Hữu Phúc (thay mặt Lê Quang Huy)");
    await db.update(delegations).set({ active: false }).where(and(eq(delegations.fromUserId, from), eq(delegations.toUserId, to)));
    expect((await userOf("canbo2")).actingFor).toBeUndefined();
  });

  it("ward-limited assignment narrows what the officer sees", async () => {
    const id = await idOf("canbo");
    const [kp1] = await db.select({ id: wards.id }).from(wards).where(eq(wards.name, "Khu phố 1"));
    const before = await svc.list(await userOf("canbo"));
    await db.update(assignments).set({ wardId: kp1!.id }).where(eq(assignments.userId, id));
    const after = await svc.list(await userOf("canbo"));
    await db.update(assignments).set({ wardId: null }).where(eq(assignments.userId, id));
    expect(before.some((c) => c.ward !== "Khu phố 1")).toBe(true);
    expect(after.every((c) => c.ward === "Khu phố 1")).toBe(true);
  });

  it("hard delete is blocked once used; soft delete hides it from the public catalog", async () => {
    const [used] = await db.select({ id: topics.id, name: topics.name }).from(topics).innerJoin(cases, eq(cases.topicId, topics.id)).limit(1);
    let blocked = false;
    try {
      await repo.remove("topics", used!.id);
    } catch (e) {
      blocked = e instanceof ConflictException;
    }
    expect(blocked).toBe(true);
    await repo.update("topics", used!.id, { active: false });
    const catalog = await new SubmitService(store).catalog();
    await repo.update("topics", used!.id, { active: true });
    expect(catalog.topics.some((t) => t.name === used!.name)).toBe(false);
  });

  it("unused records can be hard-deleted", async () => {
    const row = await repo.create("wards", { name: "Khu phố thử xoá" });
    await repo.remove("wards", row.id);
    expect(await db.select().from(wards).where(eq(wards.id, row.id))).toHaveLength(0);
  });

  it("admin user list never exposes password hashes", async () => {
    const list = (await repo.list("users")) as Record<string, unknown>[];
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((u) => "passwordHash" in u)).toBe(false);
  });
});
