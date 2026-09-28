"use client";

import clsx from "clsx";
import Link from "next/link";
import {
  forwardRef,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

// ---------- Card ----------

export function Card({
  className,
  children,
  lift,
  as: Tag = "div",
  style,
  ref,
}: {
  className?: string;
  children: ReactNode;
  lift?: boolean;
  as?: "div" | "section" | "article" | "li";
  style?: CSSProperties;
  ref?: Ref<HTMLElement>;
}) {
  return (
    // Each tag types its own ref; all four accept an HTMLElement ref at runtime.
    <Tag ref={ref as Ref<never>} style={style} className={clsx("panel p-5", lift && "hoverable", className)}>
      {children}
    </Tag>
  );
}

// ---------- Button ----------

type Tone = "primary" | "neutral" | "danger" | "ghost";
const TONES: Record<Tone, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  neutral: "border-line bg-surface-2 text-ink hover:border-line-strong",
  danger: "border-danger-ink/30 bg-danger text-danger-ink hover:border-danger-ink/60",
  ghost: "bg-transparent text-ink-muted hover:bg-surface-2 hover:text-ink",
};
const SIZES = { sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-base" };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  size?: keyof typeof SIZES;
  busy?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ tone = "neutral", size = "md", busy, icon, className, children, disabled, type = "button", ...rest }, ref) {
  return (
    <button ref={ref} type={type} disabled={disabled || busy} className={clsx("btn", TONES[tone], SIZES[size], className)} {...rest}>
      {busy ? <Spinner /> : icon}
      {children}
    </button>
  );
});

export function LinkButton({ href, tone = "neutral", size = "md", className, children, external }: { href: string; tone?: Tone; size?: keyof typeof SIZES; className?: string; children: ReactNode; external?: boolean }) {
  const cls = clsx("btn", TONES[tone], SIZES[size], className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span aria-hidden className={clsx("inline-block size-4 rounded-full border-2 border-current border-r-transparent animate-spin", className)} />;
}

// ---------- Badge ----------

type BadgeTone = "success" | "danger" | "warning" | "info" | "accent" | "neutral";
const BADGE_TONES: Record<BadgeTone, string> = {
  success: "bg-success text-success-ink",
  danger: "bg-danger text-danger-ink",
  warning: "bg-warning text-warning-ink",
  info: "bg-info text-info-ink",
  accent: "bg-accent/20 text-accent",
  neutral: "bg-surface-2 text-ink-muted",
};

/** `caps={false}` keeps the text as written (e.g. "#32 low"). */
export function Badge({
  tone = "neutral",
  children,
  className,
  pulse,
  title,
  caps = true,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  pulse?: boolean;
  title?: string;
  caps?: boolean;
}) {
  return (
    <span
      title={title}
      className={clsx("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.7rem] font-semibold", caps && "uppercase tracking-wide", BADGE_TONES[tone], pulse && "animate-pulse", className)}
    >
      {children}
    </span>
  );
}

// ---------- Form controls ----------

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={clsx("field", className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={clsx("field min-h-24 resize-y", className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={clsx("field pr-8", className)} {...rest}>
      {children}
    </select>
  );
});

export function Field({ label, hint, htmlFor, children, className }: { label: string; hint?: ReactNode; htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; id: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 py-1">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description ? <span className="block text-xs text-ink-muted">{description}</span> : null}
      </span>
      <span className="relative inline-flex">
        <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="block h-6 w-11 rounded-full border border-line bg-surface-2 transition-colors peer-checked:border-accent peer-checked:bg-accent" />
        <span className="absolute left-1 top-1 block size-4 rounded-full bg-ink transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

// ---------- Misc ----------

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("well rounded-card animate-pulse", className)} />;
}

export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-full border border-line bg-surface-2 text-xl text-ink-muted" aria-hidden>
        ◎
      </div>
      <h2 className="text-base font-semibold">{title}</h2>
      {body ? <p className="max-w-md text-sm text-ink-muted">{body}</p> : null}
      {action}
    </Card>
  );
}

export function ErrorNote({ error }: { error: { message: string } | null | undefined }) {
  if (!error) return null;
  return (
    <p role="alert" className="rounded-lg border border-danger-ink/30 bg-danger px-3 py-2 text-sm text-danger-ink">
      {error.message}
    </p>
  );
}

/** Native <dialog> confirmation. */
export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel, busy }: { open: boolean; title: string; body: ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onCancel={onCancel} className="dialog-panel m-auto w-[min(92vw,440px)] p-6 text-ink backdrop:bg-black/60 backdrop:backdrop-blur-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-sm text-ink-muted">{body}</div>
      <div className="mt-6 flex justify-end gap-3">
        <Button onClick={onCancel}>Cancel</Button>
        <Button tone="danger" busy={busy} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
