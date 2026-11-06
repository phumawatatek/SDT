import { DashboardView } from "@/components/dashboard/DashboardView";
import { AppShell } from "@/components/shell/AppShell";

export default function Page() {
  return (
    <AppShell breadcrumb={["Trang chủ", "Dashboard"]}>
      <DashboardView />
    </AppShell>
  );
}
