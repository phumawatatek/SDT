"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { CaseRow, ProcessStep } from "@/lib/case";

export interface StepWork {
  step: (index: number, op: "done" | "skip" | "undo", reason?: string) => void;
  addPhoto: () => void;
  pending: boolean;
}

const MIN_REASON = 5;

function SkipForm({ onSkip, onCancel }: { onSkip: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("");
  const ok = reason.trim().length >= MIN_REASON;
  return (
    <form className="mt-1 flex gap-1" onSubmit={(e) => { e.preventDefault(); if (ok) onSkip(reason.trim()); }}>
      <input autoFocus aria-label="Lý do bỏ qua bước" placeholder={`Lý do (≥ ${MIN_REASON} ký tự)`} value={reason}
        onChange={(e) => setReason(e.target.value)} className="h-7 flex-1 rounded-control border border-line px-2" />
      <Button size="sm" type="submit" disabled={!ok}>Bỏ qua</Button>
      <Button size="sm" onClick={onCancel}>Hủy</Button>
    </form>
  );
}

function StepControls({ s, i, work }: { s: ProcessStep; i: number; work: StepWork }) {
  const [skipping, setSkipping] = useState(false);
  if (s.done || s.skippedReason) {
    return <Button size="sm" disabled={work.pending} onClick={() => work.step(i, "undo")}>Hoàn tác</Button>;
  }
  if (skipping) return <SkipForm onSkip={(r) => { setSkipping(false); work.step(i, "skip", r); }} onCancel={() => setSkipping(false)} />;
  return (
    <span className="flex gap-1">
      <Button size="sm" kind="success" disabled={work.pending} onClick={() => work.step(i, "done")}>Xong</Button>
      {!s.required && <Button size="sm" onClick={() => setSkipping(true)}>Bỏ qua</Button>}
    </span>
  );
}

/** Quy trình từng bước: chỉ bước đầu và cuối bắt buộc; bước giữa bỏ qua được nhưng phải ghi lý do. */
export function StepsList({ c, work }: { c: CaseRow; work?: StepWork }) {
  return (
    <ol className="flex flex-col gap-1.5">
      {c.steps.map((s, i) => (
        <li key={s.name} className="flex flex-wrap items-start gap-2">
          <span aria-hidden className={s.done ? "text-green" : "text-muted"}>{s.done ? "✓" : "○"}</span>
          <span className="flex-1">
            {s.name}
            {s.required && <span className="ml-1 text-[12px] text-red">(bắt buộc)</span>}
            {s.skippedReason && <span className="block text-[12px] text-muted">Bỏ qua: {s.skippedReason}</span>}
          </span>
          {work ? <StepControls s={s} i={i} work={work} /> : (
            <span className="text-[12px] text-muted">{s.done ? "Xong" : s.skippedReason ? "Bỏ qua" : "Chưa làm"}</span>
          )}
        </li>
      ))}
    </ol>
  );
}
