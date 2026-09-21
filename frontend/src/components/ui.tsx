import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-5">
      <div>
        <h3 className="text-base font-semibold text-primary">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

type Tone = "primary" | "accent" | "success" | "danger" | "warning" | "neutral";

const badgeTones: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  warning: "bg-warning/10 text-warning",
  neutral: "bg-black/5 text-muted",
};

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary:
      "bg-primary text-surface hover:opacity-90",
    ghost:
      "border border-border bg-transparent text-muted hover:text-primary hover:border-border",
    danger:
      "bg-danger text-white hover:opacity-90",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <input
        {...props}
        className={`w-full rounded-xl border border-border bg-surface-strong px-3.5 py-2.5 text-sm text-primary placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 ${props.className ?? ""}`}
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      <select
        {...props}
        className="w-full appearance-none rounded-xl border border-border bg-surface-strong px-3.5 py-2.5 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
      >
        {children}
      </select>
    </label>
  );
}

export function Stat({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold text-primary tabular-nums">{value}</p>
          {delta && <p className="mt-1 text-xs font-medium text-muted">{delta}</p>}
        </div>
        {icon && (
          <div className="rounded-xl border border-border bg-surface-strong p-2.5 text-primary">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-strong text-muted">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a3 3 0 1 1 5 2.2c-.8.7-.3 1.1-1.5 1.8" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="0.5" fill="currentColor" />
        </svg>
      </div>
      <p className="text-sm font-medium text-primary">{title}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const tableWrap =
  "border-b border-border/60 px-4 py-3 text-sm whitespace-nowrap";
const tableHead = `${tableWrap} text-xs font-semibold uppercase tracking-wider text-muted`;

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <th className={`${tableHead} ${className}`}>{children}</th>;
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`${tableWrap} ${className}`}>{children}</td>;
}
