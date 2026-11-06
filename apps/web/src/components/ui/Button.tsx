import type { ButtonHTMLAttributes } from "react";
import type { ActionKind } from "@/api/types";

const KIND: Record<ActionKind, string> = {
  primary: "bg-brand text-white border-brand hover:bg-brand-deep",
  success: "bg-green-ink text-white border-green-ink hover:opacity-90",
  danger: "bg-white text-red border-red hover:bg-red-tint",
  normal: "bg-white text-ink border-line hover:bg-blue-tint",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ActionKind;
  size?: "md" | "sm";
  loading?: boolean;
}

/** Nút: Chính, Thành công, Nguy hiểm, Thường; cỡ 32px và nhỏ 28px (PHASE1_SPEC §12). */
export function Button({ kind = "normal", size = "md", loading, disabled, children, className = "", ...rest }: ButtonProps) {
  const height = size === "sm" ? "h-7 px-2.5" : "h-8 px-3";
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-1 rounded-control border font-medium focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-50 ${height} ${KIND[kind]} ${className}`}
      {...rest}
    >
      {loading ? "Đang gửi…" : children}
    </button>
  );
}
