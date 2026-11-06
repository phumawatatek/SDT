"use client";

import { useState, useTransition } from "react";
import { CitizenDetail } from "@/components/detail/CitizenDetail";
import { Button } from "@/components/ui/Button";
import type { CaseRow } from "@/lib/case";
import { lookupCase } from "@/api/client";

/** Tra cứu bằng mã, không cần đăng nhập. Chỉ hiện thông tin công khai cho người dân, không có thao tác. */
export function LookupView() {
  const [code, setCode] = useState("");
  const [searched, setSearched] = useState<string | null>(null);
  const [found, setFound] = useState<CaseRow | null>(null);
  const [loading, start] = useTransition();
  const search = (raw: string) => start(async () => {
    const key = raw.trim().toUpperCase();
    setFound(await lookupCase(key));
    setSearched(key);
  });
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 p-3 text-[15px]">
      <h1 className="text-[17px] font-bold">Tra cứu phản ánh</h1>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); search(code); }}>
        <label htmlFor="code" className="sr-only">Mã tra cứu</label>
        <input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ví dụ: PA-2611-0012"
          className="h-10 flex-1 rounded-control border border-line bg-white px-3" />
        <Button kind="primary" type="submit" className="h-10" disabled={!code.trim()} loading={loading}>Tra cứu</Button>
      </form>
      {searched && !found && !loading && <p role="alert" className="rounded-panel bg-white p-4 text-center text-muted">Không tìm thấy mã {searched}. Kiểm tra lại mã trong tin Zalo/SMS.</p>}
      {found && <CitizenDetail user={null} c={found} />}
    </div>
  );
}
