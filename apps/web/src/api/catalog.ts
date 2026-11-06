"use client";

import { useEffect, useState } from "react";
import { BASE_PATH } from "@/lib/base-path";

/** Danh mục công khai do quản trị cấu hình: chuyên đề, khu phố đang dùng, ngày nghỉ. */
export interface Catalog {
  topics: { name: string; urgent: boolean }[];
  wards: string[];
  holidays: string[];
}

const EMPTY: Catalog = { topics: [], wards: [], holidays: [] };

/** Nạp danh mục từ API (một lần mỗi lần mở form). */
export function useCatalog(): Catalog {
  const [c, setC] = useState<Catalog>(EMPTY);
  useEffect(() => {
    let live = true;
    fetch(`${BASE_PATH}/api/public/catalog`).then((r) => (r.ok ? r.json() : EMPTY)).then((d: Catalog) => live && setC(d)).catch(() => {});
    return () => { live = false; };
  }, []);
  return c;
}
