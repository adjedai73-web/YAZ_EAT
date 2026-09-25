"use client";
import type { Category, Product } from "@/lib/types";
import { MenuBrowser } from "./menu-browser";

/** Bridges server-rendered cards with client-side search filtering. */
export function MenuView({ categories, activeSlug, sections, products }: {
  categories: Category[];
  activeSlug?: string;
  products: Pick<Product, "id" | "name" | "description">[];
  sections: { id: string; name: string; slug: string; cards: { id: string; node: React.ReactNode }[] }[];
}) {
  return (
    <MenuBrowser categories={categories} activeSlug={activeSlug} products={products}>
      {(visible) => (
        <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
          {sections.map((s) => {
            const cards = visible ? s.cards.filter((c) => visible.has(c.id)) : s.cards;
            if (!cards.length) return null;
            return (
              <section key={s.id} aria-labelledby={`sec-${s.slug}`}>
                <h2 id={`sec-${s.slug}`} className="text-2xl font-extrabold">{s.name}</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map((c) => <div key={c.id} className="contents">{c.node}</div>)}</div>
              </section>
            );
          })}
        </div>
      )}
    </MenuBrowser>
  );
}
