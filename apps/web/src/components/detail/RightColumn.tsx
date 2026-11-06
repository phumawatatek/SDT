"use client";

import { useEffect } from "react";
import { LabelValue, Panel } from "@/components/ui/Panel";
import { canSeeIdentity } from "@/lib/access";
import { logIdentityView } from "@/api/client";
import { HIDDEN } from "@/lib/list";
import type { DemoUser } from "@/lib/roles";
import type { CaseView } from "@/api/types";
import type { CaseRow } from "@/lib/case";
import { ActionPanel } from "./ActionPanel";

/** Người gửi: số đầy đủ chỉ hiện ở chi tiết và mỗi lần xem được ghi nhật ký. */
function SenderPanel({ user, c }: { user: DemoUser; c: CaseRow }) {
  const allowed = canSeeIdentity(user, c);
  useEffect(() => {
    if (allowed) void logIdentityView(c.code);
  }, [allowed, c.code]);
  return (
    <Panel title="Người gửi">
      {allowed ? (
        <LabelValue rows={[["Họ tên", c.sender], ["Điện thoại", c.phone]]} />
      ) : (
        <p className="text-muted">{HIDDEN} — người dân chưa đồng ý cho trưởng khu phố xem danh tính.</p>
      )}
    </Panel>
  );
}

function Timeline({ c }: { c: CaseRow }) {
  return (
    <Panel title="Lịch sử xử lý">
      <ol className="relative ml-2 border-l-2 border-line">
        {[...c.history].reverse().map((h, i) => (
          <li key={`${h.at}-${i}`} className="mb-3 ml-3">
            <span aria-hidden className="absolute -left-[5px] mt-1.5 size-2 rounded-full bg-brand" />
            <p className="text-[12px] text-muted">{h.at} · {h.actor}</p>
            <p>{h.action}</p>
            {h.reason && <p className="text-[12px] text-muted">Lý do: {h.reason}</p>}
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/** Cột phải (làm): Việc cần làm → Người gửi → Lịch sử (PHASE1_SPEC §13). */
export function RightColumn({ user, c, nextCode }: { user: DemoUser; c: CaseView; nextCode?: string }) {
  return (
    <div className="flex flex-col gap-3">
      <ActionPanel key={`${user.role}-${c.code}`} c={c} nextCode={nextCode} />
      <SenderPanel user={user} c={c} />
      <Timeline c={c} />
    </div>
  );
}
