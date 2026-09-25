"use client";
import { Copy } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";

export function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <button type="button" className={buttonClass("outline", "md", "w-full")}
      onClick={() => navigator.clipboard.writeText(text).then(() => toast("Copié."), () => toast("Copie impossible.", "error"))}>
      <Copy className="size-4" /> {label}
    </button>
  );
}
