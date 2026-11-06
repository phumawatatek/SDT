import { type Audience, type BadgeTone, type CaseStatus, STATUS_META, statusLabel } from "@/lib/status";

const TONE_CLASS: Record<BadgeTone, string> = {
  amber: "bg-amber-tint text-amber-ink",
  blue: "bg-blue-tint text-brand-ink",
  green: "bg-green-tint text-green-ink",
  gray: "bg-gray-tint text-ink",
};

interface StatusBadgeProps {
  status: CaseStatus;
  audience?: Audience;
}

/** Luôn có chữ, không dùng màu thay chữ (PHASE1_SPEC §12). */
export function StatusBadge({ status, audience = "staff" }: StatusBadgeProps) {
  const tone = STATUS_META[status].tone;
  return (
    <span
      data-tone={tone}
      className={`inline-block whitespace-nowrap rounded-group px-1.5 py-0.5 text-[12px] font-medium ${TONE_CLASS[tone]}`}
    >
      {statusLabel(status, audience)}
    </span>
  );
}
