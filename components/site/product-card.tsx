import Link from "next/link";
import { formatDA } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductImage } from "./product-image";
import { QuickAdd } from "./quick-add";

/** Menu card. Products with no extras can be added in one tap; others open the product page. */
export function ProductCard({ product, hasExtras, priority }: { product: Product; hasExtras: boolean; priority?: boolean }) {
  const unavailable = !product.available;
  return (
    <article className="group relative flex gap-4 rounded-[var(--radius-card)] border border-line bg-paper p-3 sm:flex-col sm:gap-0 sm:p-0 sm:overflow-hidden">
      <Link href={`/product/${product.slug}`} className="absolute inset-0 z-0 rounded-[var(--radius-card)]" aria-label={product.name} />
      <ProductImage
        src={product.image_url}
        alt={product.name}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 112px"
        priority={priority}
        className={`size-28 shrink-0 rounded-xl sm:aspect-[4/3] sm:size-auto sm:w-full sm:rounded-none ${unavailable ? "opacity-50 grayscale" : ""}`}
      />
      <div className="flex min-w-0 flex-1 flex-col sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[1.05rem] font-bold leading-tight">{product.name}</h3>
          {product.bestseller && !unavailable && (
            <span className="shrink-0 rounded-full bg-sun-100 px-2 py-0.5 text-xs font-semibold text-brand-950">Best-seller</span>
          )}
        </div>
        {product.description && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{product.description}</p>}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <span className="font-display text-lg font-bold">{formatDA(product.price)}</span>
          {unavailable ? (
            <span className="rounded-full bg-ember-100 px-3 py-1 text-xs font-semibold text-ember-600">Indisponible</span>
          ) : (
            <QuickAdd
              product={{ id: product.id, slug: product.slug, name: product.name, image: product.image_url, price: product.price }}
              hasExtras={hasExtras}
            />
          )}
        </div>
      </div>
    </article>
  );
}
