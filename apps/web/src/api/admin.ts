// Gọi API quản trị từ trình duyệt (qua /api). Kiểu dữ liệu khớp apps/api/src/modules/admin.
import type { ActionResult } from "./types";
import { BASE_PATH } from "@/lib/base-path";

export type AdminEntity = "users" | "topics" | "wards" | "assignments" | "delegations";
export type Row = Record<string, unknown> & { id?: number };

export interface AdminOptions {
  units: { id: number; name: string; kind: string }[];
  topics: { id: number; name: string; active: boolean }[];
  wards: { id: number; name: string; active: boolean }[];
  users: { id: number; name: string; role: string; roleId: number; unitId: number | null; wardId: number | null; active: boolean }[];
  roles: { id: number; name: string; kind: string }[];
}

/** Gọi API JSON từ trình duyệt; lỗi trả thông báo của API. */
export async function sendJson(method: string, url: string, body?: unknown): Promise<ActionResult> {
  try {
    const res = await fetch(`${BASE_PATH}${url}`, {
      method,
      headers: body === undefined ? undefined : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    const b = (await res.json().catch(() => ({}))) as { message?: unknown };
    return { ok: false, error: typeof b.message === "string" ? b.message : `Lỗi ${res.status}` };
  } catch {
    return { ok: false, error: "Không kết nối được máy chủ" };
  }
}

const send = (method: string, path: string, body?: unknown) => sendJson(method, `/api/admin${path}`, body);

export const adminCreate = (e: AdminEntity, body: Row) => send("POST", `/${e}`, body);
export const adminUpdate = (e: AdminEntity, id: number, body: Row) => send("PATCH", `/${e}/${id}`, body);
/** Xoá cứng — API chặn (409) nếu đã được dùng. */
export const adminDelete = (e: AdminEntity, id: number) => send("DELETE", `/${e}/${id}`);
export const resetPassword = (id: number, password: string) => send("POST", `/users/${id}/password`, { password });
export const addHoliday = (date: string, name: string) => send("POST", "/holidays", { date, name });
export const removeHoliday = (date: string) => send("DELETE", `/holidays/${date}`);
