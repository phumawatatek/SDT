// Gọi apps/api từ trình duyệt qua /api (Next rewrite, cùng origin nên cookie httpOnly đi kèm).
import type { CaseRow } from "@/lib/case";
import type { ActionResult } from "./types";
import { BASE_PATH } from "@/lib/base-path";

async function errorOf(res: Response): Promise<string> {
  if (res.status === 401) return "Phiên đăng nhập đã hết hạn";
  try {
    const body = (await res.json()) as { message?: unknown };
    if (typeof body.message === "string") return body.message;
  } catch {
    // thân không phải JSON
  }
  return "Có lỗi, thử lại sau";
}

async function post(path: string, body?: unknown, method = "POST"): Promise<Response> {
  return fetch(`${BASE_PATH}/api${path}`, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function run(path: string, body?: unknown, method = "POST"): Promise<ActionResult> {
  try {
    const res = await post(path, body, method);
    return res.ok ? { ok: true } : { ok: false, error: await errorOf(res) };
  } catch {
    return { ok: false, error: "Không kết nối được máy chủ" };
  }
}

const c = (code: string) => `/cases/${encodeURIComponent(code)}`;

export const login = (username: string, password: string) => run("/auth/login", { username, password });
export const logout = () => run("/auth/logout");

export const performAction = (i: { code: string; actionId: string; reason?: string; target?: string; share?: boolean }) =>
  run(`${c(i.code)}/actions`, { actionId: i.actionId, reason: i.reason, target: i.target, share: i.share });

/** Người dân sửa phản ánh của mình (khi chưa có cán bộ nhận). */
export const editCase = (code: string, i: { ward: string; address: string; description: string }) => run(c(code), i, "PATCH");

export const updateStep = (i: { code: string; index: number; op: "done" | "skip" | "undo"; reason?: string }) =>
  run(`${c(i.code)}/steps`, { index: i.index, op: i.op, reason: i.reason });

export const addAfterPhoto = (code: string) => run(`${c(code)}/photos`);
export const logIdentityView = (code: string) => run(`${c(code)}/identity-views`);
export const logSearchHits = (codes: string[], q: string) => run("/cases/search-hits", { codes, q });

export interface SubmitInput {
  topic: string;
  ward: string;
  address: string;
  description: string;
  photos: number;
  consentShowKp: boolean;
  onBehalfName: string;
  onBehalfPhone: string;
}

export type SubmitResult = { ok: true; code: string } | { ok: false; error: string };

export async function submitCase(d: SubmitInput): Promise<SubmitResult> {
  try {
    const res = await post("/cases", d);
    if (!res.ok) return { ok: false, error: await errorOf(res) };
    return { ok: true, code: ((await res.json()) as { code: string }).code };
  } catch {
    return { ok: false, error: "Không kết nối được máy chủ" };
  }
}

/** Tra cứu công khai bằng mã; không có thì null. */
export async function lookupCase(code: string): Promise<CaseRow | null> {
  if (!/^PA-\d{4}-\d{4}$/.test(code)) return null;
  const res = await fetch(`${BASE_PATH}/api/public/cases/${encodeURIComponent(code)}`);
  return res.ok ? ((await res.json()) as CaseRow) : null;
}
