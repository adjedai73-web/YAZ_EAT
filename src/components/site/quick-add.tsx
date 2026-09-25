"use client";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cart } from "@/lib/cart/store";
import { toast } from "@/components/ui/toast";

export function QuickAdd({ product, hasExtras }: {
  product: { id: string; slug: string; name: string; image: string | null; price: number }; hasExtras: boolean;
}) {
  const cls = "relative z-10 grid size-10 place-items-center rounded-full bg-brand-800 text-white transition-colors hover:bg-brand-700";
  if (hasExtras) {
    return (
      <Link href={`/product/${product.slug}`} className={cls} aria-label={`Personnaliser ${product.name}`}>
        <Plus className="size-5" />
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      aria-label={`Ajouter ${product.name} au panier`}
      onClick={() => {
        cart.add({ productId: product.id, slug: product.slug, name: product.name, image: product.image, unitPrice: product.price, extras: [], quantity: 1, notes: "" });
        toast(`${product.name} ajouté au panier`);
      }}
    >
      <Plus className="size-5" />
    </button>
  );
}
