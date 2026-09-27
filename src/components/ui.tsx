"use client";

import clsx from "clsx";
import Link from "next/link";
import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

// ---------- Card ----------

export function Card({ className, children, lift, as: Tag = "div" }: { className?: string; children: ReactNode; lift?: boolean; as?: "div" | "section" | "article" | "li" }) {
  return <Tag className={clsx("clay p-6", lift && "clay-lift", className)}>{children}</Tag>;
}

// ---------- Button ----------

type Tone = "primary" | "neutral" | "mint" | "danger" | "ghost";
const TONES: Record<Tone, string> = {
  primary: "bg-accent text-accent-ink",
  neutral: "bg-surface text-ink",
  mint: "bg-mint text-mint-ink",
  danger: "bg-peach text-peach-ink",
  ghost: "bg-transparent text-ink shadow-none hover:bg-surface-2",
};
const SIZES = { sm: "px-3.5 py-2 text-sm", md: "px-5 py-2.5 text-[0.95rem]", lg: "px-6 py-3.5 text-base" };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  size?: keyof typeof SIZES;
  busy?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button({ tone = "neutral", size = "md", busy, icon, className, children, disabled, type = "button", ...rest }, ref) {
  return (
    <button ref={ref} type={type} disabled={disabled || busy} className={clsx("clay-btn", TONES[tone], SIZES[size], className)} {...rest}>
      {busy ? <Spinner /> : icon}
      {children}
    </button>
  );
});

export function LinkButton({ href, tone = "neutral", size = "md", className, children, external }: { href: string; tone?: Tone; size?: keyof typeof SIZES; className?: string; children: ReactNode; external?: boolean }) {
  const cls = clsx("clay-btn", TONES[tone], SIZES[size], className);
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
  return <span aria-hidden className={clsx("inline-block size-4 rounded-full border-2 border-current border-r-transparent animate-clay-spin", className)} />;
}

// ---------- Badge ----------

type BadgeTone = "mint" | "peach" | "lemon" | "lilac" | "accent" | "neutral";
const BADGE_TONES: Record<BadgeTone, string> = {
  mint: "bg-mint text-mint-ink",
  peach: "bg-peach text-peach-ink",
  lemon: "bg-lemon text-lemon-ink",
  lilac: "bg-lilac text-lilac-ink",
  accent: "bg-accent text-accent-ink",
  neutral: "bg-surface-2 text-ink-muted",
};

export function Badge({ tone = "neutral", children, className, pulse, title }: { tone?: BadgeTone; children: ReactNode; className?: string; pulse?: boolean; title?: string }) {
  return (
    <span title={title} className={clsx("clay-sm inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold tracking-wide", BADGE_TONES[tone], pulse && "animate-clay-pulse", className)}>
      {children}
    </span>
  );
}

// ---------- Form controls ----------

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={clsx("clay-input", className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={clsx("clay-input min-h-24 resize-y", className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={clsx("clay-input appearance-none pr-10", className)} {...rest}>
      {children}
    </select>
  );
});

export function Field({ label, hint, htmlFor, children, className }: { label: string; hint?: ReactNode; htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="px-1 text-sm font-bold text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="px-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function Toggle({ checked, onChange, label, description, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; id: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 rounded-[20px] px-1 py-1">
      <span>
        <span className="block text-sm font-bold">{label}</span>
        {description ? <span className="block text-xs text-ink-muted">{description}</span> : null}
      </span>
      <span className="relative inline-flex">
        <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <span className="clay-well block h-8 w-14 transition-colors peer-checked:bg-mint" />
        <span className="clay-sm absolute left-1 top-1 block size-6 rounded-full bg-surface transition-transform peer-checked:translate-x-6" />
      </span>
    </label>
  );
}

// ---------- Misc ----------

export function IconPlate({ src, alt, size = 72 }: { src: string | null | undefined; alt: string; size?: number }) {
  return (
    <div className="clay-sm grid shrink-0 place-items-center rounded-[22px] bg-surface-2" style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} width={size - 12} height={size - 12} loading="lazy" className="object-contain drop-shadow-md" />
      ) : (
        <span className="text-2xl" aria-hidden>
          ?
        </span>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("clay-well animate-pulse", className)} />;
}

export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="clay-sm grid size-16 place-items-center rounded-full bg-lilac text-2xl text-lilac-ink" aria-hidden>
        ◎
      </div>
      <h2 className="text-lg font-extrabold">{title}</h2>
      {body ? <p className="max-w-md text-sm text-ink-muted">{body}</p> : null}
      {action}
    </Card>
  );
}

export function ErrorNote({ error }: { error: { message: string } | null | undefined }) {
  if (!error) return null;
  return (
    <p role="alert" className="clay-sm rounded-[20px] bg-peach px-4 py-3 text-sm font-semibold text-peach-ink">
      {error.message}
    </p>
  );
}

/** Native <dialog> styled as a clay card. */
export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel, busy }: { open: boolean; title: string; body: ReactNode; confirmLabel: string; onConfirm: () => void; onCancel: () => void; busy?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} onCancel={onCancel} className="clay-dialog m-auto w-[min(92vw,440px)] p-7 text-ink backdrop:bg-[rgb(30_31_46/0.45)] backdrop:backdrop-blur-sm">
      <h2 className="text-xl font-extrabold">{title}</h2>
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
