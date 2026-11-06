"use client";

import { useState } from "react";
import { useCatalog } from "@/api/catalog";
import { editCase } from "@/api/client";
import type { CaseView } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { SelectField, TextArea, TextField } from "@/components/ui/Field";
import { useRun } from "./useRun";

const MIN_DESC = 10;

/** Người dân sửa khu phố, địa chỉ, nội dung khi phường chưa có cán bộ nhận. Đổi chuyên đề: rút rồi gửi lại. */
export function EditCaseForm({ c, onDone, onCancel }: { c: CaseView; onDone: () => void; onCancel: () => void }) {
  const { wards } = useCatalog();
  const [ward, setWard] = useState(c.ward);
  const [address, setAddress] = useState(c.address);
  const [description, setDescription] = useState(c.content);
  const { run, pending, error } = useRun();
  const ok = !!ward && address.trim().length >= 3 && description.trim().length >= MIN_DESC;
  const options = (wards.includes(ward) || !ward ? wards : [ward, ...wards]).map((w) => ({ value: w, label: w }));
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (ok) run(() => editCase(c.code, { ward, address: address.trim(), description: description.trim() }), onDone); }}>
      <SelectField id="edit-ward" label="Khu phố" value={ward} onChange={(e) => setWard(e.target.value)} options={options} />
      <TextField id="edit-address" label="Địa chỉ" required minLength={3} value={address} onChange={(e) => setAddress(e.target.value)} />
      <TextArea id="edit-desc" label="Nội dung" required rows={5} value={description} onChange={(e) => setDescription(e.target.value)}
        error={description.trim().length < MIN_DESC ? `Cần ít nhất ${MIN_DESC} ký tự` : undefined} />
      <p className="text-[12px] text-muted">Muốn đổi chuyên đề: rút phản ánh này rồi gửi lại.</p>
      {error && <p role="alert" className="text-red">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" kind="primary" disabled={!ok} loading={pending}>Lưu thay đổi</Button>
        <Button onClick={onCancel} disabled={pending}>Hủy</Button>
      </div>
    </form>
  );
}
