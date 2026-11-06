// Kiểu dữ liệu trả về từ apps/api (khớp DTO bên API). TODO: sinh tự động từ /api/docs-json (openapi-typescript).
import type { CaseRow } from "@/lib/case";
import type { DemoUser } from "@/lib/roles";

export type ActionKind = "primary" | "success" | "danger" | "normal";

export interface CaseAction {
  id: string;
  label: string;
  kind: ActionKind;
  needsReason: boolean;
  /** Thao tác cần chọn đích: phòng (giao phòng) hoặc cán bộ (giao cán bộ). */
  target?: "unit" | "handler";
  disabledReason?: string;
}

/** Vụ như người xem được thấy: API đã che dữ liệu và tính sẵn thao tác được phép. */
export interface CaseView extends CaseRow {
  actions: CaseAction[];
  waiting: string;
}

export interface AppUser extends DemoUser {
  id: number;
}

/** Danh mục để chọn đích giao việc (chỉ gửi cho vai trò cần). */
export interface Directory {
  units: string[];
  staffByUnit: Record<string, string[]>;
}

export type ActionResult = { ok: true } | { ok: false; error: string };
