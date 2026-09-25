import { getCategories, getMenu, getProductIdsWithExtras } from "@/lib/data/catalog";
import { ProductCard } from "@/components/site/product-card";
import { MenuView } from "@/components/site/menu-view";
import { EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";

export async function MenuPage({ categorySlug }: { categorySlug?: string }) {
  const [categories, menu, withExtras] = await Promise.all([getCategories(), getMenu(), getProductIdsWithExtras()]);
  const sections = categorySlug ? menu.filter((s) => s.category.slug === categorySlug) : menu;

  if (!menu.length) {
    return <EmptyState icon={<UtensilsCrossed />} title="Le menu arrive bientôt" text="Aucun plat n'est encore disponible en ligne." />;
  }
  if (categorySlug && !sections.length) {
    return <EmptyState title="Catégorie vide" text="Aucun plat dans cette catégorie pour le moment." action={<ButtonLink href="/menu">Voir tout le menu</ButtonLink>} />;
  }

  let rank = 0;
  return (
    <>
      <h1 className="sr-only">{categorySlug ? sections[0]?.category.name : "Menu"}</h1>
      <MenuView
        categories={categories}
        activeSlug={categorySlug}
        products={sections.flatMap((s) => s.products.map((p) => ({ id: p.id, name: p.name, description: p.description })))}
        sections={sections.map((s) => ({
          id: s.category.id,
          name: s.category.name,
          slug: s.category.slug,
          cards: s.products.map((p) => ({
            id: p.id,
            node: <ProductCard product={p} hasExtras={withExtras.has(p.id)} priority={rank++ < 4} />,
          })),
        }))}
      />
    </>
  );
}
