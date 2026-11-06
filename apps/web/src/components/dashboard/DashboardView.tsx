"use client";

import { useState } from "react";
import { useCases, useUser } from "@/components/shell/ShellContext";
import { CaseTable } from "@/components/ui/CaseTable";
import { Panel } from "@/components/ui/Panel";
import { deadlineState } from "@/lib/deadline";
import type { DemoUser } from "@/lib/roles";
import { countBy, kpis, quality, TREND_12M, unitResults } from "@/lib/stats";
import type { CaseRow } from "@/lib/case";
import { BarList, KpiCard, QualityRing, TrendChart } from "./Widgets";

const PERIODS = ["7 ngày", "30 ngày", "90 ngày", "12 tháng"] as const;

function scopeOf(user: DemoUser, seen: CaseRow[]): { label: string; cases: CaseRow[] } {
  if (user.role === "truongphong") return { label: user.unit ?? "Phòng", cases: seen };
  if (user.role === "phochutich") return { label: "Khối phụ trách", cases: seen.filter((c) => (user.units ?? []).includes(c.unit)) };
  return { label: "Toàn phường", cases: seen.filter((c) => !c.sensitive) };
}

function UnitTable({ cases }: { cases: CaseRow[] }) {
  return (
    <table className="w-full text-[12.5px]">
      <thead className="bg-th-bg text-left text-[11.5px]">
        <tr><th scope="col" className="px-2 py-1">Đơn vị</th><th scope="col" className="px-2 py-1 text-right">Tiếp nhận</th><th scope="col" className="px-2 py-1 text-right">Đã giải quyết</th><th scope="col" className="px-2 py-1 text-right">Quá hạn</th></tr>
      </thead>
      <tbody>
        {unitResults(cases).map((u) => (
          <tr key={u.unit} className="border-b border-line-2">
            <td className="px-2 py-1"><a className="text-brand hover:underline" href={`/tat-ca?phong=${encodeURIComponent(u.unit)}`}>{u.unit}</a></td>
            <td className="px-2 py-1 text-right tabular-nums">{u.total}</td>
            <td className="px-2 py-1 text-right tabular-nums">{u.done}</td>
            <td className={`px-2 py-1 text-right tabular-nums ${u.overdue ? "font-semibold text-red" : ""}`}>{u.overdue}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Dashboard 6 khối (PHASE1_SPEC §13). Mọi số, cột, thanh đều mở đúng danh sách. */
export function DashboardView() {
  const user = useUser();
  const all = useCases();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>("30 ngày");
  const [unitTab, setUnitTab] = useState("Tất cả");
  const scope = scopeOf(user, all);
  const units = ["Tất cả", ...countBy(scope.cases, "unit").map(([u]) => u)];
  // Đổi vai trò có thể làm tab đơn vị không còn trong phạm vi: quay về "Tất cả".
  const activeUnit = units.includes(unitTab) ? unitTab : "Tất cả";
  const cases = activeUnit === "Tất cả" ? scope.cases : scope.cases.filter((c) => c.unit === activeUnit);
  const unitParam = activeUnit !== "Tất cả" ? activeUnit : user.role === "truongphong" ? user.unit : undefined;
  const scopeQs = unitParam ? `&phong=${encodeURIComponent(unitParam)}` : "";
  const near = cases.filter((c) => ["soon", "overdue"].includes(deadlineState(c.status, c.dueAt)));
  const sensitive = user.role === "chutich" ? all.filter((c) => c.sensitive) : [];

  if (user.role !== "chutich" && user.role !== "phochutich" && user.role !== "truongphong") {
    return <p className="rounded-panel bg-white p-6 text-center text-muted">Vai trò này không có dashboard.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[17px] font-bold">Dashboard · {scope.label}</h1>
        <div role="group" aria-label="Chọn kỳ (bản demo: số liệu chưa đổi theo kỳ)" className="flex items-center gap-1">
          <span className="text-[12px] text-muted">Kỳ (demo):</span>
          {PERIODS.map((p) => (
            <button key={p} type="button" aria-pressed={p === period} onClick={() => setPeriod(p)}
              className={`rounded-group border px-2 py-1 ${p === period ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>{p}</button>
          ))}
        </div>
      </div>
      {user.role !== "truongphong" && (
        <div role="tablist" aria-label="Đơn vị" className="flex flex-wrap gap-1">
          {units.map((u) => (
            <button key={u} type="button" role="tab" aria-selected={u === activeUnit} onClick={() => setUnitTab(u)}
              className={`rounded-group px-2 py-1 ${u === activeUnit ? "bg-blue-tint font-semibold text-brand-ink" : "text-muted"}`}>{u}</button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-5 gap-3 max-[1099px]:grid-cols-2">{kpis(cases, scopeQs).map((k) => <KpiCard key={k.id} k={k} />)}</div>
      <div className="grid grid-cols-2 gap-3 max-[1099px]:grid-cols-1">
        <Panel title="Chất lượng giải quyết"><div className="flex justify-around">{quality(cases).map((q) => <QualityRing key={q.id} q={q} />)}</div></Panel>
        <Panel title="Theo chuyên đề"><BarList label="Số phản ánh theo chuyên đề" items={countBy(cases, "topic")} hrefFor={(t) => `/tat-ca?chuyen-de=${encodeURIComponent(t)}${scopeQs}`} /></Panel>
      </div>
      <Panel title="Xu hướng 12 tháng"><TrendChart data={TREND_12M} /></Panel>
      <Panel title="Kết quả theo đơn vị"><UnitTable cases={cases} /></Panel>
      <Panel title="Phản ánh gần hạn và quá hạn"><CaseTable compact user={user} rows={near} total={cases.length} /></Panel>
      {sensitive.length > 0 && <Panel title="Luồng kín – phản ánh về cán bộ"><CaseTable compact user={user} rows={sensitive} total={sensitive.length} /></Panel>}
    </div>
  );
}
