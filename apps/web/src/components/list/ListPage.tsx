import { Suspense } from "react";
import { AppShell } from "@/components/shell/AppShell";
import type { TabsetId } from "@/lib/tabs";
import { CaseListView } from "./CaseListView";

export function ListPage({ title, tabset }: { title: string; tabset: TabsetId }) {
  return (
    <AppShell breadcrumb={["Trang chủ", title]}>
      <Suspense fallback={<p className="text-muted">Đang tải danh sách…</p>}>
        <CaseListView title={title} tabset={tabset} />
      </Suspense>
    </AppShell>
  );
}
