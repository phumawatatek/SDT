"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useCases, useUser } from "@/components/shell/ShellContext";
import { Button } from "@/components/ui/Button";
import { CaseTable } from "@/components/ui/CaseTable";
import { applyAll, baseFilter, distinct, fromParams, reportText, type AllFilter } from "@/lib/allFilter";
import { applyQuery } from "@/lib/list";
import { useSearchLog } from "./useSearchLog";
import { GROUPS, inGroup } from "@/lib/stats";
import { STATUS_META, type CaseStatus } from "@/lib/status";
import type { CaseRow } from "@/lib/case";

type SetF = (patch: Partial<AllFilter>) => void;

function Select({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-0.5 text-[12px] text-muted">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-8 rounded-control border border-line bg-white px-2 text-[13px] text-ink">
        <option value="">Tất cả</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function Filters({ f, set, scoped }: { f: AllFilter; set: SetF; scoped: CaseRow[] }) {
  const statusCount = (s: CaseStatus) => scoped.filter((c) => baseFilter(c, { ...f, status: "" }) && c.status === s).length;
  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select label="Thời gian" value={f.days} onChange={(v) => set({ days: v as AllFilter["days"] })} options={[["7", "7 ngày"], ["30", "30 ngày"], ["90", "90 ngày"]]} />
      <Select label="Phòng" value={f.unit} onChange={(v) => set({ unit: v })} options={distinct(scoped, "unit").map((u) => [u, u])} />
      <Select label="Chuyên đề" value={f.topic} onChange={(v) => set({ topic: v })} options={distinct(scoped, "topic").map((t) => [t, t])} />
      <Select label="Trạng thái" value={f.status} onChange={(v) => set({ status: v as AllFilter["status"] })}
        options={(Object.keys(STATUS_META) as CaseStatus[]).map((s) => [s, `${STATUS_META[s].staffLabel} (${statusCount(s)})`])} />
      <Select label="Khu phố" value={f.ward} onChange={(v) => set({ ward: v })} options={distinct(scoped, "ward").map((w) => [w, w])} />
      <Button kind={f.overdueOnly ? "danger" : "normal"} aria-pressed={f.overdueOnly} onClick={() => set({ overdueOnly: !f.overdueOnly })}>Chỉ vụ quá hạn</Button>
    </div>
  );
}

function Report({ rows, f }: { rows: CaseRow[]; f: AllFilter }) {
  const [copied, setCopied] = useState(false);
  const text = reportText(rows, f);
  return (
    <details className="rounded-panel border border-line bg-white px-3.5 py-2">
      <summary className="cursor-pointer font-semibold">Lập báo cáo theo bộ lọc</summary>
      <pre className="my-2 whitespace-pre-wrap rounded-control bg-paper p-2 font-sans">{text}</pre>
      <Button size="sm" onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true), () => setCopied(false))}>{copied ? "Đã sao chép" : "Sao chép"}</Button>
    </details>
  );
}

/** Tất cả phản ánh: một cách lọc duy nhất (PHASE1_SPEC §13). */
export function AllCasesView() {
  const params = useSearchParams();
  // Đổi URL (bấm thẻ chỉ số, menu) thì khởi tạo lại bộ lọc theo URL.
  return <AllCasesInner key={params.toString()} params={params} />;
}

function AllCasesInner({ params }: { params: URLSearchParams }) {
  const user = useUser();
  const [f, setF] = useState<AllFilter>(() => fromParams(params));
  const set: SetF = (patch) => setF((prev) => ({ ...prev, ...patch }));
  const scoped = useCases();
  // Áp từ khóa trước để số đếm ở nhóm và ô Trạng thái khớp với danh sách.
  const searched = applyQuery(user, scoped, { q: f.q, filters: {} });
  const rows = applyAll(searched, f);
  const onSearch = (q: string) => set({ q });
  useSearchLog(user, rows, f.q);

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-[17px] font-bold">Tất cả phản ánh</h1>
      <div role="group" aria-label="Nhóm trạng thái" className="flex flex-wrap gap-1">
        {GROUPS.map((g) => (
          <button key={g.id} type="button" aria-pressed={f.group === g.id} onClick={() => set({ group: g.id })}
            className={`rounded-group border px-2.5 py-1 ${f.group === g.id ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>
            {g.label} ({searched.filter((c) => baseFilter(c, f) && inGroup(c, g.id)).length})
          </button>
        ))}
      </div>
      <input type="search" aria-label="Tìm kiếm" placeholder="Tìm không cần dấu, nhiều từ, mọi trường…" value={f.q}
        onChange={(e) => onSearch(e.target.value)} className="h-8 w-full max-w-md rounded-control border border-line bg-white px-2.5" />
      <Filters f={f} set={set} scoped={searched} />
      <Report key={reportText(rows, f)} rows={rows} f={f} />
      <CaseTable compact user={user} rows={rows} total={scoped.length} />
    </div>
  );
}
