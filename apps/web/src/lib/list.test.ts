import { describe, expect, it } from "vitest";
import { MOCK_CASES } from "@/mock/cases";
import { applyAll, EMPTY_FILTER, reportText } from "./allFilter";
import { deadlineState, workdaysBetween } from "./deadline";
import { applyQuery, hitByIdentity } from "./list";
import { userFor } from "./roles";
import { kpis, quality } from "./stats";
import { matchesQuery } from "./text";

describe("search without diacritics", () => {
  it("matches words in any order, no accents", () => {
    expect(matchesQuery(["Đèn đường hẻm 12 không sáng"], "sang den")).toBe(true);
    expect(matchesQuery(["Đèn đường hẻm 12"], "den nuoc")).toBe(false);
  });

  it("neighbourhood head cannot find sender by name without consent", () => {
    const kp = userFor("kp");
    const hidden = MOCK_CASES.find((c) => c.ward === kp.ward && !c.consentShowKp)!;
    expect(applyQuery(kp, [hidden], { q: hidden.sender, filters: {} })).toHaveLength(0);
  });

  it("flags hits that came from sender identity (for access log)", () => {
    const u = userFor("dieuphoi");
    const c = MOCK_CASES[0];
    expect(hitByIdentity(u, c, c.sender)).toBe(true);
    expect(hitByIdentity(u, c, c.code)).toBe(false);
  });

  it("sorts by column", () => {
    const u = userFor("dieuphoi");
    const rows = applyQuery(u, MOCK_CASES, { q: "", filters: {}, sort: { key: "code", dir: "desc" } });
    expect(rows[0].code >= rows[rows.length - 1].code).toBe(true);
  });
});

describe("deadlines on working days", () => {
  it("skips weekends", () => {
    expect(workdaysBetween("2026-11-06", "2026-11-09")).toBe(1); // Fri → Mon
  });

  it("pauses while waiting for citizen", () => {
    expect(deadlineState("cho_bo_sung", "2026-01-01")).toBe("paused");
    expect(deadlineState("dang_xu_ly", "2026-11-03")).toBe("overdue");
  });
});

describe("all-cases filter and report", () => {
  it("keyword search ignores time window", () => {
    const f = { ...EMPTY_FILTER, days: "7" as const, q: "x" };
    const old = MOCK_CASES.find((c) => c.submittedAt < "2026-10-15")!;
    expect(applyAll([old], f)).toHaveLength(1);
    expect(applyAll([old], { ...f, q: "" })).toHaveLength(0);
  });

  it("report states total", () => {
    expect(reportText(MOCK_CASES, EMPTY_FILTER)).toContain(`Tổng số: ${MOCK_CASES.length} phản ánh`);
  });
});

describe("dashboard stats", () => {
  it("5 KPI cards, total equals case count", () => {
    const k = kpis(MOCK_CASES);
    expect(k).toHaveLength(5);
    expect(k[0].value).toBe(MOCK_CASES.length);
  });

  it("quality rings state their basis", () => {
    expect(quality(MOCK_CASES).every((q) => q.basis.length > 0)).toBe(true);
  });
});
