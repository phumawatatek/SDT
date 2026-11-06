import { LoginForm } from "@/components/shell/LoginForm";
import { TopBar } from "@/components/shell/ShellFrame";

export const metadata = { title: "Đăng nhập · PAKN Phường Xuân Lãnh" };

const DEMO_ACCOUNTS = ["citizen", "kp", "canbo", "canbo2", "canbo3", "canbo4", "truongphong", "dieuphoi", "phochutich", "chutich", "admin"];

export default function Page() {
  return (
    <div className="min-h-screen">
      <TopBar />
      <LoginForm />
      {process.env.NODE_ENV !== "production" && (
        <p className="mx-auto mt-3 max-w-sm px-3 text-[12px] text-muted">
          Môi trường dev — tài khoản seed: {DEMO_ACCOUNTS.join(", ")}. Mật khẩu: SEED_PASSWORD trong apps/api/.env.
        </p>
      )}
    </div>
  );
}
