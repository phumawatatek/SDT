// Test tích hợp với Postgres thật: `pnpm test:int` (seed lại trước khi chạy). Không có DATABASE_URL thì bỏ qua.
import { eq } from "drizzle-orm";
import { after, before, describe, expect, it } from "../../../test/expect.js";
import { loadUser } from "../../../shared/auth/user-loader.js";
import { createDb, queryCounter, type Db } from "../../../shared/persistence/db.js";
import { users } from "../../../shared/persistence/schema.js";
import { CaseError } from "../application/case-errors.js";
import { CaseService } from "../application/case.service.js";
import { SubmitService } from "../application/submit.service.js";
import type { Role } from "../domain/roles.js";
import type { AppUser } from "../domain/user.js";
import { loadCases } from "../infrastructure/persistence/case-query.js";
import { DrizzleCaseStore } from "../infrastructure/persistence/drizzle-case.store.js";

const url = process.env["DATABASE_URL"];
const skip = !url;

/** Seed đặt tên đăng nhập = vai trò. */
const USERNAMES: Record<Role, string> = {
  citizen: "citizen", kp: "kp", canbo: "canbo", truongphong: "truongphong",
  dieuphoi: "dieuphoi", phochutich: "phochutich", chutich: "chutich", admin: "admin",
};

let conn: ReturnType<typeof createDb> | undefined;
let db: Db;
let store: DrizzleCaseStore;
let svc: CaseService;

const as = async (r: Role): Promise<AppUser> => {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.username, USERNAMES[r]));
  const u = row && (await loadUser(db, row.id));
  if (!u) throw new Error(`Thiếu tài khoản seed ${r} — chạy pnpm db:seed`);
  return u;
};

/** Kết quả thao tác: "ok" hoặc mã lỗi nghiệp vụ. */
const attempt = async (fn: () => Promise<unknown>): Promise<string> => {
  try {
    await fn();
    return "ok";
  } catch (e) {
    if (e instanceof CaseError) return e.code;
    throw e;
  }
};

describe("cases (Postgres thật)", { skip }, () => {
  before(() => {
    conn = createDb(url ?? "");
    db = conn.db;
    store = new DrizzleCaseStore(db);
    svc = new CaseService(store);
  });
  after(async () => {
    await conn?.client.end();
  });

  describe("server enforces permissions (không tin client)", () => {
    it("officer cannot perform a coordinator action", async () => {
      expect(await attempt(async () => svc.perform(await as("canbo"), "PA-2611-0015", { actionId: "giao_phong", target: "Phòng VH-XH" }))).toBe("NOT_FOUND");
    });

    it("officer cannot touch a case outside own scope (sensitive)", async () => {
      expect(await attempt(async () => svc.perform(await as("canbo"), "PA-2611-0033", { actionId: "gui_ket_qua" }))).toBe("NOT_FOUND");
    });

    it("reason is required server-side", async () => {
      expect(await attempt(async () => svc.perform(await as("dieuphoi"), "PA-2611-0015", { actionId: "khong_xu_ly", reason: "x" }))).toBe("INVALID");
    });

    it("assign target must be a real unit", async () => {
      expect(await attempt(async () => svc.perform(await as("dieuphoi"), "PA-2611-0015", { actionId: "giao_phong", target: "Phòng ma" }))).toBe("INVALID");
    });

    it("coordinator assigns unit; status and event persisted", async () => {
      expect(await attempt(async () => svc.perform(await as("dieuphoi"), "PA-2611-0015", { actionId: "giao_phong", target: "Phòng KT-HT-ĐT" }))).toBe("ok");
      const c = await store.findByCode("PA-2611-0015");
      expect(c?.status).toBe("da_giao");
      expect(c?.unit).toBe("Phòng KT-HT-ĐT");
      expect(c?.history.at(-1)?.action).toBe("Giao Phòng KT-HT-ĐT");
    });

    it("result submission blocked server-side when required steps missing", async () => {
      expect(await attempt(async () => svc.perform(await as("canbo"), "PA-2611-0012", { actionId: "gui_ket_qua" }))).toBe("INVALID");
    });
  });

  describe("data sent to browser is scoped and masked", () => {
    it("admin receives no cases", async () => {
      expect(await svc.list(await as("admin"))).toHaveLength(0);
    });

    it("neighbourhood head never receives identity without consent", async () => {
      const list = await svc.list(await as("kp"));
      expect(list.length).toBeGreaterThan(0);
      for (const c of list) {
        if (!c.consentShowKp) expect([c.sender, c.phone]).toEqual(["Đã ẩn", ""]);
        expect(c.coords).toBe("");
        expect(c.sensitive).toBe(false);
      }
    });

    it("citizen receives only own cases and no official names", async () => {
      const me = await as("citizen");
      const list = await svc.list(me);
      expect(list.every((c) => c.sender === me.name)).toBe(true);
      expect(list.flatMap((c) => c.history.map((h) => h.actor)).every((a) => a === "Bạn" || a === "Phường")).toBe(true);
    });

    it("closed-flow cases reach only the Chairman", async () => {
      for (const r of ["canbo", "truongphong", "dieuphoi", "phochutich", "kp"] as Role[]) {
        expect((await svc.list(await as(r))).some((c) => c.sensitive), r).toBe(false);
      }
      expect((await svc.list(await as("chutich"))).some((c) => c.sensitive)).toBe(true);
    });

    it("public lookup hides identity and officials", async () => {
      const c = await new SubmitService(store).lookup("PA-2611-0033");
      expect(c).toMatchObject({ sender: "", phone: "", address: "", handler: "—", unit: "UBND phường" });
    });
  });

  describe("citizen edits / withdraws own case before an officer takes it", () => {
    const submit = async () => {
      const u = await as("citizen");
      return new SubmitService(store).submit(u, {
        topic: "Môi trường", ward: (await store.catalog()).wards[0] ?? "", address: "12 đường thử",
        description: "Đèn đường hỏng cả tuần nay", photos: 0, consentShowKp: false, onBehalfName: "", onBehalfPhone: "",
      });
    };
    const edit = async (code: string, r: Role = "citizen") =>
      attempt(async () => svc.edit(await as(r), code, { ward: (await store.catalog()).wards[1] ?? "", address: "34 đường sửa", description: "Nội dung đã sửa lại cho rõ" }));

    it("owner edits, change is saved and logged; others cannot", async () => {
      const code = await submit();
      expect(await edit(code)).toBe("ok");
      const c = await store.findByCode(code);
      expect(c?.address).toBe("34 đường sửa");
      expect(c?.content).toBe("Nội dung đã sửa lại cho rõ");
      expect(c?.history.some((h) => h.action === "Người dân sửa nội dung phản ánh")).toBe(true);
      expect(await edit(code, "canbo")).not.toBe("ok");
    });

    it("withdraw needs a reason, closes the case, then edit is blocked", async () => {
      const code = await submit();
      const u = await as("citizen");
      expect(await attempt(() => svc.perform(u, code, { actionId: "rut" }))).toBe("INVALID");
      expect(await attempt(() => svc.perform(u, code, { actionId: "rut", reason: "Đã tự sửa xong" }))).toBe("ok");
      expect((await store.findByCode(code))?.status).toBe("da_rut");
      expect(await edit(code)).toBe("FORBIDDEN");
    });

    it("cannot edit once an officer is handling it", async () => {
      expect(await edit("PA-2611-0012")).not.toBe("ok");
    });
  });

  describe("Gate 3 — no N+1", () => {
    it("query count is the same for 1 case and all cases", async () => {
      queryCounter.n = 0;
      await loadCases(db);
      const all = queryCounter.n;
      queryCounter.n = 0;
      await store.findByCode("PA-2611-0012");
      const one = queryCounter.n;
      console.log(`queries: all=${all} one=${one}`);
      expect(all).toBe(one);
      expect(all).toBeLessThanOrEqual(5);
    });

    it("search-hit logging loads cases in one batch", async () => {
      const u = await as("dieuphoi");
      queryCounter.n = 0;
      await svc.logSearchHits(u, ["PA-2611-0012", "PA-2610-0198", "PA-2610-0187"], "zzz-khong-trung");
      expect(queryCounter.n).toBeLessThanOrEqual(5);
    });
  });
});
