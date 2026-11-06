import { LabelValue, Panel } from "@/components/ui/Panel";
import { StepBar } from "@/components/ui/StepBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DemoUser } from "@/lib/roles";
import type { CaseView } from "@/api/types";
import type { CaseRow } from "@/lib/case";
import { ActionPanel } from "./ActionPanel";

/** Người dân xem một cột: Việc của bạn → Kết quả → Thông tin → Hình ảnh → Tiến độ. Không lộ trạng thái nội bộ. */
/** `user = null`: tra cứu bằng mã không đăng nhập — chỉ hiện trạng thái, kết quả, tiến độ; không địa chỉ, không ghi chú. */
export function CitizenDetail({ user, c }: { user: DemoUser | null; c: CaseRow | CaseView }) {
  const unit = c.sensitive ? "UBND phường" : c.unit;
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 text-[15px]">
      <header>
        <p className="text-[12px] text-muted">Mã tra cứu {c.code}</p>
        <h1 className="text-[17px] font-bold">{c.title}</h1>
        <div className="mt-1"><StatusBadge status={c.status} audience="citizen" /></div>
      </header>
      {user && "actions" in c && <ActionPanel key={c.code} c={c} />}
      <Panel title="Kết quả">{c.result ?? <p className="text-muted">Phường đang xử lý, kết quả sẽ báo qua Zalo.</p>}</Panel>
      {user ? (
        <>
          <Panel title="Thông tin">
            <LabelValue rows={[["Chuyên đề", c.topic], ["Địa chỉ", c.address], ["Ngày gửi", c.submittedAt], ["Đơn vị xử lý", unit]]} />
            {c.kpNote?.shared && <p className="mt-2 border-l-4 border-gold pl-2">Trưởng khu phố: {c.kpNote.text}</p>}
          </Panel>
          <Panel title="Hình ảnh">
            <p>Ảnh bạn gửi: {c.photosBefore} · Ảnh sau xử lý: {c.photosAfter}</p>
          </Panel>
        </>
      ) : (
        <Panel title="Thông tin">
          <LabelValue rows={[["Chuyên đề", c.topic], ["Ngày gửi", c.submittedAt], ["Đơn vị xử lý", unit]]} />
          <p className="mt-2 text-[12px] text-muted">Đăng nhập để xem địa chỉ, hình ảnh và thao tác.</p>
        </Panel>
      )}
      <Panel title="Tiến độ"><StepBar status={c.status} /></Panel>
    </div>
  );
}
