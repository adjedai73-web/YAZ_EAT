"use client";
import { useSyncExternalStore } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

type Toast = { id: number; text: string; tone: "success" | "error" };
let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function toast(text: string, tone: Toast["tone"] = "success") {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, text, tone }].slice(-3);
  emit();
  setTimeout(() => { toasts = toasts.filter((t) => t.id !== id); emit(); }, 3200);
}

const EMPTY: Toast[] = [];
export function Toaster() {
  const list = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => toasts,
    () => EMPTY,
  );
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="animate-rise pointer-events-auto flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {t.tone === "success" ? <CheckCircle2 className="size-4 text-sun-400" /> : <AlertCircle className="size-4 text-ember-100" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}
