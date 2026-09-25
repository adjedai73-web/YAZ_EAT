"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus } from "lucide-react";
import { cart } from "@/lib/cart/store";
import { formatDA, cn } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";

export function Stepper({ value, onChange, min = 1, max = 50, label, size = "md" }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; label: string; size?: "sm" | "md";
}) {
  const btn = size === "sm" ? "size-8" : "size-11";
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-paper" role="group" aria-label={label}>
      <button type="button" className={cn(btn, "grid place-items-center rounded-full hover:bg-leaf disabled:opacity-40")}
        onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Diminuer la quantité">
        <Minus className="size-4" />
      </button>
      <span className={cn("text-center font-bold tabular-nums", size === "sm" ? "w-7 text-sm" : "w-9")} aria-live="polite">{value}</span>
      <button type="button" className={cn(btn, "grid place-items-center rounded-full hover:bg-leaf disabled:opacity-40")}
        onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Augmenter la quantité">
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function AddToCartForm({ product, extras, ordersOpen }: {
  product: { id: string; slug: string; name: string; image: string | null; price: number; available: boolean };
  extras: { id: string; name: string; price: number }[];
  ordersOpen: boolean;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const chosen = extras.filter((e) => selected.includes(e.id));
  const unit = product.price + chosen.reduce((s, e) => s + e.price, 0);
  const total = unit * qty;

  if (!product.available) {
    return (
      <div className="rounded-[var(--radius-card)] bg-ember-100 p-5 text-ember-600">
        <p className="font-bold">Indisponible</p>
        <p className="text-sm">Ce plat ne peut pas être commandé pour le moment.</p>
      </div>
    );
  }

  const add = (goToCart: boolean) => {
    cart.add({ productId: product.id, slug: product.slug, name: product.name, image: product.image, unitPrice: product.price, extras: chosen, quantity: qty, notes: notes.trim() });
    toast(`${qty} × ${product.name} ajouté au panier`);
    if (goToCart) router.push("/cart");
    else { setQty(1); setSelected([]); setNotes(""); }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); add(false); }} className="space-y-6">
      {extras.length > 0 && (
        <fieldset>
          <legend className="text-lg font-bold">Suppléments</legend>
          <p className="text-sm text-ink-soft">Facultatif</p>
          <div className="mt-3 divide-y divide-line rounded-[var(--radius-card)] border border-line">
            {extras.map((e) => {
              const on = selected.includes(e.id);
              return (
                <label key={e.id} className="flex cursor-pointer items-center gap-3 px-4 py-3.5 hover:bg-leaf/60">
                  <input type="checkbox" className="peer sr-only" checked={on}
                    onChange={() => setSelected((s) => (on ? s.filter((x) => x !== e.id) : [...s, e.id]))} />
                  <span className={cn("grid size-6 place-items-center rounded-md border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-sun-500",
                    on ? "border-brand-800 bg-brand-800 text-white" : "border-line")} aria-hidden>
                    {on && <Check className="size-4" />}
                  </span>
                  <span className="flex-1 font-medium">{e.name}</span>
                  <span className="text-sm font-semibold text-ink-soft">+{formatDA(e.price)}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor="item-notes" className="text-lg font-bold">Instructions</label>
        <p className="text-sm text-ink-soft">Facultatif — ex. sans oignon, bien cuit</p>
        <Textarea id="item-notes" className="mt-3" maxLength={200} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Votre demande…" />
      </div>

      <div className="flex items-center justify-between">
        <span className="font-semibold">Quantité</span>
        <Stepper value={qty} onChange={setQty} label="Quantité" />
      </div>

      <div className="sticky bottom-0 -mx-4 space-y-2 border-t border-line bg-paper px-4 pb-4 pt-3 safe-bottom md:static md:mx-0 md:border-0 md:p-0">
        {!ordersOpen && <p className="text-sm text-ink-soft">Les commandes sont fermées pour le moment, mais vous pouvez préparer votre panier.</p>}
        <Button type="submit" size="lg" className="w-full justify-between">
          <span>Ajouter au panier</span>
          <span className="font-display text-lg">{formatDA(total)}</span>
        </Button>
        <button type="button" onClick={() => add(true)} className="w-full py-2 text-sm font-semibold text-brand-800 hover:underline">
          Ajouter et voir le panier
        </button>
      </div>
    </form>
  );
}
