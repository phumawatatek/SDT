"use client";

import { useState } from "react";
import { createRole, deleteRole, updateRole, type RbacData, type RoleRow, type Scope } from "@/api/rbac";
import { useRun } from "@/components/detail/useRun";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { ROLE_LABEL } from "./sections";

/** Quyền vai trò quản trị luôn giữ (API cũng chặn). */
const LOCKED_ADMIN = ["admin.roles"];
const isAdminPerm = (id: string) => id.startsWith("admin.");

interface GridProps {
  data: RbacData;
  adminKind: boolean;
  perms: string[];
  toggle: (id: string, on: boolean) => void;
}

/** Quyền theo nhóm. Vai trò quản trị chỉ thấy nhóm quản trị; vai trò nghiệp vụ không thấy nhóm quản trị. */
function PermissionGrid({ data, adminKind, perms, toggle }: GridProps) {
  const shown = data.permissions.filter((p) => isAdminPerm(p.id) === adminKind);
  const groups = [...new Set(shown.map((p) => p.group))];
  const locked = (id: string) => adminKind && LOCKED_ADMIN.includes(id);
  return (
    <div className="grid grid-cols-3 gap-3 max-[899px]:grid-cols-1">
      {groups.map((g) => (
        <fieldset key={g} className="rounded-panel border border-line bg-white p-2">
          <legend className="px-1 text-[12px] font-semibold">{g}</legend>
          {shown.filter((p) => p.group === g).map((p) => (
            <label key={p.id} className="flex items-center gap-2 py-0.5 text-[13px]" title={locked(p.id) ? "Vai trò quản trị luôn giữ quyền này" : p.id}>
              <input type="checkbox" checked={perms.includes(p.id)} disabled={locked(p.id)} onChange={(e) => toggle(p.id, e.target.checked)} />
              {p.label}{locked(p.id) && <span className="text-muted"> (bắt buộc)</span>}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}

interface Props {
  data: RbacData;
  /** undefined = tạo mới. */
  role?: RoleRow;
  onClose: () => void;
}

/** Form tạo / sửa vai trò: tên, loại (chỉ khi tạo), phạm vi xem, quyền theo nhóm. */
export function RoleEditor({ data, role, onClose }: Props) {
  const [name, setName] = useState(role?.name ?? "");
  const [kind, setKind] = useState(role?.kind ?? "canbo");
  const [scope, setScope] = useState<Scope>(role?.scope ?? data.scopesForKind["canbo"]![0]!);
  const [perms, setPerms] = useState<string[]>(role?.perms ?? []);
  const { run, pending, error } = useRun();
  const adminKind = kind === "admin";
  const scopes = data.scopesForKind[kind] ?? [];

  const pickKind = (k: string) => {
    setKind(k);
    setScope(data.scopesForKind[k]?.[0] ?? "none");
    setPerms(k === "admin" ? [...LOCKED_ADMIN] : []);
  };
  const toggle = (id: string, on: boolean) => setPerms((s) => (on ? [...s, id] : s.filter((x) => x !== id)));
  const save = () => {
    const body = { name: name.trim(), scope, perms };
    run(() => (role ? updateRole(role.id, body) : createRole({ ...body, kind })), onClose);
  };
  const remove = () => {
    if (role && window.confirm(`Xoá vai trò "${role.name}"? Chỉ xoá được khi chưa gán cho ai.`)) run(() => deleteRole(role.id), onClose);
  };

  return (
    <form className="flex flex-col gap-3 rounded-panel border border-brand/30 bg-blue-tint/40 p-3" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <p className="font-semibold">{role ? `Sửa vai trò: ${role.name}` : "Thêm vai trò"}</p>
      <div className="grid grid-cols-3 gap-3 max-[899px]:grid-cols-1">
        <TextField id="role-name" label="Tên vai trò" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
        <SelectField id="role-kind" label="Loại (giao diện, hồ sơ)" value={kind} disabled={!!role} onChange={(e) => pickKind(e.target.value)}
          options={Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))} />
        <SelectField id="role-scope" label="Phạm vi xem phản ánh" value={scope} onChange={(e) => setScope(e.target.value as Scope)}
          options={scopes.map((s) => ({ value: s, label: data.scopes[s] }))} />
      </div>
      <PermissionGrid data={data} adminKind={adminKind} perms={perms} toggle={toggle} />
      <p className="text-[12px] text-muted">
        {adminKind ? "Vai trò quản trị chỉ nhận quyền quản trị, không xem nội dung phản ánh." : "Quyền chỉ quyết định ai được làm; thao tác vẫn theo trạng thái phản ánh."}
      </p>
      {error && <p role="alert" className="text-red">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" kind="primary" loading={pending}>{role ? "Lưu thay đổi" : "Thêm"}</Button>
        <Button onClick={onClose} disabled={pending}>Hủy</Button>
        {role && !role.system && <Button kind="danger" onClick={remove} disabled={pending}>Xoá vai trò</Button>}
      </div>
    </form>
  );
}
