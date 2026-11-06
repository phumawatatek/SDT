"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useCases, useUser } from "@/components/shell/ShellContext";
import { ORDER_KEY } from "@/components/ui/CaseTable";
import { DeadlineBar } from "@/components/ui/DeadlineBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StepBar } from "@/components/ui/StepBar";
import type { DemoUser } from "@/lib/roles";
import { addAfterPhoto, updateStep } from "@/api/client";
import type { CaseView } from "@/api/types";
import { CitizenDetail } from "./CitizenDetail";
import { LeftColumn, type StepWork } from "./LeftColumn";
import { RightColumn } from "./RightColumn";
import { useRun } from "./useRun";

const noop = () => () => {};

/** Thứ tự sau khi lọc và sắp xếp ở danh sách là thứ tự cho Trước / Sau. */
function useNeighbors(code: string): { prev?: string; next?: string } {
  const raw = useSyncExternalStore(noop, () => sessionStorage.getItem(ORDER_KEY) ?? "[]", () => "[]");
  const order = JSON.parse(raw) as string[];
  const i = order.indexOf(code);
  if (i < 0) return {};
  return { prev: order[i - 1], next: order[i + 1] };
}

function NavLink({ code, label }: { code?: string; label: string }) {
  if (!code) return <span className="rounded-control border border-line px-2 py-1 text-muted opacity-50">{label}</span>;
  return <Link href={`/phan-anh/${code}`} className="rounded-control border border-line bg-white px-2 py-1 hover:bg-blue-tint">{label}</Link>;
}

export function CaseDetailView({ code }: { code: string }) {
  const user = useUser();
  // Danh sách vụ trong context đã được server lọc theo quyền xem.
  const c = useCases().find((x) => x.code === code);
  const { prev, next } = useNeighbors(code);

  if (!c) {
    return <p className="rounded-panel bg-white p-6 text-center text-muted">Không tìm thấy phản ánh hoặc bạn không có quyền xem.</p>;
  }
  if (user.role === "citizen") return <CitizenDetail user={user} c={c} />;
  return <StaffDetail key={c.code} user={user} c={c} prev={prev} next={next} />;
}

/** Bản làm việc của cán bộ: đánh dấu bước, thêm ảnh sau — lưu ngay qua server. */
function StaffDetail({ user, c, prev, next }: { user: DemoUser; c: CaseView; prev?: string; next?: string }) {
  const { run, pending, error } = useRun();
  const editable = c.actions.some((a) => a.id === "gui_ket_qua");
  const work: StepWork | undefined = editable ? {
    step: (index, op, reason) => run(() => updateStep({ code: c.code, index, op, reason })),
    addPhoto: () => run(() => addAfterPhoto(c.code)),
    pending,
  } : undefined;
  return (
    <div className="flex flex-col gap-3">
      <header className="rounded-panel border border-line bg-white px-3.5 py-3 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[12px] text-muted">{c.code} {c.reopened && <span className="font-semibold text-red">· Mở lại</span>}</p>
            <h1 className="text-[17px] font-bold">{c.title}</h1>
            <p className="text-[12px] text-muted">{c.topic} · {c.ward} · Tiếp nhận {c.submittedAt}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={c.status} />
            <NavLink code={prev} label="← Trước" />
            <NavLink code={next} label="Sau →" />
          </div>
        </div>
        <div className="mt-3"><StepBar status={c.status} /></div>
        <DeadlineBar status={c.status} submittedAt={c.submittedAt} dueAt={c.dueAt} />
        {error && <p role="alert" className="mt-2 text-red">{error}</p>}
      </header>
      <div className="grid grid-cols-[1fr_360px] gap-3 max-[1099px]:grid-cols-1">
        <LeftColumn c={c} showCoords={user.role !== "kp"} work={work} />
        <RightColumn user={user} c={c} nextCode={next} />
      </div>
    </div>
  );
}
