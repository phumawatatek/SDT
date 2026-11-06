import { jwtVerify, SignJWT } from "jose";

/** Phiên đăng nhập 8 giờ (một ca làm việc). */
export const SESSION_SECONDS = 8 * 3600;
export const SESSION_COOKIE = "sdt_session";

function secret(): Uint8Array {
  const s = process.env["JWT_SECRET"];
  if (!s || s.length < 32) throw new Error("JWT_SECRET chưa cấu hình hoặc ngắn hơn 32 ký tự (xem apps/api/.env.example)");
  return new TextEncoder().encode(s);
}

/** Access token chỉ mang user id; quyền đọc lại từ DB mỗi request để khoá tài khoản có hiệu lực ngay. */
export async function signAccess(userId: number): Promise<string> {
  return new SignJWT({ typ: "access" }).setProtectedHeader({ alg: "HS256" }).setSubject(String(userId))
    .setIssuedAt().setExpirationTime(`${SESSION_SECONDS}s`).sign(secret());
}

/** Hợp lệ thì trả user id; sai chữ ký, hết hạn, sai loại thì null. */
export async function verifyAccess(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    return payload["typ"] === "access" && Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
