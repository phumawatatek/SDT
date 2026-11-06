"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useCases, useUser } from "@/components/shell/ShellContext";
import { CaseTable } from "@/components/ui/CaseTable";
import { applyQuery, type ColumnKey, type ListQuery } from "@/lib/list";
import { useSearchLog } from "./useSearchLog";
import { TABSETS, type ListTab, type TabsetId } from "@/lib/tabs";

/** Mẫu Danh sách (PHASE1_SPEC §13): tab có số lượng, tab nằm trong URL, tìm kiếm → lọc cột → bảng. */
export function CaseListView({ title, tabset }: { title: string; tabset: TabsetId }) {
  const tabs: ListTab[] = TABSETS[tabset];
  const user = useUser();
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const [query, setQuery] = useState<ListQuery>({ q: "", filters: {} });

  const scoped = useCases();
  const tabId = params.get("tab") ?? tabs[0].id;
  const tab = tabs.find((t) => t.id === tabId) ?? tabs[0];
  const inTab = scoped.filter((c) => tab.match(c, user));
  const rows = applyQuery(user, inTab, query);

  const onSort = (key: ColumnKey) =>
    setQuery((q) => ({ ...q, sort: { key, dir: q.sort?.key === key && q.sort.dir === "asc" ? "desc" : "asc" } }));
  const onFilter = (key: ColumnKey, value: string) => setQuery((q) => ({ ...q, filters: { ...q.filters, [key]: value } }));

  const onSearch = (q: string) => setQuery((prev) => ({ ...prev, q }));
  useSearchLog(user, rows, query.q);

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-[17px] font-bold">{title}</h1>
      <div role="tablist" aria-label={title} className="flex flex-wrap gap-1 border-b border-line">
        {tabs.map((t) => {
          const active = t.id === tab.id;
          return (
            <button key={t.id} type="button" role="tab" aria-selected={active}
              onClick={() => router.replace(`${path}?tab=${t.id}`, { scroll: false })}
              className={`-mb-px rounded-t-group border px-3 py-1.5 ${active ? "border-line border-b-white bg-white font-semibold text-brand" : "border-transparent text-muted hover:text-ink"}`}>
              {t.label} <span className="ml-1 rounded-group bg-blue-tint px-1.5 text-[12px] text-brand-ink">{scoped.filter((c) => t.match(c, user)).length}</span>
            </button>
          );
        })}
      </div>
      <input type="search" aria-label="Tìm kiếm" placeholder="Tìm theo mã, nội dung, địa chỉ… (không cần dấu)"
        value={query.q} onChange={(e) => onSearch(e.target.value)}
        className="h-8 w-full max-w-md rounded-control border border-line bg-white px-2.5" />
      <CaseTable user={user} rows={rows} total={inTab.length} query={query} onSort={onSort} onFilter={onFilter} />
    </div>
  );
}
