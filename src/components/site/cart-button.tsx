"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart/store";

export function CartButton() {
  const { count, hydrated } = useCart();
  return (
    <Link href="/cart" className="relative grid size-11 place-items-center rounded-full bg-leaf text-ink hover:bg-brand-100" aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}>
      <ShoppingBag className="size-5" />
      {hydrated && count > 0 && (
        <span key={count} className="animate-pop absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-ember-600 px-1 text-xs font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
