import { aliasedTable, and, asc, count, eq, inArray, not, type SQL } from "drizzle-orm";
import type { Db } from "../../../../shared/persistence/db.js";
import {
  attachments, caseEvents, caseSenders, cases, caseSteps, kpNotes, topics, units, users, wards,
} from "../../../../shared/persistence/schema.js";
import type { StoredCase } from "../../application/case-store.port.js";
import type { AppUser } from "../../domain/user.js";

const handlers = aliasedTable(users, "handler");
const NONE = "—";
const VN_OFFSET = 7 * 3_600_000;
const dateOf = (d: Date) => new Date(d.getTime() + VN_OFFSET).toISOString().slice(0, 10);
const stamp = (d: Date) => new Date(d.getTime() + VN_OFFSET).toISOString().slice(0, 16).replace("T", " ");

/** Lọc thô ở SQL theo phạm vi vai trò; service vẫn lọc lại bằng `canView`. `false` = không thấy gì. */
export function scopeWhere(u: AppUser): SQL | undefined | false {
  const open = u.scope === "own" || u.perms.includes("xem_luong_kin") ? undefined : not(cases.sensitive);
  switch (u.scope) {
    case "own": return eq(caseSenders.userId, u.id);
    case "ward": return and(eq(wards.name, u.ward ?? ""), open);
    case "assigned": return and(eq(units.name, u.unit ?? ""), inArray(topics.name, u.topics?.length ? u.topics : [""]), open);
    case "unit": return and(eq(units.name, u.unit ?? ""), open);
    case "all": return open;
    case "none": return false;
  }
}

/** Nạp vụ theo điều kiện — 5 câu query cố định, không phụ thuộc số vụ (Gate 3). */
export async function loadCases(db: Db, where?: SQL): Promise<StoredCase[]> {
  const rows = await db.select({ c: cases, topic: topics.name, ward: wards.name, unit: units.name, handler: handlers.name, sender: caseSenders })
    .from(cases).innerJoin(topics, eq(topics.id, cases.topicId)).innerJoin(wards, eq(wards.id, cases.wardId))
    .leftJoin(units, eq(units.id, cases.unitId)).leftJoin(handlers, eq(handlers.id, cases.handlerId))
    .innerJoin(caseSenders, eq(caseSenders.caseId, cases.id)).where(where).orderBy(asc(cases.dueAt));
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.c.id);
  const [steps, events, photos, notes] = await Promise.all([
    db.select().from(caseSteps).where(inArray(caseSteps.caseId, ids)).orderBy(asc(caseSteps.ord)),
    db.select().from(caseEvents).where(inArray(caseEvents.caseId, ids)).orderBy(asc(caseEvents.at), asc(caseEvents.id)),
    db.select({ caseId: attachments.caseId, kind: attachments.kind, n: count() }).from(attachments)
      .where(inArray(attachments.caseId, ids)).groupBy(attachments.caseId, attachments.kind),
    db.select().from(kpNotes).where(inArray(kpNotes.caseId, ids)),
  ]);
  const photo = (id: number, kind: "truoc" | "sau") => photos.find((p) => p.caseId === id && p.kind === kind)?.n ?? 0;
  return rows.map(({ c, topic, ward, unit, handler, sender }) => {
    const note = notes.find((n) => n.caseId === c.id);
    return {
      id: c.id, resumeStatus: c.resumeStatus, code: c.code, title: c.title, content: c.content,
      sender: sender.name, phone: sender.phone, consentShowKp: sender.consentShowKp, topic, ward,
      address: c.address, coords: c.coords, submittedAt: dateOf(c.submittedAt), unit: unit ?? NONE, handler: handler ?? NONE,
      dueAt: c.dueAt, status: c.status, sensitive: c.sensitive, urgent: c.urgent, reopened: c.reopened,
      extensionRound: c.extensionRound === 1 || c.extensionRound === 2 ? c.extensionRound : undefined,
      closedOnTime: c.closedOnTime ?? undefined,
      receivedMinutesAgo: c.receivedAt ? Math.floor((Date.now() - c.receivedAt.getTime()) / 60_000) : undefined,
      channel: c.channel,
      steps: steps.filter((s) => s.caseId === c.id).map((s) => ({ name: s.name, required: s.required, done: s.done, skippedReason: s.skippedReason ?? undefined })),
      history: events.filter((e) => e.caseId === c.id).map((e) => ({ at: stamp(e.at), actor: e.actorName, action: e.action, reason: e.reason ?? undefined })),
      photosBefore: photo(c.id, "truoc"), photosAfter: photo(c.id, "sau"),
      kpNote: note ? { text: note.text, shared: note.shared } : undefined,
      result: c.result ?? undefined, rating: c.rating ?? undefined,
    };
  });
}
