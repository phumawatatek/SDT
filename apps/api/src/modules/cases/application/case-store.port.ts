import type { CaseRow } from "../domain/case.js";
import type { CaseStatus } from "../domain/status.js";
import type { AppUser } from "../domain/user.js";
import type { CasePatch } from "../domain/workflow.js";

/** Bản ghi đầy đủ cho server (có id, trạng thái quay về). Không trả thẳng ra API — dùng `sanitize`. */
export type StoredCase = CaseRow & { id: number; resumeStatus: CaseStatus | null };

export type StepOp = "done" | "skip" | "undo";

export interface NewCase {
  code: string;
  description: string;
  address: string;
  topicId: number;
  wardId: number;
  urgent: boolean;
  sensitive: boolean;
  onBehalf: boolean;
  status: CaseStatus;
  unitId: number | null;
  handlerId: number | null;
  dueAt: string;
  photos: number;
  sender: { name: string; phone: string; userId: number | null; enteredById: number | null; consentShowKp: boolean };
  actor: { id: number; name: string };
}

export interface TopicInfo {
  id: number;
  name: string;
  defaultUnitId: number | null;
  sensitive: boolean;
  urgent: boolean;
  slaDays: number;
}

/** Cổng lưu trữ phản ánh (driven port) — bản cài ở infrastructure (Drizzle). */
export interface CaseStore {
  /** Các vụ trong phạm vi thô theo vai trò (lọc SQL); service lọc lại bằng `canView`. */
  listScoped(u: AppUser): Promise<StoredCase[]>;
  findByCode(code: string): Promise<StoredCase | undefined>;
  findByCodes(codes: string[]): Promise<StoredCase[]>;
  unitExists(name: string): Promise<boolean>;
  /** Cán bộ đang hoạt động, vai trò canbo, thuộc phòng `unit`. */
  isStaffOf(name: string, unit: string): Promise<boolean>;
  /** Cập nhật với khoá lạc quan theo trạng thái; false khi trạng thái đã bị người khác đổi. */
  applyPatch(c: StoredCase, p: CasePatch, actor: AppUser, event: string, reason?: string): Promise<boolean>;
  /** Sửa nội dung do người dân gửi (khoá lạc quan theo trạng thái), ghi nhật ký. */
  updateContent(c: StoredCase, p: ContentPatch, actor: AppUser): Promise<boolean>;
  saveNote(c: StoredCase, u: AppUser, text: string, shared: boolean): Promise<void>;
  updateStep(c: StoredCase, u: AppUser, index: number, op: StepOp, reason?: string): Promise<void>;
  addPhoto(c: StoredCase, kind: "sau"): Promise<void>;
  /** Ghi nhật ký truy cập; bỏ qua nếu cùng người, vụ, hành động trong `dedupeMs`. */
  logAccess(userId: number, code: string, action: string, dedupeMs: number): Promise<void>;
  directory(u: AppUser): Promise<{ units: string[]; staffByUnit: Record<string, string[]> }>;
  /** Chỉ chuyên đề / khu phố đang dùng. */
  topicByName(name: string): Promise<TopicInfo | undefined>;
  wardIdByName(name: string): Promise<number | undefined>;
  userIdByRole(role: "chutich"): Promise<number | null>;
  phoneOf(userId: number): Promise<string | null>;
  nextCode(today: string): Promise<string>;
  holidays(): Promise<string[]>;
  /** Danh mục công khai cho form gửi phản ánh: chuyên đề, khu phố đang dùng. */
  catalog(): Promise<Catalog>;
  create(c: NewCase): Promise<void>;
}

export interface Catalog {
  topics: { name: string; urgent: boolean }[];
  wards: string[];
  holidays: string[];
}

export const CASE_STORE = Symbol("CaseStore");

export interface ContentPatch {
  wardId: number;
  address: string;
  description: string;
}
