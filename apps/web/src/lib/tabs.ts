import type { CaseRow } from "@/lib/case";
import { deadlineState } from "./deadline";
import type { DemoUser } from "./roles";
import { isOpenStatus } from "./status";

export interface ListTab {
  id: string;
  label: string;
  match: (c: CaseRow, user: DemoUser) => boolean;
}

const isOpen = (c: CaseRow) => isOpenStatus(c.status);
const overdue = (c: CaseRow) => deadlineState(c.status, c.dueAt) === "overdue";
const all = () => true;

export const TABSETS = {
  hopViec: [
    { id: "cho-nhan", label: "Chờ nhận", match: (c) => c.status === "da_giao" },
    { id: "dang-xu-ly", label: "Đang xử lý", match: (c, u) => isOpen(c) && c.status !== "da_giao" && c.handler === u.name },
    { id: "sap-han", label: "Sắp hạn", match: (c) => deadlineState(c.status, c.dueAt) === "soon" },
    { id: "qua-han", label: "Quá hạn", match: overdue },
  ],
  phong: [
    { id: "cho-duyet", label: "Chờ tôi duyệt", match: (c) => c.status === "cho_duyet_ket_qua" || (c.status === "de_nghi_gia_han" && c.extensionRound === 1) },
    { id: "cho-giao", label: "Chờ giao cán bộ", match: (c) => c.status === "da_giao" },
    { id: "dang-mo", label: "Đang mở", match: isOpen },
    { id: "qua-han", label: "Quá hạn", match: overdue },
  ],
  dieuPhoi: [
    { id: "cho-dieu-phoi", label: "Chờ điều phối", match: (c) => c.status === "cho_dieu_phoi" },
    { id: "de-nghi-chuyen", label: "Đề nghị chuyển", match: (c) => c.status === "de_nghi_chuyen" },
    { id: "qua-han", label: "Quá hạn", match: overdue },
    { id: "da-chuyen", label: "Đã chuyển cơ quan khác", match: (c) => c.status === "chuyen_co_quan_khac" },
  ],
  khuPho: [
    { id: "dang-mo", label: "Đang mở", match: isOpen },
    { id: "chua-ghi-chu", label: "Chưa ghi chú xác minh", match: (c) => isOpen(c) && !c.kpNote },
    { id: "tat-ca", label: "Tất cả", match: all },
  ],
  luongKin: [
    { id: "dang-mo", label: "Đang mở", match: (c) => c.sensitive && isOpen(c) },
    { id: "tat-ca", label: "Tất cả", match: (c) => c.sensitive },
  ],
  dan: [
    { id: "dang-mo", label: "Đang xử lý", match: isOpen },
    { id: "tat-ca", label: "Tất cả", match: all },
  ],
} satisfies Record<string, ListTab[]>;

export type TabsetId = keyof typeof TABSETS;
