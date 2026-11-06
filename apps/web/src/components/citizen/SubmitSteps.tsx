"use client";

import { TextArea, TextField, SelectField } from "@/components/ui/Field";
import { useCatalog } from "@/api/catalog";

export interface Draft {
  topic: string;
  photos: number;
  ward: string;
  address: string;
  description: string;
  consentShowKp: boolean;
  onBehalfName: string;
  onBehalfPhone: string;
}

export const EMPTY_DRAFT: Draft = {
  topic: "", photos: 0, ward: "", address: "", description: "", consentShowKp: false, onBehalfName: "", onBehalfPhone: "",
};

export const MIN_DESC = 10;
type Set = (patch: Partial<Draft>) => void;

export function TopicStep({ d, set }: { d: Draft; set: Set }) {
  const { topics } = useCatalog();
  const urgent = topics.some((t) => t.name === d.topic && t.urgent);
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">1. Chọn chuyên đề</legend>
      <div className="grid grid-cols-3 gap-2 max-[759px]:grid-cols-2">
        {topics.length === 0 && <p className="col-span-3 text-muted">Đang tải chuyên đề…</p>}
        {topics.map((t) => (
          <button key={t.name} type="button" aria-pressed={d.topic === t.name} onClick={() => set({ topic: t.name })}
            className={`min-h-14 rounded-panel border p-2 text-left ${d.topic === t.name ? "border-brand bg-blue-tint font-semibold" : "border-line bg-white"}`}>
            {t.name}
          </button>
        ))}
      </div>
      {urgent && <p role="alert" className="mt-2 rounded-control bg-red-tint p-2 text-red">Việc khẩn cấp, nguy hiểm: gọi ngay 113 (Công an).</p>}
    </fieldset>
  );
}

export function PlaceStep({ d, set }: { d: Draft; set: Set }) {
  const { wards } = useCatalog();
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 font-semibold">2. Ảnh và vị trí</legend>
      <label className="flex flex-col gap-1">
        <span className="font-medium">Ảnh hiện trường</span>
        <input type="file" accept="image/*" multiple onChange={(e) => set({ photos: e.target.files?.length ?? 0 })} />
        <span className="text-[12px] text-muted">Đã chọn {d.photos} ảnh</span>
      </label>
      <SelectField id="ward" label="Khu phố" value={d.ward} onChange={(e) => set({ ward: e.target.value })}
        options={[{ value: "", label: "— Chọn khu phố —" }, ...wards.map((w) => ({ value: w, label: w }))]} />
      <TextField id="address" label="Địa chỉ cụ thể" placeholder="Số nhà, hẻm, đường…" value={d.address} onChange={(e) => set({ address: e.target.value })} />
    </fieldset>
  );
}

export function DescStep({ d, set }: { d: Draft; set: Set }) {
  const short = d.description.length > 0 && d.description.trim().length < MIN_DESC;
  return (
    <fieldset>
      <legend className="mb-2 font-semibold">3. Mô tả</legend>
      <TextArea id="desc" label="Nội dung phản ánh" rows={5} placeholder="Mô tả sự việc, thời gian, mức độ ảnh hưởng…"
        value={d.description} onChange={(e) => set({ description: e.target.value })} error={short ? `Cần ít nhất ${MIN_DESC} ký tự` : undefined} />
    </fieldset>
  );
}

export function PrivacyStep({ d, set, onBehalf }: { d: Draft; set: Set; onBehalf: boolean }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 font-semibold">4. Quyền riêng tư và gửi</legend>
      {onBehalf && (
        <>
          <TextField id="ob-name" label="Họ tên người dân" value={d.onBehalfName} onChange={(e) => set({ onBehalfName: e.target.value })} />
          <TextField id="ob-phone" label="Số điện thoại người dân" inputMode="tel" value={d.onBehalfPhone} onChange={(e) => set({ onBehalfPhone: e.target.value })} />
        </>
      )}
      {onBehalf ? (
        <p className="text-[12px] text-muted">Người dân sẽ nhận tin Zalo để tự xác nhận có cho trưởng khu phố xem danh tính hay không. Trước khi xác nhận, danh tính được ẩn.</p>
      ) : (
        <label className="flex items-start gap-2">
          <input type="checkbox" className="mt-1" checked={d.consentShowKp} onChange={(e) => set({ consentShowKp: e.target.checked })} />
          <span>Đồng ý cho trưởng khu phố xem tên và số điện thoại của tôi.
            <span className="block text-[12px] text-muted">Cán bộ xử lý luôn thấy thông tin liên hệ. Mỗi lần xem đều được ghi nhật ký.</span></span>
        </label>
      )}
    </fieldset>
  );
}

export function stepError(step: number, d: Draft, onBehalf: boolean): string | undefined {
  if (step === 0 && !d.topic) return "Chọn một chuyên đề";
  if (step === 1 && (!d.ward || !d.address.trim())) return "Chọn khu phố và nhập địa chỉ";
  if (step === 2 && d.description.trim().length < MIN_DESC) return `Mô tả cần ít nhất ${MIN_DESC} ký tự`;
  if (step === 3 && onBehalf && (!d.onBehalfName.trim() || d.onBehalfPhone.replace(/\D/g, "").length < 9)) return "Nhập họ tên và SĐT người dân";
  return undefined;
}
