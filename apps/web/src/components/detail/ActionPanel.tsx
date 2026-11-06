"use client";

import Link from "next/link";
import { useState } from "react";
import { useDirectory } from "@/components/shell/ShellContext";
import { Button } from "@/components/ui/Button";
import { SelectField, TextArea } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import type { CaseAction, CaseView as CaseRow } from "@/api/types";
import { performAction } from "@/api/client";
import { EditCaseForm } from "./EditCaseForm";
import { useRun } from "./useRun";

const MIN_REASON = 5;

interface FormProps {
  action: CaseAction;
  c: CaseRow;
  onDone: () => void;
  onCancel: () => void;
}

function useTargets(action: CaseAction, c: CaseRow): string[] {
  const dir = useDirectory();
  if (action.target === "unit") return dir.units;
  if (action.target === "handler") return (dir.staffByUnit[c.unit] ?? []).filter((n) => n !== c.handler);
  return [];
}

/** Form cho thao tác cần lý do, ghi chú hoặc chọn đích giao. */
function ActionForm({ action, c, onDone, onCancel }: FormProps) {
  const [text, setText] = useState("");
  const [share, setShare] = useState(false);
  const targets = useTargets(action, c);
  const [target, setTarget] = useState("");
  const { run, pending, error } = useRun();
  const isNote = action.id === "ghi_chu";
  const wantsText = action.needsReason || isNote;
  const ok = (!wantsText || text.trim().length >= MIN_REASON) && (!action.target || !!target);
  const submit = () => run(() => performAction({ code: c.code, actionId: action.id, reason: text.trim() || undefined, target: target || undefined, share }), onDone);
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (ok) submit(); }}>
      {action.target && (
        <SelectField id="target" label={action.target === "unit" ? "Giao cho phòng" : "Giao cho cán bộ"} value={target}
          onChange={(e) => setTarget(e.target.value)} options={[{ value: "", label: "— Chọn —" }, ...targets.map((t) => ({ value: t, label: t }))]} />
      )}
      {wantsText && (
        <TextArea id="reason" label={isNote ? "Ghi chú xác minh" : "Lý do"} value={text} autoFocus={!action.target}
          placeholder={`Tối thiểu ${MIN_REASON} ký tự`} onChange={(e) => setText(e.target.value)}
          error={text && text.trim().length < MIN_REASON ? `Cần ít nhất ${MIN_REASON} ký tự` : undefined} />
      )}
      {isNote && (
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
          Gửi cho người dân xem (người dân nhận tin Zalo)
        </label>
      )}
      {error && <p role="alert" className="text-red">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" kind={action.kind === "danger" ? "danger" : "primary"} disabled={!ok} loading={pending}>{action.label}</Button>
        <Button onClick={onCancel} disabled={pending}>Hủy</Button>
      </div>
    </form>
  );
}

function ActionList({ actions, c, onPick, onDone }: { actions: CaseAction[]; c: CaseRow; onPick: (a: CaseAction) => void; onDone: (label: string) => void }) {
  const { run, pending, error } = useRun();
  const direct = (a: CaseAction) => run(() => performAction({ code: c.code, actionId: a.id }), () => onDone(a.label));
  return (
    <div className="flex flex-col gap-2">
      {actions.map((a) => (
        <div key={a.id}>
          <Button kind={a.kind} disabled={!!a.disabledReason || pending} className="w-full"
            onClick={() => (a.needsReason || a.target || a.id === "ghi_chu" || a.id === "sua_noi_dung" ? onPick(a) : direct(a))}>
            {a.label}
          </Button>
          {a.disabledReason && <p className="mt-0.5 text-[12px] text-red">{a.disabledReason}</p>}
        </div>
      ))}
      {error && <p role="alert" className="text-red">{error}</p>}
    </div>
  );
}

/** Khung "Việc cần làm": chỉ hiện thao tác được phép; không có quyền thì hiện "đang chờ ai làm gì". Server kiểm quyền lại. */
export function ActionPanel({ c, nextCode }: { c: CaseRow; nextCode?: string }) {
  const [pending, setPending] = useState<CaseAction | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const actions = c.actions;

  if (done) {
    return (
      <Panel title="Việc cần làm">
        <p className="mb-2 text-green-ink">Đã thực hiện: {done}.</p>
        <div className="flex gap-3">
          <button type="button" className="text-brand underline" onClick={() => setDone(null)}>Xem việc tiếp theo của vụ này</button>
          {nextCode && <Link className="text-brand underline" href={`/phan-anh/${nextCode}`}>Mở phản ánh kế tiếp →</Link>}
        </div>
      </Panel>
    );
  }
  if (pending) {
    return (
      <Panel title="Việc cần làm">
        {pending.id === "sua_noi_dung"
          ? <EditCaseForm c={c} onDone={() => { setDone(pending.label); setPending(null); }} onCancel={() => setPending(null)} />
          : <ActionForm action={pending} c={c} onDone={() => { setDone(pending.label); setPending(null); }} onCancel={() => setPending(null)} />}
      </Panel>
    );
  }
  return (
    <Panel title="Việc cần làm">
      {actions.length === 0
        ? <p className="text-muted">{c.waiting}</p>
        : <ActionList actions={actions} c={c} onPick={setPending} onDone={setDone} />}
    </Panel>
  );
}
