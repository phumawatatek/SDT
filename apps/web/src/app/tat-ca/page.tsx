import { Suspense } from "react";
import { AllCasesView } from "@/components/list/AllCasesView";
import { AppShell } from "@/components/shell/AppShell";

export default function Page() {
  return (
    <AppShell breadcrumb={["Trang chủ", "Tất cả phản ánh"]}>
      <Suspense fallback={<p className="text-muted">Đang tải…</p>}>
        <AllCasesView />
      </Suspense>
    </AppShell>
  );
}
