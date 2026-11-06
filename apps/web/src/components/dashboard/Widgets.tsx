import Link from "next/link";
import type { Kpi, Quality } from "@/lib/stats";

/** Thẻ chỉ số: mũi tên so với kỳ trước (xanh tốt, đỏ xấu); bấm mở đúng danh sách. */
export function KpiCard({ k }: { k: Kpi }) {
  const good = k.delta === 0 || (k.delta > 0) === k.goodWhenUp;
  const arrow = k.delta > 0 ? "▲" : k.delta < 0 ? "▼" : "■";
  return (
    <Link href={k.href} className="rounded-panel border border-line bg-white px-3.5 py-3 shadow-panel hover:border-brand">
      <p className="text-[12px] text-muted">{k.label}</p>
      <p className="text-[22px] font-bold tabular-nums">{k.value}</p>
      <p className={`text-[12px] ${good ? "text-green" : "text-red"}`}>
        <span aria-hidden>{arrow}</span> {Math.abs(k.delta)} so với kỳ trước
        <span className="sr-only">{good ? " (tốt)" : " (xấu)"}</span>
      </p>
    </Link>
  );
}

/** Vòng chất lượng: Đạt / Chưa đạt so với vạch mục tiêu, ghi rõ căn cứ tính. */
export function QualityRing({ q }: { q: Quality }) {
  const ok = q.higherIsBetter ? q.pct >= q.target : q.pct <= q.target;
  const r = 30;
  const len = 2 * Math.PI * r;
  const desc = `${q.label} ${q.pct}%, mục tiêu ${q.higherIsBetter ? "≥" : "≤"} ${q.target}%, ${ok ? "đạt" : "chưa đạt"}. Căn cứ: ${q.basis}.`;
  return (
    <figure className="flex flex-col items-center gap-1">
      <svg viewBox="0 0 80 80" className="size-20" role="img" aria-label={desc}>
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--line-2)" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke={ok ? "var(--green)" : "var(--red)"} strokeWidth="8"
          strokeDasharray={`${(q.pct / 100) * len} ${len}`} transform="rotate(-90 40 40)" />
        <text x="40" y="45" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)">{q.pct}%</text>
      </svg>
      <figcaption className="text-center">
        <span className="font-semibold">{q.label}</span>
        <span className={`ml-1 rounded-group px-1 text-[12px] ${ok ? "bg-green-tint text-green-ink" : "bg-red-tint text-red"}`}>{ok ? "Đạt" : "Chưa đạt"}</span>
        <span className="block text-[12px] text-muted">Mục tiêu {q.higherIsBetter ? "≥" : "≤"} {q.target}% · {q.basis}</span>
      </figcaption>
    </figure>
  );
}

/** Thanh ngang có số; mỗi thanh là link mở danh sách tương ứng. Có mô tả bằng chữ. */
export function BarList({ items, hrefFor, label }: { items: [string, number][]; hrefFor: (k: string) => string; label: string }) {
  const max = Math.max(1, ...items.map(([, v]) => v));
  return (
    <ul aria-label={label} className="flex flex-col gap-1.5">
      {items.map(([k, v]) => (
        <li key={k}>
          <Link href={hrefFor(k)} className="grid grid-cols-[150px_1fr_32px] items-center gap-2 hover:text-brand">
            <span className="truncate">{k}</span>
            <span className="h-3 rounded-group bg-line-2"><span className="block h-full rounded-group bg-brand" style={{ width: `${(v / max) * 100}%` }} /></span>
            <span className="text-right tabular-nums">{v}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TrendChart({ data }: { data: [string, number][] }) {
  const max = Math.max(...data.map(([, v]) => v));
  const text = data.map(([m, v]) => `${m}: ${v}`).join(", ");
  return (
    <figure>
      <div className="flex h-32 items-end gap-1" role="img" aria-label={`Số phản ánh 12 tháng: ${text}`}>
        {data.map(([m, v]) => (
          <div key={m} className="flex flex-1 flex-col items-center gap-0.5">
            <span className="text-[11px] tabular-nums text-muted">{v}</span>
            <span className="w-full rounded-t-group bg-brand" style={{ height: `${(v / max) * 96}px` }} />
            <span className="text-[11px] text-muted">{m}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}
