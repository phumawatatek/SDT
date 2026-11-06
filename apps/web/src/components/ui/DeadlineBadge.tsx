import { DEADLINE_LABEL, deadlineState, deadlineText, workdaysBetween, todayVN } from "@/lib/deadline";
import type { CaseStatus } from "@/lib/status";

const TONE = {
  ok: "bg-green-tint text-green-ink",
  soon: "bg-amber-tint text-amber-ink",
  overdue: "bg-red-tint text-red",
  paused: "bg-gray-tint text-ink",
  none: "text-muted",
} as const;

export function DeadlineBadge({ status, dueAt }: { status: CaseStatus; dueAt: string }) {
  const state = deadlineState(status, dueAt);
  if (state === "none") return <span className="text-muted">—</span>;
  return (
    <span className={`inline-block whitespace-nowrap rounded-group px-1.5 py-0.5 text-[12px] font-medium ${TONE[state]}`}>
      {DEADLINE_LABEL[state]}
    </span>
  );
}

/** Thanh thời hạn ngay dưới thanh bước. */
export function DeadlineBar({ status, submittedAt, dueAt }: { status: CaseStatus; submittedAt: string; dueAt: string }) {
  const state = deadlineState(status, dueAt);
  const total = Math.max(1, workdaysBetween(submittedAt, dueAt));
  const used = workdaysBetween(submittedAt, todayVN());
  const pct = Math.min(100, Math.max(0, Math.round((used / total) * 100)));
  const bar = state === "overdue" ? "bg-red" : state === "soon" ? "bg-gold" : state === "paused" ? "bg-muted" : "bg-green";
  return (
    <div className="mt-2">
      <div className="mb-1 flex justify-between text-[12px] text-muted">
        <span>Hạn xử lý: {dueAt}</span>
        <span>{deadlineText(status, dueAt)}</span>
      </div>
      <div
        className="h-1.5 rounded-group bg-line-2"
        role="progressbar"
        aria-label="Thời hạn đã dùng"
        aria-valuenow={state === "none" ? 100 : pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-full rounded-group ${state === "none" ? "bg-green" : bar}`} style={{ width: `${state === "none" ? 100 : pct}%` }} />
      </div>
    </div>
  );
}
