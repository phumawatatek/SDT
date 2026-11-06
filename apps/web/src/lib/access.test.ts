import { describe, expect, it } from "vitest";
import { MOCK_CASES } from "@/mock/cases";
import { canSeeIdentity, canView, visibleCases } from "./access";
import { cellText } from "./list";
import { userFor, type Role } from "./roles";

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


describe("display masking (rules live in apps/api; web only renders)", () => {
  it("citizen sees the ward, not the officer's unit, on closed-flow cases", () => {
    const c = MOCK_CASES.find((x) => x.code === "PA-2611-0033")!;
    expect(cellText(userFor("citizen"), c, "unit")).toBe("UBND phường");
  });
});
