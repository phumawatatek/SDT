import { redirect } from "next/navigation";
import { Suspense } from "react";
import { homeFor } from "@/lib/roles";
import { currentUser } from "@/api/server";

async function Go(): Promise<null> {
  const u = await currentUser();
  redirect(u ? homeFor(u.role) : "/dang-nhap");
}

/** Trang gốc: chuyển tới trang chính của vai trò, hoặc trang đăng nhập. */
export default function Home() {
  return <Suspense fallback={<p className="p-6 text-muted">Đang chuyển trang…</p>}><Go /></Suspense>;
}
