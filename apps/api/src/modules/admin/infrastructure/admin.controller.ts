import {
  BadRequestException, Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, ParseIntPipe, Patch, Post,
  UnprocessableEntityException, type PipeTransform,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../shared/auth/session.guard.js";
import type { Role } from "../../cases/domain/roles.js";
import type { AppUser } from "../../cases/domain/user.js";
import { checkDelegation, checkNotSelf, checkRange, checkUser } from "../domain/admin-rules.js";
import {
  AssignmentDto, CreateUserDto, DelegationDto, HolidayDto, PasswordDto, TopicDto, UpdateAssignmentDto,
  UpdateDelegationDto, UpdateTopicDto, UpdateUserDto, UpdateWardDto, WardDto,
} from "../restapi/dto.js";
import { isAdminPerm } from "../../rbac/domain/permissions.js";
import { AdminRepo, ENTITIES, hashPassword, type Entity } from "./admin.repo.js";

const LOG_LIMIT = 200;

class EntityPipe implements PipeTransform<string, Entity> {
  transform(v: string): Entity {
    if (!(v in ENTITIES)) throw new BadRequestException({ code: "INVALID_REQUEST", message: "Mục quản trị không hợp lệ" });
    return v as Entity;
  }
}

/** Quyền quản trị theo từng mục (RBAC). Không truyền mục = cần ít nhất một quyền quản trị. */
const admin = (u: AppUser, perm?: string) => {
  const ok = perm ? u.perms.includes(perm) : u.perms.some(isAdminPerm);
  if (!ok) throw new ForbiddenException({ code: "FORBIDDEN", message: "Bạn không có quyền quản trị mục này" });
};
const reject = (msg: string | undefined) => {
  if (msg) throw new UnprocessableEntityException({ code: "INVALID", message: msg });
};

/** Quản trị: cấu hình — không xem nội dung phản ánh. Xoá mềm = PATCH { active: false }; xoá cứng = DELETE (bị chặn nếu đã dùng). */
@ApiTags("admin")
@Controller("admin")
export class AdminController {
  constructor(private readonly repo: AdminRepo) {}

  /** Loại vai trò của roleId (422 nếu không tồn tại). */
  private async kindOf(roleId: number): Promise<Role> {
    const kind = await this.repo.roleKind(roleId);
    reject(kind ? undefined : "Vai trò không tồn tại");
    return kind!;
  }

  @Get("options")
  options(@CurrentUser() u: AppUser) {
    admin(u);
    return this.repo.options();
  }

  @Get("access-log")
  async log(@CurrentUser() u: AppUser) {
    admin(u, "admin.log");
    return (await this.repo.accessLog(LOG_LIMIT)).map((e) => ({ ...e, at: e.at.toISOString() }));
  }

  @Get("holidays")
  holidays(@CurrentUser() u: AppUser) {
    admin(u, "admin.holidays");
    return this.repo.holidays();
  }

  @Post("holidays")
  @HttpCode(204)
  addHoliday(@CurrentUser() u: AppUser, @Body() d: HolidayDto) {
    admin(u, "admin.holidays");
    return this.repo.addHoliday(d.date, d.name.trim());
  }

  @Delete("holidays/:date")
  @HttpCode(204)
  removeHoliday(@CurrentUser() u: AppUser, @Param("date") date: string) {
    admin(u, "admin.holidays");
    return this.repo.removeHoliday(date);
  }

  @Get(":entity")
  list(@CurrentUser() u: AppUser, @Param("entity", EntityPipe) entity: Entity) {
    admin(u, `admin.${entity}`);
    return this.repo.list(entity);
  }

  /** Xoá cứng. Đã gắn phản ánh / lịch sử → 409, dùng PATCH active=false để khoá. */
  @Delete(":entity/:id")
  @HttpCode(204)
  remove(@CurrentUser() u: AppUser, @Param("entity", EntityPipe) entity: Entity, @Param("id", ParseIntPipe) id: number) {
    admin(u, `admin.${entity}`);
    if (entity === "users") reject(checkNotSelf(u.id, id, { deleting: true }));
    return this.repo.remove(entity, id);
  }

  @Post("users")
  async createUser(@CurrentUser() u: AppUser, @Body() d: CreateUserDto) {
    admin(u, "admin.users");
    const role = await this.kindOf(d.roleId);
    reject(checkUser({ ...d, role }));
    const { password, ...rest } = d;
    return this.repo.create("users", { ...rest, role, phone: rest.phone || null, passwordHash: await hashPassword(password) });
  }

  @Patch("users/:id")
  @HttpCode(204)
  async updateUser(@CurrentUser() u: AppUser, @Param("id", ParseIntPipe) id: number, @Body() d: UpdateUserDto) {
    admin(u, "admin.users");
    const cur = await this.repo.find("users", id);
    const role = d.roleId === undefined ? (cur["role"] as Role) : await this.kindOf(d.roleId);
    reject(checkNotSelf(u.id, id, { ...d, role }));
    reject(checkUser({ role, unitId: d.unitId === undefined ? (cur["unitId"] as number | null) : d.unitId, wardId: d.wardId === undefined ? (cur["wardId"] as number | null) : d.wardId }));
    return this.repo.update("users", id, { ...d, role, ...(d.phone === "" ? { phone: null } : {}) });
  }

  @Post("users/:id/password")
  @HttpCode(204)
  password(@CurrentUser() u: AppUser, @Param("id", ParseIntPipe) id: number, @Body() d: PasswordDto) {
    admin(u, "admin.users");
    return this.repo.setPassword(id, d.password);
  }

  @Post("topics")
  createTopic(@CurrentUser() u: AppUser, @Body() d: TopicDto) {
    admin(u, "admin.topics");
    return this.repo.create("topics", { ...d });
  }

  @Patch("topics/:id")
  @HttpCode(204)
  updateTopic(@CurrentUser() u: AppUser, @Param("id", ParseIntPipe) id: number, @Body() d: UpdateTopicDto) {
    admin(u, "admin.topics");
    return this.repo.update("topics", id, { ...d });
  }

  @Post("wards")
  createWard(@CurrentUser() u: AppUser, @Body() d: WardDto) {
    admin(u, "admin.wards");
    return this.repo.create("wards", { ...d, name: d.name.trim() });
  }

  @Patch("wards/:id")
  @HttpCode(204)
  updateWard(@CurrentUser() u: AppUser, @Param("id", ParseIntPipe) id: number, @Body() d: UpdateWardDto) {
    admin(u, "admin.wards");
    return this.repo.update("wards", id, { ...d });
  }

  @Post("assignments")
  createAssignment(@CurrentUser() u: AppUser, @Body() d: AssignmentDto) {
    admin(u, "admin.assignments");
    reject(checkRange(d.fromDate, d.toDate, "Phân công"));
    return this.repo.create("assignments", { ...d, toDate: d.toDate || null });
  }

  @Patch("assignments/:id")
  @HttpCode(204)
  async updateAssignment(@CurrentUser() u: AppUser, @Param("id", ParseIntPipe) id: number, @Body() d: UpdateAssignmentDto) {
    admin(u, "admin.assignments");
    const cur = await this.repo.find("assignments", id);
    reject(checkRange(d.fromDate ?? String(cur["fromDate"]), d.toDate === undefined ? (cur["toDate"] as string | null) : d.toDate, "Phân công"));
    return this.repo.update("assignments", id, d.toDate === "" ? { ...d, toDate: null } : { ...d });
  }

  @Post("delegations")
  createDelegation(@CurrentUser() u: AppUser, @Body() d: DelegationDto) {
    admin(u, "admin.delegations");
    reject(checkDelegation(d));
    return this.repo.create("delegations", { ...d });
  }

  @Patch("delegations/:id")
  @HttpCode(204)
  async updateDelegation(@CurrentUser() u: AppUser, @Param("id", ParseIntPipe) id: number, @Body() d: UpdateDelegationDto) {
    admin(u, "admin.delegations");
    const cur = await this.repo.find("delegations", id);
    reject(checkDelegation({
      fromUserId: d.fromUserId ?? Number(cur["fromUserId"]), toUserId: d.toUserId ?? Number(cur["toUserId"]),
      startDate: d.startDate ?? String(cur["startDate"]), endDate: d.endDate ?? String(cur["endDate"]),
    }));
    return this.repo.update("delegations", id, { ...d });
  }
}
