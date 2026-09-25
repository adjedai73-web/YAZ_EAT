"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart/store";
import { formatDA } from "@/lib/format";

const HIDDEN_ON = ["/cart", "/checkout", "/order"];

/** Sticky bottom bar on mobile whenever the cart has items. */
export function MobileCartBar() {
  const { count, subtotal, hydrated } = useCart();
  const pathname = usePathname();
  if (!hydrated || count === 0 || HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 px-3 pt-2 md:hidden">
      <Link
        href="/cart"
        className="animate-rise flex h-14 items-center justify-between rounded-2xl bg-brand-800 px-5 text-white shadow-xl shadow-brand-950/20"
      >
        <span className="text-sm font-medium">
          {count} article{count > 1 ? "s" : ""} • <span className="font-bold">{formatDA(subtotal)}</span>
        </span>
        <span className="rounded-xl bg-sun-500 px-3 py-1.5 text-sm font-bold text-brand-950">Voir le panier</span>
      </Link>
    </div>
  );
}
