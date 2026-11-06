import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  small?: boolean;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Khung: đệm 12px dọc, 14px ngang, bo 8px. */
export function Panel({ title, small, actions, children, className = "" }: PanelProps) {
  return (
    <section className={`rounded-panel border border-line bg-white px-3.5 py-3 shadow-panel ${className}`}>
      {title && (
        <header className="mb-2 flex items-center justify-between gap-2">
          <h2 className={small ? "text-[12.5px] font-semibold uppercase text-muted" : "text-[15px] font-semibold"}>
            {title}
          </h2>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function LabelValue({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-1">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
