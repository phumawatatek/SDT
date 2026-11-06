"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition, type FormEvent } from "react";
import { login } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";

const noop = () => () => {};

/** Đăng nhập qua API: API cấp JWT trong cookie httpOnly, rồi về trang chính của vai trò. */
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // Khoá nút tới khi JS chạy: bấm sớm sẽ không bị nuốt mất.
  const ready = useSyncExternalStore(noop, () => true, () => false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    start(async () => {
      const r = await login(String(f.get("username") ?? ""), String(f.get("password") ?? ""));
      if (!r.ok) return setError(r.error);
      router.replace("/");
      router.refresh();
    });
  };
  return (
    <Panel title="Đăng nhập cán bộ" className="mx-auto mt-10 max-w-sm">
      <form method="post" onSubmit={submit} className="flex flex-col gap-3">
        <TextField id="username" name="username" label="Tên đăng nhập" autoComplete="username" required autoFocus />
        <TextField id="password" name="password" type="password" label="Mật khẩu" autoComplete="current-password" required />
        {error && <p role="alert" className="text-red">{error}</p>}
        <Button type="submit" kind="primary" loading={pending} disabled={!ready}>Đăng nhập</Button>
      </form>
    </Panel>
  );
}
