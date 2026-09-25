"use client";
import { createContext, useActionState, useContext, useEffect, useRef } from "react";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { FormState } from "@/lib/admin/form";
import { Field } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { FormMessage, SubmitButton } from "./form-bits";
import { ConfirmButton } from "./confirm-button";

const ErrorsCtx = createContext<Record<string, string>>({});

/**
 * Generic admin form bound to a server action `(prev, formData) => FormState`.
 * Field errors are exposed to <AField> children through context, so pages can
 * compose forms in server components with plain inputs (defaultValue/defaultChecked).
 */
export function AdminForm({ action, children, submitLabel = "Enregistrer", resetOnSuccess, className, onSuccess }: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode; submitLabel?: string; resetOnSuccess?: boolean; className?: string; onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state?.ok && resetOnSuccess) ref.current?.reset(); }, [state, resetOnSuccess]);
  return (
    <ErrorsCtx.Provider value={state?.fieldErrors ?? {}}>
      <form ref={ref} action={formAction} className={className ?? "space-y-4"} noValidate>
        {children}
        <div className="col-span-full space-y-3">
          <FormMessage state={state} onSuccess={onSuccess} />
          <SubmitButton>{submitLabel}</SubmitButton>
        </div>
      </form>
    </ErrorsCtx.Provider>
  );
}

/** Field wired to the surrounding AdminForm's server-side errors. `name` = input id/name. */
export function AField({ name, id, label, hint, children, className }: { name: string; id?: string; label: string; hint?: string; children: React.ReactNode; className?: string }) {
  const errors = useContext(ErrorsCtx);
  return <Field label={label} htmlFor={id ?? name} error={errors[name]} hint={hint} className={className}>{children}</Field>;
}

/** Icon delete button with confirmation dialog. */
export function DeleteAction({ id, action, label, title, description }: {
  id: string; action: (id: string) => Promise<FormState>; label: string; title: string; description?: string;
}) {
  const router = useRouter();
  return (
    <ConfirmButton variant="icon" icon={<Trash2 className="size-4.5" />} label={label} title={title} description={description} confirmLabel="Supprimer"
      onConfirm={async () => {
        const res = await action(id);
        if (res?.error) toast(res.error, "error"); else { if (res?.message) toast(res.message); router.refresh(); }
      }} />
  );
}

export function MoveButtons({ id, action, first, last }: { id: string; action: (id: string, d: "up" | "down") => Promise<FormState>; first: boolean; last: boolean }) {
  const [pending, start] = useTransition();
  const move = (d: "up" | "down") => start(async () => { const r = await action(id, d); if (r?.error) toast(r.error, "error"); });
  const cls = "grid size-9 place-items-center rounded-full text-ink-soft hover:bg-leaf disabled:opacity-30";
  return (
    <span className="inline-flex">
      <button type="button" className={cls} disabled={first || pending} onClick={() => move("up")} aria-label="Monter"><ArrowUp className="size-4" /></button>
      <button type="button" className={cls} disabled={last || pending} onClick={() => move("down")} aria-label="Descendre"><ArrowDown className="size-4" /></button>
    </span>
  );
}
