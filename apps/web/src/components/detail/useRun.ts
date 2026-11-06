"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ActionResult } from "@/api/types";

/** Gọi server action, hiện lỗi nếu có, thành công thì tải lại dữ liệu trang. */
export function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<ActionResult>, onOk?: () => void) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) return setError(r.error);
      onOk?.();
      router.refresh();
    });
  return { run, pending, error };
}
