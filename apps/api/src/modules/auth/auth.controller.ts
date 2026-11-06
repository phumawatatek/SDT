import { Body, Controller, Get, HttpCode, Inject, Post, Res, UnauthorizedException } from "@nestjs/common";
import { ApiProperty, ApiTags } from "@nestjs/swagger";
import bcrypt from "bcryptjs";
import { IsString, MaxLength, MinLength } from "class-validator";
import { eq } from "drizzle-orm";
import { CurrentUser } from "../../shared/auth/session.guard.js";
import { SESSION_COOKIE, SESSION_SECONDS, signAccess } from "../../shared/auth/token.js";
import { loadUser } from "../../shared/auth/user-loader.js";
import { DB, type Db } from "../../shared/persistence/db.js";
import { users } from "../../shared/persistence/schema.js";
import type { AppUser } from "../cases/domain/user.js";

export class LoginDto {
  @ApiProperty({ example: "tranminh" }) @IsString() @MinLength(1) @MaxLength(64)
  username!: string;

  @ApiProperty() @IsString() @MinLength(1) @MaxLength(128)
  password!: string;
}

interface CookieResponse {
  cookie(name: string, value: string, opts: Record<string, unknown>): void;
  clearCookie(name: string, opts: Record<string, unknown>): void;
}

/** So sánh hash cả khi không có user để tránh dò tài khoản bằng thời gian phản hồi. */
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);
const cookieOpts = () => ({ httpOnly: true, sameSite: "lax", secure: process.env["NODE_ENV"] === "production", path: "/" });

/** Đăng nhập tài khoản nội bộ (username + mật khẩu). API cấp JWT trong cookie httpOnly. Người dân (VNeID/OTP) làm sau. */
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(DB) private readonly db: Db) {}

  @Post("login")
  @HttpCode(200)
  async login(@Body() d: LoginDto, @Res({ passthrough: true }) res: CookieResponse): Promise<AppUser> {
    const [u] = await this.db.select().from(users).where(eq(users.username, d.username.trim().toLowerCase())).limit(1);
    const ok = await bcrypt.compare(d.password, u?.passwordHash ?? DUMMY_HASH);
    const user = u && ok && u.active ? await loadUser(this.db, u.id) : null;
    if (!user) throw new UnauthorizedException({ code: "INVALID_CREDENTIALS", message: "Sai tên đăng nhập hoặc mật khẩu" });
    res.cookie(SESSION_COOKIE, await signAccess(user.id), { ...cookieOpts(), maxAge: SESSION_SECONDS * 1000 });
    return user;
  }

  @Post("logout")
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: CookieResponse): void {
    res.clearCookie(SESSION_COOKIE, cookieOpts());
  }

  @Get("me")
  me(@CurrentUser() u: AppUser): AppUser {
    return u;
  }
}
