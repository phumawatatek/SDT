import { SubmitForm } from "@/components/citizen/SubmitForm";
import { AppShell } from "@/components/shell/AppShell";

export default function Page() {
  return (
    <AppShell breadcrumb={["Trang chủ", "Gửi phản ánh"]}>
      <SubmitForm />
    </AppShell>
  );
}
