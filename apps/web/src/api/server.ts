import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { AdminOptions, Row } from "./admin";
import type { AuditRow, RbacData } from "./rbac";
import type { AppUser, CaseView, Directory } from "./types";

/** Địa chỉ apps/api nhìn từ server Next (trình duyệt đi qua rewrite /api cùng origin). */
export const API_URL = process.env.API_URL ?? "http://localhost:3001";

/** GET tới API kèm cookie phiên của người dùng. 401 → null (chưa đăng nhập / phiên hết hạn). */
async function apiGet<T>(path: string): Promise<T | null> {
  const cookie = (await cookies()).toString();
  const res = await fetch(`${API_URL}/api${path}`, { headers: { cookie }, cache: "no-store" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`API ${path} lỗi ${res.status}`);
  return (await res.json()) as T;
}

export const currentUser = cache(() => apiGet<AppUser>("/auth/me"));

export async function requireUser(): Promise<AppUser> {
  const u = await currentUser();
  if (!u) redirect("/dang-nhap");
  return u;
}

export async function loadShell(): Promise<{ user: AppUser; cases: CaseView[]; directory: Directory }> {
  const user = await requireUser();
  const [cases, directory] = await Promise.all([apiGet<CaseView[]>("/cases"), apiGet<Directory>("/cases/directory")]);
  return { user, cases: cases ?? [], directory: directory ?? { units: [], staffByUnit: {} } };
}

/** Đường dẫn API của từng mục quản trị. */
const ADMIN_PATH = {
  users: "/admin/users", assign: "/admin/assignments", delegate: "/admin/delegations", topics: "/admin/topics",
  wards: "/admin/wards", holidays: "/admin/holidays", log: "/admin/access-log",
} as const;
export type AdminSectionKey = keyof typeof ADMIN_PATH;

/** Dữ liệu một mục quản trị + danh mục cho ô chọn. null khi không phải quản trị viên. */
export async function loadAdminSection(section: AdminSectionKey): Promise<{ rows: Row[]; options: AdminOptions } | null> {
  const u = await requireUser();
  if (u.role !== "admin") return null;
  const [rows, options] = await Promise.all([apiGet<Row[]>(ADMIN_PATH[section]), apiGet<AdminOptions>("/admin/options")]);
  return rows && options ? { rows, options } : null;
}

/** Vai trò & phân quyền + nhật ký đổi quyền. null khi không có quyền quản trị phân quyền. */
export async function loadRbac(): Promise<{ data: RbacData; audit: AuditRow[] } | null> {
  const u = await requireUser();
  if (u.role !== "admin") return null;
  const [data, audit] = await Promise.all([apiGet<RbacData>("/rbac/roles"), apiGet<AuditRow[]>("/rbac/audit")]);
  return data && audit ? { data, audit } : null;
}
