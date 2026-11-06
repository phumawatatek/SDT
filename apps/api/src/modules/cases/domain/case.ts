// Kiểu dữ liệu một phản ánh như UI dùng. Server ánh xạ từ DB sang kiểu này (src/server/caseRepo.ts).
import type { CaseStatus } from "./status.js";

export interface ProcessStep {
  name: string;
  required: boolean;
  done: boolean;
  skippedReason?: string;
}

export interface HistoryEntry {
  at: string;
  actor: string;
  action: string;
  reason?: string;
}

export interface CaseRow {
  code: string;
  title: string;
  content: string;
  sender: string;
  phone: string;
  consentShowKp: boolean;
  topic: string;
  ward: string;
  address: string;
  coords: string;
  submittedAt: string;
  unit: string;
  handler: string;
  dueAt: string;
  status: CaseStatus;
  sensitive: boolean;
  urgent: boolean;
  reopened: boolean;
  extensionRound?: 1 | 2;
  closedOnTime?: boolean;
  /** Số phút từ lúc cán bộ nhận việc (để tính cửa sổ đề nghị chuyển 60 phút). */
  receivedMinutesAgo?: number;
  channel: "Zalo" | "Web" | "Gửi hộ";
  steps: ProcessStep[];
  history: HistoryEntry[];
  photosBefore: number;
  photosAfter: number;
  kpNote?: { text: string; shared: boolean };
  result?: string;
  rating?: "hai_long" | "khong_hai_long";
}
