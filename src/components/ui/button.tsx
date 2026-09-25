import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "brand" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-sun-500 text-brand-950 hover:bg-sun-400",
  brand: "bg-brand-800 text-white hover:bg-brand-700",
  outline: "border border-line bg-paper text-ink hover:border-brand-800",
  ghost: "text-ink hover:bg-leaf",
  danger: "bg-ember-600 text-white hover:brightness-110",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-14 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-semibold transition-colors",
    "disabled:pointer-events-none disabled:opacity-50 select-none",
    variants[variant], sizes[size], extra,
  );
}

export function Button({
  variant = "primary", size = "md", className, loading, children, disabled, ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary", size = "md", className, ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
