import { Suspense } from "react";
import { CaseDetailView } from "@/components/detail/CaseDetailView";
import { AppShell } from "@/components/shell/AppShell";

async function Detail({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <CaseDetailView code={code} />;
}

export default function Page({ params }: PageProps<"/phan-anh/[code]">) {
  return (
    <AppShell breadcrumb={["Trang chủ", "Chi tiết phản ánh"]}>
      <Suspense fallback={<p className="text-muted">Đang tải…</p>}>
        <Detail params={params} />
      </Suspense>
    </AppShell>
  );
}
