"use client";

import { useState } from "react";
import { adminCreate, adminDelete, adminUpdate, resetPassword, type AdminOptions, type Row } from "@/api/admin";
import { useRun } from "@/components/detail/useRun";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { EntityForm } from "./EntityForm";
import type { SectionSpec } from "./sections";

type Mode = { kind: "create" } | { kind: "edit"; row: Row } | { kind: "password"; row: Row } | null;

function PasswordForm({ row, onDone, onCancel }: { row: Row; onDone: () => void; onCancel: () => void }) {
  const [pw, setPw] = useState("");
  const { run, pending, error } = useRun();
  return (
    <form className="flex items-end gap-2 rounded-panel border border-brand/30 bg-blue-tint/40 p-3"
      onSubmit={(e) => { e.preventDefault(); run(() => resetPassword(Number(row.id), pw), onDone); }}>
      <div className="w-72"><TextField id="new-pw" label={`Mật khẩu mới cho ${String(row["name"])}`} type="password" minLength={6} required
        autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      <Button type="submit" kind="primary" loading={pending}>Đặt lại</Button>
      <Button onClick={onCancel} disabled={pending}>Hủy</Button>
      {error && <p role="alert" className="text-red">{error}</p>}
    </form>
  );
}

function RowActions({ spec, row, onEdit, onPassword }: { spec: SectionSpec; row: Row; onEdit: () => void; onPassword: () => void }) {
  const { run, pending, error } = useRun();
  const id = Number(row.id);
  const active = row["active"] !== false;
  const hardDelete = () => {
    if (window.confirm("Xoá hẳn bản ghi này? Không hoàn tác được. Nếu đã được dùng, hệ thống sẽ yêu cầu khoá thay vì xoá.")) {
      run(() => adminDelete(spec.entity, id));
    }
  };
  return (
    <div className="flex w-[260px] flex-wrap items-center gap-1">
      <Button size="sm" onClick={onEdit} disabled={pending}>Sửa</Button>
      {spec.password && <Button size="sm" onClick={onPassword} disabled={pending}>Đặt lại MK</Button>}
      {spec.soft && <Button size="sm" onClick={() => run(() => adminUpdate(spec.entity, id, { active: !active }))} disabled={pending}>{active ? "Khoá" : "Mở lại"}</Button>}
      <Button size="sm" kind="danger" onClick={hardDelete} disabled={pending}>Xoá</Button>
      {error && <span role="alert" className="basis-full text-[12px] leading-snug text-red">{error}</span>}
    </div>
  );
}

function Table({ spec, rows, options, setMode }: { spec: SectionSpec; rows: Row[]; options: AdminOptions; setMode: (m: Mode) => void }) {
  return (
    <div className="overflow-x-auto rounded-panel border border-line bg-white">
      <table className="w-full text-[13px]">
        <thead className="bg-th-bg text-left text-[12px]">
          <tr>{spec.columns.map((c) => <th key={c.label} scope="col" className="px-2 py-2">{c.label}</th>)}<th className="px-2 py-2">Trạng thái</th><th /></tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={spec.columns.length + 2} className="p-6 text-center text-muted">Chưa có dữ liệu. Bấm “Thêm” để tạo.</td></tr>}
          {rows.map((r) => (
            <tr key={String(r.id)} className={`border-b border-line-2 ${r["active"] === false ? "bg-paper text-muted" : ""}`}>
              {spec.columns.map((c) => <td key={c.label} className="px-2 py-1.5">{c.value(r, options)}</td>)}
              <td className="px-2 py-1.5">{r["active"] === false ? "Đã khoá" : "Đang dùng"}</td>
              <td className="w-[1%] px-2 py-1.5"><RowActions spec={spec} row={r} onEdit={() => setMode({ kind: "edit", row: r })} onPassword={() => setMode({ kind: "password", row: r })} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Một mục quản trị: thêm / sửa / khoá–mở (xoá mềm) / xoá cứng. */
export function CrudSection({ title, spec, rows, options }: { title: string; spec: SectionSpec; rows: Row[]; options: AdminOptions }) {
  const [mode, setMode] = useState<Mode>(null);
  const [showLocked, setShowLocked] = useState(false);
  const { run, pending, error } = useRun();
  const shown = showLocked ? rows : rows.filter((r) => r["active"] !== false);
  const save = (body: Row) => run(
    () => (mode?.kind === "edit" ? adminUpdate(spec.entity, Number(mode.row.id), body) : adminCreate(spec.entity, body)),
    () => setMode(null),
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[17px] font-bold">{title}</h1>
        <Button kind="primary" onClick={() => setMode({ kind: "create" })} disabled={mode !== null}>+ Thêm</Button>
        {spec.soft && <label className="ml-auto flex items-center gap-2 text-[13px]"><input type="checkbox" checked={showLocked} onChange={(e) => setShowLocked(e.target.checked)} /> Hiện mục đã khoá ({rows.length - rows.filter((r) => r["active"] !== false).length})</label>}
      </div>
      {(mode?.kind === "create" || mode?.kind === "edit") && (
        <EntityForm key={mode.kind === "edit" ? String(mode.row.id) : "new"} fields={spec.fields} options={options}
          row={mode.kind === "edit" ? mode.row : undefined} pending={pending} error={error} onSubmit={save} onCancel={() => setMode(null)} />
      )}
      {mode?.kind === "password" && <PasswordForm row={mode.row} onDone={() => setMode(null)} onCancel={() => setMode(null)} />}
      <Table spec={spec} rows={shown} options={options} setMode={setMode} />
    </div>
  );
}
