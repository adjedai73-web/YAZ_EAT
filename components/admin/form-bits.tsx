"use client";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import type { FormState } from "@/lib/admin/form";

export function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" loading={pending} className={className}>{children}</Button>;
}

/** Shows the action result; success messages also toast. */
export function FormMessage({ state, onSuccess }: { state: FormState; onSuccess?: () => void }) {
  useEffect(() => {
    if (state?.ok) { if (state.message) toast(state.message); onSuccess?.(); }
    else if (state?.error) toast(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  if (state?.error) return <Alert>{state.error}</Alert>;
  if (state?.fieldErrors) return <Alert>Corrigez les champs indiqués.</Alert>;
  return null;
}

export function ImageInput({ name, current, label, removeName }: { name: string; current: string | null; label: string; removeName: string }) {
  const [preview, setPreview] = useState<string | null>(current);
  const [removed, setRemoved] = useState(false);
  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);
  return (
    <div>
      <span className="block text-sm font-semibold">{label}</span>
      <div className="mt-1.5 flex items-center gap-4">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-leaf">
          {preview && !removed && <Image src={preview} alt="" fill sizes="96px" className="object-cover" unoptimized={preview.startsWith("blob:")} />}
        </div>
        <div className="space-y-2 text-sm">
          <input type="file" name={name} accept="image/jpeg,image/png,image/webp,image/avif"
            className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-800 file:px-3 file:py-2 file:font-semibold file:text-white"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPreview(URL.createObjectURL(f)); setRemoved(false); } }} />
          <p className="text-ink-soft">JPG, PNG, WebP — 5 Mo max.</p>
          {current && (
            <label className="flex items-center gap-2">
              <input type="checkbox" name={removeName} checked={removed} onChange={(e) => setRemoved(e.target.checked)} /> Supprimer l'image
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
