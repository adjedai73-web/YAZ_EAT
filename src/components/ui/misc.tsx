import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-leaf", className)} aria-hidden />;
}

export function EmptyState({ title, text, action, icon }: { title: string; text?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-16 text-center">
      {icon && <div className="mb-4 grid size-16 place-items-center rounded-full bg-leaf text-brand-800">{icon}</div>}
      <h2 className="text-xl font-bold">{title}</h2>
      {text && <p className="mt-2 text-ink-soft">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "info" | "success"; children: ReactNode }) {
  const tones = {
    error: "border-ember-600/30 bg-ember-100 text-ember-600",
    info: "border-sun-500/40 bg-sun-100 text-ink",
    success: "border-brand-800/20 bg-brand-100 text-brand-900",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-[var(--radius-control)] border px-4 py-3 text-sm font-medium", tones[tone])}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "brand" | "accent" | "danger"; className?: string }) {
  const tones = {
    neutral: "bg-leaf text-ink-soft",
    brand: "bg-brand-100 text-brand-900",
    accent: "bg-sun-100 text-brand-950",
    danger: "bg-ember-100 text-ember-600",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>{children}</span>;
}
