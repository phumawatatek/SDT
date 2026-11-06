import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const CONTROL =
  "w-full rounded-control border border-line bg-white px-2.5 py-1.5 placeholder:text-muted disabled:bg-paper aria-[invalid=true]:border-red";

interface WrapProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}

function Wrap({ id, label, error, children }: WrapProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium">{label}</label>
      {children}
      {error && <p id={`${id}-err`} className="text-[12px] text-red">{error}</p>}
    </div>
  );
}

type Base = { id: string; label: string; error?: string };

export function TextField({ id, label, error, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrap id={id} label={label} error={error}>
      <input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={`${CONTROL} h-8`} {...rest} />
    </Wrap>
  );
}

export function TextArea({ id, label, error, ...rest }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrap id={id} label={label} error={error}>
      <textarea id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={CONTROL} rows={3} {...rest} />
    </Wrap>
  );
}

type SelectProps = Base & SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
};

export function SelectField({ id, label, error, options, ...rest }: SelectProps) {
  return (
    <Wrap id={id} label={label} error={error}>
      <select id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={`${CONTROL} h-8`} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Wrap>
  );
}
