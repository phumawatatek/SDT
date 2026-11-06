import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../shared/auth/session.guard.js";
import type { AppUser } from "../../cases/domain/user.js";
import { PERMISSIONS, SCOPE_LABEL, SCOPES_FOR_KIND } from "../domain/permissions.js";
import { RoleDto, UpdateRoleDto } from "../restapi/dto.js";
import { RbacRepo } from "./rbac.repo.js";

const AUDIT_LIMIT = 200;

const need = (u: AppUser) => {
  if (!u.perms.includes("admin.roles")) throw new ForbiddenException({ code: "FORBIDDEN", message: "Bạn không có quyền quản trị phân quyền" });
};

/** Vai trò & phân quyền (RBAC). Chỉ vai trò có quyền `admin.roles`. Mọi thay đổi ghi nhật ký. */
@ApiTags("rbac")
@Controller("rbac")
export class RbacController {
  constructor(private readonly repo: RbacRepo) {}

  /** Vai trò + danh mục quyền + phạm vi hợp lệ theo loại + cảnh báo quy trình thiếu người. */
  @Get("roles")
  async list(@CurrentUser() u: AppUser) {
    need(u);
    return { ...(await this.repo.overview()), permissions: PERMISSIONS, scopes: SCOPE_LABEL, scopesForKind: SCOPES_FOR_KIND };
  }

  @Post("roles")
  create(@CurrentUser() u: AppUser, @Body() d: RoleDto) {
    need(u);
    return this.repo.create(u.id, d);
  }

  @Patch("roles/:id")
  @HttpCode(204)
  update(@CurrentUser() u: AppUser, @Param("id", ParseIntPipe) id: number, @Body() d: UpdateRoleDto) {
    need(u);
    return this.repo.update(u.id, id, d);
  }

  @Delete("roles/:id")
  @HttpCode(204)
  remove(@CurrentUser() u: AppUser, @Param("id", ParseIntPipe) id: number) {
    need(u);
    return this.repo.remove(u.id, id);
  }

  @Get("audit")
  audit(@CurrentUser() u: AppUser) {
    need(u);
    return this.repo.audit(AUDIT_LIMIT);
  }
}
