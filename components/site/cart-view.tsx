"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { cart, lineTotal, useCart } from "@/lib/cart/store";
import { priceOrder, reconcileItems, toPricingLines } from "@/lib/orders/pricing";
import { formatDA } from "@/lib/format";
import type { OrderQuote } from "@/lib/types";
import { ButtonLink } from "@/components/ui/button";
import { Alert, EmptyState, Skeleton } from "@/components/ui/misc";
import { ProductImage } from "./product-image";
import { Stepper } from "./add-to-cart-form";

export function CartView({ deliveryEnabled, hasZones, ordersOpen }: { deliveryEnabled: boolean; hasZones: boolean; ordersOpen: boolean }) {
  const { items, hydrated } = useCart();
  const synced = useRef(false);

  // Once: refresh prices / availability from the current menu data.
  useEffect(() => {
    if (!hydrated || synced.current) return;
    synced.current = true;
    if (items.length) cart.reconcile(reconcileItems);
  }, [hydrated, items.length]);

  // Totals computed locally from the menu (never from prices stored in the cart).
  const { quote, quoteError } = useMemo((): { quote: OrderQuote | null; quoteError: string | null } => {
    const lines = toPricingLines(items);
    if (!lines.length) return { quote: null, quoteError: null };
    const res = priceOrder({ orderType: deliveryEnabled ? "DELIVERY" : "PICKUP", lines });
    return res.ok ? { quote: res.quote, quoteError: null } : { quote: null, quoteError: res.error };
  }, [items, deliveryEnabled]);

  if (!hydrated) return <div className="mt-6 space-y-3"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>;

  if (!items.length) {
    return <EmptyState icon={<ShoppingBag />} title="Votre panier est vide" text="Ajoutez vos plats préférés depuis le menu." action={<ButtonLink href="/menu">Voir le menu</ButtonLink>} />;
  }

  const hasUnavailable = items.some((i) => i.unavailable);

  return (
    <div className="mt-6 grid gap-8 md:grid-cols-[1fr_300px]">
      <ul className="divide-y divide-line">
        {items.map((i) => (
          <li key={i.key} className="flex gap-4 py-4">
            <Link href={`/product/${i.slug}`} className="shrink-0">
              <ProductImage src={i.image} alt={i.name} sizes="80px" className={`size-20 rounded-xl ${i.unavailable ? "opacity-50 grayscale" : ""}`} />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold leading-tight">{i.name}</h2>
                <span className="shrink-0 font-semibold">{formatDA(lineTotal(i))}</span>
              </div>
              {i.extras.length > 0 && <p className="mt-0.5 text-sm text-ink-soft">+ {i.extras.map((e) => e.name).join(", ")}</p>}
              {i.notes && <p className="mt-0.5 text-sm italic text-ink-soft">« {i.notes} »</p>}
              {i.unavailable && <p className="mt-1 text-sm font-semibold text-ember-600">Indisponible — retirez cet article pour commander.</p>}
              <div className="mt-2 flex items-center justify-between">
                <Stepper size="sm" value={i.quantity} min={1} onChange={(q) => cart.setQuantity(i.key, q)} label={`Quantité ${i.name}`} />
                <button type="button" onClick={() => cart.remove(i.key)} className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-ember-100 hover:text-ember-600" aria-label={`Retirer ${i.name}`}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit space-y-4 rounded-[var(--radius-card)] bg-leaf p-5 md:sticky md:top-24">
        {quoteError && <Alert>{quoteError}</Alert>}
        <Totals quote={quote} loading={!quote && !quoteError} hasZones={hasZones} deliveryEnabled={deliveryEnabled} />
        {!ordersOpen && <Alert tone="info">Les commandes sont fermées pour le moment.</Alert>}
        {hasUnavailable || !ordersOpen || !quote || quote.below_min_order ? (
          <span className="flex h-14 w-full cursor-not-allowed items-center justify-center rounded-[var(--radius-control)] bg-line font-semibold text-ink-soft" aria-disabled>
            Passer la commande
          </span>
        ) : (
          <ButtonLink href="/checkout" size="lg" className="w-full">Passer la commande</ButtonLink>
        )}
        {quote?.below_min_order && <p className="text-sm text-ink-soft">Commande minimum : {formatDA(quote.min_order)}.</p>}
        <Link href="/menu" className="block text-center text-sm font-semibold text-brand-800 hover:underline">Continuer mes achats</Link>
      </aside>
    </div>
  );
}

export function Totals({ quote, loading, hasZones, deliveryEnabled }: {
  quote: OrderQuote | null; loading: boolean; hasZones: boolean; deliveryEnabled: boolean;
}) {
  if (loading || !quote) {
    return <div className="space-y-2" aria-busy><Skeleton className="h-5" /><Skeleton className="h-5" /><Skeleton className="h-7" /></div>;
  }
  const isDelivery = quote.order_type === "DELIVERY";
  return (
    <dl className="space-y-2 text-[0.95rem]">
      <div className="flex justify-between"><dt>Sous-total</dt><dd className="font-semibold">{formatDA(quote.subtotal)}</dd></div>
      {quote.discount > 0 && (
        <div className="flex justify-between text-brand-800">
          <dt>{quote.promotion_name ?? "Réduction"}</dt><dd className="font-semibold">−{formatDA(quote.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt>Livraison</dt>
        <dd className="font-semibold">
          {!isDelivery ? (deliveryEnabled ? "Retrait" : "Retrait au restaurant") : quote.zone_missing && hasZones ? "Selon la zone" : formatDA(quote.delivery_fee)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <dt className="font-bold">Total</dt>
        <dd className="font-display text-2xl font-extrabold">{formatDA(quote.total)}</dd>
      </div>
    </dl>
  );
}
