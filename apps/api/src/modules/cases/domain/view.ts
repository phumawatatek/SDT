// Dữ liệu trả ra API theo người xem: che danh tính, toạ độ, tên cán bộ; kèm thao tác được phép.
import { canSeeIdentity, handlerVisible } from "./access.js";
import { actionsFor, citizenWaitingText, waitingText, type CaseAction } from "./actions.js";
import type { CaseRow } from "./case.js";
import { HIDDEN } from "./list.js";
import type { DemoUser } from "./roles.js";

const NONE = "—";

/** Vụ như người xem được thấy, cùng thao tác họ được làm và dòng "đang chờ ai làm gì". */
export interface CaseView extends CaseRow {
  actions: CaseAction[];
  waiting: string;
}

/** Chỉ giữ trường của CaseRow (bỏ id, trạng thái quay về... của bản lưu). */
function pick(s: CaseRow): CaseRow {
  return {
    code: s.code, title: s.title, content: s.content, sender: s.sender, phone: s.phone, consentShowKp: s.consentShowKp,
    topic: s.topic, ward: s.ward, address: s.address, coords: s.coords, submittedAt: s.submittedAt, unit: s.unit,
    handler: s.handler, dueAt: s.dueAt, status: s.status, sensitive: s.sensitive, urgent: s.urgent, reopened: s.reopened,
    extensionRound: s.extensionRound, closedOnTime: s.closedOnTime, receivedMinutesAgo: s.receivedMinutesAgo,
    channel: s.channel, steps: s.steps, history: s.history, photosBefore: s.photosBefore, photosAfter: s.photosAfter,
    kpNote: s.kpNote, result: s.result, rating: s.rating,
  };
}

export function sanitize(u: DemoUser, s: CaseRow): CaseRow {
  const out = pick(s);
  if (!canSeeIdentity(u, s)) Object.assign(out, { sender: HIDDEN, phone: "" });
  if (u.role === "kp") out.coords = "";
  if (u.role === "citizen") {
    if (!handlerVisible(u, s)) Object.assign(out, { handler: NONE, unit: "UBND phường" });
    if (s.kpNote && !s.kpNote.shared) out.kpNote = undefined;
    out.history = s.history.map((h) => ({ ...h, actor: h.actor === u.name ? "Bạn" : "Phường" }));
  }
  return out;
}

/** Quyền tính trên bản đầy đủ, dữ liệu trả ra là bản đã che. */
export function viewFor(u: DemoUser, s: CaseRow): CaseView {
  return {
    ...sanitize(u, s),
    actions: actionsFor(u, s),
    waiting: u.role === "citizen" ? citizenWaitingText(s) : waitingText(s),
  };
}

/** Tra cứu công khai bằng mã: chỉ thông tin tối thiểu — không danh tính, địa chỉ, ảnh, tên cán bộ. */
export function publicView(c: CaseRow): CaseRow {
  return {
    code: c.code, title: c.sensitive ? "Phản ánh đã được tiếp nhận" : c.title, content: "", sender: "", phone: "",
    consentShowKp: false, topic: c.sensitive ? NONE : c.topic, ward: c.ward, address: "", coords: "", submittedAt: c.submittedAt,
    unit: c.sensitive || c.unit === NONE ? "UBND phường" : c.unit, handler: NONE, dueAt: c.dueAt, status: c.status,
    sensitive: c.sensitive, urgent: c.urgent, reopened: c.reopened, channel: c.channel, steps: [], photosBefore: 0, photosAfter: 0,
    result: c.result, history: c.history.map((h) => ({ at: h.at, action: h.action, actor: "Phường" })),
  };
}
