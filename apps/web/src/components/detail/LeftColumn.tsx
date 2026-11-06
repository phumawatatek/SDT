import { LabelValue, Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import type { CaseRow } from "@/lib/case";
import { StepsList, type StepWork } from "./StepsList";

export type { StepWork };

function Photos({ label, count }: { label: string; count: number }) {
  return (
    <figure className="flex-1">
      <figcaption className="mb-1 text-[12px] font-semibold uppercase text-muted">{label}</figcaption>
      {count === 0 ? (
        <p className="rounded-control border border-dashed border-line p-4 text-center text-muted">Chưa có ảnh</p>
      ) : (
        <ul className="grid grid-cols-3 gap-1.5">
          {Array.from({ length: count }, (_, i) => (
            <li key={i} className="grid aspect-square place-items-center rounded-control bg-paper text-[12px] text-muted">
              Ảnh {i + 1}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

/** Cột trái (đọc): Thông tin → Quy trình → Kết quả → Hình ảnh → Ghi chú trưởng KP (PHASE1_SPEC §13). */
export function LeftColumn({ c, showCoords, work }: { c: CaseRow; showCoords: boolean; work?: StepWork }) {
  return (
    <div className="flex flex-col gap-3">
      <Panel title="Thông tin phản ánh">
        <blockquote className="mb-3 border-l-4 border-brand bg-blue-tint px-3 py-2">{c.content}</blockquote>
        <LabelValue
          rows={[
            ["Chuyên đề", c.topic],
            ["Khu phố", c.ward],
            ["Địa chỉ", c.address],
            ...(showCoords ? ([["Tọa độ", c.coords]] as [string, string][]) : []),
            ["Kênh gửi", c.channel],
            ["Đơn vị chủ trì", c.unit],
          ]}
        />
      </Panel>
      <Panel title="Quy trình xử lý"><StepsList c={c} work={work} /></Panel>
      <Panel title="Kết quả">{c.result ?? <p className="text-muted">Chưa có kết quả.</p>}</Panel>
      <Panel title="Hình ảnh" actions={work && <Button size="sm" onClick={work.addPhoto}>+ Thêm ảnh sau xử lý</Button>}>
        <div className="flex gap-3 max-[759px]:flex-col">
          <Photos label="Người dân gửi" count={c.photosBefore} />
          <Photos label="Sau khi xử lý" count={c.photosAfter} />
        </div>
      </Panel>
      <Panel title="Ghi chú trưởng khu phố">
        {c.kpNote ? (
          <p>{c.kpNote.text} <span className="text-[12px] text-muted">{c.kpNote.shared ? "· Đã gửi cho người dân xem" : "· Chỉ cán bộ xem"}</span></p>
        ) : (
          <p className="text-muted">Chưa có ghi chú.</p>
        )}
      </Panel>
    </div>
  );
}
