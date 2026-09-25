import { saveProduct } from "@/lib/admin/actions";
import type { Category, Extra, Product } from "@/lib/types";
import { AdminForm, AField } from "@/components/admin/admin-form";
import { ImageInput } from "@/components/admin/form-bits";
import { Panel } from "@/components/admin/shell";
import { Input, Select, Textarea, Toggle } from "@/components/ui/field";
import { formatDA } from "@/lib/format";

/** Server-rendered product form; submission handled by the saveProduct server action. */
export function ProductForm({ product, categories, extras, selectedExtraIds, categoryExtraNames }: {
  product: Product | null; categories: Category[]; extras: Extra[]; selectedExtraIds: string[];
  categoryExtraNames: Record<string, string[]>;
}) {
  const p = product;
  return (
    <AdminForm action={saveProduct} submitLabel={p ? "Enregistrer les modifications" : "Créer le produit"} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="space-y-6">
        <Panel title="Informations">
          <div className="space-y-4">
            <AField name="name" label="Nom"><Input id="name" name="name" defaultValue={p?.name} required maxLength={80} /></AField>
            <AField name="slug" label="Slug (URL)" hint="Laissez vide pour le générer depuis le nom. Exemple : burger-yaz">
              <Input id="slug" name="slug" defaultValue={p?.slug} maxLength={80} />
            </AField>
            <AField name="description" label="Description"><Textarea id="description" name="description" defaultValue={p?.description ?? ""} maxLength={600} /></AField>
            <div className="grid gap-4 sm:grid-cols-2">
              <AField name="price" label="Prix (DA)"><Input id="price" name="price" type="number" inputMode="numeric" min={0} step={1} defaultValue={p?.price} required /></AField>
              <AField name="category_id" label="Catégorie">
                <Select id="category_id" name="category_id" defaultValue={p?.category_id ?? ""} required>
                  <option value="" disabled>Choisir…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? "" : " (masquée)"}</option>)}
                </Select>
              </AField>
            </div>
            <AField name="sort_order" label="Ordre d'affichage" hint="Plus petit = affiché en premier.">
              <Input id="sort_order" name="sort_order" type="number" defaultValue={p?.sort_order ?? 0} className="max-w-32" />
            </AField>
          </div>
        </Panel>
        <Panel title="Suppléments">
          {extras.length === 0 ? (
            <p className="text-sm text-ink-soft">Aucun supplément créé. Ajoutez-en dans « Suppléments ».</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-ink-soft">Suppléments propres à ce produit. Ceux liés à la catégorie s&apos;ajoutent automatiquement.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {extras.map((e) => (
                  <label key={e.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm">
                    <input type="checkbox" name="extra_ids" value={e.id} defaultChecked={selectedExtraIds.includes(e.id)} className="size-4 accent-brand-800" />
                    <span className="flex-1">{e.name}{!e.available && <span className="text-ember-600"> · indisponible</span>}</span>
                    <span className="text-ink-soft">+{formatDA(e.price)}</span>
                  </label>
                ))}
              </div>
              {p && (categoryExtraNames[p.category_id]?.length ?? 0) > 0 && (
                <p className="mt-3 text-sm text-ink-soft">Via la catégorie : {categoryExtraNames[p.category_id]!.join(", ")}</p>
              )}
            </>
          )}
        </Panel>
      </div>
      <div className="space-y-6">
        <Panel title="Photo"><ImageInput name="image" removeName="remove_image" current={p?.image_url ?? null} label="Image du produit" /></Panel>
        <Panel title="Visibilité">
          <div className="divide-y divide-line">
            <Toggle name="active" label="Activé" description="Visible sur le site." defaultChecked={p?.active ?? true} />
            <Toggle name="available" label="Disponible" description="Sinon affiché « Indisponible »." defaultChecked={p?.available ?? true} />
            <Toggle name="bestseller" label="Best-seller" defaultChecked={p?.bestseller ?? false} />
            <Toggle name="featured" label="Mis en avant" defaultChecked={p?.featured ?? false} />
          </div>
        </Panel>
      </div>
    </AdminForm>
  );
}
