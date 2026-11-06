import { notFound } from "next/navigation";
import { Suspense } from "react";
import { loadAdminSection, loadRbac } from "@/api/server";
import { AdminView } from "@/components/admin/AdminView";
import { RolesView } from "@/components/admin/RolesView";
import { AppShell } from "@/components/shell/AppShell";
import { ADMIN_SECTIONS, type AdminSection } from "@/lib/roles";

const isSection = (s: string): s is AdminSection => ADMIN_SECTIONS.some((t) => t.id === s);

async function Admin({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isSection(section)) notFound();
  if (section === "roles") return <RolesView data={await loadRbac()} />;
  return <AdminView section={section} data={await loadAdminSection(section)} />;
}

export default function Page({ params }: PageProps<"/quan-tri/[section]">) {
  return (
    <AppShell breadcrumb={[]}>
      <Suspense fallback={<p className="text-muted">Đang tải…</p>}><Admin params={params} /></Suspense>
    </AppShell>
  );
}
