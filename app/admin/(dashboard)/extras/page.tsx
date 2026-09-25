import { getAdminSession } from "@/lib/admin/auth";
import { deleteExtra, saveExtra } from "@/lib/admin/actions";
import { formatDA } from "@/lib/format";
import type { Category, Extra } from "@/lib/types";
import { PageHeader, Panel } from "@/components/admin/shell";
import { AdminForm, AField, DeleteAction } from "@/components/admin/admin-form";
import { Input, Toggle } from "@/components/ui/field";
import { Badge, EmptyState } from "@/components/ui/misc";

export const metadata = { title: "Suppléments" };

function ExtraFields({ e, categories, linked }: { e?: Extra; categories: Category[]; linked: string[] }) {
  const k = e?.id ?? "new";
  return (
    <>
      {e && <input type="hidden" name="id" value={e.id} />}
      <div className="grid gap-4 sm:grid-cols-[1fr_140px_110px]">
        <AField name="name" id={`name-${k}`} label="Nom"><Input id={`name-${k}`} name="name" defaultValue={e?.name} required maxLength={60} placeholder="Cheese" /></AField>
        <AField name="price" id={`price-${k}`} label="Prix (DA)"><Input id={`price-${k}`} name="price" type="number" inputMode="numeric" min={0} defaultValue={e?.price ?? ""} required /></AField>
        <AField name="sort_order" id={`sort-${k}`} label="Ordre"><Input id={`sort-${k}`} name="sort_order" type="number" defaultValue={e?.sort_order ?? 0} /></AField>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold">Proposé pour toutes les catégories cochées</legend>
        <p className="text-sm text-ink-soft">Vous pouvez aussi l&apos;attacher à un produit précis depuis la fiche produit.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm has-[:checked]:border-brand-800 has-[:checked]:bg-brand-100">
              <input type="checkbox" name="category_ids" value={c.id} defaultChecked={linked.includes(c.id)} className="accent-brand-800" /> {c.name}
            </label>
          ))}
          {categories.length === 0 && <span className="text-sm text-ink-soft">Aucune catégorie.</span>}
        </div>
      </fieldset>
      <Toggle name="available" label="Disponible" description="Un supplément indisponible n'est plus proposé." defaultChecked={e?.available ?? true} />
    </>
  );
}

export default async function ExtrasPage() {
  const { supabase } = await getAdminSession();
  const [extrasRes, catsRes, linksRes, prodLinks] = await Promise.all([
    supabase.from("extras").select("*").order("sort_order").order("name"),
    supabase.from("categories").select("*").order("sort_order").order("name"),
    supabase.from("category_extras").select("category_id, extra_id"),
    supabase.from("product_extras").select("extra_id"),
  ]);
  if (extrasRes.error || catsRes.error || linksRes.error || prodLinks.error) throw new Error("Chargement impossible");
  const extras = (extrasRes.data ?? []) as Extra[];
  const categories = (catsRes.data ?? []) as Category[];
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const linked = new Map<string, string[]>();
  for (const l of linksRes.data ?? []) linked.set(l.extra_id as string, [...(linked.get(l.extra_id as string) ?? []), l.category_id as string]);
  const productCount = new Map<string, number>();
  for (const l of prodLinks.data ?? []) productCount.set(l.extra_id as string, (productCount.get(l.extra_id as string) ?? 0) + 1);

  return (
    <>
      <PageHeader title="Suppléments" subtitle="Options payantes proposées sur les produits (fromage, frites, sauce…)." />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div>
          {extras.length === 0 ? (
            <Panel><EmptyState title="Aucun supplément" text="Créez des suppléments puis rattachez-les à des catégories ou des produits." /></Panel>
          ) : (
            <ul className="space-y-3">
              {extras.map((e) => {
                const cats = (linked.get(e.id) ?? []).map((id) => catName.get(id)).filter(Boolean);
                const n = productCount.get(e.id) ?? 0;
                return (
                  <li key={e.id} className="rounded-[var(--radius-card)] border border-line bg-paper">
                    <div className="flex items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{e.name} <span className="font-normal text-ink-soft">+{formatDA(e.price)}</span> {!e.available && <Badge tone="danger">Indisponible</Badge>}</p>
                        <p className="truncate text-sm text-ink-soft">
                          {cats.length ? cats.join(", ") : "Aucune catégorie"}{n ? ` · ${n} produit${n > 1 ? "s" : ""}` : ""}
                        </p>
                      </div>
                      <DeleteAction id={e.id} action={deleteExtra} label={`Supprimer ${e.name}`} title={`Supprimer « ${e.name} » ?`} description="Les commandes passées gardent ce supplément dans leur historique." />
                    </div>
                    <details className="border-t border-line">
                      <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-semibold text-brand-800 hover:bg-leaf/60">Modifier</summary>
                      <div className="px-4 pb-4"><AdminForm action={saveExtra}><ExtraFields e={e} categories={categories} linked={linked.get(e.id) ?? []} /></AdminForm></div>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <Panel title="Nouveau supplément" className="xl:sticky xl:top-6 xl:self-start">
          <AdminForm action={saveExtra} submitLabel="Créer le supplément" resetOnSuccess><ExtraFields categories={categories} linked={[]} /></AdminForm>
        </Panel>
      </div>
    </>
  );
}
