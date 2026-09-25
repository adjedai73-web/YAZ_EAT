"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/format";

/** Native <dialog> confirmation (accessible, no dependency). */
export function ConfirmButton({ label, title, description, confirmLabel, onConfirm, withReason, variant = "danger-outline", icon, className }: {
  label: string; title: string; description?: string; confirmLabel: string;
  onConfirm: (reason?: string) => void | Promise<void>; withReason?: boolean;
  variant?: "danger-outline" | "icon"; icon?: React.ReactNode; className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} aria-label={variant === "icon" ? label : undefined}
        className={cn(variant === "icon"
          ? "grid size-9 place-items-center rounded-full text-ink-soft hover:bg-ember-100 hover:text-ember-600"
          : "h-11 w-full rounded-[var(--radius-control)] border border-ember-600/30 text-sm font-semibold text-ember-600 hover:bg-ember-100", className)}>
        {variant === "icon" ? icon : label}
      </button>
      <dialog ref={ref} className="m-auto w-[min(92vw,420px)] rounded-[var(--radius-card)] p-0 backdrop:bg-brand-950/50">
        <form method="dialog" className="p-6" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true);
          try { await onConfirm(withReason ? reason.trim() : undefined); } finally { setBusy(false); ref.current?.close(); setReason(""); }
        }}>
          <h2 className="text-xl font-bold">{title}</h2>
          {description && <p className="mt-2 text-ink-soft">{description}</p>}
          {withReason && (
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Motif (facultatif)"
              className="mt-4 min-h-20 w-full rounded-[var(--radius-control)] border border-line p-3" />
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => ref.current?.close()}>Retour</Button>
            <Button type="submit" variant="danger" loading={busy}>{confirmLabel}</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
