import { describe, expect, it } from "vitest";
import { STATUS_META, maskPhone, statusLabel } from "./status";

describe("status", () => {
  it("has 14 statuses per SYSTEM_SPEC §4 plus da_rut (người dân rút, chốt 2026-11-06)", () => {
    expect(Object.keys(STATUS_META)).toHaveLength(15);
  });

  it("shows simpler label to citizens", () => {
    expect(statusLabel("cho_bo_sung", "staff")).toBe("Chờ người dân bổ sung");
    expect(statusLabel("cho_bo_sung", "citizen")).toBe("Cần bạn bổ sung");
    expect(statusLabel("cho_duyet_ket_qua", "citizen")).toBe("Đang xử lý");
  });

  it("pauses clock only when waiting for citizen or finished", () => {
    expect(STATUS_META.cho_bo_sung.clockPaused).toBe(true);
    expect(STATUS_META.de_nghi_gia_han.clockPaused).toBe(false);
  });
});

describe("maskPhone", () => {
  it("masks middle digits", () => {
    expect(maskPhone("0904123843")).toBe("0904***843");
  });

  it("never leaks short or malformed numbers", () => {
    expect(maskPhone("12345")).toBe("***");
    expect(maskPhone("")).toBe("***");
  });
});
