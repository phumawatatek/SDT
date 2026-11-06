"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { navFor } from "@/lib/roles";
import { UserMenu } from "./UserMenu";
import { useUser } from "./ShellContext";

export const WARD_NAME = "Phường Xuân Lãnh";

/** Tên hệ thống + phường — đầu thanh bên, và thanh trên của trang chưa đăng nhập. */
function Identity() {
  return (
    <Link href="/" className="block leading-tight text-white">
      <span className="block text-[12px] opacity-80">Phản ánh kiến nghị</span>
      <span className="block text-[16px] font-bold">{WARD_NAME}</span>
    </Link>
  );
}

function NavList() {
  const { role } = useUser();
  const path = usePathname();
  return (
    <ul className="max-[1099px]:flex max-[1099px]:overflow-x-auto">
      {navFor(role).map((item) => {
        const active = path === item.href || (item.href !== "/dan" && path.startsWith(`${item.href}/`));
        return (
          <li key={item.href} className="shrink-0">
            <Link href={item.href} aria-current={active ? "page" : undefined}
              className={`block border-l-4 px-4 py-2 text-white max-[1099px]:border-b-4 max-[1099px]:border-l-0 ${active ? "border-gold bg-brand-deep font-semibold" : "border-transparent hover:bg-brand-deep"}`}>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Thanh bên chứa mọi thứ không thuộc nghiệp vụ: định danh, menu theo vai trò, người dùng, đăng xuất. */
function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[232px] shrink-0 flex-col bg-brand text-white max-[1099px]:static max-[1099px]:h-auto max-[1099px]:w-full">
      <div className="bg-brand-deep px-4 py-3 max-[1099px]:flex max-[1099px]:items-center max-[1099px]:justify-between">
        <Identity />
        <div className="hidden max-[1099px]:block"><UserMenu compact /></div>
      </div>
      <nav aria-label="Menu chính" className="flex-1 py-2 max-[1099px]:py-0">
        <NavList />
      </nav>
      <div className="border-t border-white/20 p-3 max-[1099px]:hidden">
        <UserMenu />
      </div>
    </aside>
  );
}

/** Thanh trên cho trang chưa đăng nhập (đăng nhập, tra cứu công khai). */
export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="flex h-[54px] shrink-0 items-center justify-between bg-brand-deep px-4 text-white">
      <Identity />
      {children}
    </header>
  );
}

/** Khung đã đăng nhập: thanh bên trái + vùng làm việc chỉ chứa nội dung nghiệp vụ. */
export function ShellFrame({ children }: { breadcrumb?: string[]; children: ReactNode }) {
  return (
    <div className="flex min-h-screen max-[1099px]:flex-col">
      <Sidebar />
      <main className="min-w-0 flex-1 p-4">{children}</main>
    </div>
  );
}
