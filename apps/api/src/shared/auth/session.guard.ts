import { createParamDecorator, Inject, Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from "@nestjs/common";
import type { AppUser } from "../../modules/cases/domain/user.js";
import { DB, type Db } from "../persistence/db.js";
import { SESSION_COOKIE, verifyAccess } from "./token.js";
import { loadUser } from "./user-loader.js";

export interface AuthRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: AppUser;
}

/** Lấy token từ cookie httpOnly (trình duyệt) hoặc `Authorization: Bearer` (công cụ, test). */
export function tokenOf(headers: AuthRequest["headers"]): string | null {
  const auth = headers["authorization"];
  if (typeof auth === "string" && auth.startsWith("Bearer ")) return auth.slice(7).trim();
  const cookie = headers["cookie"];
  if (typeof cookie !== "string") return null;
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === SESSION_COOKIE) return decodeURIComponent(v.join("="));
  }
  return null;
}

/**
 * Guard toàn app: có token thì kiểm, nạp người dùng còn hoạt động rồi gắn `req.user`; token sai thì 401.
 * Không có token thì cho qua — API công khai (tra cứu) không cần đăng nhập, API khác đòi qua `@CurrentUser`.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(DB) private readonly db: Db) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    const token = tokenOf(req.headers);
    if (!token) return true;
    const id = await verifyAccess(token);
    const user = id === null ? null : await loadUser(this.db, id);
    if (!user) throw new UnauthorizedException({ code: "INVALID_SESSION", message: "Phiên đăng nhập đã hết hạn" });
    req.user = user;
    return true;
  }
}

/** `@CurrentUser() u: AppUser` — không có người đăng nhập thì 401. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AppUser => {
  const user = ctx.switchToHttp().getRequest<AuthRequest>().user;
  if (!user) throw new UnauthorizedException({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" });
  return user;
});
