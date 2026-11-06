"use client";

import { useRouter } from "next/navigation";
import { logout } from "@/api/client";
import { GROUP_COLOR } from "@/lib/roles";
import { useUser } from "./ShellContext";

/** Người đang đăng nhập + nút đăng xuất (đáy thanh bên). `compact`: chỉ nút, cho màn hình hẹp. */
export function UserMenu({ compact = false }: { compact?: boolean }) {
  const user = useUser();
  const router = useRouter();
  const out = async () => {
    await logout();
    router.replace("/dang-nhap");
    router.refresh();
  };
  const button = (
    <button type="button" onClick={() => void out()}
      className="rounded-control border border-white/40 px-2 py-1 text-[12px] text-white hover:bg-brand-deep focus-visible:outline-2 focus-visible:outline-gold">
      Đăng xuất
    </button>
  );
  if (compact) return button;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <span aria-hidden className={`grid size-8 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white ring-2 ring-white/30 ${GROUP_COLOR[user.group]}`}>
          {user.name.split(" ").at(-1)?.[0]?.toUpperCase()}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate font-semibold">{user.name}</span>
          <span className="block truncate text-[12px] opacity-80">{user.title}</span>
        </span>
      </div>
      {button}
    </div>
  );
}
