import { STATUS_LABELS, cn } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const TONES: Record<OrderStatus, string> = {
  NEW: "bg-sun-500 text-brand-950",
  CONFIRMED: "bg-brand-100 text-brand-900",
  PREPARING: "bg-[#e7ecff] text-[#2f3f8f]",
  READY: "bg-[#e3f5ee] text-[#16664a]",
  OUT_FOR_DELIVERY: "bg-[#f2e8ff] text-[#5b2d91]",
  DELIVERED: "bg-leaf text-ink-soft",
  CANCELLED: "bg-ember-100 text-ember-600",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold", TONES[status], className)}>{STATUS_LABELS[status]}</span>;
}
