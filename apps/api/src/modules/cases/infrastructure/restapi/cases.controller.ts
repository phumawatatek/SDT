import {
  BadRequestException, Body, Controller, Get, HttpCode, NotFoundException, Param, Patch, Post, UseFilters, type PipeTransform,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../../shared/auth/session.guard.js";
import { CaseService } from "../../application/case.service.js";
import { SubmitService } from "../../application/submit.service.js";
import type { AppUser } from "../../domain/user.js";
import { CaseErrorFilter } from "./case-error.filter.js";
import { ActionDto, EditCaseDto, CODE_RE, SearchHitsDto, StepDto, SubmitDto } from "./dto.js";

/** Kiểm mã tra cứu trên đường dẫn: PA-yymm-nnnn. */
class CodePipe implements PipeTransform<string, string> {
  transform(v: string) {
    if (!CODE_RE.test(v)) throw new BadRequestException({ code: "INVALID_REQUEST", message: "Mã không hợp lệ" });
    return v;
  }
}

@ApiTags("cases")
@UseFilters(CaseErrorFilter)
@Controller("cases")
export class CasesController {
  constructor(private readonly cases: CaseService, private readonly submits: SubmitService) {}

  /** Vụ người dùng được xem — đã lọc theo quyền, che danh tính, kèm thao tác được phép. */
  @Get()
  list(@CurrentUser() u: AppUser) {
    return this.cases.list(u);
  }

  /** Danh mục giao việc (phòng cho điều phối, cán bộ cho trưởng phòng). */
  @Get("directory")
  directory(@CurrentUser() u: AppUser) {
    return this.cases.directory(u);
  }

  @Post()
  async submit(@CurrentUser() u: AppUser, @Body() d: SubmitDto) {
    return { code: await this.submits.submit(u, d) };
  }

  @Post("search-hits")
  @HttpCode(204)
  searchHits(@CurrentUser() u: AppUser, @Body() d: SearchHitsDto) {
    return this.cases.logSearchHits(u, d.codes, d.q);
  }

  /** Người dân sửa phản ánh của mình (chỉ khi chưa có cán bộ nhận). */
  @Patch(":code")
  @HttpCode(204)
  edit(@CurrentUser() u: AppUser, @Param("code", CodePipe) code: string, @Body() d: EditCaseDto) {
    return this.cases.edit(u, code, d);
  }

  @Post(":code/actions")
  @HttpCode(204)
  perform(@CurrentUser() u: AppUser, @Param("code", CodePipe) code: string, @Body() d: ActionDto) {
    return this.cases.perform(u, code, d);
  }

  @Post(":code/steps")
  @HttpCode(204)
  step(@CurrentUser() u: AppUser, @Param("code", CodePipe) code: string, @Body() d: StepDto) {
    return this.cases.step(u, code, d.index, d.op, d.reason);
  }

  @Post(":code/photos")
  @HttpCode(204)
  photo(@CurrentUser() u: AppUser, @Param("code", CodePipe) code: string) {
    return this.cases.addAfterPhoto(u, code);
  }

  @Post(":code/identity-views")
  @HttpCode(204)
  identityView(@CurrentUser() u: AppUser, @Param("code", CodePipe) code: string) {
    return this.cases.logIdentityView(u, code);
  }
}

/** Danh mục công khai: chuyên đề, khu phố đang dùng, ngày nghỉ (form gửi phản ánh, tính hạn ở web). */
@ApiTags("public")
@Controller("public/catalog")
export class PublicCatalogController {
  constructor(private readonly submits: SubmitService) {}

  @Get()
  catalog() {
    return this.submits.catalog();
  }
}

/** Tra cứu công khai bằng mã — không cần đăng nhập, chỉ thông tin tối thiểu. */
@ApiTags("public")
@Controller("public/cases")
export class PublicCasesController {
  constructor(private readonly submits: SubmitService) {}

  @Get(":code")
  async lookup(@Param("code", CodePipe) code: string) {
    const c = await this.submits.lookup(code);
    if (!c) throw new NotFoundException({ code: "NOT_FOUND", message: "Không tìm thấy mã phản ánh" });
    return c;
  }
}
