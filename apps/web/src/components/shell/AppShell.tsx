import { type ReactNode, Suspense } from "react";
import { loadShell } from "@/api/server";
import { ShellProvider } from "./ShellContext";
import { ShellFrame } from "./ShellFrame";

interface Props {
  breadcrumb: string[];
  children: ReactNode;
}

async function ShellData({ breadcrumb, children }: Props) {
  const { user, cases, directory } = await loadShell();
  return (
    <ShellProvider value={{ user, cases, directory }}>
      <ShellFrame breadcrumb={breadcrumb}>{children}</ShellFrame>
    </ShellProvider>
  );
}

/** Khung trang đã đăng nhập: server đọc phiên, nạp vụ được phép xem rồi mới render nội dung theo vai trò. */
export function AppShell(props: Props) {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen max-[1099px]:flex-col">
        <div className="w-[232px] shrink-0 bg-brand max-[1099px]:h-[54px] max-[1099px]:w-full" />
        <p className="p-4 text-muted">Đang tải…</p>
      </div>
    }>
      <ShellData {...props} />
    </Suspense>
  );
}
