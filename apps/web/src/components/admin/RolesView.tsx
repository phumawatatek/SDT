"use client";

import { useState } from "react";
import type { AuditRow, RbacData, RoleRow } from "@/api/rbac";
import { Button } from "@/components/ui/Button";
import { RoleEditor } from "./RoleEditor";
import { ROLE_LABEL } from "./sections";

type Mode = { kind: "create" } | { kind: "edit"; role: RoleRow } | null;

function Warnings({ list }: { list: string[] }) {
  if (list.length === 0) return null;
  return (
    <div role="alert" className="rounded-panel border border-amber-ink/30 bg-amber-tint p-3 text-[13px]">
      <p className="font-semibold">Quy trình có thể bị kẹt:</p>
      <ul className="list-disc pl-5">{list.map((w) => <li key={w}>{w}</li>)}</ul>
    </div>
  );
}

function RolesTable({ data, onEdit }: { data: RbacData; onEdit: (r: RoleRow) => void }) {
  return (
    <div className="overflow-x-auto rounded-panel border border-line bg-white">
      <table className="w-full text-[13px]">
        <thead className="bg-th-bg text-left text-[12px]">
          <tr>{["Vai trò", "Loại", "Phạm vi xem", "Số quyền", "Người dùng", ""].map((h) => <th key={h} scope="col" className="px-2 py-2">{h}</th>)}</tr>
        </thead>
        <tbody>
          {data.roles.map((r) => (
            <tr key={r.id} className="border-b border-line-2">
              <td className="px-2 py-1.5 font-medium">{r.name}{r.system && <span className="ml-1 text-[11px] text-muted">(gốc)</span>}</td>
              <td className="px-2 py-1.5">{ROLE_LABEL[r.kind] ?? r.kind}</td>
              <td className="px-2 py-1.5">{data.scopes[r.scope]}</td>
              <td className="px-2 py-1.5">{r.perms.length}</td>
              <td className="px-2 py-1.5">{r.activeUsers}</td>
              <td className="w-[1%] whitespace-nowrap px-2 py-1.5"><Button size="sm" onClick={() => onEdit(r)}>Sửa quyền</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Audit({ rows }: { rows: AuditRow[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-[15px] font-semibold">Nhật ký đổi quyền</h2>
      <div className="overflow-x-auto rounded-panel border border-line bg-white">
        <table className="w-full text-[13px]">
          <thead className="bg-th-bg text-left text-[12px]">
            <tr>{["Thời điểm", "Người đổi", "Vai trò", "Thay đổi"].map((h) => <th key={h} scope="col" className="px-2 py-2">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted">Chưa có thay đổi.</td></tr>}
            {rows.map((a, i) => (
              <tr key={i} className="border-b border-line-2">
                <td className="whitespace-nowrap px-2 py-1.5">{new Date(a.at).toLocaleString("vi-VN")}</td>
                <td className="px-2 py-1.5">{a.actor}</td>
                <td className="px-2 py-1.5">{a.role}</td>
                <td className="px-2 py-1.5">{a.change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-muted">Chỉ ghi thêm, không sửa / xoá. Hiện 200 dòng mới nhất.</p>
    </div>
  );
}

/** Vai trò & phân quyền: danh sách vai trò, sửa quyền, cảnh báo quy trình thiếu người, nhật ký. */
export function RolesView({ data }: { data: { data: RbacData; audit: AuditRow[] } | null }) {
  const [mode, setMode] = useState<Mode>(null);
  if (!data) return <p className="rounded-panel bg-white p-6 text-center text-muted">Bạn không có quyền quản trị phân quyền.</p>;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-[17px] font-bold">Vai trò và phân quyền</h1>
        <Button kind="primary" onClick={() => setMode({ kind: "create" })} disabled={mode !== null}>+ Thêm vai trò</Button>
      </div>
      <Warnings list={data.data.warnings} />
      {mode && (
        <RoleEditor key={mode.kind === "edit" ? mode.role.id : "new"} data={data.data}
          role={mode.kind === "edit" ? mode.role : undefined} onClose={() => setMode(null)} />
      )}
      <RolesTable data={data.data} onEdit={(r) => setMode({ kind: "edit", role: r })} />
      <Audit rows={data.audit} />
    </div>
  );
}
