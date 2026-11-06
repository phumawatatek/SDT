import { describe, expect, it } from "../../../test/expect.js";
import { MOCK_CASES } from "../../../seed/data/cases.js";
import { citizenCanAmend } from "./actions.js";
import { transition } from "./workflow.js";

const byCode = (code: string) => MOCK_CASES.find((c) => c.code === code)!;
const T = "2026-11-06";

describe("workflow transitions (SYSTEM_SPEC §4)", () => {
  it("coordinator assigns a unit and clears handler", () => {
    expect(transition(byCode("PA-2611-0015"), "giao_phong", { target: "Phòng VH-XH" }, "Phan Thu Hà", T)?.patch)
      .toEqual({ status: "da_giao", unit: "Phòng VH-XH", handler: null });
  });

  it("transfer request returns to previous status when rejected", () => {
    const c = byCode("PA-2611-0012");
    const req = transition(c, "de_nghi_chuyen", { reason: "Sai thẩm quyền" }, "Trần Minh", T)!;
    expect(req.patch).toMatchObject({ status: "de_nghi_chuyen", resumeStatus: "dang_xu_ly" });
    const back = transition({ ...c, status: "de_nghi_chuyen", resumeStatus: "dang_xu_ly" }, "tu_choi_chuyen", {}, "Phan Thu Hà", T)!;
    expect(back.patch.status).toBe("dang_xu_ly");
  });

  it("extension approval adds 5 working days and resumes", () => {
    const c = { ...byCode("PA-2610-0199"), resumeStatus: "dang_xu_ly" as const };
    const t = transition(c, "duyet_gia_han", {}, "Lê Quang Huy", T)!;
    expect(t.patch).toMatchObject({ status: "dang_xu_ly", dueAt: "2026-11-19" });
  });

  it("result approval records whether closed on time", () => {
    const c = byCode("PA-2610-0160"); // hạn 2026-10-26, đã quá
    expect(transition(c, "duyet_ket_qua", {}, "Lê Quang Huy", T)?.patch.closedOnTime).toBe(false);
  });

  it("reopen sets red flag, shorter deadline, rework step", () => {
    const t = transition(byCode("PA-2610-0150"), "mo_lai", { reason: "Vẫn còn ngập" }, "Lý Thị Hằng", T)!;
    expect(t.patch).toMatchObject({ status: "mo_lai", reopened: true, addReworkStep: true, dueAt: "2026-11-13" });
  });

  it("rejected extension does not count as a round", () => {
    const c = { ...byCode("PA-2610-0199"), extensionRound: 1 as const };
    expect(transition(c, "tu_choi_gia_han", { reason: "Không đủ căn cứ" }, "x", T)?.patch.extensionRound).toBeNull();
  });

  it("unknown action yields no transition", () => {
    expect(transition(byCode("PA-2611-0012"), "hack", {}, "x", T)).toBeUndefined();
  });
});

describe("holidays come from configuration", () => {
  it("a configured holiday is skipped when adding working days", async () => {
    const { addWorkdays, setHolidays, HOLIDAYS } = await import("./deadline.js");
    setHolidays(["2026-11-09"]);
    expect(addWorkdays("2026-11-06", 1)).toBe("2026-11-10");
    setHolidays(HOLIDAYS);
    expect(addWorkdays("2026-11-06", 1)).toBe("2026-11-09");
  });
});

describe("citizen amend window", () => {
  it("allowed only before an officer is assigned, never for sensitive cases", () => {
    const base = byCode("PA-2611-0015");
    expect(citizenCanAmend({ ...base, status: "cho_dieu_phoi", sensitive: false })).toBe(true);
    expect(citizenCanAmend({ ...base, status: "da_giao", handler: "—", sensitive: false })).toBe(true);
    expect(citizenCanAmend({ ...base, status: "da_giao", handler: "Trần Minh", sensitive: false })).toBe(false);
    expect(citizenCanAmend({ ...base, status: "dang_xu_ly", sensitive: false })).toBe(false);
    expect(citizenCanAmend({ ...base, status: "cho_dieu_phoi", sensitive: true })).toBe(false);
  });

  it("withdraw moves to da_rut", () => {
    expect(transition(byCode("PA-2611-0015"), "rut", { reason: "Đã tự xử lý" }, "Dân", T)?.patch).toEqual({ status: "da_rut" });
  });
});
