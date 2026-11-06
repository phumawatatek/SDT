"use client";

import { useState, type FormEvent } from "react";
import type { AdminOptions, Row } from "@/api/admin";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import type { FieldSpec } from "./sections";

type Values = Record<string, string | boolean>;

/** Giá trị form (chuỗi) từ bản ghi. */
export function toValues(fields: FieldSpec[], row?: Row): Values {
  return Object.fromEntries(fields.map((f) => {
    const v = row?.[f.key];
    if (f.type === "checkbox") return [f.key, v === true];
    return [f.key, v === null || v === undefined ? "" : String(v)];
  }));
}

/** Chuyển giá trị form sang body API: số, null cho ô trống, bỏ trường chỉ-khi-tạo khi sửa. */
export function toBody(fields: FieldSpec[], values: Values, editing: boolean): Row {
  const body: Row = {};
  for (const f of fields) {
    if (editing && f.createOnly) continue;
    const v = values[f.key];
    if (f.type === "checkbox") body[f.key] = v === true;
    else if (v === "" || v === undefined) body[f.key] = f.required ? "" : null;
    else if (f.numeric || f.type === "number") body[f.key] = Number(v);
    else body[f.key] = typeof v === "string" ? v.trim() : v;
  }
  return body;
}

function Field({ f, value, set, options }: { f: FieldSpec; value: string | boolean; set: (v: string | boolean) => void; options: AdminOptions }) {
  const id = `f-${f.key}`;
  if (f.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 self-end pb-1.5">
        <input id={id} type="checkbox" checked={value === true} onChange={(e) => set(e.target.checked)} /> {f.label}
      </label>
    );
  }
  if (f.type === "select") {
    const opts = f.options?.(options) ?? [];
    const head = f.nullable ? [{ value: "", label: "— Không —" }] : [{ value: "", label: "— Chọn —" }];
    return <SelectField id={id} label={f.label} required={f.required} value={String(value)} onChange={(e) => set(e.target.value)} options={[...head, ...opts]} />;
  }
  return (
    <TextField id={id} label={f.label} type={f.type} required={f.required} value={String(value)}
      autoComplete={f.type === "password" ? "new-password" : "off"} onChange={(e) => set(e.target.value)} />
  );
}

interface Props {
  fields: FieldSpec[];
  options: AdminOptions;
  row?: Row;
  pending: boolean;
  error: string | null;
  onSubmit: (body: Row) => void;
  onCancel: () => void;
}

/** Form thêm / sửa một bản ghi quản trị. */
export function EntityForm({ fields, options, row, pending, error, onSubmit, onCancel }: Props) {
  const editing = !!row;
  const [values, setValues] = useState<Values>(() => toValues(fields, row));
  const visible = fields.filter((f) => !(editing && f.createOnly));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(toBody(fields, values, editing));
  };
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-panel border border-brand/30 bg-blue-tint/40 p-3">
      <p className="font-semibold">{editing ? "Sửa" : "Thêm mới"}</p>
      <div className="grid grid-cols-3 gap-3 max-[899px]:grid-cols-1">
        {visible.map((f) => (
          <Field key={f.key} f={f} value={values[f.key] ?? ""} options={options} set={(v) => setValues((s) => ({ ...s, [f.key]: v }))} />
        ))}
      </div>
      {error && <p role="alert" className="text-red">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" kind="primary" loading={pending}>{editing ? "Lưu thay đổi" : "Thêm"}</Button>
        <Button onClick={onCancel} disabled={pending}>Hủy</Button>
      </div>
    </form>
  );
}
