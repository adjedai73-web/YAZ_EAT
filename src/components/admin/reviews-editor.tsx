"use client";
import { useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import type { Review } from "@/lib/types";
import { Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const MAX = 12;

/** Edits the public reviews list; serialized into a hidden `reviews` JSON field for saveSettings. */
export function ReviewsEditor({ initial }: { initial: Review[] }) {
  const [items, setItems] = useState<Review[]>(initial);
  const update = (i: number, patch: Partial<Review>) => setItems((l) => l.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-3">
      <input type="hidden" name="reviews" value={JSON.stringify(items)} />
      {items.length === 0 && <p className="text-sm text-ink-soft">Aucun avis : la section « Avis » est masquée sur le site.</p>}
      {items.map((r, i) => (
        <fieldset key={i} className="space-y-2 rounded-xl border border-line p-3">
          <legend className="sr-only">Avis {i + 1}</legend>
          <div className="flex items-center gap-2">
            <Input aria-label="Nom du client" placeholder="Nom (ex. Amine B.)" value={r.name} maxLength={60} onChange={(e) => update(i, { name: e.target.value })} className="h-10" />
            <div className="flex shrink-0" role="radiogroup" aria-label="Note">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={r.rating === n} aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                  onClick={() => update(i, { rating: n })} className="p-0.5">
                  <Star className={`size-5 ${n <= r.rating ? "fill-sun-500 text-sun-500" : "text-line"}`} />
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setItems((l) => l.filter((_, j) => j !== i))} aria-label="Supprimer cet avis"
              className="grid size-9 shrink-0 place-items-center rounded-full text-ember-600 hover:bg-ember-100"><Trash2 className="size-4.5" /></button>
          </div>
          <Textarea aria-label="Texte de l'avis" placeholder="Texte de l'avis" value={r.text} maxLength={400} onChange={(e) => update(i, { text: e.target.value })} className="min-h-20" />
        </fieldset>
      ))}
      {items.length < MAX && (
        <Button type="button" variant="outline" size="sm" onClick={() => setItems((l) => [...l, { name: "", text: "", rating: 5 }])}>
          <Plus className="size-4" /> Ajouter un avis
        </Button>
      )}
      <p className="text-xs text-ink-soft">Publiez uniquement de vrais avis clients (Google, Instagram…). {MAX} maximum.</p>
    </div>
  );
}
