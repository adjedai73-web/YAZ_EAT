"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bike, Store, ShoppingBag } from "lucide-react";
import { cart, useCart } from "@/lib/cart/store";
import { priceOrder, toPricingLines } from "@/lib/orders/pricing";
import { checkoutSchema } from "@/lib/orders/schemas";
import { buildPreparedOrder, generateReference, savePreparedOrder } from "@/lib/orders/local-order";
import { buildWhatsAppLink, createWhatsAppOrderMessage } from "@/lib/whatsapp/message";
import { formatDA, cn } from "@/lib/format";
import type { OrderType } from "@/lib/types";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Alert, EmptyState, Skeleton } from "@/components/ui/misc";
import { Totals } from "./cart-view";

type Form = { customer_name: string; customer_phone: string; address: string; commune: string; wilaya: string; notes: string };

export function CheckoutForm({ deliveryEnabled, pickupEnabled, ordersOpen, zones, defaultCity, whatsapp, restaurantName, referencePrefix, hasPromoCodes }: {
  deliveryEnabled: boolean; pickupEnabled: boolean; ordersOpen: boolean;
  zones: { id: string; name: string; fee: number }[]; defaultCity: string;
  whatsapp: string | null; restaurantName: string; referencePrefix: string; hasPromoCodes: boolean;
}) {
  const router = useRouter();
  const { items, hydrated } = useCart();
  const [type, setType] = useState<OrderType>(deliveryEnabled ? "DELIVERY" : "PICKUP");
  const [zoneId, setZoneId] = useState("");
  const [form, setForm] = useState<Form>({ customer_name: "", customer_phone: "", address: "", commune: "", wilaya: defaultCity, notes: "" });
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);

  const lines = useMemo(() => toPricingLines(items), [items]);

  // Totals from the local menu (prices never come from the stored cart).
  const { quote, quoteError, promoError } = useMemo(() => {
    if (!lines.length) return { quote: null, quoteError: null, promoError: null };
    const input = { orderType: type, zoneId: type === "DELIVERY" && zoneId ? zoneId : null, lines };
    let res = priceOrder({ ...input, promoCode: promo });
    let promoError: string | null = null;
    if (!res.ok && res.field === "promo") { promoError = res.error; res = priceOrder(input); }
    return res.ok ? { quote: res.quote, quoteError: null, promoError } : { quote: null, quoteError: res.error, promoError };
  }, [lines, type, zoneId, promo]);

  if (!hydrated) return <div className="mt-8 grid gap-4"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-40" /></div>;
  if (!items.length && !placed) {
    return <EmptyState icon={<ShoppingBag />} title="Votre panier est vide" text="Ajoutez des plats avant de passer commande." action={<ButtonLink href="/menu">Voir le menu</ButtonLink>} />;
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors(({ [k]: _removed, ...rest }) => rest);
  };
  const hasUnavailable = items.some((i) => i.unavailable);

  // Everything below is synchronous so the browser keeps the click "user gesture"
  // and allows opening WhatsApp in a new tab/app.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!ordersOpen) return setSubmitError("Le restaurant ne prend pas de commandes pour le moment.");
    if (!whatsapp) return setSubmitError("Le numéro WhatsApp du restaurant n'est pas encore configuré. Commande impossible pour le moment.");

    const parsed = checkoutSchema.safeParse({
      ...form, order_type: type, delivery_zone_id: type === "DELIVERY" && zoneId ? zoneId : null,
      items: lines.map((l) => ({ product_id: l.productId, quantity: l.quantity, extra_ids: l.extraIds, notes: l.notes })),
    });
    const local: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key === "items") { setSubmitError("Votre panier est vide."); return; }
        if (key && !local[key]) local[key] = issue.message;
      }
    }
    // Also checked here so all missing fields show at once (the schema checks them after the basics).
    if (type === "DELIVERY") {
      if (!form.address.trim()) local.address ??= "Adresse obligatoire pour la livraison.";
      if (!form.commune.trim()) local.commune ??= "Commune obligatoire.";
      if (!form.wilaya.trim()) local.wilaya ??= "Wilaya obligatoire.";
      if (zones.length && !zoneId) local.delivery_zone_id = "Choisissez votre zone.";
    }
    if (Object.keys(local).length || !parsed.success) {
      setErrors(local);
      document.getElementById(Object.keys(local)[0] ?? "customer_name")?.focus();
      return;
    }

    const priced = priceOrder({ orderType: type, zoneId: type === "DELIVERY" && zoneId ? zoneId : null, promoCode: promoError ? "" : promo, lines });
    if (!priced.ok) return setSubmitError(priced.error);
    if (priced.quote.below_min_order) return setSubmitError(`Commande minimum : ${formatDA(priced.quote.min_order)}.`);

    const order = buildPreparedOrder(generateReference(referencePrefix), { ...form, customer_phone: parsed.data.customer_phone }, priced.quote);
    savePreparedOrder(order);
    const link = buildWhatsAppLink(whatsapp, createWhatsAppOrderMessage(order, restaurantName));
    window.open(link, "_blank", "noopener,noreferrer"); // may be blocked: the confirmation page has the button too
    setPlaced(true);
    cart.clear();
    router.push(`/order/${encodeURIComponent(order.order_number)}`);
  };

  return (
    <form onSubmit={submit} noValidate className="mt-8 grid gap-8 md:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        {deliveryEnabled && pickupEnabled && (
          <fieldset>
            <legend className="mb-3 text-lg font-bold">Type de commande</legend>
            <div className="grid grid-cols-2 gap-3">
              <TypeOption active={type === "DELIVERY"} onClick={() => setType("DELIVERY")} icon={<Bike className="size-6" />} label="Livraison" />
              <TypeOption active={type === "PICKUP"} onClick={() => setType("PICKUP")} icon={<Store className="size-6" />} label="Retrait au restaurant" />
            </div>
          </fieldset>
        )}

        <fieldset className="space-y-4">
          <legend className="mb-3 text-lg font-bold">Vos coordonnées</legend>
          <Field label="Nom complet" htmlFor="customer_name" error={errors.customer_name}>
            <Input id="customer_name" autoComplete="name" value={form.customer_name} onChange={set("customer_name")} aria-invalid={!!errors.customer_name} maxLength={80} required />
          </Field>
          <Field label="Téléphone" htmlFor="customer_phone" error={errors.customer_phone} hint="Le restaurant vous appellera si besoin.">
            <Input id="customer_phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0550 12 34 56" value={form.customer_phone} onChange={set("customer_phone")} aria-invalid={!!errors.customer_phone} required />
          </Field>
        </fieldset>

        {type === "DELIVERY" && (
          <fieldset className="space-y-4">
            <legend className="mb-3 text-lg font-bold">Adresse de livraison</legend>
            {zones.length > 0 && (
              <Field label="Zone de livraison" htmlFor="delivery_zone_id" error={errors.delivery_zone_id}>
                <Select id="delivery_zone_id" value={zoneId} onChange={(e) => { setZoneId(e.target.value); setErrors(({ delivery_zone_id: _r, ...rest }) => rest); }} aria-invalid={!!errors.delivery_zone_id}>
                  <option value="">Choisir…</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name} — {formatDA(z.fee)}</option>)}
                </Select>
              </Field>
            )}
            <Field label="Adresse" htmlFor="address" error={errors.address}>
              <Input id="address" autoComplete="street-address" placeholder="Rue, numéro, repère…" value={form.address} onChange={set("address")} aria-invalid={!!errors.address} maxLength={300} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Commune" htmlFor="commune" error={errors.commune}>
                <Input id="commune" autoComplete="address-level2" value={form.commune} onChange={set("commune")} aria-invalid={!!errors.commune} maxLength={80} />
              </Field>
              <Field label="Wilaya" htmlFor="wilaya" error={errors.wilaya}>
                <Input id="wilaya" autoComplete="address-level1" value={form.wilaya} onChange={set("wilaya")} aria-invalid={!!errors.wilaya} maxLength={80} />
              </Field>
            </div>
          </fieldset>
        )}

        <Field label="Note pour la commande (facultatif)" htmlFor="notes" error={errors.notes}>
          <Textarea id="notes" value={form.notes} onChange={set("notes")} maxLength={500} placeholder="Étage, code d'entrée, heure souhaitée…" />
        </Field>
      </div>

      <aside className="h-fit space-y-4 rounded-[var(--radius-card)] bg-leaf p-5 md:sticky md:top-24">
        <h2 className="text-xl font-extrabold">Récapitulatif</h2>
        <ul className="space-y-3 border-b border-line pb-4 text-sm">
          {items.map((i) => (
            <li key={i.key} className={cn("flex justify-between gap-3", i.unavailable && "text-ember-600 line-through")}>
              <span>
                <span className="font-semibold">{i.quantity}× {i.name}</span>
                {i.extras.length > 0 && <span className="block text-ink-soft">+ {i.extras.map((e) => e.name).join(", ")}</span>}
                {i.notes && <span className="block italic text-ink-soft">« {i.notes} »</span>}
              </span>
            </li>
          ))}
        </ul>
        {hasUnavailable && <Alert>Des articles indisponibles seront ignorés. <Link href="/cart" className="underline">Modifier le panier</Link></Alert>}

        {hasPromoCodes && <div>
          <label htmlFor="promo" className="text-sm font-semibold">Code promo</label>
          <div className="mt-1.5 flex gap-2">
            <Input id="promo" className="h-11 uppercase" value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} maxLength={30} />
            <Button type="button" variant="outline" className="h-11" disabled={!promoInput.trim()} onClick={() => setPromo(promoInput.trim())}>Appliquer</Button>
          </div>
          {promoError && <p className="mt-1 text-sm text-ember-600">{promoError}</p>}
          {promo && !promoError && quote?.promotion_name && <p className="mt-1 text-sm text-brand-800">Code appliqué : {quote.promotion_name}</p>}
        </div>}

        {quoteError && <Alert>{quoteError}</Alert>}
        <Totals quote={quote} loading={!quote && !quoteError} hasZones={zones.length > 0} deliveryEnabled={deliveryEnabled} />
        {quote?.below_min_order && <Alert tone="info">Commande minimum : {formatDA(quote.min_order)}.</Alert>}
        {submitError && <Alert>{submitError}</Alert>}
        {!ordersOpen && <Alert tone="info">Le restaurant ne prend pas de commandes pour le moment.</Alert>}
        {!whatsapp && <Alert tone="info">Commande en ligne bientôt disponible : le numéro WhatsApp du restaurant n&apos;est pas encore configuré.</Alert>}

        <Button type="submit" size="lg" className="w-full"
          disabled={placed || !ordersOpen || !whatsapp || !lines.length || !!quote?.below_min_order}>
          Confirmer la commande
        </Button>
        <p className="text-center text-xs text-ink-soft">Votre commande sera envoyée au restaurant sur WhatsApp. Paiement à la livraison ou au retrait.</p>
      </aside>
    </form>
  );
}

function TypeOption({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={cn("flex flex-col items-center gap-2 rounded-[var(--radius-card)] border-2 p-4 font-semibold transition-colors",
        active ? "border-brand-800 bg-brand-100 text-brand-900" : "border-line hover:border-brand-800/40")}>
      {icon}{label}
    </button>
  );
}
