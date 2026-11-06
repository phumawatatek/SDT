import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { userFor } from "@/lib/roles";
import { MOCK_CASES } from "@/mock/cases";
import { CaseTable } from "./CaseTable";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("CaseTable", () => {
  it("never renders full phone numbers in the list", () => {
    const { container } = render(<CaseTable user={userFor("dieuphoi")} rows={MOCK_CASES} total={MOCK_CASES.length} />);
    for (const row of MOCK_CASES) expect(container.textContent).not.toContain(row.phone);
    expect(screen.getByText("0904***843")).toBeTruthy();
  });

  it("hides sender for neighbourhood head without consent", () => {
    const kp = userFor("kp");
    const noConsent = MOCK_CASES.find((c) => c.ward === kp.ward && !c.consentShowKp);
    expect(noConsent).toBeDefined();
    const { container } = render(<CaseTable user={kp} rows={[noConsent!]} total={1} />);
    expect(container.textContent).not.toContain(noConsent!.sender);
    expect(screen.getAllByText("Đã ẩn").length).toBe(2);
  });

  it("marks sortable column direction for screen readers", () => {
    render(<CaseTable user={userFor("dieuphoi")} rows={MOCK_CASES} total={MOCK_CASES.length}
      query={{ q: "", filters: {}, sort: { key: "code", dir: "asc" } }} onSort={() => {}} />);
    expect(screen.getByRole("columnheader", { name: /Mã/ }).getAttribute("aria-sort")).toBe("ascending");
  });

  it("shows empty state and footer", () => {
    render(<CaseTable user={userFor("dieuphoi")} rows={[]} total={5} />);
    expect(screen.getByText("Không có phản ánh nào.")).toBeTruthy();
    expect(screen.getByText("Tổng số: 0 phản ánh (lọc từ 5)")).toBeTruthy();
  });
});
