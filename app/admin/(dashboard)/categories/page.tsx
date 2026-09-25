import { getAdminSession } from "@/lib/admin/auth";
import { deleteCategory, moveCategory, saveCategory } from "@/lib/admin/actions";
import type { Category } from "@/lib/types";
import { PageHeader, Panel } from "@/components/admin/shell";
import { AdminForm, AField, DeleteAction, MoveButtons } from "@/components/admin/admin-form";
import { ImageInput } from "@/components/admin/form-bits";
import { ProductImage } from "@/components/site/product-image";
import { Input, Textarea, Toggle } from "@/components/ui/field";
import { Badge, EmptyState } from "@/components/ui/misc";

export const metadata = { title: "Catégories" };

function CategoryFields({ c }: { c?: Category }) {
  const k = c?.id ?? "new";
  return (
    <>
      {c && <input type="hidden" name="id" value={c.id} />}
      <input type="hidden" name="sort_order" value={c?.sort_order ?? 999} />
      <AField name="name" id={`name-${k}`} label="Nom"><Input id={`name-${k}`} name="name" defaultValue={c?.name} required maxLength={60} /></AField>
      <AField name="slug" id={`slug-${k}`} label="Slug (URL)" hint="Vide = généré depuis le nom."><Input id={`slug-${k}`} name="slug" defaultValue={c?.slug} maxLength={80} /></AField>
      <AField name="description" id={`desc-${k}`} label="Description"><Textarea id={`desc-${k}`} name="description" defaultValue={c?.description ?? ""} maxLength={300} className="min-h-16" /></AField>
      <ImageInput name="image" removeName="remove_image" current={c?.image_url ?? null} label="Image" />
      <Toggle name="active" label="Visible sur le site" defaultChecked={c?.active ?? true} />
    </>
  );
}

export default async function CategoriesPage() {
  const { supabase } = await getAdminSession();
  const [cats, prods, catExtras] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("products").select("category_id"),
    supabase.from("category_extras").select("category_id, extras(name)"),
  ]);
  if (cats.error || prods.error || catExtras.error) throw new Error("Chargement impossible");
  const categories = (cats.data ?? []) as Category[];
  const counts = new Map<string, number>();
  for (const p of prods.data ?? []) counts.set(p.category_id as string, (counts.get(p.category_id as string) ?? 0) + 1);
  const extrasBy = new Map<string, string[]>();
  for (const r of (catExtras.data ?? []) as unknown as { category_id: string; extras: { name: string } | null }[]) {
    if (r.extras) extrasBy.set(r.category_id, [...(extrasBy.get(r.category_id) ?? []), r.extras.name]);
  }

  return (
    <>
      <PageHeader title="Catégories" subtitle="L'ordre ici est l'ordre du menu sur le site." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div>
          {categories.length === 0 ? (
            <Panel><EmptyState title="Aucune catégorie" text="Créez vos catégories (Burgers, Tacos…) avec le formulaire." /></Panel>
          ) : (
            <ul className="space-y-3">
              {categories.map((c, i) => (
                <li key={c.id} className="rounded-[var(--radius-card)] border border-line bg-paper">
                  <div className="flex items-center gap-3 p-3">
                    <MoveButtons id={c.id} action={moveCategory} first={i === 0} last={i === categories.length - 1} />
                    <ProductImage src={c.image_url} alt={c.name} sizes="48px" className="size-12 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{c.name} {!c.active && <Badge>Masquée</Badge>}</p>
                      <p className="truncate text-sm text-ink-soft">
                        {counts.get(c.id) ?? 0} produit{(counts.get(c.id) ?? 0) > 1 ? "s" : ""}
                        {extrasBy.get(c.id)?.length ? ` · Suppléments : ${extrasBy.get(c.id)!.join(", ")}` : ""}
                      </p>
                    </div>
                    <DeleteAction id={c.id} action={deleteCategory} label={`Supprimer ${c.name}`} title={`Supprimer « ${c.name} » ?`}
                      description={(counts.get(c.id) ?? 0) > 0 ? "Cette catégorie contient des produits : déplacez-les ou supprimez-les d'abord." : "Cette action est définitive."} />
                  </div>
                  <details className="group border-t border-line">
                    <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-leaf/60">Modifier</summary>
                    <div className="px-4 pb-4"><AdminForm action={saveCategory}><CategoryFields c={c} /></AdminForm></div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Panel title="Nouvelle catégorie" className="xl:sticky xl:top-6 xl:self-start">
          <AdminForm action={saveCategory} submitLabel="Créer la catégorie" resetOnSuccess><CategoryFields /></AdminForm>
        </Panel>
      </div>
    </>
  );
}
