import { describe, expect, it } from "../../../test/expect.js";
import { checkDelegation, checkNotSelf, checkRange, checkUser } from "./admin-rules.js";

describe("admin rules", () => {
  it("officer and department head need a unit; neighbourhood head needs a ward", () => {
    expect(checkUser({ role: "canbo" })).toBe("Cán bộ, trưởng phòng cần đơn vị");
    expect(checkUser({ role: "truongphong", unitId: 1 })).toBeUndefined();
    expect(checkUser({ role: "kp", wardId: null })).toBe("Trưởng khu phố cần khu phố");
    expect(checkUser({ role: "dieuphoi" })).toBeUndefined();
  });

  it("admin cannot lock, delete or demote themselves", () => {
    expect(checkNotSelf(7, 7, { active: false })).toMatch(/Không thể khoá/);
    expect(checkNotSelf(7, 7, { deleting: true })).toMatch(/Không thể khoá/);
    expect(checkNotSelf(7, 7, { role: "canbo" })).toMatch(/vai trò quản trị/);
    expect(checkNotSelf(7, 8, { active: false })).toBeUndefined();
  });

  it("date ranges must not end before they start", () => {
    expect(checkRange("2026-11-10", "2026-11-09", "Phân công")).toMatch(/sau ngày bắt đầu/);
    expect(checkRange("2026-11-10", null, "Phân công")).toBeUndefined();
  });

  it("delegation must go to someone else", () => {
    expect(checkDelegation({ fromUserId: 3, toUserId: 3, startDate: "2026-11-10", endDate: "2026-11-12" })).toMatch(/chính mình/);
    expect(checkDelegation({ fromUserId: 3, toUserId: 4, startDate: "2026-11-10", endDate: "2026-11-12" })).toBeUndefined();
  });
});
