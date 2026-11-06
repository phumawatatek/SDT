import { describe, expect, it } from "../../../test/expect.js";
import { MOCK_CASES } from "../../../seed/data/cases.js";
import { canSeeIdentity, canView } from "../../cases/domain/access.js";
import { actionsFor } from "../../cases/domain/actions.js";
import { userFor, type DemoUser, type Role } from "../../cases/domain/roles.js";
import { describeChange } from "../infrastructure/rbac.repo.js";
import { checkRole, DEFAULT_ROLES, missingRequired, REQUIRED_PERMS } from "./permissions.js";

const without = (u: DemoUser, perm: string): DemoUser => ({ ...u, perms: u.perms.filter((p) => p !== perm) });
const ids = (u: DemoUser, c: (typeof MOCK_CASES)[number]) => actionsFor(u, c).map((a) => a.id);
const byStatus = (s: string) => MOCK_CASES.find((c) => c.status === s && !c.sensitive)!;

describe("RBAC — role configuration rules", () => {
  it("all 8 default roles are valid", () => {
    for (const [kind, r] of Object.entries(DEFAULT_ROLES)) expect(checkRole(kind as Role, r.scope, r.perms), kind).toBeUndefined();
  });

  it("admin role cannot get case permissions and must keep role management", () => {
    expect(checkRole("admin", "none", [...DEFAULT_ROLES.admin.perms, "giao_phong"])).toMatch(/nghiệp vụ/);
    expect(checkRole("admin", "none", DEFAULT_ROLES.admin.perms.filter((p) => p !== "admin.roles"))).toMatch(/phân quyền/);
  });

  it("business roles cannot get admin permissions; scope must fit the kind; unknown permission rejected", () => {
    expect(checkRole("chutich", "all", ["admin.users"])).toMatch(/quản trị/);
    expect(checkRole("dieuphoi", "unit", [])).toMatch(/Phạm vi/);
    expect(checkRole("canbo", "assigned", ["bay_len_troi"])).toMatch(/không tồn tại/);
  });

  it("warns when a workflow-critical permission has nobody", () => {
    const all = Object.values(DEFAULT_ROLES).flatMap((r) => r.perms);
    expect(missingRequired(all)).toHaveLength(0);
    const noCoordinator = all.filter((p) => p !== "giao_phong");
    expect(missingRequired(noCoordinator)).toHaveLength(1);
    expect(missingRequired(noCoordinator)[0]).toContain("Giao phòng");
    expect(REQUIRED_PERMS.every((p) => all.includes(p))).toBe(true);
  });

  it("audit text lists added / removed permissions and scope change", () => {
    const t = describeChange({ name: "A", scope: "assigned", perms: ["nhan_viec"] }, { name: "A", scope: "unit", perms: ["gui_ket_qua"] });
    expect(t).toContain("+Làm bước");
    expect(t).toContain("-Nhận việc");
    expect(t).toContain("phạm vi:");
  });
});

describe("RBAC — permissions drive actions and visibility", () => {
  it("removing a permission removes exactly that action", () => {
    const c = { ...byStatus("cho_duyet_ket_qua"), unit: userFor("truongphong").unit! };
    expect(ids(userFor("truongphong"), c)).toEqual(["duyet_ket_qua", "tra_lai"]);
    expect(ids(without(userFor("truongphong"), "duyet_ket_qua"), c)).toEqual(["tra_lai"]);
  });

  it("granting a coordinator action to another role works; citizen actions stay owner-only", () => {
    const c = byStatus("cho_dieu_phoi");
    const head = { ...userFor("truongphong"), perms: [...userFor("truongphong").perms, "khong_xu_ly"] };
    expect(ids(head, c)).toContain("khong_xu_ly");
    const resolved = byStatus("da_giai_quyet");
    const staff = { ...userFor("dieuphoi"), perms: [...userFor("dieuphoi").perms, "danh_gia"] };
    expect(ids(staff, resolved)).not.toContain("danh_gia");
  });

  it("closed-flow cases need the dedicated view permission", () => {
    const s = MOCK_CASES.find((c) => c.sensitive)!;
    expect(canView(userFor("dieuphoi"), s)).toBe(false);
    expect(canView({ ...userFor("dieuphoi"), perms: [...userFor("dieuphoi").perms, "xem_luong_kin"] }, s)).toBe(true);
    expect(canView(without(userFor("chutich"), "xem_luong_kin"), s)).toBe(false);
  });

  it("scope widens / narrows what a role sees", () => {
    const head = userFor("truongphong");
    const other = MOCK_CASES.find((c) => !c.sensitive && c.unit !== head.unit && c.unit !== "—")!;
    expect(canView(head, other)).toBe(false);
    expect(canView({ ...head, scope: "all" }, other)).toBe(true);
  });

  it("identity: permission, or neighbourhood-head consent", () => {
    const c = MOCK_CASES.find((x) => !x.consentShowKp)!;
    expect(canSeeIdentity(userFor("kp"), c)).toBe(false);
    expect(canSeeIdentity({ ...userFor("kp"), perms: ["xem_danh_tinh"] }, c)).toBe(true);
    expect(canSeeIdentity(without(userFor("dieuphoi"), "xem_danh_tinh"), c)).toBe(false);
    expect(canSeeIdentity({ ...userFor("admin"), perms: ["xem_danh_tinh"] }, c)).toBe(false);
  });
});
