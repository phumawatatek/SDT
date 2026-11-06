import { LoginForm } from "@/components/shell/LoginForm";
import { TopBar } from "@/components/shell/ShellFrame";

export const metadata = { title: "Đăng nhập · PAKN Phường Xuân Lãnh" };

/** Tài khoản seed (apps/api/src/seed). Hiện ở dev, hoặc khi bật NEXT_PUBLIC_DEMO_ACCOUNTS=1 (máy demo). */
const DEMO_ACCOUNTS: [string, string][] = [
  ["citizen", "Người dân"], ["kp", "Trưởng khu phố"], ["canbo", "Cán bộ"], ["canbo2", "Cán bộ"], ["canbo3", "Cán bộ"],
  ["canbo4", "Cán bộ"], ["tonghop", "Cán bộ tổng hợp phòng"], ["truongphong", "Trưởng phòng"], ["photruongphong", "Phó trưởng phòng"],
  ["dieuphoi", "Điều phối viên"], ["phochutich", "Phó Chủ tịch"], ["chutich", "Chủ tịch"], ["giamsat", "Giám sát (chỉ xem)"],
  ["admin", "Quản trị"],
];
const SHOW = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEMO_ACCOUNTS === "1";

export default function Page() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <LoginForm />
      {SHOW && (
        <div className="mx-auto mt-3 max-w-sm px-3 text-[12px] text-muted">
          <p className="font-semibold">Tài khoản demo — mật khẩu: 123456</p>
          <ul className="mt-1 grid grid-cols-2 gap-x-3">
            {DEMO_ACCOUNTS.map(([u, r]) => <li key={u}><span className="font-mono text-ink">{u}</span> · {r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
