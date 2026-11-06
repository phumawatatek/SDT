"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { AppUser, CaseView, Directory } from "@/api/types";

export type { Directory };

interface ShellData {
  user: AppUser;
  /** Vụ người dùng được xem — server đã lọc theo quyền và che danh tính. */
  cases: CaseView[];
  directory: Directory;
}

const Ctx = createContext<ShellData | null>(null);

export function ShellProvider({ value, children }: { value: ShellData; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function useShell(): ShellData {
  const v = useContext(Ctx);
  if (!v) throw new Error("Thiếu ShellProvider");
  return v;
}

export const useUser = (): AppUser => useShell().user;
export const useCases = (): CaseView[] => useShell().cases;
export const useDirectory = (): Directory => useShell().directory;
