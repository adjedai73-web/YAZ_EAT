import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import { getAdminSession } from "@/lib/admin/auth";
import { deleteProduct } from "@/lib/admin/actions";
import { formatDA, cn } from "@/lib/format";
import type { Category, Product } from "@/lib/types";
import { PageHeader } from "@/components/admin/shell";
import { DeleteAction } from "@/components/admin/admin-form";
import { ProductSwitch } from "@/components/admin/switch-action";
import { ProductImage } from "@/components/site/product-image";
import { buttonClass } from "@/components/ui/button";
import { Alert, Badge, EmptyState } from "@/components/ui/misc";

export const metadata = { title: "Produits" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; saved?: string }> }) {
  const { q = "", category = "", saved } = await searchParams;
  const { supabase } = await getAdminSession();
  const [prodRes, catRes] = await Promise.all([
    supabase.from("products").select("*").order("sort_order").order("name"),
    supabase.from("categories").select("*").order("sort_order").order("name"),
  ]);
  if (prodRes.error || catRes.error) throw new Error("Chargement impossible");
  const categories = (catRes.data ?? []) as Category[];
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const needle = q.trim().toLowerCase();
  const products = ((prodRes.data ?? []) as Product[]).filter((p) =>
    (!category || p.category_id === category) && (!needle || p.name.toLowerCase().includes(needle)));
  const all = prodRes.data?.length ?? 0;

  return (
    <>
      <PageHeader title="Produits" subtitle={`${all} produit${all > 1 ? "s" : ""}`}
        action={<Link href="/admin/products/new" className={buttonClass("primary")}><Plus className="size-4.5" /> Nouveau produit</Link>} />
      {saved && <div className="mb-4"><Alert tone="success">Produit enregistré.</Alert></div>}

      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Rechercher un produit</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-soft" />
          <input name="q" defaultValue={q} placeholder="Rechercher un produit" className="h-11 w-full rounded-[var(--radius-control)] border border-line bg-paper pl-10 pr-3 text-[16px]" />
        </label>
        <select name="category" defaultValue={category} aria-label="Catégorie" className="h-11 rounded-[var(--radius-control)] border border-line bg-paper px-3">
          <option value="">Toutes les catégories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className={buttonClass("brand")}>Filtrer</button>
      </form>

      {products.length === 0 ? (
        <EmptyState title={all ? "Aucun résultat" : "Aucun produit"} text={all ? "Modifiez la recherche." : "Créez votre premier produit pour remplir le menu."}
          action={!all && <Link href="/admin/products/new" className={buttonClass("primary")}>Créer un produit</Link>} />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-paper">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-leaf/60 text-ink-soft">
              <tr><th className="px-4 py-3 font-semibold">Produit</th><th className="px-4 py-3 text-right font-semibold">Prix</th>
                <th className="px-3 py-3 text-center font-semibold">Activé</th><th className="px-3 py-3 text-center font-semibold">Disponible</th>
                <th className="px-3 py-3 text-center font-semibold">Best-seller</th><th className="px-3 py-3 text-center font-semibold">En avant</th><th className="px-3 py-3"><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.id} className={cn(saved === p.id && "bg-sun-100/60")}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <ProductImage src={p.image_url} alt={p.name} sizes="48px" className="size-12 shrink-0 rounded-lg" />
                      <span><span className="block font-bold hover:underline">{p.name}</span><span className="text-ink-soft">{catName.get(p.category_id)}</span></span>
                      {!p.available && <Badge tone="danger">Indisponible</Badge>}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">{formatDA(p.price)}</td>
                  <td className="px-3 py-3 text-center"><ProductSwitch id={p.id} field="active" checked={p.active} label={`Activer ${p.name}`} /></td>
                  <td className="px-3 py-3 text-center"><ProductSwitch id={p.id} field="available" checked={p.available} label={`${p.name} disponible`} /></td>
                  <td className="px-3 py-3 text-center"><ProductSwitch id={p.id} field="bestseller" checked={p.bestseller} label={`${p.name} best-seller`} /></td>
                  <td className="px-3 py-3 text-center"><ProductSwitch id={p.id} field="featured" checked={p.featured} label={`${p.name} mis en avant`} /></td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end">
                      <Link href={`/admin/products/${p.id}`} className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-leaf" aria-label={`Modifier ${p.name}`}><Pencil className="size-4.5" /></Link>
                      <DeleteAction id={p.id} action={deleteProduct} label={`Supprimer ${p.name}`} title={`Supprimer « ${p.name} » ?`}
                        description="Le produit disparaît du menu. Les commandes passées gardent leur contenu. Pour le masquer temporairement, désactivez-le plutôt." />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
