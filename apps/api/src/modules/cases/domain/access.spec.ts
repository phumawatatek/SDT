import { describe, expect, it } from "../../../test/expect.js";
import { MOCK_CASES } from "../../../seed/data/cases.js";
import { canSeeIdentity, canView, visibleCases } from "./access.js";
import { actionsFor, canSubmitResult, citizenWaitingText, waitingText } from "./actions.js";
import { userFor, type Role } from "./roles.js";

const sensitive = MOCK_CASES.filter((c) => c.sensitive);
const roles: Role[] = ["citizen", "kp", "canbo", "truongphong", "dieuphoi", "phochutich", "chutich", "admin"];

describe("view scope (PHASE1_SPEC §2)", () => {
  it("only the Chairman sees closed-flow cases about officials", () => {
    expect(sensitive.length).toBeGreaterThan(0);
    for (const r of roles) {
      const sees = sensitive.some((c) => canView(userFor(r), c));
      expect(sees, r).toBe(r === "chutich");
    }
  });

  it("admin sees no case content", () => {
    expect(visibleCases(userFor("admin"), MOCK_CASES)).toHaveLength(0);
  });

  it("neighbourhood head only sees own ward", () => {
    const kp = userFor("kp");
    expect(visibleCases(kp, MOCK_CASES).every((c) => c.ward === kp.ward)).toBe(true);
  });

  it("officer only sees own unit and assigned topics", () => {
    const u = userFor("canbo");
    expect(visibleCases(u, MOCK_CASES).every((c) => c.unit === u.unit && u.topics!.includes(c.topic))).toBe(true);
  });

  it("citizen only sees own cases", () => {
    const u = userFor("citizen");
    expect(visibleCases(u, MOCK_CASES).every((c) => c.sender === u.name)).toBe(true);
  });

  it("neighbourhood head needs consent to see identity", () => {
    const kp = userFor("kp");
    for (const c of MOCK_CASES) expect(canSeeIdentity(kp, c)).toBe(c.consentShowKp);
  });
});

describe("actions (PHASE1_SPEC §1–3)", () => {
  const byCode = (code: string) => MOCK_CASES.find((c) => c.code === code)!;

  it("only coordinator can merge duplicates", () => {
    const c = byCode("PA-2611-0015");
    for (const r of roles) {
      const can = actionsFor(userFor(r), c).some((a) => a.id === "gop_trung");
      expect(can, r).toBe(r === "dieuphoi");
    }
  });

  it("reject/transfer actions require a reason", () => {
    const acts = actionsFor(userFor("dieuphoi"), byCode("PA-2611-0015"));
    expect(acts.filter((a) => a.id !== "giao_phong").every((a) => a.needsReason)).toBe(true);
  });

  it("result submission needs required steps and an after-photo", () => {
    expect(canSubmitResult(byCode("PA-2611-0012"))).toMatch(/bước bắt buộc/);
  });

  it("department head approves extension round 1, vice-chair round 2", () => {
    const r1 = byCode("PA-2610-0199");
    const r2 = byCode("PA-2610-0170");
    expect(actionsFor(userFor("truongphong"), r1).some((a) => a.id === "duyet_gia_han")).toBe(true);
    expect(actionsFor(userFor("truongphong"), r2).some((a) => a.id === "duyet_gia_han")).toBe(false);
    expect(actionsFor(userFor("phochutich"), r2).some((a) => a.id === "duyet_gia_han_2")).toBe(true);
  });

  it("department head cannot self-handle", () => {
    const acts = actionsFor(userFor("truongphong"), byCode("PA-2611-0021"));
    expect(acts.some((a) => a.id === "nhan_viec")).toBe(false);
  });

  it("shows who is waiting when user has no action", () => {
    expect(actionsFor(userFor("phochutich"), byCode("PA-2611-0012"))).toHaveLength(0);
    expect(waitingText(byCode("PA-2611-0012"))).toBe("Đang chờ Trần Minh xử lý");
  });

  it("citizen can reopen only once", () => {
    const resolved = { ...byCode("PA-2610-0150"), sender: userFor("citizen").name };
    expect(actionsFor(userFor("citizen"), resolved).some((a) => a.id === "mo_lai")).toBe(true);
    expect(actionsFor(userFor("citizen"), { ...resolved, reopened: true }).some((a) => a.id === "mo_lai")).toBe(false);
  });

  it("citizen waiting text never names officials (closed flow)", () => {
    const c = byCode("PA-2611-0033");
    expect(citizenWaitingText(c)).not.toContain(c.handler);
  });

  it("officer cannot take a case assigned to a colleague", () => {
    const c = { ...byCode("PA-2611-0021"), handler: "Nguyễn Hữu Phúc" };
    expect(actionsFor(userFor("canbo"), c)).toHaveLength(0);
  });

  it("transfer request hidden 60 minutes after receiving", () => {
    const c = { ...byCode("PA-2611-0012"), receivedMinutesAgo: 30 };
    expect(actionsFor(userFor("canbo"), c).some((a) => a.id === "de_nghi_chuyen")).toBe(true);
    expect(actionsFor(userFor("canbo"), { ...c, receivedMinutesAgo: 61 }).some((a) => a.id === "de_nghi_chuyen")).toBe(false);
  });

  it("vice-chair approves round 2 only inside own block", () => {
    const c = byCode("PA-2610-0170");
    expect(actionsFor(userFor("phochutich"), { ...c, unit: "Phòng VH-XH" })).toHaveLength(0);
  });

  it("neighbourhood head cannot note closed cases", () => {
    expect(actionsFor(userFor("kp"), { ...byCode("PA-2611-0012"), status: "da_dong" })).toHaveLength(0);
  });

  it("at most one primary button per panel", () => {
    for (const r of roles) for (const c of MOCK_CASES) {
      for (const st of ["da_giao", "dang_xu_ly", "cho_duyet_ket_qua"] as const) {
        const n = actionsFor(userFor(r), { ...c, status: st }).filter((a) => a.kind === "primary").length;
        expect(n, `${r} ${c.code} ${st}`).toBeLessThanOrEqual(1);
      }
    }
  });
});
