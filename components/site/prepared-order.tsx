"use client";
import { useSyncExternalStore } from "react";
import { MessageCircleWarning, ShoppingBag } from "lucide-react";
import { getPreparedOrder, type PreparedOrder } from "@/lib/orders/local-order";
import { buildWhatsAppLink, createWhatsAppOrderMessage } from "@/lib/whatsapp/message";
import { formatDA, formatDateTime, ORDER_TYPE_LABELS } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { WhatsAppIcon } from "./brand-icons";

const noop = () => () => {};

export function PreparedOrderView({ reference, whatsapp, restaurantName, pickupAddress }: {
  reference: string; whatsapp: string | null; restaurantName: string; pickupAddress: string | null;
}) {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const order = useSyncExternalStore(noop, () => getCachedOrder(reference), () => null);

  if (!hydrated) return <div className="mx-auto max-w-2xl space-y-4 px-4 py-8"><Skeleton className="h-24" /><Skeleton className="h-48" /></div>;
  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <EmptyState icon={<ShoppingBag />} title="Commande introuvable"
          text="Cette commande n'est pas enregistrée sur cet appareil. Si vous l'avez déjà envoyée sur WhatsApp, le restaurant l'a dans la conversation."
          action={<ButtonLink href="/menu">Retour au menu</ButtonLink>} />
      </div>
    );
  }

  const waLink = whatsapp ? buildWhatsAppLink(whatsapp, createWhatsAppOrderMessage(order, restaurantName)) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="text-center">
        <MessageCircleWarning className="mx-auto size-14 text-flame-500" aria-hidden />
        <h1 className="mt-3 text-3xl font-extrabold md:text-4xl">Votre commande est prête à être envoyée.</h1>
        <p className="mt-2 font-display text-xl font-bold text-brand-800">Réf. {order.order_number}</p>
        <p className="text-sm text-ink-soft">Préparée le {formatDateTime(order.created_at)}</p>
      </div>

      <div className="mt-6 rounded-[var(--radius-card)] border-2 border-[#25D366] p-5 text-center">
        <p className="font-semibold">Votre commande a été préparée. Envoyez-la sur WhatsApp pour finaliser votre commande.</p>
        {waLink ? (
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="mt-4 flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#25D366] font-bold text-white hover:brightness-95">
            <WhatsAppIcon /> Envoyer sur WhatsApp
          </a>
        ) : (
          <p className="mt-3 text-sm text-ember-600">Le numéro WhatsApp du restaurant n&apos;est pas configuré.</p>
        )}
        <p className="mt-2 text-xs text-ink-soft">
          Tant que le message n&apos;est pas envoyé dans WhatsApp, le restaurant ne reçoit pas votre commande.
          La référence sert à identifier votre commande dans la conversation.
        </p>
      </div>

      <OrderSummary order={order} />

      <section className="mt-6 rounded-[var(--radius-card)] border border-line p-5 text-[0.95rem]" aria-labelledby="client-title">
        <h2 id="client-title" className="text-lg font-bold">{ORDER_TYPE_LABELS[order.order_type]}</h2>
        <p className="mt-2">{order.customer_name} — {order.customer_phone}</p>
        {order.order_type === "DELIVERY" && <p className="text-ink-soft">{[order.address, order.commune, order.wilaya].filter(Boolean).join(", ")}</p>}
        {order.order_type === "PICKUP" && pickupAddress && <p className="text-ink-soft">À récupérer : {pickupAddress}</p>}
        {order.notes && <p className="mt-2 italic text-ink-soft">Note : {order.notes}</p>}
      </section>

      <div className="mt-8">
        <ButtonLink href="/menu" variant="brand" className="h-12 w-full">Retour au menu</ButtonLink>
      </div>
    </div>
  );
}

function OrderSummary({ order }: { order: PreparedOrder }) {
  return (
    <section className="mt-6 rounded-[var(--radius-card)] border border-line p-5" aria-labelledby="items-title">
      <h2 id="items-title" className="text-lg font-bold">Commande</h2>
      <ul className="mt-3 divide-y divide-line">
        {order.items.map((i, k) => (
          <li key={k} className="flex justify-between gap-3 py-3">
            <div>
              <p className="font-semibold">{i.quantity}× {i.product_name}</p>
              {i.extras.map((x) => <p key={x.name} className="text-sm text-ink-soft">+ {x.name} ({formatDA(x.price)})</p>)}
              {i.notes && <p className="text-sm italic text-ink-soft">« {i.notes} »</p>}
            </div>
            <span className="shrink-0 font-semibold">{formatDA(i.line_total)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-1.5 border-t border-line pt-3">
        <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatDA(order.subtotal)}</dd></div>
        {order.discount > 0 && <div className="flex justify-between text-brand-800"><dt>{order.promotion_name ?? "Réduction"}</dt><dd>−{formatDA(order.discount)}</dd></div>}
        {order.order_type === "DELIVERY" && <div className="flex justify-between"><dt>Livraison{order.delivery_zone_name ? ` (${order.delivery_zone_name})` : ""}</dt><dd>{formatDA(order.delivery_fee)}</dd></div>}
        <div className="flex items-baseline justify-between pt-2"><dt className="font-bold">Total</dt><dd className="font-display text-2xl font-extrabold">{formatDA(order.total)}</dd></div>
      </dl>
    </section>
  );
}

// useSyncExternalStore needs a stable snapshot: cache the parsed order per reference.
const cacheMap = new Map<string, PreparedOrder | null>();
function getCachedOrder(reference: string) {
  if (!cacheMap.has(reference)) cacheMap.set(reference, getPreparedOrder(reference));
  return cacheMap.get(reference) ?? null;
}
