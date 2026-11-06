"use client";

import { useRouter } from "next/navigation";
import { COLUMNS, cellText, type ColumnKey, type ListQuery } from "@/lib/list";
import type { DemoUser } from "@/lib/roles";
import type { CaseRow } from "@/lib/case";
import { DeadlineBadge } from "./DeadlineBadge";
import { StatusBadge } from "./StatusBadge";

interface CaseTableProps {
  user: DemoUser;
  rows: CaseRow[];
  total: number;
  query?: ListQuery;
  onSort?: (key: ColumnKey) => void;
  onFilter?: (key: ColumnKey, value: string) => void;
  compact?: boolean;
}

export const ORDER_KEY = "pakn-list-order";

function Cell({ user, c, k }: { user: DemoUser; c: CaseRow; k: ColumnKey }) {
  if (k === "status") return <StatusBadge status={c.status} audience={user.role === "citizen" ? "citizen" : "staff"} />;
  if (k === "dueAt") return <span className="flex items-center gap-1 whitespace-nowrap">{c.dueAt} <DeadlineBadge status={c.status} dueAt={c.dueAt} /></span>;
  if (k === "code") return <span className="font-medium text-brand">{c.code}</span>;
  return <>{cellText(user, c, k)}</>;
}

function HeaderRow({ query, onSort }: Pick<CaseTableProps, "query" | "onSort">) {
  return (
    <tr>
      <th scope="col" className="border-b border-line px-2 py-1.5 text-left text-[11.5px] font-semibold">STT</th>
      {COLUMNS.map(({ key, label }) => {
        const dir = query?.sort?.key === key ? query.sort.dir : undefined;
        return (
          <th key={key} scope="col" aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none"}
            className="border-b border-line px-2 py-1.5 text-left text-[11.5px] font-semibold">
            {onSort ? (
              <button type="button" onClick={() => onSort(key)} className="flex items-center gap-1">
                {label}<span aria-hidden>{dir === "asc" ? "▲" : dir === "desc" ? "▼" : ""}</span>
              </button>
            ) : label}
          </th>
        );
      })}
    </tr>
  );
}

function FilterRow({ query, onFilter }: Required<Pick<CaseTableProps, "query" | "onFilter">>) {
  return (
    <tr>
      <td className="border-b border-line px-1 py-1" />
      {COLUMNS.map(({ key, label }) => (
        <td key={key} className="border-b border-line px-1 py-1">
          <input aria-label={`Lọc ${label}`} value={query.filters[key] ?? ""} onChange={(e) => onFilter(key, e.target.value)}
            className="h-6 w-full min-w-16 rounded-group border border-line px-1 text-[12px] font-normal" />
        </td>
      ))}
    </tr>
  );
}

/** Bảng kiểu Excel (PHASE1_SPEC §12): hàng lọc cột, bấm tiêu đề để sắp xếp, tiêu đề đứng yên. */
export function CaseTable({ user, rows, total, query, onSort, onFilter, compact }: CaseTableProps) {
  const router = useRouter();
  const open = (code: string) => {
    sessionStorage.setItem(ORDER_KEY, JSON.stringify(rows.map((r) => r.code)));
    router.push(`/phan-anh/${code}`);
  };
  return (
    <div className="max-h-[70vh] overflow-auto rounded-panel border border-line bg-white shadow-panel">
      <table className="w-full border-collapse text-[12.5px]">
        <thead className="sticky top-0 bg-th-bg">
          <HeaderRow query={query} onSort={onSort} />
          {!compact && query && onFilter && <FilterRow query={query} onFilter={onFilter} />}
        </thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={c.code} tabIndex={0} role="link" aria-label={`Mở phản ánh ${c.code}`} onClick={() => open(c.code)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(c.code); } }}
              className={`cursor-pointer border-b border-line-2 hover:bg-amber-tint focus-visible:bg-amber-tint ${c.reopened || c.urgent ? "font-semibold" : ""}`}>
              <td className="px-2 py-1.5">{i + 1}</td>
              {COLUMNS.map(({ key }) => (
                <td key={key} className={`px-2 py-1.5 ${key === "title" ? "max-w-[260px] truncate" : "whitespace-nowrap"}`}>
                  <Cell user={user} c={c} k={key} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="p-6 text-center text-muted">Không có phản ánh nào.</p>}
      <p className="border-t border-line-2 px-2 py-1.5 text-[12px] text-muted">Tổng số: {rows.length} phản ánh (lọc từ {total})</p>
    </div>
  );
}
