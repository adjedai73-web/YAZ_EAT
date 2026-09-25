"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { EmptyState } from "@/components/ui/misc";
import { cn } from "@/lib/format";

/** Client-side search over the server-rendered menu. Category chips are real links (SEO + back button). */
export function MenuBrowser({ categories, activeSlug, children, products }: {
  categories: Category[];
  activeSlug?: string;
  products: Pick<Product, "id" | "name" | "description">[];
  children: (visibleIds: Set<string> | null) => React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!q) return null;
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return new Set(products.filter((p) => norm(`${p.name} ${p.description ?? ""}`).includes(q)).map((p) => p.id));
  }, [query, products]);

  return (
    <>
      <div className="sticky top-16 z-30 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-soft" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un plat…"
              aria-label="Rechercher un plat"
              className="h-12 w-full rounded-full border border-line bg-leaf pl-12 pr-12 text-[16px] focus:border-brand-800 focus:bg-paper focus:outline-none"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full hover:bg-line" aria-label="Effacer la recherche">
                <X className="size-4" />
              </button>
            )}
          </div>
          <nav className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4" aria-label="Catégories">
            <Chip href="/menu" active={!activeSlug}>Tout</Chip>
            {categories.map((c) => (
              <Chip key={c.id} href={`/menu/${c.slug}`} active={activeSlug === c.slug}>{c.name}</Chip>
            ))}
          </nav>
        </div>
      </div>
      {visible && visible.size === 0 ? (
        <EmptyState title="Aucun plat trouvé" text={`Rien ne correspond à « ${query} ».`}
          action={<button onClick={() => setQuery("")} className="font-semibold text-brand-800 underline">Effacer la recherche</button>} />
      ) : (
        children(visible)
      )}
    </>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} scroll={false} aria-current={active ? "page" : undefined}
      className={cn("shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
        active ? "bg-brand-800 text-white" : "bg-leaf text-ink hover:bg-brand-100")}>
      {children}
    </Link>
  );
}
