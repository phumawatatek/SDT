import { Inject, Injectable } from "@nestjs/common";
import type { CaseRow } from "../domain/case.js";
import { addWorkdays, setHolidays, todayVN } from "../domain/deadline.js";
import type { CaseStatus } from "../domain/status.js";
import type { AppUser } from "../domain/user.js";
import { publicView } from "../domain/view.js";
import { CaseError } from "./case-errors.js";
import { CASE_STORE, type CaseStore, type TopicInfo } from "./case-store.port.js";

const PHONE = /^0\d{9}$/;

export interface SubmitCommand {
  topic: string;
  ward: string;
  address: string;
  description: string;
  photos: number;
  consentShowKp: boolean;
  onBehalfName: string;
  onBehalfPhone: string;
}

/** Chuyên đề dễ là khiếu nại hoặc ngoài phường → qua điều phối (SYSTEM_SPEC §5). */
const VIA_COORDINATOR = new Set(["Đất đai", "Khác / Không rõ", "Điện, nước, viễn thông"]);

interface Route {
  status: CaseStatus;
  unitId: number | null;
  handlerId: number | null;
}

/** Gửi phản ánh (người dân / trưởng KP gửi hộ) và tra cứu công khai bằng mã. */
@Injectable()
export class SubmitService {
  constructor(@Inject(CASE_STORE) private readonly store: CaseStore) {}

  /** Định tuyến: luồng kín → Chủ tịch; chuyên đề rõ → giao thẳng đơn vị chủ trì; còn lại → hàng chờ điều phối. */
  private async route(t: TopicInfo): Promise<Route> {
    if (t.sensitive) return { status: "dang_xu_ly", unitId: t.defaultUnitId, handlerId: await this.store.userIdByRole("chutich") };
    if (!t.defaultUnitId || VIA_COORDINATOR.has(t.name)) return { status: "cho_dieu_phoi", unitId: null, handlerId: null };
    return { status: "da_giao", unitId: t.defaultUnitId, handlerId: null };
  }

  async submit(u: AppUser, d: SubmitCommand): Promise<string> {
    if (!u.perms.includes("gui_phan_anh")) throw new CaseError("FORBIDDEN", "Vai trò của bạn không được gửi phản ánh");
    const onBehalf = u.role === "kp";
    if (onBehalf && (d.onBehalfName.trim().length < 2 || !PHONE.test(d.onBehalfPhone.trim()))) {
      throw new CaseError("INVALID", "Cần họ tên và SĐT người được gửi hộ");
    }
    const [topic, wardId] = await Promise.all([this.store.topicByName(d.topic), this.store.wardIdByName(d.ward)]);
    if (!topic || !wardId) throw new CaseError("INVALID", "Chuyên đề hoặc khu phố không hợp lệ");
    const today = todayVN();
    setHolidays(await this.store.holidays());
    const [r, code, phone] = await Promise.all([this.route(topic), this.store.nextCode(today), this.store.phoneOf(u.id)]);
    await this.store.create({
      code, description: d.description.trim(), address: d.address.trim(), topicId: topic.id, wardId,
      urgent: topic.urgent, sensitive: topic.sensitive, onBehalf, status: r.status, unitId: r.unitId, handlerId: r.handlerId,
      dueAt: addWorkdays(today, topic.urgent ? 1 : topic.slaDays), photos: d.photos,
      sender: {
        name: onBehalf ? d.onBehalfName.trim() : u.name, phone: onBehalf ? d.onBehalfPhone.trim() : (phone ?? ""),
        userId: onBehalf ? null : u.id, enteredById: onBehalf ? u.id : null, consentShowKp: !onBehalf && d.consentShowKp,
      },
      actor: { id: u.id, name: u.name },
    });
    return code;
  }

  catalog() {
    return this.store.catalog();
  }

  async lookup(code: string): Promise<CaseRow | null> {
    const c = await this.store.findByCode(code);
    return c ? publicView(c) : null;
  }
}
