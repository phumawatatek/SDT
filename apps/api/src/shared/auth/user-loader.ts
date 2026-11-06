import { and, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { todayVN } from "../../modules/cases/domain/deadline.js";
import { GROUP, type AppUser } from "../../modules/cases/domain/user.js";
import type { Db } from "../persistence/db.js";
import { assignments, delegations, rolePermissions, roles, topics, units, userBlockUnits, users, wards } from "../persistence/schema.js";

/** Người dùng còn hoạt động kèm phạm vi (phân công, khối đơn vị) — không gồm ủy quyền. */
async function loadBase(db: Db, id: number, today: string): Promise<AppUser | null> {
  const [u] = await db.select({ user: users, unit: units.name, ward: wards.name, scope: roles.scope }).from(users)
    .innerJoin(roles, eq(roles.id, users.roleId))
    .leftJoin(units, eq(units.id, users.unitId)).leftJoin(wards, eq(wards.id, users.wardId))
    .where(eq(users.id, id)).limit(1);
  if (!u || !u.user.active) return null;
  const [asg, b, perms] = await Promise.all([
    db.select({ topic: topics.name, ward: wards.name }).from(assignments)
      .innerJoin(topics, eq(topics.id, assignments.topicId)).leftJoin(wards, eq(wards.id, assignments.wardId))
      .where(and(eq(assignments.userId, id), eq(assignments.active, true), lte(assignments.fromDate, today),
        or(isNull(assignments.toDate), gte(assignments.toDate, today)))),
    db.select({ name: units.name }).from(userBlockUnits).innerJoin(units, eq(units.id, userBlockUnits.unitId)).where(eq(userBlockUnits.userId, id)),
    db.select({ perm: rolePermissions.perm }).from(rolePermissions).where(eq(rolePermissions.roleId, u.user.roleId)),
  ]);
  return {
    id, role: u.user.role, name: u.user.name, title: u.user.title, group: GROUP[u.user.role],
    unit: u.unit ?? undefined, ward: u.ward ?? undefined,
    topics: asg.length ? [...new Set(asg.map((x) => x.topic))] : undefined,
    assignments: u.user.role === "canbo" ? asg.map((x) => ({ topic: x.topic, ward: x.ward ?? undefined })) : undefined,
    units: b.length ? b.map((x) => x.name) : undefined,
    perms: perms.map((x) => x.perm), scope: u.scope,
  };
}

/** Nạp người dùng + những người đang ủy quyền cho họ hôm nay (người ủy quyền cũng phải còn hoạt động). */
export async function loadUser(db: Db, id: number): Promise<AppUser | null> {
  const today = todayVN();
  const base = await loadBase(db, id, today);
  if (!base) return null;
  const rows = await db.select({ from: delegations.fromUserId }).from(delegations)
    .where(and(eq(delegations.toUserId, id), eq(delegations.active, true), lte(delegations.startDate, today), gte(delegations.endDate, today)));
  if (rows.length === 0) return base;
  const ids = [...new Set(rows.map((r) => r.from))].filter((x) => x !== id);
  const live = await db.select({ id: users.id }).from(users).where(and(inArray(users.id, ids), eq(users.active, true)));
  const actingFor = (await Promise.all(live.map((r) => loadBase(db, r.id, today)))).filter((x): x is AppUser => !!x);
  return actingFor.length ? { ...base, actingFor } : base;
}
