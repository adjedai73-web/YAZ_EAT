import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeWhatsAppNumber } from "../src/config/restaurant.ts";
import { priceOrder, reconcileItems } from "../src/lib/orders/pricing.ts";
import { buildPreparedOrder, generateReference } from "../src/lib/orders/local-order.ts";
import { buildWhatsAppLink, createWhatsAppOrderMessage } from "../src/lib/whatsapp/message.ts";
import { products, extrasForProduct } from "../src/lib/menu/index.ts";
import { ordering } from "../src/config/restaurant.ts";

const nbsp = (s: string) => s.replace(/[\u202f\u00a0]/g, " ");
// Uses whatever the real menu contains: the first available product,
// and one of its extras only if the menu defines any (the current real menu has none).
const available = products.find((p) => p.available)!;
const extra = extrasForProduct(available.id)[0] ?? null;
const extraIds = extra ? [extra.id] : [];
const extraPrice = extra ? extra.price : 0;

test("WhatsApp number normalization to 213XXXXXXXXX", () => {
  assert.equal(normalizeWhatsAppNumber("0550 12 34 56"), "213550123456");
  assert.equal(normalizeWhatsAppNumber("+213 (550) 12-34-56"), "213550123456");
  assert.equal(normalizeWhatsAppNumber("00213550123456"), "213550123456");
  assert.equal(normalizeWhatsAppNumber("213550123456"), "213550123456");
  assert.equal(normalizeWhatsAppNumber("021234567"), null);
  assert.equal(normalizeWhatsAppNumber(""), null);
  assert.equal(normalizeWhatsAppNumber(undefined), null);
});

test("prices come from the menu, extras included, delivery fee from config", () => {
  assert.ok(available, "the menu must contain at least one available product");
  const res = priceOrder({ orderType: "DELIVERY", lines: [{ productId: available.id, quantity: 2, extraIds, notes: "" }] });
  assert.ok(res.ok);
  if (!res.ok) return;
  assert.equal(res.quote.subtotal, (available.price + extraPrice) * 2);
  assert.equal(res.quote.delivery_fee, ordering.delivery.defaultFee);
  assert.equal(res.quote.total, res.quote.subtotal + ordering.delivery.defaultFee);
  const pickup = priceOrder({ orderType: "PICKUP", lines: [{ productId: available.id, quantity: 1, extraIds: [], notes: "" }] });
  assert.ok(pickup.ok && pickup.quote.delivery_fee === 0 && pickup.quote.total === available.price);
});

test("every product of the real menu is priced from the menu data", () => {
  for (const p of products.filter((x) => x.available)) {
    const res = priceOrder({ orderType: "PICKUP", lines: [{ productId: p.id, quantity: 3, extraIds: [], notes: "" }] });
    assert.ok(res.ok, p.name);
    if (res.ok) assert.equal(res.quote.total, p.price * 3, p.name);
  }
});

test("pricing rejects empty carts, unknown products/extras, bad quantities, unavailable items", () => {
  assert.equal(priceOrder({ orderType: "PICKUP", lines: [] }).ok, false);
  assert.equal(priceOrder({ orderType: "PICKUP", lines: [{ productId: "nope", quantity: 1, extraIds: [], notes: "" }] }).ok, false);
  assert.equal(priceOrder({ orderType: "PICKUP", lines: [{ productId: available.id, quantity: 0, extraIds: [], notes: "" }] }).ok, false);
  assert.equal(priceOrder({ orderType: "PICKUP", lines: [{ productId: available.id, quantity: 1, extraIds: ["fake"], notes: "" }] }).ok, false);
  const off = products.find((p) => !p.available);
  if (off) assert.equal(priceOrder({ orderType: "PICKUP", lines: [{ productId: off.id, quantity: 1, extraIds: [], notes: "" }] }).ok, false);
  assert.equal(priceOrder({ orderType: "PICKUP", promoCode: "FAKE", lines: [{ productId: available.id, quantity: 1, extraIds: [], notes: "" }] }).ok, false);
});

test("cart prices stored in the browser are ignored (reconciled from the menu)", () => {
  const [item] = reconcileItems([{ key: "k", productId: available.id, slug: available.slug, name: "x", image: null, unitPrice: 1, extras: [], quantity: 1, notes: "" }]);
  assert.equal(item!.unitPrice, available.price);
  assert.equal(item!.unavailable, false);
  const [gone] = reconcileItems([{ key: "k", productId: "deleted", slug: "deleted", name: "x", image: null, unitPrice: 1, extras: [], quantity: 1, notes: "" }]);
  assert.equal(gone!.unavailable, true);
});

test("customer reference format YAZ-YYYYMMDD-XXXX (Algiers date)", () => {
  const ref = generateReference("YAZ", new Date("2026-09-23T23:30:00Z"), () => 0);
  assert.equal(ref, "YAZ-20260924-AAAA");
  assert.match(generateReference("YAZ"), /^YAZ-\d{8}-[A-Z2-9]{4}$/);
});

test("prepared order → complete WhatsApp message and encoded wa.me URL", () => {
  const res = priceOrder({ orderType: "DELIVERY", lines: [{ productId: available.id, quantity: 1, extraIds, notes: "Bien cuit" }] });
  assert.ok(res.ok);
  if (!res.ok) return;
  const order = buildPreparedOrder("YAZ-20260924-AB12", {
    customer_name: "Ahmed", customer_phone: "0550000000", address: "Rue 1", commune: "Biskra", wilaya: "Biskra", notes: "Sonner",
  }, res.quote);
  const msg = nbsp(createWhatsAppOrderMessage(order, "YAZ EAT"));
  for (const part of ["🍗 *YAZ EAT — NOUVELLE COMMANDE*", "*Commande:* YAZ-20260924-AB12", "*Client:* Ahmed", "*Téléphone:* 0550000000",
    "*Adresse:* Rue 1, Biskra, Biskra", `• 1x ${available.name}`, ...(extra ? [`+ ${extra.name}`] : []), "_Bien cuit_", "*Sous-total:*", "*Livraison:*",
    "🔥 *TOTAL:", "*Type:* Livraison", "*Note:* Sonner"]) assert.ok(msg.includes(part), `missing: ${part}`);
  const url = buildWhatsAppLink("213550123456", msg);
  assert.ok(url.startsWith("https://wa.me/213550123456?text="));
  assert.equal(decodeURIComponent(url.split("?text=")[1]!), msg);
  assert.ok(!/[\s*()]/.test(url.split("?")[0]!));
});
