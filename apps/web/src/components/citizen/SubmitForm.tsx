"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useUser } from "@/components/shell/ShellContext";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { submitCase } from "@/api/client";
import { DescStep, EMPTY_DRAFT, PlaceStep, PrivacyStep, stepError, TopicStep, type Draft } from "./SubmitSteps";

const STEP_NAMES = ["Chuyên đề", "Ảnh và vị trí", "Mô tả", "Quyền riêng tư"];

/** Luồng gửi 4 bước, có thanh tiến độ, quay lại không mất dữ liệu. Trưởng KP dùng để gửi hộ. */
function SentPanel({ code }: { code: string }) {
  return (
    <Panel title="Đã gửi phản ánh" className="mx-auto max-w-xl text-[15px]">
      <p>Mã tra cứu: <strong className="text-[22px] text-brand">{code}</strong></p>
      <p className="mt-1 text-muted">Phường sẽ báo tiến độ qua Zalo. Bạn có thể tra cứu bằng mã này bất cứ lúc nào.</p>
      <Link href="/tra-cuu" className="mt-3 inline-block text-brand underline">Tra cứu bằng mã</Link>
    </Panel>
  );
}

export function SubmitForm() {
  const user = useUser();
  const onBehalf = user.role === "kp";
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(EMPTY_DRAFT);
  const [sent, setSent] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [sending, start] = useTransition();
  const send = () => start(async () => {
    setFailed(null);
    const r = await submitCase(d);
    if (r.ok) setSent(r.code);
    else setFailed(r.error);
  });
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));
  const error = stepError(step, d, onBehalf);

  if (user.role !== "citizen" && !onBehalf) {
    return <p className="rounded-panel bg-white p-6 text-center text-muted">Chỉ người dân hoặc trưởng khu phố (gửi hộ) dùng trang này.</p>;
  }
  if (sent) return <SentPanel code={sent} />;
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 text-[15px]">
      <h1 className="text-[17px] font-bold">{onBehalf ? "Gửi hộ người dân" : "Gửi phản ánh"}</h1>
      <ol aria-label="Các bước" className="flex gap-1">
        {STEP_NAMES.map((n, i) => (
          <li key={n} aria-current={i === step ? "step" : undefined}
            className={`flex-1 rounded-group px-2 py-1 text-center text-[12px] ${i < step ? "bg-brand text-white" : i === step ? "bg-gold" : "bg-line-2 text-muted"}`}>{n}</li>
        ))}
      </ol>
      <Panel>
        {step === 0 && <TopicStep d={d} set={set} />}
        {step === 1 && <PlaceStep d={d} set={set} />}
        {step === 2 && <DescStep d={d} set={set} />}
        {step === 3 && <PrivacyStep d={d} set={set} onBehalf={onBehalf} />}
      </Panel>
      <div className="flex items-center justify-between gap-2">
        <Button disabled={step === 0} onClick={() => setStep(step - 1)}>Quay lại</Button>
        {error && <span className="text-[12px] text-muted">{error}</span>}
        {failed && <span role="alert" className="text-[12px] text-red">{failed}</span>}
        {step < 3
          ? <Button kind="primary" disabled={!!error} onClick={() => setStep(step + 1)}>Tiếp tục</Button>
          : <Button kind="primary" disabled={!!error} loading={sending} onClick={send}>Gửi phản ánh</Button>}
      </div>
    </div>
  );
}
