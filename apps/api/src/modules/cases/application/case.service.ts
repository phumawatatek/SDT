import { Inject, Injectable } from "@nestjs/common";
import { canSeeIdentity, canView } from "../domain/access.js";
import { actionsFor } from "../domain/actions.js";
import { setHolidays, todayVN } from "../domain/deadline.js";
import { hitByIdentity } from "../domain/list.js";
import { actorLabel, identitiesOf, type AppUser } from "../domain/user.js";
import { viewFor, type CaseView } from "../domain/view.js";
import { transition } from "../domain/workflow.js";
import { CaseError, notFound } from "./case-errors.js";
import { CASE_STORE, type CaseStore, type StepOp, type StoredCase } from "./case-store.port.js";

export const MIN_REASON = 5;
const LOG_DEDUPE_MS = 60_000;

export interface EditCommand {
  ward: string;
  address: string;
  description: string;
}

export interface ActionCommand {
  actionId: string;
  reason?: string;
  target?: string;
  share?: boolean;
}

/** Nghiệp vụ trên phản ánh. Mọi quyền kiểm ở đây bằng đúng quy tắc domain (actionsFor, canView). */
@Injectable()
export class CaseService {
  constructor(@Inject(CASE_STORE) private readonly store: CaseStore) {}

  /** Các vụ người dùng được xem (đã che, kèm thao tác) — gồm vụ của người đang ủy quyền cho họ. */
  async list(u: AppUser): Promise<CaseView[]> {
    const seen = new Map<string, CaseView>();
    for (const who of identitiesOf(u)) {
      if (who.role === "admin") continue;
      for (const c of await this.store.listScoped(who)) {
        if (!seen.has(c.code) && canView(who, c)) seen.set(c.code, viewFor(who, c));
      }
    }
    return [...seen.values()];
  }

  directory(u: AppUser) {
    return this.store.directory(u);
  }

  /** Nạp vụ + danh tính đầu tiên được xem nó (mình, hoặc người ủy quyền). Lỗi chung để không lộ vụ có tồn tại hay không. */
  private async load(u: AppUser, code: string): Promise<{ c: StoredCase; as: AppUser }> {
    const c = await this.store.findByCode(code);
    const as = c && identitiesOf(u).find((who) => canView(who, c));
    if (!c || !as) throw notFound();
    return { c, as };
  }

  /** Danh tính có thao tác `actionId` trên vụ (ưu tiên chính mình). */
  private async loadFor(u: AppUser, code: string, actionId: string) {
    const c = await this.store.findByCode(code);
    if (!c || !identitiesOf(u).some((who) => canView(who, c))) throw notFound();
    for (const as of identitiesOf(u)) {
      const action = canView(as, c) ? actionsFor(as, c).find((a) => a.id === actionId) : undefined;
      if (action) return { c, as, action };
    }
    return { c, as: u, action: undefined };
  }

  private async checkTarget(kind: "unit" | "handler", target: string | undefined, c: StoredCase) {
    if (!target) throw new CaseError("INVALID", "Chưa chọn đích giao");
    const ok = kind === "unit" ? await this.store.unitExists(target) : await this.store.isStaffOf(target, c.unit);
    if (!ok) throw new CaseError("INVALID", kind === "unit" ? "Phòng không hợp lệ" : "Cán bộ không thuộc phòng xử lý");
  }

  /** Thực hiện một thao tác trong khung "Việc cần làm". */
  async perform(u: AppUser, code: string, cmd: ActionCommand): Promise<void> {
    const { c, as, action } = await this.loadFor(u, code, cmd.actionId);
    if (!action) throw new CaseError("FORBIDDEN", "Bạn không được thực hiện thao tác này ở trạng thái hiện tại");
    if (action.disabledReason) throw new CaseError("INVALID", action.disabledReason);
    const reason = cmd.reason?.trim() || undefined;
    if ((action.needsReason || action.id === "ghi_chu") && (reason ?? "").length < MIN_REASON) {
      throw new CaseError("INVALID", `Cần nhập ít nhất ${MIN_REASON} ký tự`);
    }
    if (action.target) await this.checkTarget(action.target, cmd.target, c);
    const actor = { ...u, name: actorLabel(u, as) };
    if (action.id === "ghi_chu") return this.store.saveNote(c, actor, reason ?? "", cmd.share ?? false);
    setHolidays(await this.store.holidays());
    const t = transition(c, action.id, { reason, target: cmd.target }, as.name, todayVN());
    if (!t) throw new CaseError("INVALID", "Thao tác chưa được hỗ trợ");
    if (!(await this.store.applyPatch(c, t.patch, actor, t.event, reason))) {
      throw new CaseError("CONFLICT", "Phản ánh vừa được người khác cập nhật, tải lại để xem");
    }
  }

  /** Người dân sửa phản ánh của mình khi chưa có cán bộ nhận (thao tác "sua_noi_dung"). */
  async edit(u: AppUser, code: string, d: EditCommand): Promise<void> {
    const { c, action } = await this.loadFor(u, code, "sua_noi_dung");
    if (!action) throw new CaseError("FORBIDDEN", "Phản ánh không còn sửa được: đã có cán bộ nhận hoặc đã kết thúc. Bạn có thể bổ sung khi phường hỏi.");
    const wardId = await this.store.wardIdByName(d.ward);
    if (!wardId) throw new CaseError("INVALID", "Khu phố không hợp lệ");
    const ok = await this.store.updateContent(c, { wardId, address: d.address.trim(), description: d.description.trim() }, u);
    if (!ok) throw new CaseError("CONFLICT", "Phản ánh vừa được cập nhật, tải lại để xem");
  }

  /** Cán bộ thao tác bước/ảnh: chỉ khi đang được phép gửi kết quả (đúng người xử lý, đúng trạng thái). */
  private async loadForWorker(u: AppUser, code: string): Promise<{ c: StoredCase; actor: AppUser }> {
    const { c, as, action } = await this.loadFor(u, code, "gui_ket_qua");
    if (!action) throw new CaseError("FORBIDDEN", "Bạn không xử lý phản ánh này");
    return { c, actor: { ...u, name: actorLabel(u, as) } };
  }

  async step(u: AppUser, code: string, index: number, op: StepOp, reason?: string): Promise<void> {
    const { c, actor } = await this.loadForWorker(u, code);
    const step = c.steps[index];
    if (!step) throw new CaseError("INVALID", "Bước không tồn tại");
    const why = reason?.trim() ?? "";
    if (op === "skip" && (step.required || why.length < MIN_REASON)) {
      throw new CaseError("INVALID", "Bước bắt buộc không bỏ qua được, hoặc thiếu lý do");
    }
    await this.store.updateStep(c, actor, index, op, op === "skip" ? why : undefined);
  }

  /** Thêm ảnh sau xử lý. Chưa có kho lưu tệp — ghi bản ghi đính kèm với đường dẫn tạm (xem questions.md). */
  async addAfterPhoto(u: AppUser, code: string): Promise<void> {
    await this.store.addPhoto((await this.loadForWorker(u, code)).c, "sau");
  }

  /** Nhật ký xem danh tính người gửi (Luật 91/2025). */
  async logIdentityView(u: AppUser, code: string): Promise<void> {
    const { c, as } = await this.load(u, code);
    if (canSeeIdentity(as, c)) await this.store.logAccess(u.id, code, "Xem danh tính người gửi", LOG_DEDUPE_MS);
  }

  /** Nhật ký tìm kiếm trúng theo tên/SĐT người gửi — tự kiểm lại vụ có thật sự trúng không. */
  async logSearchHits(u: AppUser, codes: string[], q: string): Promise<void> {
    if (q.trim().length < 2 || codes.length === 0) return;
    const found = await this.store.findByCodes(codes);
    for (const c of found.filter((x) => identitiesOf(u).some((who) => canView(who, x) && hitByIdentity(who, x, q)))) {
      await this.store.logAccess(u.id, c.code, "Tìm kiếm trúng theo tên/SĐT người gửi", LOG_DEDUPE_MS);
    }
  }
}
