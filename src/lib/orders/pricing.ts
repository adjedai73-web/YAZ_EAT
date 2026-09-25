/**
 * Local pricing engine (no database). Prices ALWAYS come from the menu data,
 * never from what is stored in the browser cart.
 */
import { ordering } from "@/config/restaurant";
import { deliveryZones, getExtra, getProduct, extrasForProduct, isPromotionLive, promotions } from "@/lib/menu";
import type { OrderQuote, OrderType, Promotion } from "@/lib/types";
import type { CartItem } from "@/lib/cart/store";

export interface PricingLine { productId: string; quantity: number; extraIds: string[]; notes: string }
export interface PricingInput { orderType: OrderType; zoneId?: string | null; promoCode?: string; lines: PricingLine[] }
export type PricingResult = { ok: true; quote: OrderQuote } | { ok: false; error: string; field?: "promo" };

const MAX_QTY = 50;
const MAX_LINES = 40;

function discountFor(p: Promotion, subtotal: number) {
  if (subtotal < p.min_order) return 0;
  const d = p.discount_type === "PERCENTAGE" ? Math.floor((subtotal * p.discount_value) / 100) : p.discount_value;
  return Math.max(0, Math.min(d, subtotal));
}

export function priceOrder(input: PricingInput, now = new Date()): PricingResult {
  if (input.orderType === "DELIVERY" && !ordering.delivery.enabled) return { ok: false, error: "La livraison n'est pas disponible." };
  if (input.orderType === "PICKUP" && !ordering.pickup.enabled) return { ok: false, error: "Le retrait n'est pas disponible." };
  if (!input.lines.length) return { ok: false, error: "Votre panier est vide." };
  if (input.lines.length > MAX_LINES) return { ok: false, error: "Trop d'articles dans le panier." };

  const lines: OrderQuote["lines"] = [];
  for (const l of input.lines) {
    if (!Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > MAX_QTY) return { ok: false, error: "Quantité invalide." };
    const product = getProduct(l.productId);
    if (!product) return { ok: false, error: "Un article de votre panier n'existe plus." };
    if (!product.available) return { ok: false, error: `« ${product.name} » est indisponible.` };
    const allowed = new Set(extrasForProduct(product.id).map((e) => e.id));
    const ex: { id: string; name: string; price: number }[] = [];
    for (const id of new Set(l.extraIds)) {
      const e = getExtra(id);
      if (!e || !e.available || !allowed.has(id)) return { ok: false, error: `Un supplément de « ${product.name} » n'est plus disponible.` };
      ex.push({ id: e.id, name: e.name, price: e.price });
    }
    const extrasTotal = ex.reduce((s, e) => s + e.price, 0);
    lines.push({
      product_id: product.id, name: product.name, unit_price: product.price, quantity: l.quantity,
      extras_total: extrasTotal, line_total: (product.price + extrasTotal) * l.quantity,
      notes: l.notes.trim().slice(0, 200) || null, extras: ex,
    });
  }
  const subtotal = lines.reduce((s, l) => s + l.line_total, 0);

  // Promotions: best automatic one, or the promo code if it is better.
  const live = promotions.filter((p) => isPromotionLive(p, now));
  let best: { promo: Promotion; amount: number } | null = null;
  for (const p of live.filter((x) => !x.code)) {
    const amount = discountFor(p, subtotal);
    if (amount > 0 && (!best || amount > best.amount)) best = { promo: p, amount };
  }
  const code = (input.promoCode ?? "").trim().toUpperCase();
  if (code) {
    const p = live.find((x) => x.code === code);
    if (!p) return { ok: false, error: "Code promo invalide ou expiré.", field: "promo" };
    const amount = discountFor(p, subtotal);
    if (amount === 0) return { ok: false, error: `Ce code promo nécessite une commande de ${p.min_order} DA minimum.`, field: "promo" };
    if (!best || amount >= best.amount) best = { promo: p, amount };
  }
  const discount = best?.amount ?? 0;

  // Delivery fee: zone fee when zones exist, otherwise the default fee.
  let deliveryFee = 0;
  let zoneName: string | null = null;
  let zoneMissing = false;
  if (input.orderType === "DELIVERY") {
    if (deliveryZones.length) {
      const zone = deliveryZones.find((z) => z.id === input.zoneId);
      if (zone) { deliveryFee = zone.fee; zoneName = zone.name; } else zoneMissing = true;
    } else {
      deliveryFee = ordering.delivery.defaultFee;
    }
  }

  const minOrder = ordering.minOrderAmount;
  return {
    ok: true,
    quote: {
      order_type: input.orderType, subtotal, discount, promotion_name: best?.promo.name ?? null,
      delivery_fee: deliveryFee, delivery_zone_name: zoneName, zone_missing: zoneMissing,
      min_order: minOrder, below_min_order: subtotal < minOrder,
      total: subtotal - discount + deliveryFee, lines,
    },
  };
}

/** Refreshes cart items with the current menu prices / availability (display + checkout safety). */
export function reconcileItems(items: CartItem[]): CartItem[] {
  return items.map((i) => {
    const p = getProduct(i.productId);
    const allowed = new Set(extrasForProduct(i.productId).map((e) => e.id));
    const extras = i.extras.map((e) => ({ ...e, name: getExtra(e.id)?.name ?? e.name, price: getExtra(e.id)?.price ?? e.price }));
    return {
      ...i,
      name: p?.name ?? i.name,
      unitPrice: p?.price ?? i.unitPrice,
      extras,
      unavailable: !p || !p.available || !i.extras.every((e) => allowed.has(e.id)),
    };
  });
}

export const toPricingLines = (items: CartItem[]): PricingLine[] =>
  items.filter((i) => !i.unavailable).map((i) => ({ productId: i.productId, quantity: i.quantity, extraIds: i.extras.map((e) => e.id), notes: i.notes }));
