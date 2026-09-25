import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

const control =
  "w-full rounded-[var(--radius-control)] border border-line bg-paper px-4 text-[16px] text-ink placeholder:text-ink-soft/70 " +
  "transition-colors focus:border-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-800/15 disabled:bg-leaf aria-[invalid=true]:border-ember-600";

export function Field({ label, htmlFor, error, hint, children, className }: {
  label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">{label}</label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-ember-600" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-sm text-ink-soft">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, "h-12", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(control, "min-h-24 py-3", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(control, "h-12 appearance-none bg-[length:1rem] pr-10", className)} {...props} />;
}

export function Toggle({ label, description, className, ...props }: ComponentProps<"input"> & { label: string; description?: string }) {
  return (
    <label className={cn("flex cursor-pointer items-start justify-between gap-4 py-2", className)}>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="block text-sm text-ink-soft">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" {...props} />
        <span className="h-7 w-12 rounded-full bg-line transition-colors peer-checked:bg-brand-800 peer-focus-visible:ring-2 peer-focus-visible:ring-sun-500" />
        <span className="absolute left-1 top-1 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
