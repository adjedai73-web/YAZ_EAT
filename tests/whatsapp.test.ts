import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppLink, createWhatsAppOrderMessage } from "../src/lib/whatsapp/message.ts";
import { formatDA, normalizeDzPhone, slugify, toWhatsAppIntl } from "../src/lib/format.ts";
import type { OrderView } from "../src/lib/types.ts";

const order: OrderView = {
  id: "11111111-1111-1111-1111-111111111111", order_number: "YAZ-20260922-0001", status: "NEW",
  customer_name: "Ahmed", customer_phone: "0550000000", order_type: "DELIVERY",
  address: "12 rue Didouche", commune: "Biskra", wilaya: "Biskra", delivery_zone_name: null, notes: "Sans oignon",
  subtotal: 900, discount: 0, promotion_name: null, delivery_fee: 200, total: 1100, created_at: "2026-09-22T10:00:00Z",
  items: [
    { id: "a", product_name: "Burger YAZ", unit_price: 650, extras_total: 100, quantity: 1, line_total: 750, notes: null, extras: [{ name: "Cheese", price: 100 }] },
    { id: "b", product_name: "Frites", unit_price: 150, extras_total: 0, quantity: 1, line_total: 150, notes: null, extras: [] },
  ],
  events: [],
};

test("formatDA uses plain spaces", () => {
  assert.equal(formatDA(1100), "1 100 DA");
  assert.equal(formatDA(650), "650 DA");
});

test("order message matches the spec layout", () => {
  const m = createWhatsAppOrderMessage(order, "YAZ EAT");
  for (const part of [
    "🍗 *YAZ EAT — NOUVELLE COMMANDE*", "📦 *Commande:* YAZ-20260922-0001", "👤 *Client:* Ahmed",
    "📞 *Téléphone:* 0550000000", "📍 *Adresse:* 12 rue Didouche, Biskra, Biskra", "• 1x Burger YAZ — 650 DA",
    "+ Cheese — 100 DA", "• 1x Frites — 150 DA", "💰 *Sous-total:* 900 DA", "🚚 *Livraison:* 200 DA",
    "🔥 *TOTAL: 1 100 DA*", "🚚 *Type:* Livraison", "📝 *Note:* Sans oignon",
  ]) assert.ok(m.includes(part), `missing: ${part}`);
});

test("pickup message has no address and no delivery line", () => {
  const m = createWhatsAppOrderMessage({ ...order, order_type: "PICKUP", delivery_fee: 0, total: 900 });
  assert.ok(!m.includes("Adresse"));
  assert.ok(!m.includes("*Livraison:*"));
  assert.ok(m.includes("Retrait au restaurant"));
});

test("discount line appears when a promotion applies", () => {
  const m = createWhatsAppOrderMessage({ ...order, discount: 90, promotion_name: "-10 %", total: 1010 });
  assert.ok(m.includes("🏷️ *Réduction (-10 %):* -90 DA"));
});

test("wa.me link encodes the message", () => {
  const url = buildWhatsAppLink("+213 550 00 00 00", "a b&c");
  assert.equal(url, "https://wa.me/213550000000?text=a%20b%26c");
});

test("Algerian phone normalization", () => {
  assert.equal(normalizeDzPhone("+213 550 00 00 00"), "0550000000");
  assert.equal(normalizeDzPhone("00213661234567"), "0661234567");
  assert.equal(normalizeDzPhone("0770 12 34 56"), "0770123456");
  assert.equal(normalizeDzPhone("12345"), null);
  assert.equal(normalizeDzPhone("0850000000"), null);
  assert.equal(toWhatsAppIntl("0550000000"), "213550000000");
});

test("slugify strips accents", () => {
  assert.equal(slugify("Crème Brûlée & Café"), "creme-brulee-cafe");
});
