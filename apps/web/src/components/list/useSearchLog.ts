"use client";

import { useEffect } from "react";
import { logSearchHits } from "@/api/client";
import { hitByIdentity } from "@/lib/list";
import type { DemoUser } from "@/lib/roles";
import type { CaseRow } from "@/lib/case";

const DEBOUNCE_MS = 800;

/** Ghi nhật ký khi tìm kiếm trúng nhờ tên/SĐT người gửi — chỉ cho dòng thực sự hiển thị, sau khi ngừng gõ. */
export function useSearchLog(user: DemoUser, rows: CaseRow[], q: string): void {
  const codes = rows.map((r) => r.code).join(",");
  useEffect(() => {
    if (!q.trim()) return;
    const t = setTimeout(() => {
      // Server kiểm lại từng vụ có thật sự trúng theo danh tính không rồi mới ghi.
      const hits = rows.filter((c) => hitByIdentity(user, c, q)).map((c) => c.code);
      if (hits.length) void logSearchHits(hits, q);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
    // rows được đại diện bởi `codes` để không chạy lại mỗi lần render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, codes, q]);
}
