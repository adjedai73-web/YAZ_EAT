"use client";
import { useOptimistic, useTransition } from "react";
import type { FormState } from "@/lib/admin/form";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/format";
import { patchProduct, setOrdersOpen } from "@/lib/admin/actions";

/** Small optimistic on/off switch calling a server action. Reverts and toasts on failure. */
export function SwitchAction({ checked, label, onToggle, successMessage }: {
  checked: boolean; label: string; onToggle: (next: boolean) => Promise<FormState>; successMessage?: (next: boolean) => string;
}) {
  const [pending, start] = useTransition();
  const [value, setValue] = useOptimistic(checked);
  return (
    <button type="button" role="switch" aria-checked={value} aria-label={label} title={label} disabled={pending}
      onClick={() => start(async () => {
        const next = !value;
        setValue(next);
        const res = await onToggle(next);
        if (res?.error) toast(res.error, "error");
        else if (successMessage) toast(successMessage(next));
      })}
      className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60", value ? "bg-brand-800" : "bg-line")}>
      <span className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", value && "translate-x-5")} />
    </button>
  );
}

// --- concrete switches (client-side wrappers so server pages can pass plain data) ---

type ProductFlag = "active" | "available" | "featured" | "bestseller";
export function ProductSwitch({ id, field, checked, label }: { id: string; field: ProductFlag; checked: boolean; label: string }) {
  return <SwitchAction checked={checked} label={label} onToggle={(next) => patchProduct(id, { [field]: next })} />;
}

export function OrdersOpenSwitch({ open }: { open: boolean }) {
  return <SwitchAction checked={open} label="Commandes en ligne ouvertes" onToggle={setOrdersOpen}
    successMessage={(n) => (n ? "Commandes ouvertes." : "Commandes fermées.")} />;
}
