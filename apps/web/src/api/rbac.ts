// Vai trò & phân quyền (RBAC) — khớp apps/api/src/modules/rbac.
import { sendJson } from "./admin";

export type Scope = "own" | "ward" | "assigned" | "unit" | "all" | "none";

export interface PermissionDef {
  id: string;
  label: string;
  group: string;
}

export interface RoleRow {
  id: number;
  name: string;
  kind: string;
  scope: Scope;
  system: boolean;
  perms: string[];
  activeUsers: number;
}

export interface RbacData {
  roles: RoleRow[];
  warnings: string[];
  permissions: PermissionDef[];
  scopes: Record<Scope, string>;
  scopesForKind: Record<string, Scope[]>;
}

export interface AuditRow {
  at: string;
  actor: string;
  role: string;
  change: string;
}

export interface RoleInput {
  name: string;
  scope: Scope;
  perms: string[];
}

export const createRole = (r: RoleInput & { kind: string }) => sendJson("POST", "/api/rbac/roles", r);
export const updateRole = (id: number, r: RoleInput) => sendJson("PATCH", `/api/rbac/roles/${id}`, r);
export const deleteRole = (id: number) => sendJson("DELETE", `/api/rbac/roles/${id}`);
