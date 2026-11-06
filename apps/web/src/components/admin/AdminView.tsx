"use client";

import { useState } from "react";
import { addHoliday, removeHoliday, type AdminOptions, type Row } from "@/api/admin";
import { useRun } from "@/components/detail/useRun";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { ADMIN_SECTIONS, type AdminSection } from "@/lib/roles";
import { CrudSection } from "./CrudSection";
import { SECTIONS } from "./sections";

function SimpleTable({ head, rows, actions }: { head: string[]; rows: string[][]; actions?: (i: number) => React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-panel border border-line bg-white">
      <table className="w-full text-[13px]">
        <thead className="bg-th-bg text-left text-[12px]">
          <tr>{head.map((h) => <th key={h} scope="col" className="px-2 py-2">{h}</th>)}{actions && <th />}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={head.length + 1} className="p-6 text-center text-muted">Chưa có dữ liệu.</td></tr>}
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line-2">
              {r.map((v, j) => <td key={j} className="px-2 py-1.5">{v}</td>)}
              {actions && <td className="px-2 py-1.5">{actions(i)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Ngày nghỉ: khoá theo ngày, chỉ thêm / xoá (không gắn dữ liệu khác nên xoá cứng được). */
function Holidays({ rows }: { rows: Row[] }) {
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const { run, pending, error } = useRun();
  const add = () => run(() => addHoliday(date, name.trim()), () => { setDate(""); setName(""); });
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-[17px] font-bold">Ngày nghỉ</h1>
      <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
        <div className="w-44"><TextField id="h-date" label="Ngày" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="w-72"><TextField id="h-name" label="Tên ngày nghỉ" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} /></div>
        <Button type="submit" kind="primary" loading={pending}>+ Thêm</Button>
        {error && <p role="alert" className="text-red">{error}</p>}
      </form>
      <SimpleTable head={["Ngày", "Tên"]} rows={rows.map((h) => [String(h["date"]), String(h["name"])])}
        actions={(i) => <Button size="sm" kind="danger" disabled={pending}
          onClick={() => window.confirm("Xoá ngày nghỉ này?") && run(() => removeHoliday(String(rows[i]?.["date"])))}>Xoá</Button>} />
      <p className="text-[12px] text-muted">Hạn xử lý tính theo ngày làm việc, bỏ qua các ngày này.</p>
    </div>
  );
}

function AccessLog({ rows }: { rows: Row[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-[17px] font-bold">Nhật ký truy cập</h1>
      <p className="text-[12px] text-muted">Chỉ ghi thêm, không sửa / xoá (Luật 91/2025). Hiện 200 dòng mới nhất.</p>
      <SimpleTable head={["Thời điểm", "Người xem", "Vai trò", "Mã phản ánh", "Hành động"]}
        rows={rows.map((e) => [new Date(String(e["at"])).toLocaleString("vi-VN"), String(e["user"]), String(e["role"]), String(e["caseCode"]), String(e["action"])])} />
    </div>
  );
}

/** Một mục quản trị (chọn ở thanh bên). Quản trị cấu hình, không xem nội dung phản ánh. */
export function AdminView({ section, data }: { section: Exclude<AdminSection, "roles">; data: { rows: Row[]; options: AdminOptions } | null }) {
  if (!data) return <p className="rounded-panel bg-white p-6 text-center text-muted">Chỉ quản trị hệ thống được vào trang này.</p>;
  if (section === "holidays") return <Holidays rows={data.rows} />;
  if (section === "log") return <AccessLog rows={data.rows} />;
  const title = ADMIN_SECTIONS.find((s) => s.id === section)?.label ?? "";
  return <CrudSection key={section} title={title} spec={SECTIONS[section]} rows={data.rows} options={data.options} />;
}
